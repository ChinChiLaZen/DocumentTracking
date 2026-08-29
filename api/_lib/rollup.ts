// Mirrors src/domain/derive.ts's checksRequired/checksDone/effectiveStatus —
// kept as a local, loosely-typed re-implementation (not imported) since api/
// and src/ are separate TS project references (see tsconfig.api.json) with
// no cross-project imports. Same posture already accepted for
// validateProjectRecord.ts. Only what api/cron/daily-digest.ts needs.

interface CheckRow {
  cells?: Record<string, boolean>
}

interface DetailSheet {
  itemNo: number
  rows?: CheckRow[]
}

interface Item {
  no: number
  manualStatus?: string
}

export function checksRequired(sheet: DetailSheet): number {
  return (sheet.rows ?? []).reduce((sum, row) => sum + Object.keys(row.cells ?? {}).length, 0)
}

export function checksDone(sheet: DetailSheet): number {
  return (sheet.rows ?? []).reduce(
    (sum, row) => sum + Object.values(row.cells ?? {}).filter((v) => v).length,
    0,
  )
}

function autoStatus(sheet: DetailSheet): string | undefined {
  const required = checksRequired(sheet)
  if (required === 0) return undefined
  const done = checksDone(sheet)
  if (done >= required) return 'Submitted'
  if (done > 0) return 'In Progress'
  return 'Pending'
}

/** Effective status shown on Tracker/Priority/Dashboard (CLAUDE.md §6.3). */
export function effectiveStatus(item: Item, sheet: DetailSheet | undefined): string {
  if (item.manualStatus) return item.manualStatus
  if (sheet) return autoStatus(sheet) ?? 'Pending'
  return 'Pending'
}

export interface ProjectStatusSnapshot {
  itemStatuses: Record<number, string>
  checksDone: number
  checksRequired: number
}

export function computeSnapshot(items: Item[], sheets: DetailSheet[]): ProjectStatusSnapshot {
  const sheetByItemNo = new Map(sheets.map((s) => [s.itemNo, s]))
  const itemStatuses: Record<number, string> = {}
  for (const item of items) {
    itemStatuses[item.no] = effectiveStatus(item, sheetByItemNo.get(item.no))
  }
  let done = 0
  let required = 0
  for (const sheet of sheets) {
    done += checksDone(sheet)
    required += checksRequired(sheet)
  }
  return { itemStatuses, checksDone: done, checksRequired: required }
}
