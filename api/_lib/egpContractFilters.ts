// Fixed Sub-unit (หน่วยงานย่อย) / Agency (หน่วยงาน) option lists for narrowing
// the Awarded Contracts EGP-CONTRACT query, plus the post-fetch filter that
// applies them. The upstream EGP-CONTRACT API (api/_lib/egpContract.ts) has
// no confirmed request-side filter for dept_name/dept_sub_name — only
// api-key/year/keyword/limit are — so these are applied here, against the
// already-mapped AwardedContractLead.deptName/deptSubName fields, on the
// already-fetched result set before it's persisted (see
// api/procurement/leads.ts's `?resource=contracts` POST branch).
//
// Mirrors src/data/egpContractFilters.ts (duplicated, not imported, since
// api/ cannot import src/** — see CLAUDE.md). Keep both lists in sync.
import type { AwardedContractLead } from './egpContract.js'

export const SUB_UNIT_OPTIONS = [
  'ท่าอากาศยาน',
  'กรมท่าอากาศยาน',
  'ท่าอากาศยานสุวรรณภูมิ',
  'ท่าอากาศยานดอนเมือง',
  'ท่าอากาศยานภูเก็ต',
  'ท่าอากาศยานหาดใหญ่',
  'ท่าอากาศยานเชียงใหม่',
  'ท่าอากาศยานเชียงราย',
] as const

export const AGENCY_OPTIONS = ['บริษัท ท่าอากาศยานไทย จำกัด (มหาชน)', 'กรมท่าอากาศยาน'] as const

/**
 * Substring containment, not exact equality — real dept_name/dept_sub_name
 * values may carry extra text (e.g. a regional office suffix) the fixed
 * list can't predict. subUnit/agency undefined (or omitted) means "All",
 * i.e. no narrowing on that dimension.
 */
export function filterContractLeads(
  leads: AwardedContractLead[],
  filters: { subUnit?: string; agency?: string },
): AwardedContractLead[] {
  let result = leads
  if (filters.subUnit) {
    const subUnit = filters.subUnit
    result = result.filter((lead) => lead.deptSubName.includes(subUnit))
  }
  if (filters.agency) {
    const agency = filters.agency
    result = result.filter((lead) => lead.deptName.includes(agency))
  }
  return result
}
