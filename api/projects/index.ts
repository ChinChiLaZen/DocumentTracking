import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, sql } from '../_lib/db.js'
import { getCurrentUser, requireAdmin } from '../_lib/auth.js'
import { isValidProjectRecord, type ProjectRecordInput } from '../_lib/validateProjectRecord.js'

// One file for the whole /api/projects surface — list (GET), upsert (PUT,
// serves create/edit/reset-to-seed/bootstrap-seeding alike, one project at
// a time via ?id=), and admin-only delete (DELETE, also via ?id=). Vercel's
// plain (non-Next.js) Functions cap a deployment at 12 serverless functions,
// and only single dynamic-segment files ([id].ts) reliably populate
// req.query — catch-all files ([...x].ts / [[...x]].ts) silently failed to
// route here (see CLAUDE.md §10) — so this uses a query param instead of a
// path segment rather than a second route file.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'PUT' && req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()

  if (req.method === 'GET') {
    const user = await getCurrentUser(req)
    if (!user) {
      res.status(401).json({ error: 'Not signed in' })
      return
    }
    const result = await sql`
      SELECT meta, items, sheets, history, schedule FROM project_records ORDER BY seq ASC
    `
    const projects = result.rows.map((row) => ({
      meta: row.meta, items: row.items, sheets: row.sheets, history: row.history, schedule: row.schedule,
    }))
    res.status(200).json({ projects })
    return
  }

  const id = typeof req.query.id === 'string' ? req.query.id : ''
  if (!id) {
    res.status(400).json({ error: 'id query param is required' })
    return
  }

  if (req.method === 'DELETE') {
    // Admin-only server-side, closing a real gap: previously the Delete
    // button was only hidden client-side for non-admins, with nothing
    // stopping a devtools call from actually deleting a project.
    const caller = await requireAdmin(req)
    if (!caller) {
      res.status(403).json({ error: 'Admin access required' })
      return
    }
    const result = await sql`DELETE FROM project_records WHERE id = ${id} RETURNING id`
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' })
      return
    }
    res.status(200).json({ ok: true })
    return
  }

  // PUT — any signed-in user (matches today's client-only gate: Add Project
  // has no admin check). Serves initial create, every debounced edit-sync,
  // reset-to-seed, and first-time bootstrap seeding (the client just PUTs
  // each of its baked-in INITIAL_PROJECTS once when the table is empty —
  // idempotent via ON CONFLICT, so a race between two browsers both seeding
  // is harmless since they're upserting the exact same source data).
  const user = await getCurrentUser(req)
  if (!user) {
    res.status(401).json({ error: 'Not signed in' })
    return
  }

  const { record } = (req.body ?? {}) as { record?: unknown }
  if (!isValidProjectRecord(record) || record.meta.id !== id) {
    res.status(400).json({ error: 'record must be a valid project record whose meta.id matches the id query param' })
    return
  }
  const r = record as ProjectRecordInput

  const upserted = await sql`
    INSERT INTO project_records (id, meta, items, sheets, history, schedule, updated_by)
    VALUES (
      ${id},
      ${JSON.stringify(r.meta)}::jsonb,
      ${JSON.stringify(r.items)}::jsonb,
      ${JSON.stringify(r.sheets)}::jsonb,
      ${JSON.stringify(r.history ?? [])}::jsonb,
      ${JSON.stringify(r.schedule ?? { phases: [], milestones: [] })}::jsonb,
      ${user.email}
    )
    ON CONFLICT (id) DO UPDATE SET
      meta = EXCLUDED.meta,
      items = EXCLUDED.items,
      sheets = EXCLUDED.sheets,
      history = EXCLUDED.history,
      schedule = EXCLUDED.schedule,
      updated_by = EXCLUDED.updated_by,
      updated_at = now()
    RETURNING meta, items, sheets, history, schedule
  `
  const row = upserted.rows[0]
  res.status(200).json({
    project: {
      meta: row.meta,
      items: row.items,
      sheets: row.sheets,
      history: row.history,
      schedule: row.schedule,
    },
  })
}
