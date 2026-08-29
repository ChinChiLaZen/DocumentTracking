import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, sql } from '../_lib/db.js'
import { computeSnapshot } from '../_lib/rollup.js'

interface HistoryEntryRow {
  itemNo: number
  field: string
  from?: string
  to?: string
  changedBy: string
  timestamp: string
}

const MAX_LINES_PER_SECTION = 30

// Vercel Cron requests a GET and, when a CRON_SECRET env var is configured,
// automatically sends `Authorization: Bearer <CRON_SECRET>` — checking it
// here stops anyone else from hitting this path to spam the Slack channel or
// force extra snapshot writes.
function isAuthorizedCronRequest(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.authorization === `Bearer ${secret}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!isAuthorizedCronRequest(req)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  await ensureSchema()

  const lastRunResult = await sql`SELECT value FROM cron_state WHERE key = 'daily_digest'`
  const lastRun = lastRunResult.rows[0]
    ? new Date(lastRunResult.rows[0].value as string)
    : new Date(Date.now() - 24 * 60 * 60 * 1000)

  const projectsResult = await sql`
    SELECT id, meta, items, sheets, history, created_at, updated_at
    FROM project_records ORDER BY seq ASC
  `
  const snapshotsResult = await sql`
    SELECT project_id, item_statuses, checks_done, checks_required FROM project_digest_snapshots
  `
  const prevByProject = new Map(snapshotsResult.rows.map((r) => [r.project_id as string, r]))

  const newProjects: string[] = []
  const updatedProjects: string[] = []
  const statusChangeLines: string[] = []
  const historyLines: string[] = []
  const nextSnapshots: { id: string; itemStatuses: Record<number, string>; checksDone: number; checksRequired: number }[] = []

  for (const row of projectsResult.rows) {
    const meta = row.meta as { title: string }
    const items = (row.items as { no: number; name: string; manualStatus?: string }[]) ?? []
    const sheets = (row.sheets as { itemNo: number; rows?: { cells?: Record<string, boolean> }[] }[]) ?? []
    const history = (row.history as HistoryEntryRow[]) ?? []
    const createdAt = new Date(row.created_at as string)
    const updatedAt = new Date(row.updated_at as string)
    const prev = prevByProject.get(row.id as string)

    const isNewProject = !prev
    if (isNewProject && createdAt >= lastRun) {
      newProjects.push(meta.title)
    } else if (updatedAt >= lastRun) {
      updatedProjects.push(meta.title)
    }

    const snapshot = computeSnapshot(items, sheets)

    if (prev) {
      const prevStatuses = (prev.item_statuses as Record<string, string>) ?? {}
      const itemByNo = new Map(items.map((item) => [item.no, item]))
      for (const [noStr, before] of Object.entries(prevStatuses)) {
        const no = Number(noStr)
        const after = snapshot.itemStatuses[no]
        if (after !== undefined && after !== before) {
          const name = itemByNo.get(no)?.name ?? `Item ${no}`
          statusChangeLines.push(`• ${meta.title} — Item ${no} (${name}): ${before} → ${after}`)
        }
      }
    }

    for (const h of history) {
      const ts = new Date(h.timestamp)
      if (ts >= lastRun) {
        historyLines.push(
          `• ${meta.title} — Item ${h.itemNo} ${h.field}: ${h.from ?? '—'} → ${h.to ?? '—'} (${h.changedBy})`,
        )
      }
    }

    nextSnapshots.push({ id: row.id as string, ...snapshot })
  }

  const dateLabel = new Date().toISOString().slice(0, 10)
  const lines: string[] = [`*Daily Project Digest — ${dateLabel}*`]
  if (newProjects.length) lines.push(`🆕 New projects: ${newProjects.join(', ')}`)
  if (updatedProjects.length) lines.push(`✏️ Updated: ${updatedProjects.join(', ')}`)
  if (statusChangeLines.length) {
    lines.push('*Status changes:*', ...statusChangeLines.slice(0, MAX_LINES_PER_SECTION))
    if (statusChangeLines.length > MAX_LINES_PER_SECTION) {
      lines.push(`… and ${statusChangeLines.length - MAX_LINES_PER_SECTION} more`)
    }
  }
  if (historyLines.length) {
    lines.push('*Phase Progress changes:*', ...historyLines.slice(0, MAX_LINES_PER_SECTION))
    if (historyLines.length > MAX_LINES_PER_SECTION) {
      lines.push(`… and ${historyLines.length - MAX_LINES_PER_SECTION} more`)
    }
  }
  if (lines.length === 1) lines.push('No project changes since the last digest.')
  const text = lines.join('\n')

  let slackError: string | undefined
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    slackError = 'SLACK_WEBHOOK_URL not configured'
  } else {
    try {
      const slackRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!slackRes.ok) slackError = `Slack webhook returned ${slackRes.status}`
    } catch (err) {
      slackError = err instanceof Error ? err.message : 'Slack webhook request failed'
    }
  }

  // Drop snapshots for projects that no longer exist so the table doesn't
  // grow unbounded as projects get deleted.
  await sql`DELETE FROM project_digest_snapshots WHERE project_id NOT IN (SELECT id FROM project_records)`
  for (const s of nextSnapshots) {
    await sql`
      INSERT INTO project_digest_snapshots (project_id, item_statuses, checks_done, checks_required)
      VALUES (${s.id}, ${JSON.stringify(s.itemStatuses)}::jsonb, ${s.checksDone}, ${s.checksRequired})
      ON CONFLICT (project_id) DO UPDATE SET
        item_statuses = EXCLUDED.item_statuses,
        checks_done = EXCLUDED.checks_done,
        checks_required = EXCLUDED.checks_required,
        captured_at = now()
    `
  }
  await sql`
    INSERT INTO cron_state (key, value) VALUES ('daily_digest', ${new Date().toISOString()})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
  `

  if (slackError) {
    res.status(502).json({ ok: false, error: slackError, digest: text })
    return
  }
  res.status(200).json({ ok: true, digest: text })
}
