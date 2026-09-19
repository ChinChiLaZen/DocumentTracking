import { describe, expect, it } from 'vitest'
import { filterContractLeads } from './egpContractFilters.js'
import type { AwardedContractLead } from './egpContract.js'

function lead(overrides: Partial<AwardedContractLead>): AwardedContractLead {
  return {
    no: 1,
    projectId: 'p1',
    projectName: 'test project',
    deptName: '',
    deptSubName: '',
    budgetTHB: 0,
    status: '',
    announceDate: '',
    winnerName: '',
    contractNo: '',
    contractDate: '',
    priceAgreeTHB: 0,
    ...overrides,
  }
}

describe('filterContractLeads', () => {
  const suvarnabhumi = lead({
    no: 1,
    deptName: 'บริษัท ท่าอากาศยานไทย จำกัด (มหาชน)',
    deptSubName: 'ท่าอากาศยานสุวรรณภูมิ',
  })
  const donMueang = lead({
    no: 2,
    deptName: 'บริษัท ท่าอากาศยานไทย จำกัด (มหาชน)',
    deptSubName: 'ท่าอากาศยานดอนเมือง',
  })
  const doa = lead({ no: 3, deptName: 'กรมท่าอากาศยาน', deptSubName: 'กรมท่าอากาศยาน' })
  const unrelated = lead({ no: 4, deptName: 'กรมทางหลวง', deptSubName: 'สำนักงานทางหลวงที่ 12' })
  const all = [suvarnabhumi, donMueang, doa, unrelated]

  it('returns every lead unchanged when no filter is given', () => {
    expect(filterContractLeads(all, {})).toEqual(all)
  })

  it('narrows by sub-unit only', () => {
    expect(filterContractLeads(all, { subUnit: 'ท่าอากาศยานสุวรรณภูมิ' })).toEqual([suvarnabhumi])
  })

  it('narrows by agency only', () => {
    expect(filterContractLeads(all, { agency: 'กรมท่าอากาศยาน' })).toEqual([doa])
  })

  it('combines sub-unit and agency with AND semantics', () => {
    expect(
      filterContractLeads(all, { subUnit: 'ท่าอากาศยาน', agency: 'บริษัท ท่าอากาศยานไทย จำกัด (มหาชน)' }),
    ).toEqual([suvarnabhumi, donMueang])
  })

  it('matches by substring containment, not exact equality', () => {
    const withSuffix = lead({ no: 5, deptSubName: 'ท่าอากาศยานภูเก็ต (สำนักงานภาค)' })
    expect(filterContractLeads([withSuffix], { subUnit: 'ท่าอากาศยานภูเก็ต' })).toEqual([withSuffix])
  })

  it('excludes a non-matching sub-unit', () => {
    expect(filterContractLeads(all, { subUnit: 'ท่าอากาศยานเชียงราย' })).toEqual([])
  })
})
