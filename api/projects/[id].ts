import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, sql } from '../_lib/db.js'
import { getCurrentUser, requireAdmin } from '../_lib/auth.js'
import { isValidProjectRecord, type ProjectRecordInput } from '../_lib/validateProjectRecord.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT' && req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()

  const id = typeof req.query.id === 'string' ? req.query.id : ''
  if (!id) {
    res.status(400).json({ error: 'Invalid project id' })
    return
  }

  if (req.method === 'DELETE') {
    // Admin-only server-side, closing a real gap: previously the Delete button
    // was only hidden client-side for non-admins, with nothing stopping a
    // devtools call from actually deleting a project.
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
  // and reset-to-seed — all the same "replace this project's full record"
  // operation from the server's point of view.
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
}
