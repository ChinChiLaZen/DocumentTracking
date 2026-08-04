import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, sql } from '../_lib/db.js'
import { getCurrentUser } from '../_lib/auth.js'

// Base64 inflates size ~33%; Vercel serverless functions cap request bodies
// around 4.5MB, so keep the raw (decoded) file comfortably under that.
const MAX_FILE_BYTES = 3 * 1024 * 1024

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()

  const user = await getCurrentUser(req)
  if (!user) {
    res.status(401).json({ error: 'Not signed in' })
    return
  }

  if (req.method === 'GET') {
    const leadId = typeof req.query.leadId === 'string' ? req.query.leadId : ''
    if (!leadId) {
      res.status(400).json({ error: 'leadId query param is required' })
      return
    }
    const result = await sql`
      SELECT id, filename, content_type, file_size, uploaded_by, uploaded_at
      FROM procurement_lead_documents
      WHERE lead_id = ${leadId}
      ORDER BY uploaded_at DESC
    `
    const documents = result.rows.map((row) => ({
      id: row.id as number,
      filename: row.filename as string,
      contentType: row.content_type as string,
      fileSize: row.file_size as number,
      uploadedBy: row.uploaded_by as string,
      uploadedAt: new Date(row.uploaded_at as string | Date).toISOString(),
    }))
    res.status(200).json({ documents })
    return
  }

  // POST
  const { leadId, filename, contentType, fileData } = (req.body ?? {}) as {
    leadId?: string
    filename?: string
    contentType?: string
    fileData?: string // base64, no data: URL prefix
  }

  if (!leadId || !filename || !contentType || !fileData) {
    res.status(400).json({ error: 'leadId, filename, contentType, and fileData are all required' })
    return
  }

  let byteLength: number
  try {
    byteLength = Buffer.from(fileData, 'base64').length
  } catch {
    res.status(400).json({ error: 'fileData must be valid base64' })
    return
  }
  if (byteLength === 0) {
    res.status(400).json({ error: 'File is empty' })
    return
  }
  if (byteLength > MAX_FILE_BYTES) {
    res.status(400).json({ error: `File too large — max ${Math.floor(MAX_FILE_BYTES / (1024 * 1024))}MB` })
    return
  }

  const inserted = await sql`
    INSERT INTO procurement_lead_documents (lead_id, filename, content_type, file_size, file_data, uploaded_by)
    VALUES (${leadId}, ${filename}, ${contentType}, ${byteLength}, ${fileData}, ${user.email})
    RETURNING id, filename, content_type, file_size, uploaded_by, uploaded_at
  `
  const row = inserted.rows[0]
  res.status(201).json({
    document: {
      id: row.id as number,
      filename: row.filename as string,
      contentType: row.content_type as string,
      fileSize: row.file_size as number,
      uploadedBy: row.uploaded_by as string,
      uploadedAt: new Date(row.uploaded_at as string | Date).toISOString(),
    },
  })
}
