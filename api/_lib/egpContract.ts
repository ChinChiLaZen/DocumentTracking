// Thin client for Thailand's official EGP-CONTRACT open-data API
// (https://govspending.data.go.th/doc-api, service EGP-CONTRACT) — publishes
// already-awarded government procurement contracts. Unlike e-GP's own search
// UI (Cloudflare Turnstile-gated, see src/data/procurementLeads.ts), this is
// a real public REST/JSON API requiring only a free registered API key
// (https://opend.data.go.th/register_api), so it can be fetched live and
// automatically. Confirmed via a live test call this session that every
// returned record already carries a `contract` with a named winner — this
// API is awarded-contract data, not open bid opportunities, hence the
// separate "Awarded Contracts" feature rather than folding it into
// procurement_leads_snapshot (see CLAUDE.md).

const EGP_CONTRACT_URL = 'https://opend.data.go.th/govspending/service/egp-contract'

interface EgpContractApiRecord {
  project_id?: unknown
  project_name?: unknown
  dept_name?: unknown
  dept_sub_name?: unknown
  project_money?: unknown
  project_status?: unknown
  announce_date?: unknown
  contract?: unknown
}

interface EgpContractApiContract {
  winner_name?: unknown
  contract_no?: unknown
  contract_date?: unknown
  price_agree?: unknown
}

interface EgpContractApiResponse {
  success?: unknown
  message?: unknown
  total?: unknown
  data?: unknown
}

// Mirrors src/data/types.ts's AwardedContractLead — kept as a local,
// loosely-typed shape (not imported) since api/ and src/ are separate TS
// project references (tsconfig.api.json) with no cross-project imports.
export interface AwardedContractLead {
  no: number
  projectId: string
  projectName: string
  deptName: string
  deptSubName: string
  budgetTHB: number
  status: string
  announceDate: string
  winnerName: string
  contractNo: string
  contractDate: string
  priceAgreeTHB: number
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

/** Flattens the API's per-record shape (incl. its first contract, if any) into one flat row for the table. A project with more than one contract keeps only the first — noted here rather than silently handled elsewhere. */
export function mapEgpContractRecord(record: unknown, no: number): AwardedContractLead {
  const r = (record ?? {}) as EgpContractApiRecord
  const contracts = Array.isArray(r.contract) ? (r.contract as EgpContractApiContract[]) : []
  const firstContract = contracts[0] ?? {}
  return {
    no,
    projectId: asString(r.project_id),
    projectName: asString(r.project_name),
    deptName: asString(r.dept_name),
    deptSubName: asString(r.dept_sub_name),
    budgetTHB: asNumber(r.project_money),
    status: asString(r.project_status),
    announceDate: asString(r.announce_date),
    winnerName: asString(firstContract.winner_name),
    contractNo: asString(firstContract.contract_no),
    contractDate: asString(firstContract.contract_date),
    priceAgreeTHB: asNumber(firstContract.price_agree),
  }
}

export interface FetchEgpContractsResult {
  leads: AwardedContractLead[]
  total: number
}

/** Calls the live EGP-CONTRACT API server-side (keeps the API key off the client) and maps every returned record. Throws on a non-2xx response or an API-reported failure — the caller decides how to surface that. */
export async function fetchEgpContracts(params: {
  apiKey: string
  keyword: string
  year: number
  limit?: number
}): Promise<FetchEgpContractsResult> {
  const url = new URL(EGP_CONTRACT_URL)
  url.searchParams.set('api-key', params.apiKey)
  url.searchParams.set('year', String(params.year))
  if (params.keyword) url.searchParams.set('keyword', params.keyword)
  url.searchParams.set('limit', String(params.limit ?? 200))

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`EGP-CONTRACT API returned ${res.status}`)
  }
  const body = (await res.json()) as EgpContractApiResponse
  if (!body.success) {
    throw new Error(asString(body.message) || 'EGP-CONTRACT API reported failure')
  }
  const rows = Array.isArray(body.data) ? body.data : []
  return {
    leads: rows.map((record, i) => mapEgpContractRecord(record, i + 1)),
    total: asNumber(body.total),
  }
}
