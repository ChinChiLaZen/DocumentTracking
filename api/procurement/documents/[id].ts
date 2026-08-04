import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, sql } from '../../_lib/db.js'
import { getCurrentUser } from '../../_lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()

  const user = await getCurrentUser(req)
  if (!user) {
    res.status(401).json({ error: 'Not signed in' })
    return
  }

  const docId = Number(req.query.id)
  if (!Number.isInteger(docId)) {
    res.status(400).json({ error: 'Invalid document id' })
    return
  }

  if (req.method === 'DELETE') {
    const result = await sql`DELETE FROM procurement_lead_documents WHERE id = ${docId} RETURNING id`
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Document not found' })
      return
    }
    res.status(200).json({ ok: true })
    return
  }

  // GET — stream the file back with its real content-type/filename
  const result = await sql`
    SELECT filename, content_type, file_data FROM procurement_lead_documents WHERE id = ${docId}
  `
  const row = result.rows[0] as { filename: string; content_type: string; file_data: string } | undefined
  if (!row) {
    res.status(404).json({ error: 'Document not found' })
    return
  }
  res.setHeader('Content-Type', row.content_type)
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(row.filename)}"`)
  res.status(200).send(Buffer.from(row.file_data, 'base64'))
}
