import type { DetailSheet, Item, Status } from '../data/types'
import { effectiveStatus, item3Remark, rollup as deriveRollup, type Rollup } from '../domain/derive'

export interface DataSlice {
  items: Item[]
  sheets: DetailSheet[]
}

export interface ItemWithStatus extends Item {
  status: Status
  sheet?: DetailSheet
  /** item.remark, except Item 3 whose remark is always generated (§6.5) — never hand-typed. */
  displayRemark?: string
}

export function selectItemsWithStatus(state: DataSlice): ItemWithStatus[] {
  const sheetByItemNo = new Map(state.sheets.map((s) => [s.itemNo, s]))
  return state.items.map((item) => {
    const sheet = sheetByItemNo.get(item.no)
    const displayRemark = item.no === 3 && sheet ? item3Remark(sheet) : item.remark
    return { ...item, status: effectiveStatus(item, sheet), sheet, displayRemark }
  })
}

export function selectRollup(state: DataSlice): Rollup {
  return deriveRollup(state.items, state.sheets)
}

export function selectSheetById(state: DataSlice, id: string): DetailSheet | undefined {
  return state.sheets.find((s) => s.id === id)
}
