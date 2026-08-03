import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, sql } from '../_lib/db.js'
import { getSessionToken, verifySession } from '../_lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()

  const token = getSessionToken(req)
  const payload = token ? await verifySession(token) : null
  if (!payload) {
    res.status(401).json({ error: 'Not signed in' })
    return
  }
  const userId = Number(payload.sub)

  if (req.method === 'GET') {
    const result = await sql`
      SELECT id, title, status, created_at FROM tasks WHERE user_id = ${userId} ORDER BY created_at ASC
    `
    const tasks = result.rows.map((row) => ({
      id: row.id as number,
      title: row.title as string,
      status: row.status as string,
      createdAt: new Date(row.created_at as string | Date).toISOString(),
    }))
    res.status(200).json({ tasks })
    return
  }

  if (req.method === 'POST') {
    const { title } = (req.body ?? {}) as { title?: string }
    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Title is required' })
      return
    }
    const inserted = await sql`
      INSERT INTO tasks (user_id, title) VALUES (${userId}, ${title.trim()})
      RETURNING id, title, status, created_at
    `
    const row = inserted.rows[0]
    res.status(200).json({
      task: {
        id: row.id as number,
        title: row.title as string,
        status: row.status as string,
        createdAt: new Date(row.created_at as string | Date).toISOString(),
      },
    })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
