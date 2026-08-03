import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, sql } from '../_lib/db.js'
import { getSessionToken, verifySession } from '../_lib/auth.js'

const VALID_STATUSES = ['ToDo', 'InProgress', 'AwaitingReview', 'Done']

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()

  const token = getSessionToken(req)
  const payload = token ? await verifySession(token) : null
  if (!payload) {
    res.status(401).json({ error: 'Not signed in' })
    return
  }
  const userId = Number(payload.sub)
  const taskId = Number(req.query.id)
  if (!Number.isInteger(taskId)) {
    res.status(400).json({ error: 'Invalid task id' })
    return
  }

  if (req.method === 'PATCH') {
    const { title, status } = (req.body ?? {}) as { title?: string; status?: string }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Invalid status' })
      return
    }
    const result = await sql`
      UPDATE tasks
      SET title = COALESCE(${title ?? null}, title),
          status = COALESCE(${status ?? null}, status)
      WHERE id = ${taskId} AND user_id = ${userId}
      RETURNING id, title, status, created_at
    `
    const row = result.rows[0]
    if (!row) {
      res.status(404).json({ error: 'Task not found' })
      return
    }
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

  if (req.method === 'DELETE') {
    const result = await sql`DELETE FROM tasks WHERE id = ${taskId} AND user_id = ${userId} RETURNING id`
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Task not found' })
      return
    }
    res.status(200).json({ ok: true })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
