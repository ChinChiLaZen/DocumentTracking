import { describe, expect, it } from 'vitest'
import { DOA_TEMPLATE_ITEMS } from './doaTemplate'

describe('DOA_TEMPLATE_ITEMS — locked invariants (real KKC/UTH/URT tracker data, 2026-07-27)', () => {
  it('has exactly 64 items', () => {
    expect(DOA_TEMPLATE_ITEMS).toHaveLength(64)
  })

  it('splits across docType as Shared:12 / Mandatory:21 / SiteSpecific:31', () => {
    const counts = DOA_TEMPLATE_ITEMS.reduce<Record<string, number>>((acc, item) => {
      const key = item.docType ?? 'Unassigned'
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})
    expect(counts).toEqual({ Shared: 12, Mandatory: 21, SiteSpecific: 31 })
  })

  it('splits across site as Shared:17 / KKC:17 / UTH:15 / URT:15', () => {
    const counts = DOA_TEMPLATE_ITEMS.reduce<Record<string, number>>((acc, item) => {
      const key = item.site ?? 'Unassigned'
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})
    expect(counts).toEqual({ Shared: 17, KKC: 17, UTH: 15, URT: 15 })
  })

  it('splits across phase as Bidding:33 / AfterContract:12 / InstallationCommissioning:19', () => {
    const counts = DOA_TEMPLATE_ITEMS.reduce<Record<string, number>>((acc, item) => {
      const key = item.phase ?? 'Unassigned'
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})
    expect(counts).toEqual({ Bidding: 33, AfterContract: 12, InstallationCommissioning: 19 })
  })

  it('every item has a unique code, no group/priority/detailSheetId/importance, and starts fully blank', () => {
    const codes = new Set(DOA_TEMPLATE_ITEMS.map((item) => item.code))
    expect(codes.size).toBe(64)
    for (const item of DOA_TEMPLATE_ITEMS) {
      expect(item.group).toBeUndefined()
      expect(item.priority).toBeUndefined()
      expect(item.detailSheetId).toBeUndefined()
      expect(item.importance).toBeUndefined()
      expect(item.workflowStatus).toBeUndefined()
      expect(item.documentDate).toBeUndefined()
      expect(item.expiryDate).toBeUndefined()
      expect(item.responsiblePerson).toBeUndefined()
      expect(item.documentLink).toBeUndefined()
    }
  })

  it('assigns sequential no 1..64 matching array order', () => {
    expect(DOA_TEMPLATE_ITEMS.map((item) => item.no)).toEqual(
      Array.from({ length: 64 }, (_, i) => i + 1),
    )
  })
})
