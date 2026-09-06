import type { DetailSheet, Item } from '../data/types'

// Extracted from store/useTrackerStore.ts (where cloneItems/cloneSheets used
// to live as private helpers) so domain/templateRegistry.ts and
// store/useTemplateStore.ts can deep-clone template blueprint arrays too,
// without either store importing from the other.

export function cloneItems(items: Item[]): Item[] {
  return items.map((item) => ({ ...item }))
}

export function cloneSheets(sheets: DetailSheet[]): DetailSheet[] {
  return sheets.map((sheet) => ({
    ...sheet,
    rows: sheet.rows.map((row) => ({ ...row, cells: { ...row.cells } })),
  }))
}
