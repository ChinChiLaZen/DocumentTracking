import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, sql } from '../_lib/db.js'
import { requireAdmin } from '../_lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()

  const caller = await requireAdmin(req)
  if (!caller) {
    res.status(403).json({ error: 'Admin access required' })
    return
  }

  const result = await sql`SELECT id, email, role, created_at FROM users ORDER BY created_at ASC`
  const users = result.rows.map((row) => ({
    id: row.id as number,
    email: row.email as string,
    role: row.role as 'admin' | 'member',
    createdAt: new Date(row.created_at as string | Date).toISOString(),
  }))

  res.status(200).json({ users })
}
