import type { ProcurementLead } from '../data/types'

const PROJECT_NUMBER_RE = /เลขที่โครงการ\s*:\s*([0-9A-Za-z-]+)/

/** Simple deterministic string hash (djb2), hex-encoded — not cryptographic, just needs to be stable and collision-unlikely for a few dozen leads. */
function hashString(input: string): string {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i)
  }
  return (hash >>> 0).toString(16)
}

/**
 * A stable identifier for a procurement lead, derived from its content
 * rather than stored — so it survives appends/deletes (which can renumber or
 * reorder the underlying list) and works retroactively on data saved before
 * this existed. Prefers the real เลขที่โครงการ (e-GP project number) already
 * embedded in `projectName`; falls back to a hash of agency + purchasing
 * unit + project name for the rare row that doesn't have one.
 */
export function getLeadId(lead: Pick<ProcurementLead, 'agency' | 'purchasingUnit' | 'projectName'>): string {
  const match = lead.projectName.match(PROJECT_NUMBER_RE)
  if (match) return match[1]
  return hashString(`${lead.agency}|${lead.purchasingUnit}|${lead.projectName}`)
}
