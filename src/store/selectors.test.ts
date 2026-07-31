import { describe, expect, it } from 'vitest'
import type { HistoryEntry, Item } from '../data/types'
import {
  filterHistory,
  selectHistorySorted,
  selectOverallPhaseProgress,
  selectPhaseSummary,
} from './selectors'

function fixtureItem(overrides: Partial<Item> = {}): Item {
  return {
    no: 1,
    group: 'G1',
    name: 'Fixture Item',
    standard: 'n/a',
    requirement: 'n/a',
    priority: 'A',
    ...overrides,
  }
}

describe('selectPhaseSummary', () => {
  const items: Item[] = [
    fixtureItem({ no: 1, name: 'Item 1', phase: 'Bidding', workflowStatus: 'Submitted' }),
    fixtureItem({ no: 2, name: 'Item 2', phase: 'Bidding', workflowStatus: 'Preparing' }),
    fixtureItem({ no: 3, name: 'Item 3', phase: 'Bidding' }),
    fixtureItem({ no: 9, name: 'Item 9', phase: 'Warranty', workflowStatus: 'AwaitingApproval' }),
    fixtureItem({ no: 27, name: 'Item 27', phase: 'Other', workflowStatus: 'Submitted' }),
    fixtureItem({ no: 28, name: 'Item 28' }), // no phase set — Unassigned, NOT 'Other'
  ]
  const summaries = selectPhaseSummary(items)

  it('returns exactly the 7 LIFECYCLE_PHASE_DEFS entries, in order', () => {
    expect(summaries.phases.map((s) => s.phase.id)).toEqual([
      'PreBidding',
      'Bidding',
      'AfterContract',
      'InstallationCommissioning',
      'Warranty',
      'OperationMaintenance',
      'Other',
    ])
  })

  it('counts total/done/percent/inPreparation per phase', () => {
    const bidding = summaries.phases.find((s) => s.phase.id === 'Bidding')!
    expect(bidding.total).toBe(3)
    expect(bidding.done).toBe(1) // only 'Submitted' counts as done
    expect(bidding.inPreparation).toBe(1) // 'Preparing'
    expect(bidding.percent).toBe(33) // round(1/3 * 100)

    const warranty = summaries.phases.find((s) => s.phase.id === 'Warranty')!
    expect(warranty.total).toBe(1)
    expect(warranty.done).toBe(0)
    expect(warranty.inPreparation).toBe(1) // 'AwaitingApproval' also counts as in-preparation
  })

  it('is 0/0% for a phase with no items in the fixture', () => {
    const preBidding = summaries.phases.find((s) => s.phase.id === 'PreBidding')!
    expect(preBidding.total).toBe(0)
    expect(preBidding.done).toBe(0)
    expect(preBidding.percent).toBe(0)
  })

  it('"Others" (item.phase === "Other") is a real phase, distinct from Unassigned', () => {
    const others = summaries.phases.find((s) => s.phase.id === 'Other')!
    expect(others.total).toBe(1)
    expect(others.done).toBe(1)
  })

  it('items with no phase set land in `unassigned`, never in a real phase bucket', () => {
    expect(summaries.unassigned.total).toBe(1)
    expect(summaries.unassigned.done).toBe(0)
    // Item 28 (unassigned) must not have been counted into any of the 7 real phases
    const totalAcrossPhases = summaries.phases.reduce((sum, s) => sum + s.total, 0)
    expect(totalAcrossPhases).toBe(5) // 6 items total, 1 unassigned, 5 in real phases
  })
})

describe('selectOverallPhaseProgress', () => {
  it('counts Submitted-only as done across all items', () => {
    const items: Item[] = [
      fixtureItem({ no: 1, workflowStatus: 'Submitted' }),
      fixtureItem({ no: 2, workflowStatus: 'Ready' }), // Ready is NOT done — only Submitted is
      fixtureItem({ no: 3 }),
    ]
    const result = selectOverallPhaseProgress(items)
    expect(result).toEqual({ total: 3, done: 1, percent: 33 })
  })

  it('is 0% when there are no items', () => {
    expect(selectOverallPhaseProgress([])).toEqual({ total: 0, done: 0, percent: 0 })
  })
})

describe('history selectors', () => {
  function fixtureEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
    return {
      id: 'h1',
      timestamp: '2026-07-26T10:00:00.000Z',
      itemNo: 4,
      field: 'workflowStatus',
      from: undefined,
      to: 'Preparing',
      changedBy: 'reviewer@example.com',
      ...overrides,
    }
  }

  it('selectHistorySorted returns newest first', () => {
    const entries = [
      fixtureEntry({ id: 'a', timestamp: '2026-07-26T10:00:00.000Z' }),
      fixtureEntry({ id: 'b', timestamp: '2026-07-26T12:00:00.000Z' }),
      fixtureEntry({ id: 'c', timestamp: '2026-07-26T11:00:00.000Z' }),
    ]
    expect(selectHistorySorted(entries).map((e) => e.id)).toEqual(['b', 'c', 'a'])
  })

  it('filterHistory matches by item number, item name, or changedBy', () => {
    const items: Item[] = [fixtureItem({ no: 4, name: 'Complete LM-79 Test Reports' })]
    const entries = [
      fixtureEntry({ id: 'a', itemNo: 4, changedBy: 'alice@example.com' }),
      fixtureEntry({ id: 'b', itemNo: 5, changedBy: 'bob@example.com' }),
    ]

    expect(filterHistory(entries, items, '4').map((e) => e.id)).toEqual(['a'])
    expect(filterHistory(entries, items, 'LM-79').map((e) => e.id)).toEqual(['a'])
    expect(filterHistory(entries, items, 'bob').map((e) => e.id)).toEqual(['b'])
    expect(filterHistory(entries, items, '').map((e) => e.id)).toEqual(['a', 'b']) // blank query = no filter
  })
})
