import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, sql } from '../_lib/db.js'
import { getCurrentUser, requireAdmin } from '../_lib/auth.js'
import { isValidProjectRecord, type ProjectRecordInput } from '../_lib/validateProjectRecord.js'

// Optional catch-all — one file serving /api/projects (GET list),
// /api/projects/seed (POST bulk-seed) and /api/projects/:id (PUT/DELETE).
// Purely a route-count consolidation (Vercel's Hobby plan caps a deployment
// at 12 serverless functions); routing is done by segment count/value, not
// by filename — behavior/URLs are unchanged from the three-file version.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()

  const segments = req.query.path
  const path = Array.isArray(segments) ? segments : segments === undefined ? [] : [segments]

  if (path.length === 0) {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }
    const user = await getCurrentUser(req)
    if (!user) {
      res.status(401).json({ error: 'Not signed in' })
      return
    }
    const result = await sql`
      SELECT meta, items, sheets, history FROM project_records ORDER BY seq ASC
    `
    const projects = result.rows.map((row) => ({
      meta: row.meta, items: row.items, sheets: row.sheets, history: row.history,
    }))
    res.status(200).json({ projects })
    return
  }

  if (path.length === 1 && path[0] === 'seed') {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }
    const user = await getCurrentUser(req)
    if (!user) {
      res.status(401).json({ error: 'Not signed in' })
      return
    }
    const { records } = (req.body ?? {}) as { records?: unknown }
    if (!Array.isArray(records) || records.length === 0 || !records.every(isValidProjectRecord)) {
      res.status(400).json({ error: 'records must be a non-empty array of valid project records' })
      return
    }
    for (const r of records as ProjectRecordInput[]) {
      await sql`
        INSERT INTO project_records (id, meta, items, sheets, history, updated_by)
        VALUES (
          ${r.meta.id},
          ${JSON.stringify(r.meta)}::jsonb,
          ${JSON.stringify(r.items)}::jsonb,
          ${JSON.stringify(r.sheets)}::jsonb,
          ${JSON.stringify(r.history ?? [])}::jsonb,
          ${user.email}
        )
        ON CONFLICT (id) DO NOTHING
      `
    }
    const result = await sql`
      SELECT meta, items, sheets, history FROM project_records ORDER BY seq ASC
    `
    const projects = result.rows.map((row) => ({
      meta: row.meta, items: row.items, sheets: row.sheets, history: row.history,
    }))
    res.status(200).json({ projects })
    return
  }

  if (path.length === 1) {
    // /api/projects/:id
    const id = path[0]

    if (req.method === 'DELETE') {
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

    if (req.method === 'PUT') {
      const user = await getCurrentUser(req)
      if (!user) {
        res.status(401).json({ error: 'Not signed in' })
        return
      }
      const { record } = (req.body ?? {}) as { record?: unknown }
      if (!isValidProjectRecord(record) || record.meta.id !== id) {
        res.status(400).json({ error: 'record must be a valid project record whose meta.id matches the URL' })
        return
      }
      const r = record as ProjectRecordInput
      const upserted = await sql`
        INSERT INTO project_records (id, meta, items, sheets, history, updated_by)
        VALUES (
          ${id},
          ${JSON.stringify(r.meta)}::jsonb,
          ${JSON.stringify(r.items)}::jsonb,
          ${JSON.stringify(r.sheets)}::jsonb,
          ${JSON.stringify(r.history ?? [])}::jsonb,
          ${user.email}
        )
        ON CONFLICT (id) DO UPDATE SET
          meta = EXCLUDED.meta,
          items = EXCLUDED.items,
          sheets = EXCLUDED.sheets,
          history = EXCLUDED.history,
          updated_by = EXCLUDED.updated_by,
          updated_at = now()
        RETURNING meta, items, sheets, history
      `
      const row = upserted.rows[0]
      res.status(200).json({
        project: { meta: row.meta, items: row.items, sheets: row.sheets, history: row.history },
      })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  res.status(404).json({ error: 'Not found' })
}
