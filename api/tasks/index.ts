import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, sql } from '../_lib/db.js'
import { getSessionToken, verifySession } from '../_lib/auth.js'

const VALID_STATUSES = ['ToDo', 'InProgress', 'AwaitingReview', 'Done']

// One file for the whole /api/tasks surface — list/create (GET/POST) and
// per-task update/delete (PATCH/DELETE, via ?id=) — consolidated from a
// separate tasks/[id].ts to keep the deployment's serverless-function count
// under Vercel's Hobby-plan cap of 12 (see CLAUDE.md §10), matching the same
// query-param dispatch pattern already used by api/projects/index.ts.
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

  if (req.method === 'PATCH' || req.method === 'DELETE') {
    const taskId = Number(req.query.id)
    if (!Number.isInteger(taskId)) {
      res.status(400).json({ error: 'Invalid task id' })
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

  res.status(405).json({ error: 'Method not allowed' })
}
