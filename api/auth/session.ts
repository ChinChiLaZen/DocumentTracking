import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema } from '../_lib/db.js'
import { getCurrentUser } from '../_lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()

  const user = await getCurrentUser(req)
  if (!user) {
    res.status(401).json({ user: null })
    return
  }
  res.status(200).json({ user: { email: user.email, role: user.role } })
}
