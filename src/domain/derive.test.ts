import { describe, expect, it } from 'vitest'
import type { CheckColumn, DetailSheet, Item } from '../data/types'
import { INITIAL_PROJECTS, UTAPAO_PROJECT_ID } from '../data/initialProjects'
import {
  autoStatus,
  checksDone,
  checksRequired,
  effectiveStatus,
  item3Remark,
  percent,
  rollup,
} from './derive'

function fixtureSheet(overrides: Partial<DetailSheet> = {}): DetailSheet {
  const columns: CheckColumn[] = [
    { key: 'a', label: 'A' },
    { key: 'b', label: 'B' },
  ]
  return {
    id: 'fixture',
    itemNo: 999,
    title: 'Fixture Sheet',
    applicable: 'n/a',
    columns,
    rows: [
      { id: 'r1', description: 'Row 1', cells: { a: true, b: false } },
      { id: 'r2', description: 'Row 2', cells: { a: false, b: false } },
    ],
    ...overrides,
  }
}

function fixtureItem(overrides: Partial<Item> = {}): Item {
  return {
    no: 999,
    group: 'G1',
    name: 'Fixture Item',
    standard: 'n/a',
    requirement: 'n/a',
    priority: 'A',
    ...overrides,
  }
}

describe('checksRequired / checksDone / percent', () => {
  it('counts required and done cells, computing percent', () => {
    const sheet = fixtureSheet()
    expect(checksRequired(sheet)).toBe(4)
    expect(checksDone(sheet)).toBe(1)
    expect(percent(sheet)).toBe(0.25)
  })

  it('percent is 0 when a sheet has no checkable cells', () => {
    const sheet = fixtureSheet({ rows: [] })
    expect(checksRequired(sheet)).toBe(0)
    expect(percent(sheet)).toBe(0)
  })
})

describe('autoStatus', () => {
  it('is undefined when the sheet has no checkable cells', () => {
    expect(autoStatus(fixtureSheet({ rows: [] }))).toBeUndefined()
  })

  it('is Submitted when every cell is ticked', () => {
    const sheet = fixtureSheet({
      rows: [{ id: 'r1', description: 'Row 1', cells: { a: true, b: true } }],
    })
    expect(autoStatus(sheet)).toBe('Submitted')
  })

  it('is In Progress when some but not all cells are ticked', () => {
    expect(autoStatus(fixtureSheet())).toBe('In Progress')
  })

  it('is Pending when no cells are ticked', () => {
    const sheet = fixtureSheet({
      rows: [{ id: 'r1', description: 'Row 1', cells: { a: false, b: false } }],
    })
    expect(autoStatus(sheet)).toBe('Pending')
  })
})

describe('effectiveStatus', () => {
  it('returns the manual override regardless of sheet state', () => {
    const item = fixtureItem({ manualStatus: 'Needs Revision' })
    expect(effectiveStatus(item, fixtureSheet())).toBe('Needs Revision')
  })

  it('falls back to autoStatus when there is a sheet and no override', () => {
    const item = fixtureItem()
    expect(effectiveStatus(item, fixtureSheet())).toBe('In Progress')
  })

  it('falls back to Pending when there is no sheet and no override', () => {
    const item = fixtureItem()
    expect(effectiveStatus(item, undefined)).toBe('Pending')
  })
})

describe('item3Remark (§6.5)', () => {
  it('generates the sentence from the sheet tick count, never a hand-typed literal', () => {
    // Regression fixture for the spreadsheet's real "6 of 18" vs actual-5 bug:
    // the string must always be derived from the sheet, not equal to a stale literal.
    const sheet = fixtureSheet({
      rows: Array.from({ length: 9 }, (_, i) => ({
        id: `r${i}`,
        description: `Row ${i}`,
        cells: { a: i < 6, b: false },
      })),
    })
    expect(checksDone(sheet)).toBe(6)
    expect(checksRequired(sheet)).toBe(18)
    expect(item3Remark(sheet)).toBe(
      'FAA ALECP listing confirmed for 6 of 18 listed line items. ' +
        'Remaining fixture types, connector kits, isolating transformers, CCR, light bases and ALCMS outstanding.',
    )
  })
})

describe('rollup — §6.4 invariants (locked)', () => {
  const utapao = INITIAL_PROJECTS.find((p) => p.meta.id === UTAPAO_PROJECT_ID)!
  const result = rollup(utapao.items, utapao.sheets)

  it('has 28 total items', () => {
    expect(result.totalItems).toBe(28)
  })

  it('has priority totals A:11 B:14 C:3', () => {
    expect(result.byPriority.A.total).toBe(11)
    expect(result.byPriority.B.total).toBe(14)
    expect(result.byPriority.C.total).toBe(3)
  })

  it('requires 282 checks across the 14 detail sheets', () => {
    expect(result.checkboxRollup.req).toBe(282)
  })

  it('has 120 checks done in the seed data', () => {
    expect(result.checkboxRollup.done).toBe(120)
  })

  it('passes the integrity check', () => {
    expect(result.integrityOK).toBe(true)
  })
})

describe('rollup — items without priority (e.g. AOT template items, §5.2)', () => {
  it('excludes them from byPriority but still counts them in totalItems', () => {
    const withPriority = fixtureItem({ no: 1, priority: 'A' })
    const withoutPriority = fixtureItem({ no: 2, priority: undefined })
    const result = rollup([withPriority, withoutPriority], [])

    expect(result.totalItems).toBe(2)
    expect(result.byPriority.A.total).toBe(1)
    expect(result.byPriority.B.total).toBe(0)
    expect(result.byPriority.C.total).toBe(0)
    // integrityOK is correctly false here — priority totals (1) don't cover
    // every item (2) when one has no priority at all, which is expected for
    // a mixed-shape input; real MAR rollups never see this since every MAR
    // item always has a priority.
    expect(result.integrityOK).toBe(false)
  })
})
