import { describe, expect, it } from 'vitest'
import type { BoqEstimate, ProjectMeta } from '../../data/types'
import { buildBoqWorkbook, computeBoqLayout } from './boqExcelExport'

const meta: ProjectMeta = {
  id: 'p1', title: 'Test Project', scope: 'Test Scope', vendor: 'Test Agency', preparedDate: '2026-09-05',
}

function estimate(): BoqEstimate {
  return {
    vatPercent: 7,
    categories: [
      { id: 'c1', name: 'Category 1', lines: [
        { id: 'l1', description: 'Item A', quantity: 2, unit: 'set', materialUnitCost: 100, laborUnitCost: 50 },
      ] },
      { id: 'c2', name: 'Category 2 (empty)', lines: [] },
      { id: 'c3', name: 'Category 3', lines: [
        { id: 'l2', description: 'Item B', quantity: 1, unit: 'ea', materialUnitCost: 10, laborUnitCost: 5 },
        { id: 'l3', description: 'Item C', quantity: 3, unit: 'ea', materialUnitCost: 20, laborUnitCost: 0 },
      ] },
    ],
  }
}

describe('computeBoqLayout', () => {
  it('omits zero-line categories but keeps original 1-based category numbers', () => {
    const layout = computeBoqLayout(estimate())
    expect(layout.categories.map((c) => c.categoryNo)).toEqual([1, 3])
    expect(layout.firstCategoryNo).toBe(1)
    expect(layout.lastCategoryNo).toBe(3)
  })

  it('lays out header/line/subtotal rows contiguously starting at row 9', () => {
    const layout = computeBoqLayout(estimate())
    const [cat1, cat3] = layout.categories
    expect(cat1.headerRow).toBe(9)
    expect(cat1.firstLineRow).toBe(10)
    expect(cat1.lastLineRow).toBe(10)
    expect(cat1.subtotalRow).toBe(11)
    expect(cat3.headerRow).toBe(12)
    expect(cat3.firstLineRow).toBe(13)
    expect(cat3.lastLineRow).toBe(14)
    expect(cat3.subtotalRow).toBe(15)
    expect(layout.grandTotalRow).toBe(16)
  })

  it('returns a null grand-total row when every category is empty', () => {
    const layout = computeBoqLayout({ vatPercent: 7, categories: [{ id: 'c1', name: 'Empty', lines: [] }] })
    expect(layout.categories).toHaveLength(0)
    expect(layout.grandTotalRow).toBeNull()
  })
})

describe('buildBoqWorkbook', () => {
  it('creates Overview before BOQ, matching the source template tab order', () => {
    const wb = buildBoqWorkbook(meta, estimate())
    expect(wb.worksheets.map((ws) => ws.name)).toEqual(['Overview', 'BOQ'])
  })

  it('writes the category-subtotal SUM formulas and a +-joined grand-total formula', () => {
    const wb = buildBoqWorkbook(meta, estimate())
    const boqSheet = wb.getWorksheet('BOQ')!
    const layout = computeBoqLayout(estimate())
    const cat1 = layout.categories[0]
    expect(boqSheet.getCell(cat1.subtotalRow, 9).formula).toBe(`SUM(I${cat1.firstLineRow}:I${cat1.lastLineRow})`)
    const grandTotalCell = boqSheet.getCell(layout.grandTotalRow!, 9)
    expect(grandTotalCell.formula).toBe(layout.categories.map((c) => `I${c.subtotalRow}`).join('+'))
  })

  it("points the Overview grand-total cell at the BOQ sheet's actual grand-total row", () => {
    const wb = buildBoqWorkbook(meta, estimate())
    const layout = computeBoqLayout(estimate())
    const overview = wb.getWorksheet('Overview')!
    expect(overview.getCell(12, 3).formula).toBe(`BOQ!I${layout.grandTotalRow}`)
  })

  it('renders a single italic empty-state row when there are no categories at all', () => {
    const wb = buildBoqWorkbook(meta, { vatPercent: 7, categories: [] })
    const boqSheet = wb.getWorksheet('BOQ')!
    expect(boqSheet.getCell(9, 1).value).toBe('No categories yet.')
    const overview = wb.getWorksheet('Overview')!
    expect(overview.getCell(12, 3).value).toBe(0)
  })
})
