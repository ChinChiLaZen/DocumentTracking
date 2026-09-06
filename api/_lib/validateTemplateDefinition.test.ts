import { describe, expect, it } from 'vitest'
import { isValidTemplateDefinition } from './validateTemplateDefinition.js'

const VALID = {
  label: 'Custom Template',
  description: 'A description.',
  tabSet: 'single' as const,
  hasDetailSheets: false,
  hasGroups: false,
  hasPriority: false,
  supportsDefaultPhase: false,
  groups: [],
  priorities: [],
  items: [{ no: 1, name: 'Item', standard: '', requirement: '' }],
  sheets: [],
}

describe('isValidTemplateDefinition', () => {
  it('accepts a minimal valid definition', () => {
    expect(isValidTemplateDefinition(VALID)).toBe(true)
  })

  it('accepts a full-shaped definition with a criticalNotice', () => {
    expect(
      isValidTemplateDefinition({
        ...VALID,
        tabSet: 'full',
        hasGroups: true,
        hasPriority: true,
        hasDetailSheets: true,
        groups: [{ id: 'G1', label: 'Group 1', itemRange: '1-5' }],
        priorities: [{ id: 'A', label: 'A', description: '' }],
        sheets: [{ id: 'sheet-1', itemNo: 1, title: 't', applicable: '', columns: [], rows: [] }],
        criticalNotice: { heading: 'Heads up', lines: ['Step 1'] },
      }),
    ).toBe(true)
  })

  it.each([null, undefined, 'a string', 42, []])('rejects non-object input %p', (value) => {
    expect(isValidTemplateDefinition(value)).toBe(false)
  })

  it('rejects a missing/blank label', () => {
    expect(isValidTemplateDefinition({ ...VALID, label: '' })).toBe(false)
    const withoutLabel: Record<string, unknown> = { ...VALID }
    delete withoutLabel.label
    expect(isValidTemplateDefinition(withoutLabel)).toBe(false)
  })

  it('rejects a non-string description', () => {
    expect(isValidTemplateDefinition({ ...VALID, description: 42 })).toBe(false)
  })

  it('rejects an invalid tabSet', () => {
    expect(isValidTemplateDefinition({ ...VALID, tabSet: 'both' })).toBe(false)
  })

  it.each(['hasDetailSheets', 'hasGroups', 'hasPriority', 'supportsDefaultPhase'])(
    'rejects a non-boolean %s',
    (field) => {
      expect(isValidTemplateDefinition({ ...VALID, [field]: 'yes' })).toBe(false)
    },
  )

  it.each(['groups', 'priorities', 'items', 'sheets'])('rejects a non-array %s', (field) => {
    expect(isValidTemplateDefinition({ ...VALID, [field]: {} })).toBe(false)
  })

  it('rejects a criticalNotice missing heading', () => {
    expect(isValidTemplateDefinition({ ...VALID, criticalNotice: { lines: ['a'] } })).toBe(false)
  })

  it('rejects a criticalNotice with non-array lines', () => {
    expect(isValidTemplateDefinition({ ...VALID, criticalNotice: { heading: 'h', lines: 'a' } })).toBe(false)
  })

  it('accepts criticalNotice being entirely absent', () => {
    expect(isValidTemplateDefinition({ ...VALID, criticalNotice: undefined })).toBe(true)
  })
})
