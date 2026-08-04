import { describe, expect, it } from 'vitest'
import { getLeadId } from './procurementLeadId'

describe('getLeadId', () => {
  it('extracts the real เลขที่โครงการ when present', () => {
    const lead = {
      agency: 'กรมท่าอากาศยาน',
      purchasingUnit: 'กรมท่าอากาศยาน',
      projectName: 'ทดสอบ (เลขที่โครงการ : 69029460012)',
    }
    expect(getLeadId(lead)).toBe('69029460012')
  })

  it('is stable across repeated calls for the same content', () => {
    const lead = { agency: 'A', purchasingUnit: 'B', projectName: 'No project number here' }
    expect(getLeadId(lead)).toBe(getLeadId(lead))
  })

  it('falls back to a content hash when there is no project number', () => {
    const lead = { agency: 'A', purchasingUnit: 'B', projectName: 'No project number here' }
    const id = getLeadId(lead)
    expect(id).not.toMatch(/เลขที่โครงการ/)
    expect(id.length).toBeGreaterThan(0)
  })

  it('produces different ids for different content', () => {
    const a = getLeadId({ agency: 'A', purchasingUnit: 'X', projectName: 'Foo' })
    const b = getLeadId({ agency: 'B', purchasingUnit: 'X', projectName: 'Bar' })
    expect(a).not.toBe(b)
  })
})
