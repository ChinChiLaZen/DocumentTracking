import { create } from 'zustand'
import type { DetailSheet, Item, Status } from '../data/types'
import { items as seedItems, detailSheets as seedSheets } from '../data/checklist.seed'
import type { PersistencePort } from './persistence'
import { createLocalStoragePersistence } from './persistence'

export interface TrackerState {
  items: Item[]
  sheets: DetailSheet[]
  selectedRowIds: Record<string, Set<string>>

  toggleCell(sheetId: string, rowId: string, columnKey: string): void
  setManualStatus(itemNo: number, status: Status | undefined): void
  toggleRowSelection(sheetId: string, rowId: string): void
  selectAllRows(sheetId: string, on: boolean): void
  bulkSetCells(sheetId: string, value: boolean, scope: 'selected' | 'all'): void
  bulkToggleCells(sheetId: string, scope: 'selected' | 'all'): void
  resetToSeed(): void
  hydrate(): void
}

function cloneSeed(): { items: Item[]; sheets: DetailSheet[] } {
  return {
    items: seedItems.map((item) => ({ ...item })),
    sheets: seedSheets.map((sheet) => ({
      ...sheet,
      rows: sheet.rows.map((row) => ({ ...row, cells: { ...row.cells } })),
    })),
  }
}

export function createTrackerStore(persistence: PersistencePort = createLocalStoragePersistence()) {
  return create<TrackerState>()((set, get) => {
    function persist() {
      const { items, sheets } = get()
      persistence.save({ items, sheets })
    }

    return {
      ...cloneSeed(),
      selectedRowIds: {},

      toggleCell(sheetId, rowId, columnKey) {
        set((state) => ({
          sheets: state.sheets.map((sheet) =>
            sheet.id !== sheetId
              ? sheet
              : {
                  ...sheet,
                  rows: sheet.rows.map((row) =>
                    row.id !== rowId
                      ? row
                      : { ...row, cells: { ...row.cells, [columnKey]: !row.cells[columnKey] } },
                  ),
                },
          ),
        }))
        persist()
      },

      setManualStatus(itemNo, status) {
        set((state) => ({
          items: state.items.map((item) =>
            item.no !== itemNo ? item : { ...item, manualStatus: status },
          ),
        }))
        persist()
      },

      toggleRowSelection(sheetId, rowId) {
        set((state) => {
          const current = new Set(state.selectedRowIds[sheetId] ?? [])
          if (current.has(rowId)) current.delete(rowId)
          else current.add(rowId)
          return { selectedRowIds: { ...state.selectedRowIds, [sheetId]: current } }
        })
      },

      selectAllRows(sheetId, on) {
        set((state) => {
          const sheet = state.sheets.find((s) => s.id === sheetId)
          const ids = on && sheet ? new Set(sheet.rows.map((r) => r.id)) : new Set<string>()
          return { selectedRowIds: { ...state.selectedRowIds, [sheetId]: ids } }
        })
      },

      bulkSetCells(sheetId, value, scope) {
        set((state) => ({
          sheets: state.sheets.map((sheet) => {
            if (sheet.id !== sheetId) return sheet
            const selected =
              scope === 'selected' ? (state.selectedRowIds[sheetId] ?? new Set<string>()) : null
            return {
              ...sheet,
              rows: sheet.rows.map((row) => {
                if (selected && !selected.has(row.id)) return row
                const cells = Object.fromEntries(Object.keys(row.cells).map((k) => [k, value]))
                return { ...row, cells }
              }),
            }
          }),
        }))
        persist()
      },

      bulkToggleCells(sheetId, scope) {
        set((state) => ({
          sheets: state.sheets.map((sheet) => {
            if (sheet.id !== sheetId) return sheet
            const selected =
              scope === 'selected' ? (state.selectedRowIds[sheetId] ?? new Set<string>()) : null
            return {
              ...sheet,
              rows: sheet.rows.map((row) => {
                if (selected && !selected.has(row.id)) return row
                const cells = Object.fromEntries(Object.entries(row.cells).map(([k, v]) => [k, !v]))
                return { ...row, cells }
              }),
            }
          }),
        }))
        persist()
      },

      resetToSeed() {
        set({ ...cloneSeed(), selectedRowIds: {} })
        persist()
      },

      hydrate() {
        const loaded = persistence.load()
        if (loaded) set({ items: loaded.items, sheets: loaded.sheets })
      },
    }
  })
}

export const useTrackerStore = createTrackerStore()
