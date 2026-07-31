import type { DetailSheet, Item, Priority, Status } from '../data/types'

/** COUNTA — total number of checkable cells across all rows of a sheet. */
export function checksRequired(sheet: DetailSheet): number {
  return sheet.rows.reduce((sum, row) => sum + Object.keys(row.cells).length, 0)
}

/** COUNTIF TRUE — number of cells ticked true. */
export function checksDone(sheet: DetailSheet): number {
  return sheet.rows.reduce((sum, row) => sum + Object.values(row.cells).filter((v) => v).length, 0)
}

export function percent(sheet: DetailSheet): number {
  const required = checksRequired(sheet)
  return required === 0 ? 0 : checksDone(sheet) / required
}

export function autoStatus(sheet: DetailSheet): Status | undefined {
  const required = checksRequired(sheet)
  if (required === 0) return undefined
  const done = checksDone(sheet)
  if (done >= required) return 'Submitted'
  if (done > 0) return 'In Progress'
  return 'Pending'
}

/**
 * Effective status shown on Tracker / Priority / Dashboard (§6.3).
 * A reviewer override (`item.manualStatus`) always wins; otherwise fall back
 * to the sheet's auto status; items with no sheet and no override are Pending.
 */
export function effectiveStatus(item: Item, sheet: DetailSheet | undefined): Status {
  if (item.manualStatus) return item.manualStatus
  if (sheet) return autoStatus(sheet) ?? 'Pending'
  return 'Pending'
}

/**
 * Item 3's remark is generated, never hand-typed (§6.5), so the sentence can
 * never drift from the tick count — this fixed a real "6 of 18" vs actual-5
 * mismatch in the spreadsheet.
 */
export function item3Remark(sheet: DetailSheet): string {
  const done = checksDone(sheet)
  const required = checksRequired(sheet)
  return (
    `FAA ALECP listing confirmed for ${done} of ${required} listed line items. ` +
    `Remaining fixture types, connector kits, isolating transformers, CCR, light bases and ALCMS outstanding.`
  )
}

export interface Rollup {
  totalItems: number
  byStatus: Record<Status, number>
  byPriority: Record<Priority, { total: number; done: number }>
  checkboxRollup: { req: number; done: number }
  integrityOK: boolean
}

const ALL_STATUSES: Status[] = [
  'Submitted',
  'In Progress',
  'Pending',
  'Needs Revision',
  'Not Available',
]
const ALL_PRIORITIES: Priority[] = ['A', 'B', 'C']

export function rollup(items: Item[], sheets: DetailSheet[]): Rollup {
  const sheetByItemNo = new Map(sheets.map((s) => [s.itemNo, s]))

  const byStatus = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0])) as Record<Status, number>
  const byPriority = Object.fromEntries(
    ALL_PRIORITIES.map((p) => [p, { total: 0, done: 0 }]),
  ) as Record<Priority, { total: number; done: number }>

  for (const item of items) {
    const sheet = sheetByItemNo.get(item.no)
    const status = effectiveStatus(item, sheet)
    byStatus[status] += 1
    // item.priority is MAR-only (§5.2) — items from other templates (e.g. AOT)
    // have no priority and are excluded from this tally, not from totalItems.
    if (item.priority) {
      byPriority[item.priority].total += 1
      if (status === 'Submitted') byPriority[item.priority].done += 1
    }
  }

  const checkboxRollup = sheets.reduce(
    (acc, sheet) => ({
      req: acc.req + checksRequired(sheet),
      done: acc.done + checksDone(sheet),
    }),
    { req: 0, done: 0 },
  )

  const totalItems = items.length
  const priorityTotal = ALL_PRIORITIES.reduce((sum, p) => sum + byPriority[p].total, 0)
  const statusTotal = ALL_STATUSES.reduce((sum, s) => sum + byStatus[s], 0)
  const integrityOK = totalItems === priorityTotal && totalItems === statusTotal

  return { totalItems, byStatus, byPriority, checkboxRollup, integrityOK }
}
