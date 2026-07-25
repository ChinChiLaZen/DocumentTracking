import type { DetailSheet, Item, Status } from '../data/types'
import { effectiveStatus, rollup as deriveRollup, type Rollup } from '../domain/derive'

export interface DataSlice {
  items: Item[]
  sheets: DetailSheet[]
}

export interface ItemWithStatus extends Item {
  status: Status
  sheet?: DetailSheet
}

export function selectItemsWithStatus(state: DataSlice): ItemWithStatus[] {
  const sheetByItemNo = new Map(state.sheets.map((s) => [s.itemNo, s]))
  return state.items.map((item) => {
    const sheet = sheetByItemNo.get(item.no)
    return { ...item, status: effectiveStatus(item, sheet), sheet }
  })
}

export function selectRollup(state: DataSlice): Rollup {
  return deriveRollup(state.items, state.sheets)
}

export function selectSheetById(state: DataSlice, id: string): DetailSheet | undefined {
  return state.sheets.find((s) => s.id === id)
}
