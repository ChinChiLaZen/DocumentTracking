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
  const { role, isActive } = (req.body ?? {}) as { role?: string; isActive?: boolean }

  const roleValid = role === undefined || role === 'admin' || role === 'member'
  const isActiveValid = isActive === undefined || typeof isActive === 'boolean'
  if (!Number.isInteger(targetId) || !roleValid || !isActiveValid || (role === undefined && isActive === undefined)) {
    res.status(400).json({ error: 'Invalid request' })
    return
  }

  if (targetId === caller.id) {
    res.status(400).json({ error: 'You cannot change your own role or active status' })
    return
  }

  const result = await sql`
    UPDATE users
    SET role = COALESCE(${role ?? null}, role),
        is_active = COALESCE(${isActive ?? null}, is_active)
    WHERE id = ${targetId}
    RETURNING id, email, role, is_active, created_at
  `
  const row = result.rows[0] as
    | { id: number; email: string; role: 'admin' | 'member'; is_active: boolean; created_at: string | Date }
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
      isActive: row.is_active,
      createdAt: new Date(row.created_at).toISOString(),
    },
  })
}
