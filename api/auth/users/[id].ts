import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, sql } from '../../_lib/db.js'
import { requireAdmin } from '../../_lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()

  const caller = await requireAdmin(req)
  if (!caller) {
    res.status(403).json({ error: 'Admin access required' })
    return
  }

  const targetId = Number(req.query.id)
  const { role } = (req.body ?? {}) as { role?: string }
  if (!Number.isInteger(targetId) || (role !== 'admin' && role !== 'member')) {
    res.status(400).json({ error: 'Invalid request' })
    return
  }

  const result = await sql`
    UPDATE users SET role = ${role} WHERE id = ${targetId}
    RETURNING id, email, role, created_at
  `
  const row = result.rows[0] as
    | { id: number; email: string; role: 'admin' | 'member'; created_at: string | Date }
    | undefined
  if (!row) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  res.status(200).json({
    user: {
      id: row.id,
      email: row.email,
      role: row.role,
      createdAt: new Date(row.created_at).toISOString(),
    },
  })
}
