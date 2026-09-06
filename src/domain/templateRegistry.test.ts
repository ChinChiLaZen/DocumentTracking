import { describe, expect, it } from 'vitest'
import { BUILTIN_TEMPLATE_DEFS, mergeTemplates, resolveTemplate } from './templateRegistry'
import type { TemplateDefinition } from '../data/types'

function findBuiltin(id: string): TemplateDefinition {
  const def = BUILTIN_TEMPLATE_DEFS.find((t) => t.id === id)
  if (!def) throw new Error(`missing built-in ${id}`)
  return def
}

describe('BUILTIN_TEMPLATE_DEFS', () => {
  it('has exactly the 4 shipped kinds, in order', () => {
    expect(BUILTIN_TEMPLATE_DEFS.map((t) => t.id)).toEqual(['mar', 'aot', 'doa', 'adsb'])
    expect(BUILTIN_TEMPLATE_DEFS.every((t) => t.isBuiltin)).toBe(true)
  })

  it('mar matches the static checklistTemplate.ts shape (28 items, 14 sheets, full/groups/priority/default-phase)', () => {
    const mar = findBuiltin('mar')
    expect(mar.items).toHaveLength(28)
    expect(mar.sheets).toHaveLength(14)
    expect(mar.tabSet).toBe('full')
    expect(mar.hasGroups).toBe(true)
    expect(mar.hasPriority).toBe(true)
    expect(mar.hasDetailSheets).toBe(true)
    expect(mar.supportsDefaultPhase).toBe(true)
    expect(mar.groups).toHaveLength(5)
    expect(mar.priorities.map((p) => p.id)).toEqual(['A', 'B', 'C'])
    expect(mar.criticalNotice?.lines.length).toBeGreaterThan(0)
  })

  it('aot matches the static aotTemplate.ts shape (94 items, no sheets/groups/priority, single-tab)', () => {
    const aot = findBuiltin('aot')
    expect(aot.items).toHaveLength(94)
    expect(aot.sheets).toHaveLength(0)
    expect(aot.tabSet).toBe('single')
    expect(aot.hasGroups).toBe(false)
    expect(aot.hasPriority).toBe(false)
    expect(aot.hasDetailSheets).toBe(false)
    expect(aot.supportsDefaultPhase).toBe(false)
    expect(aot.criticalNotice?.lines.length).toBeGreaterThan(0)
  })

  it('doa matches the static doaTemplate.ts shape (64 items, no critical notice)', () => {
    const doa = findBuiltin('doa')
    expect(doa.items).toHaveLength(64)
    expect(doa.sheets).toHaveLength(0)
    expect(doa.tabSet).toBe('single')
    expect(doa.criticalNotice).toBeUndefined()
  })

  it('adsb matches the static adsbTemplate.ts shape (96 items, no critical notice)', () => {
    const adsb = findBuiltin('adsb')
    expect(adsb.items).toHaveLength(96)
    expect(adsb.sheets).toHaveLength(0)
    expect(adsb.tabSet).toBe('single')
    expect(adsb.criticalNotice).toBeUndefined()
  })
})

describe('mergeTemplates', () => {
  it('with no overrides, returns exactly the 4 built-ins in order', () => {
    const merged = mergeTemplates([])
    expect(merged.map((t) => t.id)).toEqual(['mar', 'aot', 'doa', 'adsb'])
    expect(merged).toEqual(BUILTIN_TEMPLATE_DEFS)
  })

  it('an override with a built-in id replaces that built-in in place, others untouched', () => {
    const marOverride: TemplateDefinition = { ...findBuiltin('mar'), label: 'Reconfigured MAR', isBuiltin: true }
    const merged = mergeTemplates([marOverride])
    expect(merged.map((t) => t.id)).toEqual(['mar', 'aot', 'doa', 'adsb'])
    expect(merged.find((t) => t.id === 'mar')!.label).toBe('Reconfigured MAR')
    expect(merged.find((t) => t.id === 'aot')).toEqual(findBuiltin('aot'))
  })

  it('a custom (non-built-in-id) template is appended after the 4 built-ins', () => {
    const custom: TemplateDefinition = {
      id: 'custom-1',
      isBuiltin: false,
      label: 'Custom',
      description: '',
      tabSet: 'single',
      hasDetailSheets: false,
      hasGroups: false,
      hasPriority: false,
      supportsDefaultPhase: false,
      groups: [],
      priorities: [],
      items: [],
      sheets: [],
    }
    const merged = mergeTemplates([custom])
    expect(merged.map((t) => t.id)).toEqual(['mar', 'aot', 'doa', 'adsb', 'custom-1'])
  })
})

describe('resolveTemplate', () => {
  const templates = mergeTemplates([])

  it('finds an exact id match', () => {
    expect(resolveTemplate(templates, 'aot').id).toBe('aot')
  })

  it('falls back to mar when templateKind is undefined (backward-compat with pre-existing data)', () => {
    expect(resolveTemplate(templates, undefined).id).toBe('mar')
  })

  it('falls back to mar for an unknown id', () => {
    expect(resolveTemplate(templates, 'no-such-template').id).toBe('mar')
  })
})
