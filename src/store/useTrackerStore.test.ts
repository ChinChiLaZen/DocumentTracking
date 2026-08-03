import { describe, expect, it } from 'vitest'
import { createTrackerStore } from './useTrackerStore'
import { createMemoryPersistence } from './persistence'
import { DEMO_PROJECT_ID, UTAPAO_PROJECT_ID } from '../data/initialProjects'
import { selectItemsWithStatus, selectRollup, selectSheetById } from './selectors'

function setup() {
  return createTrackerStore(createMemoryPersistence())
}

describe('useTrackerStore', () => {
  it('toggling a cell updates the effective status via the selector', () => {
    const useStore = setup()
    const project = useStore.getState().projects[UTAPAO_PROJECT_ID]
    const sheet = selectSheetById(project, 'item-4')!
    // Item 4 (LM-79) starts fully unticked in the seed; toggle the first cell on.
    const rowId = sheet.rows[0].id
    const columnKey = sheet.columns[0].key

    const before = selectItemsWithStatus(project).find((i) => i.no === 4)!
    expect(before.status).toBe('Pending')

    useStore.getState().toggleCell(UTAPAO_PROJECT_ID, 'item-4', rowId, columnKey)

    const after = selectItemsWithStatus(useStore.getState().projects[UTAPAO_PROJECT_ID]).find(
      (i) => i.no === 4,
    )!
    expect(after.status).toBe('In Progress')
  })

  it('bulk check-all with a selection only affects the selected rows', () => {
    const useStore = setup()
    const sheetId = 'item-11'
    const project = useStore.getState().projects[UTAPAO_PROJECT_ID]
    const sheet = selectSheetById(project, sheetId)!
    const [row1, row2] = sheet.rows

    useStore.getState().toggleRowSelection(UTAPAO_PROJECT_ID, sheetId, row1.id)
    useStore.getState().bulkSetCells(UTAPAO_PROJECT_ID, sheetId, true, 'selected')

    const updated = selectSheetById(useStore.getState().projects[UTAPAO_PROJECT_ID], sheetId)!
    const updatedRow1 = updated.rows.find((r) => r.id === row1.id)!
    const updatedRow2 = updated.rows.find((r) => r.id === row2.id)!
    expect(Object.values(updatedRow1.cells).every(Boolean)).toBe(true)
    // row2 was not selected, so its cells should be unaffected by the bulk op
    expect(updatedRow2.cells).toEqual(sheet.rows.find((r) => r.id === row2.id)!.cells)
  })

  it('clearing a manual override returns the item to its auto status', () => {
    const useStore = setup()
    useStore.getState().setManualStatus(UTAPAO_PROJECT_ID, 4, 'Needs Revision')
    expect(
      selectItemsWithStatus(useStore.getState().projects[UTAPAO_PROJECT_ID]).find(
        (i) => i.no === 4,
      )!.status,
    ).toBe('Needs Revision')

    useStore.getState().setManualStatus(UTAPAO_PROJECT_ID, 4, undefined)
    expect(
      selectItemsWithStatus(useStore.getState().projects[UTAPAO_PROJECT_ID]).find(
        (i) => i.no === 4,
      )!.status,
    ).toBe('Pending')
  })

  it('reset restores the seeded 120/282 checkbox roll-up for the U-Tapao project', () => {
    const useStore = setup()
    const sheet = selectSheetById(useStore.getState().projects[UTAPAO_PROJECT_ID], 'item-4')!
    useStore.getState().toggleCell(UTAPAO_PROJECT_ID, 'item-4', sheet.rows[0].id, sheet.columns[0].key)

    useStore.getState().resetToSeed(UTAPAO_PROJECT_ID)

    const rollup = selectRollup(useStore.getState().projects[UTAPAO_PROJECT_ID])
    expect(rollup.checkboxRollup.req).toBe(282)
    expect(rollup.checkboxRollup.done).toBe(120)
  })

  it('reset restores the blank 0/282 state for the demo project', () => {
    const useStore = setup()
    const sheet = selectSheetById(useStore.getState().projects[DEMO_PROJECT_ID], 'item-4')!
    useStore.getState().toggleCell(DEMO_PROJECT_ID, 'item-4', sheet.rows[0].id, sheet.columns[0].key)
    expect(selectRollup(useStore.getState().projects[DEMO_PROJECT_ID]).checkboxRollup.done).toBe(1)

    useStore.getState().resetToSeed(DEMO_PROJECT_ID)

    const rollup = selectRollup(useStore.getState().projects[DEMO_PROJECT_ID])
    expect(rollup.checkboxRollup.req).toBe(282)
    expect(rollup.checkboxRollup.done).toBe(0)
  })

  it('keeps projects fully isolated — toggling one never affects another', () => {
    const useStore = setup()
    const sheet = selectSheetById(useStore.getState().projects[UTAPAO_PROJECT_ID], 'item-4')!
    const demoDoneBefore = selectRollup(
      useStore.getState().projects[DEMO_PROJECT_ID],
    ).checkboxRollup.done

    useStore.getState().toggleCell(UTAPAO_PROJECT_ID, 'item-4', sheet.rows[0].id, sheet.columns[0].key)

    const demoDoneAfter = selectRollup(
      useStore.getState().projects[DEMO_PROJECT_ID],
    ).checkboxRollup.done
    expect(demoDoneAfter).toBe(demoDoneBefore)
  })

  describe('createProject', () => {
    it('clones the blank template, independent from the template and other projects', () => {
      const useStore = setup()
      const id = useStore.getState().createProject({
        title: 'New Vendor Project',
        vendor: 'Some Vendor Co.',
        scope: 'Airfield Lighting',
        preparedDate: '2026-08-01',
        templateKind: 'mar',
        defaultPhase: 'AfterContract',
      })

      expect(useStore.getState().projectOrder).toContain(id)
      const project = useStore.getState().projects[id]
      expect(project.meta).toEqual({
        id,
        title: 'New Vendor Project',
        vendor: 'Some Vendor Co.',
        scope: 'Airfield Lighting',
        preparedDate: '2026-08-01',
        templateKind: 'mar',
      })

      const rollup = selectRollup(project)
      expect(rollup.totalItems).toBe(28)
      expect(rollup.checkboxRollup.req).toBe(282)
      expect(rollup.checkboxRollup.done).toBe(0)

      // Mutating the new project must not leak into another project's identical sheet id.
      const sheet = selectSheetById(project, 'item-4')!
      useStore.getState().toggleCell(id, 'item-4', sheet.rows[0].id, sheet.columns[0].key)
      const utapaoSheet = selectSheetById(useStore.getState().projects[UTAPAO_PROJECT_ID], 'item-4')!
      expect(utapaoSheet.rows[0].cells[utapaoSheet.columns[0].key]).toBe(false)
    })

    it('generates a fresh id each time', () => {
      const useStore = setup()
      const id1 = useStore.getState().createProject({
        title: 'A',
        vendor: '',
        scope: '',
        preparedDate: '2026-08-01',
        templateKind: 'mar',
        defaultPhase: 'AfterContract',
      })
      const id2 = useStore.getState().createProject({
        title: 'B',
        vendor: '',
        scope: '',
        preparedDate: '2026-08-01',
        templateKind: 'mar',
        defaultPhase: 'AfterContract',
      })
      expect(id1).not.toBe(id2)
      expect(useStore.getState().projectOrder.filter((i) => i === id1 || i === id2)).toHaveLength(2)
    })

    it('resets a created project back to the blank template it started at', () => {
      const useStore = setup()
      const id = useStore.getState().createProject({
        title: 'C',
        vendor: '',
        scope: '',
        preparedDate: '2026-08-01',
        templateKind: 'mar',
        defaultPhase: 'AfterContract',
      })
      const sheet = selectSheetById(useStore.getState().projects[id], 'item-4')!
      useStore.getState().toggleCell(id, 'item-4', sheet.rows[0].id, sheet.columns[0].key)
      expect(selectRollup(useStore.getState().projects[id]).checkboxRollup.done).toBe(1)

      useStore.getState().resetToSeed(id)
      expect(selectRollup(useStore.getState().projects[id]).checkboxRollup.done).toBe(0)
    })
  })

  describe('deleteProject', () => {
    it('removes the project from both projects and projectOrder, leaving others untouched', () => {
      const useStore = setup()
      const id = useStore.getState().createProject({
        title: 'Disposable Project',
        vendor: '',
        scope: '',
        preparedDate: '2026-08-01',
        templateKind: 'mar',
        defaultPhase: 'AfterContract',
      })
      expect(useStore.getState().projectOrder).toContain(id)

      useStore.getState().deleteProject(id)

      expect(useStore.getState().projects[id]).toBeUndefined()
      expect(useStore.getState().projectOrder).not.toContain(id)
      // Untouched — deleting one project must not affect another.
      expect(useStore.getState().projects[UTAPAO_PROJECT_ID]).toBeDefined()
      expect(useStore.getState().projectOrder).toContain(UTAPAO_PROJECT_ID)
    })
  })

  describe('workflow status & metadata (Phase Progress)', () => {
    it('setWorkflowStatus sets the field and appends one history entry', () => {
      const useStore = setup()
      useStore.getState().setWorkflowStatus(UTAPAO_PROJECT_ID, 4, 'Preparing', 'reviewer@example.com')

      const project = useStore.getState().projects[UTAPAO_PROJECT_ID]
      const item = project.items.find((i) => i.no === 4)!
      expect(item.workflowStatus).toBe('Preparing')
      expect(project.history).toHaveLength(1)
      expect(project.history[0]).toMatchObject({
        itemNo: 4,
        field: 'workflowStatus',
        from: undefined,
        to: 'Preparing',
        changedBy: 'reviewer@example.com',
      })
    })

    it('re-setting the same workflow status is a no-op (no duplicate history entry)', () => {
      const useStore = setup()
      useStore.getState().setWorkflowStatus(UTAPAO_PROJECT_ID, 4, 'Preparing', 'reviewer@example.com')
      useStore.getState().setWorkflowStatus(UTAPAO_PROJECT_ID, 4, 'Preparing', 'reviewer@example.com')

      expect(useStore.getState().projects[UTAPAO_PROJECT_ID].history).toHaveLength(1)
    })

    it('updateItemMeta appends one history entry per changed field', () => {
      const useStore = setup()
      useStore
        .getState()
        .updateItemMeta(
          UTAPAO_PROJECT_ID,
          4,
          { responsiblePerson: 'AAA', documentLink: 'https://example.com/doc' },
          'reviewer@example.com',
        )

      const project = useStore.getState().projects[UTAPAO_PROJECT_ID]
      const item = project.items.find((i) => i.no === 4)!
      expect(item.responsiblePerson).toBe('AAA')
      expect(item.documentLink).toBe('https://example.com/doc')
      expect(project.history).toHaveLength(2)
      expect(project.history.map((h) => h.field).sort()).toEqual(['documentLink', 'responsiblePerson'])
    })

    it('updateItemMeta skips fields that did not actually change', () => {
      const useStore = setup()
      useStore
        .getState()
        .updateItemMeta(UTAPAO_PROJECT_ID, 4, { responsiblePerson: 'AAA' }, 'reviewer@example.com')
      useStore
        .getState()
        .updateItemMeta(
          UTAPAO_PROJECT_ID,
          4,
          { responsiblePerson: 'AAA', documentDate: '2026-08-01' },
          'reviewer@example.com',
        )

      const project = useStore.getState().projects[UTAPAO_PROJECT_ID]
      expect(project.history).toHaveLength(2) // responsiblePerson (1st call) + documentDate (2nd call) only
      expect(project.history.map((h) => h.field)).toEqual(['responsiblePerson', 'documentDate'])
    })

    it('resetToSeed clears workflow status, metadata, and history', () => {
      const useStore = setup()
      useStore.getState().setWorkflowStatus(UTAPAO_PROJECT_ID, 4, 'Submitted', 'reviewer@example.com')
      useStore
        .getState()
        .updateItemMeta(UTAPAO_PROJECT_ID, 4, { responsiblePerson: 'AAA' }, 'reviewer@example.com')

      useStore.getState().resetToSeed(UTAPAO_PROJECT_ID)

      const project = useStore.getState().projects[UTAPAO_PROJECT_ID]
      const item = project.items.find((i) => i.no === 4)!
      expect(item.workflowStatus).toBeUndefined()
      expect(item.responsiblePerson).toBeUndefined()
      expect(project.history).toEqual([])
    })

    it('createProject starts with empty history', () => {
      const useStore = setup()
      const id = useStore.getState().createProject({
        title: 'D',
        vendor: '',
        scope: '',
        preparedDate: '2026-08-01',
        templateKind: 'mar',
        defaultPhase: 'AfterContract',
      })
      expect(useStore.getState().projects[id].history).toEqual([])
    })

    it('keeps workflow status and history fully isolated between projects', () => {
      const useStore = setup()
      useStore.getState().setWorkflowStatus(UTAPAO_PROJECT_ID, 4, 'Submitted', 'reviewer@example.com')

      const demoItem = useStore.getState().projects[DEMO_PROJECT_ID].items.find((i) => i.no === 4)!
      expect(demoItem.workflowStatus).toBeUndefined()
      expect(useStore.getState().projects[DEMO_PROJECT_ID].history).toEqual([])
    })
  })

  describe('setPhase (lifecycle phase)', () => {
    it('sets the field and appends one history entry', () => {
      const useStore = setup()
      // Every item defaults to phase 'AfterContract' (TEMPLATE_ITEMS) — real,
      // confirmed data since the MAR checklist is inherently a post-contract
      // submittal process.
      const before = useStore
        .getState()
        .projects[UTAPAO_PROJECT_ID].items.find((i) => i.no === 4)!
      expect(before.phase).toBe('AfterContract')

      useStore.getState().setPhase(UTAPAO_PROJECT_ID, 4, 'Bidding', 'reviewer@example.com')

      const project = useStore.getState().projects[UTAPAO_PROJECT_ID]
      const item = project.items.find((i) => i.no === 4)!
      expect(item.phase).toBe('Bidding')
      expect(project.history).toHaveLength(1)
      expect(project.history[0]).toMatchObject({
        itemNo: 4,
        field: 'phase',
        from: 'AfterContract',
        to: 'Bidding',
        changedBy: 'reviewer@example.com',
      })
    })

    it('re-setting the same phase is a no-op (no duplicate history entry)', () => {
      const useStore = setup()
      useStore.getState().setPhase(UTAPAO_PROJECT_ID, 4, 'Bidding', 'reviewer@example.com')
      useStore.getState().setPhase(UTAPAO_PROJECT_ID, 4, 'Bidding', 'reviewer@example.com')

      expect(useStore.getState().projects[UTAPAO_PROJECT_ID].history).toHaveLength(1)
    })

    it('resetToSeed restores phase to the template default (AfterContract) alongside history', () => {
      const useStore = setup()
      useStore.getState().setPhase(UTAPAO_PROJECT_ID, 4, 'Warranty', 'reviewer@example.com')

      useStore.getState().resetToSeed(UTAPAO_PROJECT_ID)

      const project = useStore.getState().projects[UTAPAO_PROJECT_ID]
      expect(project.items.find((i) => i.no === 4)!.phase).toBe('AfterContract')
      expect(project.history).toEqual([])
    })

    it('keeps phase assignments fully isolated between projects', () => {
      const useStore = setup()
      useStore.getState().setPhase(UTAPAO_PROJECT_ID, 4, 'Bidding', 'reviewer@example.com')

      const demoItem = useStore.getState().projects[DEMO_PROJECT_ID].items.find((i) => i.no === 4)!
      expect(demoItem.phase).toBe('AfterContract') // demo project's own default, unaffected by U-Tapao's override
      expect(useStore.getState().projects[DEMO_PROJECT_ID].history).toEqual([])
    })

    it('createProject sets every item to the caller-chosen defaultPhase', () => {
      const useStore = setup()
      const id = useStore.getState().createProject({
        title: 'E',
        vendor: '',
        scope: '',
        preparedDate: '2026-08-01',
        templateKind: 'mar',
        defaultPhase: 'Bidding',
      })
      const items = useStore.getState().projects[id].items
      expect(items.every((item) => item.phase === 'Bidding')).toBe(true)
    })
  })

  describe('AOT template projects', () => {
    it('createProject with templateKind "aot" clones all 94 items with no sheets, keeping each item\'s own real phase', () => {
      const useStore = setup()
      const id = useStore.getState().createProject({
        title: 'AOT Test Project',
        vendor: '',
        scope: '',
        preparedDate: '2026-08-01',
        templateKind: 'aot',
      })

      const project = useStore.getState().projects[id]
      expect(project.meta.templateKind).toBe('aot')
      expect(project.items).toHaveLength(94)
      expect(project.sheets).toEqual([])
      // real per-item phases are preserved, not bulk-overridden
      expect(project.items.find((i) => i.code === 'P0-S1-01')!.phase).toBe('PreBidding')
      expect(project.items.find((i) => i.code === 'P1-S1-01')!.phase).toBe('Bidding')
      expect(project.items.find((i) => i.code === 'P2-S1-01')!.phase).toBe('AfterContract')
      expect(project.items.find((i) => i.code === 'P3-S1-01')!.phase).toBe('InstallationCommissioning')
    })

    it('resetToSeed on an AOT-created project restores the 94-item AOT template, not MAR\'s 28-item one', () => {
      const useStore = setup()
      const id = useStore.getState().createProject({
        title: 'AOT Test Project',
        vendor: '',
        scope: '',
        preparedDate: '2026-08-01',
        templateKind: 'aot',
      })
      useStore.getState().setWorkflowStatus(id, 1, 'Submitted', 'reviewer@example.com')

      useStore.getState().resetToSeed(id)

      const project = useStore.getState().projects[id]
      expect(project.items).toHaveLength(94)
      expect(project.items.find((i) => i.no === 1)!.workflowStatus).toBeUndefined()
      expect(project.history).toEqual([])
    })

    it('an AOT project never crashes selectAllProjectsSummary-style rollup access (no priority on its items)', () => {
      const useStore = setup()
      const id = useStore.getState().createProject({
        title: 'AOT Test Project',
        vendor: '',
        scope: '',
        preparedDate: '2026-08-01',
        templateKind: 'aot',
      })
      const project = useStore.getState().projects[id]
      expect(project.items.every((item) => item.priority === undefined)).toBe(true)
      expect(project.items.every((item) => item.group === undefined)).toBe(true)
    })
  })

  describe('DOA template projects', () => {
    it('createProject with templateKind "doa" clones all 64 items with no sheets, keeping each item\'s own real phase/site/docType', () => {
      const useStore = setup()
      const id = useStore.getState().createProject({
        title: 'DOA Test Project',
        vendor: '',
        scope: '',
        preparedDate: '2026-08-01',
        templateKind: 'doa',
      })

      const project = useStore.getState().projects[id]
      expect(project.meta.templateKind).toBe('doa')
      expect(project.items).toHaveLength(64)
      expect(project.sheets).toEqual([])
      // real per-item phase/site/docType are preserved, not bulk-overridden
      const shared = project.items.find((i) => i.code === 'G1-REG')!
      expect(shared.site).toBe('Shared')
      expect(shared.docType).toBe('Shared')
      expect(shared.phase).toBe('Bidding')
      const kkcMandatory = project.items.find((i) => i.code === 'G1-03-K')!
      expect(kkcMandatory.site).toBe('KKC')
      expect(kkcMandatory.docType).toBe('Mandatory')
      const uthPostContract = project.items.find((i) => i.code === 'G2-01-U')!
      expect(uthPostContract.site).toBe('UTH')
      expect(uthPostContract.phase).toBe('AfterContract')
      const urtHandover = project.items.find((i) => i.code === 'G3-01-R')!
      expect(urtHandover.site).toBe('URT')
      expect(urtHandover.phase).toBe('InstallationCommissioning')
    })

    it('resetToSeed on a DOA-created project restores the 64-item DOA template, not MAR\'s 28-item one', () => {
      const useStore = setup()
      const id = useStore.getState().createProject({
        title: 'DOA Test Project',
        vendor: '',
        scope: '',
        preparedDate: '2026-08-01',
        templateKind: 'doa',
      })
      useStore.getState().setWorkflowStatus(id, 1, 'Submitted', 'reviewer@example.com')

      useStore.getState().resetToSeed(id)

      const project = useStore.getState().projects[id]
      expect(project.items).toHaveLength(64)
      expect(project.items.find((i) => i.no === 1)!.workflowStatus).toBeUndefined()
      expect(project.history).toEqual([])
    })

    it('a DOA project never crashes selectAllProjectsSummary-style rollup access (no priority on its items)', () => {
      const useStore = setup()
      const id = useStore.getState().createProject({
        title: 'DOA Test Project',
        vendor: '',
        scope: '',
        preparedDate: '2026-08-01',
        templateKind: 'doa',
      })
      const project = useStore.getState().projects[id]
      expect(project.items.every((item) => item.priority === undefined)).toBe(true)
      expect(project.items.every((item) => item.group === undefined)).toBe(true)
    })
  })
})
