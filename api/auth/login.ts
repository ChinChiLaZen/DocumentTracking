import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, sql } from '../_lib/db.js'
import { verifyPassword, signSession, setSessionCookie } from '../_lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { email, password } = (req.body ?? {}) as { email?: string; password?: string }
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  await ensureSchema()

  const normalizedEmail = email.trim().toLowerCase()
  const result = await sql`SELECT id, email, password_hash, role FROM users WHERE email = ${normalizedEmail}`
  const user = result.rows[0] as
    | { id: number; email: string; password_hash: string; role: 'admin' | 'member' }
    | undefined

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }

  const token = await signSession({ sub: String(user.id), email: user.email, role: user.role })
  setSessionCookie(res, token)
  res.status(200).json({ email: user.email, role: user.role })
}
