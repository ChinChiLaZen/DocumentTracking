import { describe, expect, it } from 'vitest'
import { AOT_TEMPLATE_ITEMS } from './aotTemplate'

describe('AOT_TEMPLATE_ITEMS — locked invariants (real RSMS/AOT data, 2026-07-27)', () => {
  it('has exactly 94 items', () => {
    expect(AOT_TEMPLATE_ITEMS).toHaveLength(94)
  })

  it('splits across the 4 phases as 38/20/6/30', () => {
    const counts = AOT_TEMPLATE_ITEMS.reduce<Record<string, number>>((acc, item) => {
      const key = item.phase ?? 'Unassigned'
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})
    expect(counts).toEqual({
      PreBidding: 38,
      Bidding: 20,
      AfterContract: 6,
      InstallationCommissioning: 30,
    })
  })

  it('every item has a unique code, no group/priority/detailSheetId, and starts fully blank', () => {
    const codes = new Set(AOT_TEMPLATE_ITEMS.map((item) => item.code))
    expect(codes.size).toBe(94)
    for (const item of AOT_TEMPLATE_ITEMS) {
      expect(item.group).toBeUndefined()
      expect(item.priority).toBeUndefined()
      expect(item.detailSheetId).toBeUndefined()
      expect(item.workflowStatus).toBeUndefined()
      expect(item.documentDate).toBeUndefined()
      expect(item.expiryDate).toBeUndefined()
      expect(item.responsiblePerson).toBeUndefined()
      expect(item.documentLink).toBeUndefined()
    }
  })

  it('assigns sequential no 1..94 matching array order', () => {
    expect(AOT_TEMPLATE_ITEMS.map((item) => item.no)).toEqual(
      Array.from({ length: 94 }, (_, i) => i + 1),
    )
  })
})
