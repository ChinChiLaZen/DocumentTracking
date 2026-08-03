import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, sql } from '../../_lib/db.js'
import { EMAIL_RE, requireAdmin, ROLES, type Role } from '../../_lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH' && req.method !== 'DELETE') {
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
  if (!Number.isInteger(targetId)) {
    res.status(400).json({ error: 'Invalid request' })
    return
  }

  if (targetId === caller.id) {
    res.status(400).json({ error: 'You cannot change your own role, email, active status, or delete yourself' })
    return
  }

  if (req.method === 'DELETE') {
    const result = await sql`DELETE FROM users WHERE id = ${targetId} RETURNING id`
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.status(200).json({ success: true })
    return
  }

  const { role, isActive, email } = (req.body ?? {}) as {
    role?: string
    isActive?: boolean
    email?: string
  }

  const roleValid = role === undefined || ROLES.includes(role as Role)
  const isActiveValid = isActive === undefined || typeof isActive === 'boolean'
  const emailValid = email === undefined || EMAIL_RE.test(email)
  if (
    !roleValid ||
    !isActiveValid ||
    !emailValid ||
    (role === undefined && isActive === undefined && email === undefined)
  ) {
    res.status(400).json({ error: 'Invalid request' })
    return
  }

  const normalizedEmail = email?.trim().toLowerCase()
  if (normalizedEmail !== undefined) {
    const existing = await sql`SELECT id FROM users WHERE email = ${normalizedEmail} AND id != ${targetId}`
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'An account with this email already exists' })
      return
    }
  }

  const result = await sql`
    UPDATE users
    SET role = COALESCE(${role ?? null}, role),
        is_active = COALESCE(${isActive ?? null}, is_active),
        email = COALESCE(${normalizedEmail ?? null}, email)
    WHERE id = ${targetId}
    RETURNING id, email, role, is_active, created_at
  `
  const row = result.rows[0] as
    | { id: number; email: string; role: Role; is_active: boolean; created_at: string | Date }
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
