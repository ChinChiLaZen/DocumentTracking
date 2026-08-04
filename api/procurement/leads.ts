import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, sql } from '../_lib/db.js'
import { getCurrentUser } from '../_lib/auth.js'

// Mirrors src/data/types.ts's ProcurementLead — kept as a local, loosely-typed
// shape (not imported) since api/ and src/ are separate TS project references
// (see tsconfig.api.json) with no cross-project imports.
interface ProcurementLeadInput {
  no?: unknown
  agency?: unknown
  purchasingUnit?: unknown
  projectName?: unknown
  budgetTHB?: unknown
  status?: unknown
}

function isValidLead(value: unknown): value is Required<ProcurementLeadInput> & {
  no: number
  agency: string
  purchasingUnit: string
  projectName: string
  budgetTHB: number
  status: string
} {
  if (typeof value !== 'object' || value === null) return false
  const lead = value as ProcurementLeadInput
  return (
    typeof lead.no === 'number' &&
    typeof lead.agency === 'string' &&
    lead.agency.trim() !== '' &&
    typeof lead.purchasingUnit === 'string' &&
    lead.purchasingUnit.trim() !== '' &&
    typeof lead.projectName === 'string' &&
    lead.projectName.trim() !== '' &&
    typeof lead.budgetTHB === 'number' &&
    typeof lead.status === 'string' &&
    lead.status.trim() !== ''
  )
}

const SNAPSHOT_ID = 1

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
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
    const result = await sql`
      SELECT leads, captured_date, updated_by, updated_at
      FROM procurement_leads_snapshot WHERE id = ${SNAPSHOT_ID}
    `
    const row = result.rows[0] as
      | { leads: unknown; captured_date: string; updated_by: string; updated_at: string | Date }
      | undefined
    if (!row) {
      res.status(200).json({ snapshot: null })
      return
    }
    res.status(200).json({
      snapshot: {
        leads: row.leads,
        capturedDate: row.captured_date,
        updatedBy: row.updated_by,
        updatedAt: new Date(row.updated_at).toISOString(),
      },
    })
    return
  }

  if (req.method === 'DELETE') {
    await sql`DELETE FROM procurement_leads_snapshot WHERE id = ${SNAPSHOT_ID}`
    res.status(200).json({ snapshot: null })
    return
  }

  // POST
  const { leads, capturedDate } = (req.body ?? {}) as { leads?: unknown; capturedDate?: unknown }
  if (!Array.isArray(leads) || leads.length === 0 || !leads.every(isValidLead)) {
    res.status(400).json({ error: 'leads must be a non-empty array of valid procurement lead rows' })
    return
  }
  if (typeof capturedDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(capturedDate)) {
    res.status(400).json({ error: 'capturedDate must be an ISO yyyy-mm-dd string' })
    return
  }

  const upserted = await sql`
    INSERT INTO procurement_leads_snapshot (id, leads, captured_date, updated_by, updated_at)
    VALUES (${SNAPSHOT_ID}, ${JSON.stringify(leads)}::jsonb, ${capturedDate}, ${user.email}, now())
    ON CONFLICT (id) DO UPDATE SET
      leads = EXCLUDED.leads,
      captured_date = EXCLUDED.captured_date,
      updated_by = EXCLUDED.updated_by,
      updated_at = EXCLUDED.updated_at
    RETURNING leads, captured_date, updated_by, updated_at
  `
  const row = upserted.rows[0] as { leads: unknown; captured_date: string; updated_by: string; updated_at: string | Date }
  res.status(200).json({
    snapshot: {
      leads: row.leads,
      capturedDate: row.captured_date,
      updatedBy: row.updated_by,
      updatedAt: new Date(row.updated_at).toISOString(),
    },
  })
}
