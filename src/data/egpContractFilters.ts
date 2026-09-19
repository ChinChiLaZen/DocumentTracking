// Fixed Sub-unit (หน่วยงานย่อย) / Agency (หน่วยงาน) option lists for the
// Awarded Contracts page's Refresh-from-EGP-CONTRACT filters
// (src/components/procurement/AwardedContractsPage.tsx). The actual
// narrowing happens server-side (api/_lib/egpContractFilters.ts) — this
// file only supplies the two dropdowns' option lists.
//
// Mirrors api/_lib/egpContractFilters.ts (duplicated, not imported, since
// api/ cannot import src/** — see CLAUDE.md). Keep both lists in sync.

export const SUB_UNIT_OPTIONS = [
  'ท่าอากาศยาน',
  'กรมท่าอากาศยาน',
  'ท่าอากาศยานสุวรรณภูมิ',
  'ท่าอากาศยานดอนเมือง',
  'ท่าอากาศยานภูเก็ต',
  'ท่าอากาศยานหาดใหญ่',
  'ท่าอากาศยานเชียงใหม่',
  'ท่าอากาศยานแม่ฟ้าหลวง เชียงราย',
] as const

export const AGENCY_OPTIONS = ['บริษัท ท่าอากาศยานไทย จำกัด (มหาชน)', 'กรมท่าอากาศยาน'] as const
