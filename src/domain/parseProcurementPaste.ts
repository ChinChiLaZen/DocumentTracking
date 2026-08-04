import type { ProcurementLead } from '../data/types'

/**
 * Parses rows copied from the e-GP results table (select the data rows in
 * the browser, Ctrl+C, paste here) into ProcurementLead records. Browsers
 * copy a selected HTML <table> as tab-separated columns per line, so each
 * pasted line is split on tabs; columns are, in order: No., Agency,
 * Purchasing Unit, Project Name, Budget (THB), Status — any trailing "view"
 * icon column is ignored. Lines that don't parse into a valid row (wrong
 * column count, non-numeric No./Budget, or missing text fields) are
 * skipped, never fabricated.
 */
export function parseProcurementPaste(text: string): ProcurementLead[] {
  const rows: ProcurementLead[] = []
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    const cells = line.split('\t').map((c) => c.trim())
    if (cells.length < 6) continue
    const [noStr, agency, purchasingUnit, projectName, budgetStr, status] = cells
    const no = Number(noStr)
    const budgetTHB = Number(budgetStr.replace(/,/g, ''))
    if (!Number.isFinite(no) || !Number.isFinite(budgetTHB)) continue
    if (!agency || !purchasingUnit || !projectName || !status) continue
    rows.push({ no, agency, purchasingUnit, projectName, budgetTHB, status })
  }
  return rows
}
