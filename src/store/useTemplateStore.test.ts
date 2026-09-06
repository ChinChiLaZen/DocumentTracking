import { describe, expect, it } from 'vitest'
import { createTemplateStore } from './useTemplateStore'
import { createMemoryPersistence } from './persistence'
import { BUILTIN_TEMPLATE_DEFS } from '../domain/templateRegistry'

function setup() {
  return createTemplateStore(createMemoryPersistence())
}

const CUSTOM_INPUT = {
  label: 'Flat Custom Template',
  description: 'A brand-new flat template.',
  tabSet: 'single' as const,
  hasDetailSheets: false,
  hasGroups: false,
  hasPriority: false,
  supportsDefaultPhase: false,
  groups: [],
  priorities: [],
  items: [{ no: 1, name: 'First item', standard: '', requirement: '' }],
  sheets: [],
}

describe('useTemplateStore', () => {
  it('starts with the 4 built-ins present even before hydrate() resolves', () => {
    const useStore = setup()
    expect(useStore.getState().templates.map((t) => t.id)).toEqual(['mar', 'aot', 'doa', 'adsb'])
  })

  it('hydrate() with no stored overrides leaves the built-ins untouched', async () => {
    const useStore = setup()
    await useStore.getState().hydrate()
    expect(useStore.getState().templates).toEqual(BUILTIN_TEMPLATE_DEFS)
    expect(useStore.getState().hydrated).toBe(true)
  })

  it('createTemplate appends a new custom template after the built-ins and persists it', async () => {
    const persistence = createMemoryPersistence()
    const useStore = createTemplateStore(persistence)

    const { id, error } = await useStore.getState().createTemplate(CUSTOM_INPUT)
    expect(error).toBeUndefined()
    expect(id).toBeDefined()

    const templates = useStore.getState().templates
    expect(templates.map((t) => t.id)).toEqual(['mar', 'aot', 'doa', 'adsb', id])
    const created = templates.find((t) => t.id === id)!
    expect(created.isBuiltin).toBe(false)
    expect(created.label).toBe('Flat Custom Template')

    // Actually persisted, not just held in the in-memory Zustand state — a
    // second store reading from the same persistence backend sees it too.
    const overrides = await persistence.loadTemplateOverrides()
    expect(overrides.map((t) => t.id)).toEqual([id])
  })

  it('updateTemplate on a custom id updates it in place', async () => {
    const useStore = setup()
    const { id } = await useStore.getState().createTemplate(CUSTOM_INPUT)
    const created = useStore.getState().templates.find((t) => t.id === id)!

    const { error } = await useStore.getState().updateTemplate(id!, { ...created, label: 'Renamed' })
    expect(error).toBeUndefined()
    expect(useStore.getState().templates.find((t) => t.id === id)!.label).toBe('Renamed')
  })

  it('updateTemplate on a built-in id (mar) creates an override, leaving other built-ins untouched', async () => {
    const useStore = setup()
    const mar = useStore.getState().templates.find((t) => t.id === 'mar')!

    await useStore.getState().updateTemplate('mar', { ...mar, label: 'Reconfigured MAR' })

    const templates = useStore.getState().templates
    expect(templates.map((t) => t.id)).toEqual(['mar', 'aot', 'doa', 'adsb'])
    expect(templates.find((t) => t.id === 'mar')!.label).toBe('Reconfigured MAR')
    expect(templates.find((t) => t.id === 'aot')).toEqual(BUILTIN_TEMPLATE_DEFS.find((t) => t.id === 'aot'))
  })

  it('deleteTemplate on a custom id removes it entirely', async () => {
    const useStore = setup()
    const { id } = await useStore.getState().createTemplate(CUSTOM_INPUT)

    const { error } = await useStore.getState().deleteTemplate(id!)
    expect(error).toBeUndefined()
    expect(useStore.getState().templates.map((t) => t.id)).toEqual(['mar', 'aot', 'doa', 'adsb'])
  })

  it('deleteTemplate on an overridden built-in id reverts it to the shipped default', async () => {
    const useStore = setup()
    const mar = useStore.getState().templates.find((t) => t.id === 'mar')!
    await useStore.getState().updateTemplate('mar', { ...mar, label: 'Reconfigured MAR' })
    expect(useStore.getState().templates.find((t) => t.id === 'mar')!.label).toBe('Reconfigured MAR')

    await useStore.getState().deleteTemplate('mar')

    expect(useStore.getState().templates.find((t) => t.id === 'mar')).toEqual(
      BUILTIN_TEMPLATE_DEFS.find((t) => t.id === 'mar'),
    )
  })

  it('duplicateTemplate deep-clones items/sheets so editing the copy never touches the source', async () => {
    const useStore = setup()
    const mar = useStore.getState().templates.find((t) => t.id === 'mar')!

    const { id, error } = await useStore.getState().duplicateTemplate('mar')
    expect(error).toBeUndefined()

    const copy = useStore.getState().templates.find((t) => t.id === id)!
    expect(copy.label).toBe(`${mar.label} (Copy)`)
    expect(copy.isBuiltin).toBe(false)
    expect(copy.items).toHaveLength(mar.items.length)
    expect(copy.sheets).toHaveLength(mar.sheets.length)

    // Mutate the copy's first item/sheet row and confirm the source (still
    // held by the store) is unaffected — proves the clone is deep, not a
    // shared reference (cloneItems/cloneSheets from domain/cloneChecklist.ts).
    copy.items[0].name = 'mutated'
    if (copy.sheets[0]) copy.sheets[0].rows[0].cells[copy.sheets[0].columns[0]?.key ?? ''] = true
    const stillOriginalMar = useStore.getState().templates.find((t) => t.id === 'mar')!
    expect(stillOriginalMar.items[0].name).not.toBe('mutated')
  })

  it('duplicateTemplate on an unknown id returns an error', async () => {
    const useStore = setup()
    const { error } = await useStore.getState().duplicateTemplate('no-such-id')
    expect(error).toBe('Template not found')
  })

  describe('optimistic-local-first rollback on a failing persistence backend', () => {
    function setupFailing() {
      const memory = createMemoryPersistence()
      return createTemplateStore({
        ...memory,
        saveTemplate: async () => ({ error: 'network down' }),
        deleteTemplateOverride: async () => ({ error: 'network down' }),
      })
    }

    it('createTemplate applies optimistically, then rolls back and surfaces the error', async () => {
      const useStore = setupFailing()
      const { error, id } = await useStore.getState().createTemplate(CUSTOM_INPUT)
      expect(error).toBe('network down')
      // Rolled back — the failed create must not linger in state.
      expect(useStore.getState().templates.map((t) => t.id)).toEqual(['mar', 'aot', 'doa', 'adsb'])
      expect(id).toBeUndefined()
    })

    it('deleteTemplate rolls back a failed delete, restoring the override', async () => {
      // Seed a successful override first via a working store...
      const working = createTemplateStore(createMemoryPersistence())
      const mar = working.getState().templates.find((t) => t.id === 'mar')!
      await working.getState().updateTemplate('mar', { ...mar, label: 'Reconfigured MAR' })

      // ...then attempt the delete against a store whose delete always fails.
      const useStore = createTemplateStore({
        ...createMemoryPersistence(),
        loadTemplateOverrides: async () => [working.getState().templates.find((t) => t.id === 'mar')!],
        deleteTemplateOverride: async () => ({ error: 'network down' }),
      })
      await useStore.getState().hydrate()
      expect(useStore.getState().templates.find((t) => t.id === 'mar')!.label).toBe('Reconfigured MAR')

      const { error } = await useStore.getState().deleteTemplate('mar')
      expect(error).toBe('network down')
      expect(useStore.getState().templates.find((t) => t.id === 'mar')!.label).toBe('Reconfigured MAR')
    })
  })
})
