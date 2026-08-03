import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, sql } from '../_lib/db.js'
import { EMAIL_RE, hashPassword, requireAdmin, ROLES, type Role } from '../_lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()

  const caller = await requireAdmin(req)
  if (!caller) {
    res.status(403).json({ error: 'Admin access required' })
    return
  }

  if (req.method === 'POST') {
    const { email, password, role } = (req.body ?? {}) as {
      email?: string
      password?: string
      role?: string
    }

    if (!email || !EMAIL_RE.test(email)) {
      res.status(400).json({ error: 'Enter a valid email address' })
      return
    }
    if (!password || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' })
      return
    }
    if (role !== undefined && !ROLES.includes(role as Role)) {
      res.status(400).json({ error: 'Invalid role' })
      return
    }

    const normalizedEmail = email.trim().toLowerCase()
    const existing = await sql`SELECT id FROM users WHERE email = ${normalizedEmail}`
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'An account with this email already exists' })
      return
    }

    const passwordHash = await hashPassword(password)
    const inserted = await sql`
      INSERT INTO users (email, password_hash, role) VALUES (${normalizedEmail}, ${passwordHash}, ${role ?? 'member'})
      RETURNING id, email, role, is_active, created_at
    `
    const row = inserted.rows[0] as {
      id: number
      email: string
      role: Role
      is_active: boolean
      created_at: string | Date
    }
    res.status(201).json({
      user: {
        id: row.id,
        email: row.email,
        role: row.role,
        isActive: row.is_active,
        createdAt: new Date(row.created_at).toISOString(),
      },
    })
    return
  }

  const result = await sql`SELECT id, email, role, is_active, created_at FROM users ORDER BY created_at ASC`
  const users = result.rows.map((row) => ({
    id: row.id as number,
    email: row.email as string,
    role: row.role as Role,
    isActive: row.is_active as boolean,
    createdAt: new Date(row.created_at as string | Date).toISOString(),
  }))

  res.status(200).json({ users })
}
