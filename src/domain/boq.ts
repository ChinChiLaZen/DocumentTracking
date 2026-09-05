import type { BoqCategory, BoqEstimate, BoqLine } from '../data/types'

export function lineTotal(line: BoqLine): number {
  return line.quantity * (line.materialUnitCost + line.laborUnitCost)
}

export function categoryTotal(category: BoqCategory): number {
  return category.lines.reduce((sum, line) => sum + lineTotal(line), 0)
}

export interface CategoryShare {
  categoryId: string
  name: string
  total: number
  percent: number // share of the pre-VAT subtotal, 0 when subtotal is 0
}

export interface BoqSummary {
  subtotal: number
  vatAmount: number
  netTotal: number
  categoryShares: CategoryShare[]
}

/** Subtotal/VAT/net total plus each category's % share of the pre-VAT
 *  subtotal, for the summary card and Excel export. */
export function summarizeBoq(estimate: BoqEstimate): BoqSummary {
  const subtotal = estimate.categories.reduce((sum, c) => sum + categoryTotal(c), 0)
  const vatAmount = subtotal * (estimate.vatPercent / 100)
  const netTotal = subtotal + vatAmount
  const categoryShares: CategoryShare[] = estimate.categories.map((c) => {
    const total = categoryTotal(c)
    return { categoryId: c.id, name: c.name, total, percent: subtotal > 0 ? (total / subtotal) * 100 : 0 }
  })
  return { subtotal, vatAmount, netTotal, categoryShares }
}
