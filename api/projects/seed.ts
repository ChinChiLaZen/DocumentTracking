import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, sql } from '../_lib/db.js'
import { getCurrentUser } from '../_lib/auth.js'
import { isValidProjectRecord, type ProjectRecordInput } from '../_lib/validateProjectRecord.js'

// Called by the client only when GET /api/projects comes back empty — bootstraps
// the shared table from the client's own baked-in INITIAL_PROJECTS seed data
// (the server can't build this itself; api/ can't import src/data/*, see
// validateProjectRecord.ts). ON CONFLICT DO NOTHING makes concurrent seeding
// from two browsers race-safe: whichever INSERT commits first wins per row.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()

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
    meta: row.meta,
    items: row.items,
    sheets: row.sheets,
    history: row.history,
  }))
  res.status(200).json({ projects })
}
