import { describe, expect, it } from 'vitest'
import { ADSB_TEMPLATE_ITEMS } from './adsbTemplate'

describe('ADSB_TEMPLATE_ITEMS — locked invariants (real ADS-B CATM installation checklist, 2026-08-03)', () => {
  it('has exactly 96 items', () => {
    expect(ADSB_TEMPLATE_ITEMS).toHaveLength(96)
  })

  it('splits across installPhase as DesignApproval:24 / SiteReadiness:16 / Installation:24 / TestingCommissioning:26 / AsBuiltHandover:6', () => {
    const counts = ADSB_TEMPLATE_ITEMS.reduce<Record<string, number>>((acc, item) => {
      const key = item.installPhase ?? 'Unassigned'
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})
    expect(counts).toEqual({
      DesignApproval: 24,
      SiteReadiness: 16,
      Installation: 24,
      TestingCommissioning: 26,
      AsBuiltHandover: 6,
    })
  })

  it('has exactly 80 employerIncluded items, with hwPoint splitting Hold:14 / Witness:19 / none:47', () => {
    const included = ADSB_TEMPLATE_ITEMS.filter((item) => item.employerIncluded)
    expect(included).toHaveLength(80)

    const hwCounts = included.reduce<Record<string, number>>((acc, item) => {
      const key = item.hwPoint ?? 'None'
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})
    expect(hwCounts).toEqual({ Hold: 14, Witness: 19, None: 47 })

    for (const item of ADSB_TEMPLATE_ITEMS) {
      if (!item.employerIncluded) {
        expect(item.requiredEvidence).toBeUndefined()
        expect(item.requiredEvidenceTh).toBeUndefined()
        expect(item.hwPoint).toBeUndefined()
      }
    }
  })

  it('every item has a unique code plus non-empty bilingual name/requirement text, and no group/priority/detailSheetId/importance/docType/site', () => {
    const codes = new Set(ADSB_TEMPLATE_ITEMS.map((item) => item.code))
    expect(codes.size).toBe(96)
    for (const item of ADSB_TEMPLATE_ITEMS) {
      expect(item.name).toBeTruthy()
      expect(item.nameTh).toBeTruthy()
      expect(item.requirement).toBeTruthy()
      expect(item.requirementTh).toBeTruthy()
      expect(item.group).toBeUndefined()
      expect(item.priority).toBeUndefined()
      expect(item.detailSheetId).toBeUndefined()
      expect(item.importance).toBeUndefined()
      expect(item.docType).toBeUndefined()
      expect(item.site).toBeUndefined()
      expect(item.phase).toBeUndefined()
      expect(item.workflowStatus).toBeUndefined()
      expect(item.documentDate).toBeUndefined()
      expect(item.expiryDate).toBeUndefined()
      expect(item.responsiblePerson).toBeUndefined()
      expect(item.documentLink).toBeUndefined()
      expect(item.measured).toBeUndefined()
      expect(item.result).toBeUndefined()
      expect(item.employerResult).toBeUndefined()
    }
  })

  it('assigns sequential no 1..96 matching array order', () => {
    expect(ADSB_TEMPLATE_ITEMS.map((item) => item.no)).toEqual(
      Array.from({ length: 96 }, (_, i) => i + 1),
    )
  })

  it('has a real TOR ref on exactly 13 items', () => {
    const withTorRef = ADSB_TEMPLATE_ITEMS.filter((item) => item.torRef)
    expect(withTorRef).toHaveLength(13)
  })
})
