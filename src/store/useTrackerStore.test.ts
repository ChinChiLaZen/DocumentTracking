import { describe, expect, it } from 'vitest'
import { createTrackerStore } from './useTrackerStore'
import { createMemoryPersistence } from './persistence'
import { selectItemsWithStatus, selectRollup, selectSheetById } from './selectors'

function setup() {
  return createTrackerStore(createMemoryPersistence())
}

describe('useTrackerStore', () => {
  it('toggling a cell updates the effective status via the selector', () => {
    const useStore = setup()
    const sheet = selectSheetById(useStore.getState(), 'item-9')!
    // Item 9 has a single row with 3 cells; toggle the first one on.
    const rowId = sheet.rows[0].id
    const columnKey = sheet.columns[0].key

    const before = selectItemsWithStatus(useStore.getState()).find((i) => i.no === 9)!
    expect(before.status).toBe('Pending')

    useStore.getState().toggleCell('item-9', rowId, columnKey)

    const after = selectItemsWithStatus(useStore.getState()).find((i) => i.no === 9)!
    expect(after.status).toBe('In Progress')
  })

  it('bulk check-all with a selection only affects the selected rows', () => {
    const useStore = setup()
    const sheetId = 'item-11'
    const sheet = selectSheetById(useStore.getState(), sheetId)!
    const [row1, row2] = sheet.rows

    useStore.getState().toggleRowSelection(sheetId, row1.id)
    useStore.getState().bulkSetCells(sheetId, true, 'selected')

    const updated = selectSheetById(useStore.getState(), sheetId)!
    const updatedRow1 = updated.rows.find((r) => r.id === row1.id)!
    const updatedRow2 = updated.rows.find((r) => r.id === row2.id)!
    expect(Object.values(updatedRow1.cells).every(Boolean)).toBe(true)
    // row2 was not selected, so its cells should be unaffected by the bulk op
    expect(updatedRow2.cells).toEqual(sheet.rows.find((r) => r.id === row2.id)!.cells)
  })

  it('clearing a manual override returns the item to its auto status', () => {
    const useStore = setup()
    useStore.getState().setManualStatus(9, 'Needs Revision')
    expect(selectItemsWithStatus(useStore.getState()).find((i) => i.no === 9)!.status).toBe(
      'Needs Revision',
    )

    useStore.getState().setManualStatus(9, undefined)
    expect(selectItemsWithStatus(useStore.getState()).find((i) => i.no === 9)!.status).toBe(
      'Pending',
    )
  })

  it('reset restores the seeded 120/282 checkbox roll-up', () => {
    const useStore = setup()
    const sheet = selectSheetById(useStore.getState(), 'item-9')!
    useStore.getState().toggleCell('item-9', sheet.rows[0].id, sheet.columns[0].key)

    useStore.getState().resetToSeed()

    const rollup = selectRollup(useStore.getState())
    expect(rollup.checkboxRollup.req).toBe(282)
    expect(rollup.checkboxRollup.done).toBe(120)
  })
})
