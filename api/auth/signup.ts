import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, sql } from '../_lib/db.js'
import { hashPassword, signSession, setSessionCookie } from '../_lib/auth.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { email, password, inviteCode } = (req.body ?? {}) as {
    email?: string
    password?: string
    inviteCode?: string
  }

  const expectedInviteCode = process.env.SIGNUP_INVITE_CODE
  if (!expectedInviteCode || inviteCode !== expectedInviteCode) {
    res.status(403).json({ error: 'Invalid invite code' })
    return
  }
  if (!email || !EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'Enter a valid email address' })
    return
  }
  if (!password || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' })
    return
  }

  await ensureSchema()

  const normalizedEmail = email.trim().toLowerCase()
  const existing = await sql`SELECT id FROM users WHERE email = ${normalizedEmail}`
  if (existing.rows.length > 0) {
    res.status(409).json({ error: 'An account with this email already exists' })
    return
  }

  const passwordHash = await hashPassword(password)
  const inserted = await sql`
    INSERT INTO users (email, password_hash) VALUES (${normalizedEmail}, ${passwordHash})
    RETURNING id, email
  `
  const user = inserted.rows[0] as { id: number; email: string }

  const token = await signSession({ sub: String(user.id), email: user.email })
  setSessionCookie(res, token)
  res.status(200).json({ email: user.email })
}
