import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, sql } from '../_lib/db.js'
import { getCurrentUser } from '../_lib/auth.js'
import { fetchEgpContracts } from '../_lib/egpContract.js'
import { AGENCY_OPTIONS, SUB_UNIT_OPTIONS, filterContractLeads } from '../_lib/egpContractFilters.js'

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

// Awarded Contracts (EGP-CONTRACT, live-fetched) — a separate concern from the
// open-bid-opportunity leads below (manually pasted, since e-GP's own search
// is Cloudflare-gated). Folded into this same file rather than a new
// api/procurement/contracts.ts to stay under Vercel Hobby's 12-function cap
// (see CLAUDE.md §10) — dispatched via `?resource=contracts`.
async function handleContractsResource(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const user = await getCurrentUser(req)
  if (!user) {
    res.status(401).json({ error: 'Not signed in' })
    return
  }

  if (req.method === 'GET') {
    const result = await sql`
      SELECT contracts, keyword, year, sub_unit, agency, updated_by, updated_at
      FROM procurement_contracts_snapshot WHERE id = ${SNAPSHOT_ID}
    `
    const row = result.rows[0] as
      | {
          contracts: unknown
          keyword: string
          year: number
          sub_unit: string | null
          agency: string | null
          updated_by: string
          updated_at: string | Date
        }
      | undefined
    if (!row) {
      res.status(200).json({ snapshot: null })
      return
    }
    res.status(200).json({
      snapshot: {
        leads: row.contracts,
        keyword: row.keyword,
        year: row.year,
        subUnit: row.sub_unit,
        agency: row.agency,
        updatedBy: row.updated_by,
        updatedAt: new Date(row.updated_at).toISOString(),
      },
    })
    return
  }

  // POST — live-fetch from EGP-CONTRACT and save. Only admin/ProjectManager
  // may trigger this (unlike the GET above, open to any signed-in user):
  // this route spends a shared secret API key on an outbound call, so it
  // gets a real server-side role check rather than this repo's usual
  // client-side-only gating posture for create/edit actions (see CLAUDE.md §10).
  if (user.role !== 'admin' && user.role !== 'ProjectManager') {
    res.status(403).json({ error: 'Only admin/ProjectManager may refresh awarded contracts' })
    return
  }

  const apiKey = process.env.EGP_CONTRACT_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'EGP_CONTRACT_API_KEY is not configured' })
    return
  }

  const { keyword, year, subUnit, agency } = (req.body ?? {}) as {
    keyword?: unknown
    year?: unknown
    subUnit?: unknown
    agency?: unknown
  }
  if (typeof keyword !== 'string' || keyword.trim() === '') {
    res.status(400).json({ error: 'keyword is required' })
    return
  }
  if (typeof year !== 'number' || !Number.isInteger(year)) {
    res.status(400).json({ error: 'year (Buddhist calendar, e.g. 2569) is required' })
    return
  }
  if (subUnit !== undefined && subUnit !== null && !(SUB_UNIT_OPTIONS as readonly string[]).includes(subUnit as string)) {
    res.status(400).json({ error: 'subUnit must be one of the known sub-unit options' })
    return
  }
  if (agency !== undefined && agency !== null && !(AGENCY_OPTIONS as readonly string[]).includes(agency as string)) {
    res.status(400).json({ error: 'agency must be one of the known agency options' })
    return
  }
  const subUnitValue = typeof subUnit === 'string' ? subUnit : null
  const agencyValue = typeof agency === 'string' ? agency : null

  let fetched: Awaited<ReturnType<typeof fetchEgpContracts>>
  try {
    fetched = await fetchEgpContracts({ apiKey, keyword, year })
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'EGP-CONTRACT API request failed' })
    return
  }
  const leads = filterContractLeads(fetched.leads, {
    subUnit: subUnitValue ?? undefined,
    agency: agencyValue ?? undefined,
  })

  const upserted = await sql`
    INSERT INTO procurement_contracts_snapshot (id, contracts, keyword, year, sub_unit, agency, updated_by, updated_at)
    VALUES (${SNAPSHOT_ID}, ${JSON.stringify(leads)}::jsonb, ${keyword}, ${year}, ${subUnitValue}, ${agencyValue}, ${user.email}, now())
    ON CONFLICT (id) DO UPDATE SET
      contracts = EXCLUDED.contracts,
      keyword = EXCLUDED.keyword,
      year = EXCLUDED.year,
      sub_unit = EXCLUDED.sub_unit,
      agency = EXCLUDED.agency,
      updated_by = EXCLUDED.updated_by,
      updated_at = EXCLUDED.updated_at
    RETURNING contracts, keyword, year, sub_unit, agency, updated_by, updated_at
  `
  const row = upserted.rows[0] as {
    contracts: unknown
    keyword: string
    year: number
    sub_unit: string | null
    agency: string | null
    updated_by: string
    updated_at: string | Date
  }
  res.status(200).json({
    snapshot: {
      leads: row.contracts,
      keyword: row.keyword,
      year: row.year,
      subUnit: row.sub_unit,
      agency: row.agency,
      updatedBy: row.updated_by,
      updatedAt: new Date(row.updated_at).toISOString(),
    },
    total: leads.length,
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()

  if (req.query.resource === 'contracts') {
    await handleContractsResource(req, res)
    return
  }

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
