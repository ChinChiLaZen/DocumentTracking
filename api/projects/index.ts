import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, sql } from '../_lib/db.js'
import { getCurrentUser } from '../_lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()

  const user = await getCurrentUser(req)
  if (!user) {
    res.status(401).json({ error: 'Not signed in' })
    return
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
