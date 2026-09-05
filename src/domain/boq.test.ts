import { describe, expect, it } from 'vitest'
import type { BoqCategory, BoqEstimate } from '../data/types'
import { categoryTotal, lineTotal, summarizeBoq } from './boq'

function fixtureCategory(overrides: Partial<BoqCategory> = {}): BoqCategory {
  return {
    id: 'c1',
    name: 'Category 1',
    lines: [
      { id: 'l1', description: 'Item A', quantity: 2, unit: 'set', materialUnitCost: 100, laborUnitCost: 50 },
      { id: 'l2', description: 'Item B', quantity: 1, unit: 'set', materialUnitCost: 200, laborUnitCost: 0 },
    ],
    ...overrides,
  }
}

describe('lineTotal', () => {
  it('multiplies quantity by material+labor unit cost', () => {
    expect(
      lineTotal({ id: 'l', description: '', quantity: 2, unit: 'set', materialUnitCost: 100, laborUnitCost: 50 }),
    ).toBe(300)
  })
})

describe('categoryTotal', () => {
  it('sums every line total in the category', () => {
    expect(categoryTotal(fixtureCategory())).toBe(500) // (2*150)+(1*200)
  })
})

describe('summarizeBoq', () => {
  it('computes subtotal/vat/net and category shares matching a hand-computed example', () => {
    const estimate: BoqEstimate = {
      vatPercent: 7,
      categories: [
        fixtureCategory({ id: 'c1', name: 'Category 1' }), // total 500
        fixtureCategory({
          id: 'c2',
          name: 'Category 2',
          lines: [
            { id: 'l3', description: 'Item C', quantity: 1, unit: 'set', materialUnitCost: 500, laborUnitCost: 0 },
          ],
        }), // total 500
      ],
    }
    const summary = summarizeBoq(estimate)
    expect(summary.subtotal).toBe(1000)
    expect(summary.vatAmount).toBeCloseTo(70)
    expect(summary.netTotal).toBeCloseTo(1070)
    expect(summary.categoryShares).toHaveLength(2)
    expect(summary.categoryShares[0].percent).toBeCloseTo(50)
    expect(summary.categoryShares[1].percent).toBeCloseTo(50)
  })

  it('returns 0 totals and no divide-by-zero for an empty estimate', () => {
    expect(summarizeBoq({ categories: [], vatPercent: 7 })).toEqual({
      subtotal: 0,
      vatAmount: 0,
      netTotal: 0,
      categoryShares: [],
    })
  })
})
