import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, sql } from '../_lib/db.js'
import { requireAdmin } from '../_lib/auth.js'

const STATUSES = ['ToDo', 'InProgress', 'AwaitingReview', 'Done'] as const

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()

  const caller = await requireAdmin(req)
  if (!caller) {
    res.status(403).json({ error: 'Admin access required' })
    return
  }

  const result = await sql`
    SELECT u.id, u.email, t.status, COUNT(t.id) AS count
    FROM users u
    LEFT JOIN tasks t ON t.user_id = u.id
    GROUP BY u.id, u.email, t.status
    ORDER BY u.id ASC
  `

  const byUser = new Map<number, { id: number; email: string; counts: Record<string, number> }>()
  for (const row of result.rows) {
    const id = row.id as number
    if (!byUser.has(id)) {
      byUser.set(id, {
        id,
        email: row.email as string,
        counts: { toDo: 0, inProgress: 0, awaitingReview: 0, done: 0 },
      })
    }
    const status = row.status as (typeof STATUSES)[number] | null
    const count = Number(row.count)
    if (status === 'ToDo') byUser.get(id)!.counts.toDo = count
    else if (status === 'InProgress') byUser.get(id)!.counts.inProgress = count
    else if (status === 'AwaitingReview') byUser.get(id)!.counts.awaitingReview = count
    else if (status === 'Done') byUser.get(id)!.counts.done = count
  }

  res.status(200).json({ team: Array.from(byUser.values()) })
}
