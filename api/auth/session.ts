import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSessionToken, verifySession } from '../_lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  const token = getSessionToken(req)
  const payload = token ? await verifySession(token) : null
  if (!payload) {
    res.status(401).json({ user: null })
    return
  }
  res.status(200).json({ user: { email: payload.email } })
}
