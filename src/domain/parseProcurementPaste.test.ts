import { describe, expect, it } from 'vitest'
import { parseProcurementPaste } from './parseProcurementPaste'

describe('parseProcurementPaste', () => {
  it('parses tab-separated rows copied from the e-GP table', () => {
    const pasted = [
      '1\tกรมท่าอากาศยาน\tกรมท่าอากาศยาน\tจ้างทดสอบระบบ (เลขที่โครงการ : 12345)\t65,000,000.00\tจัดทำสัญญา/บริหารสัญญา\t',
      '2\tบริษัท ท่าอากาศยานไทย จำกัด (มหาชน)\tท่าอากาศยานภูเก็ต\tจ้างทดสอบระบบ 2\t1,234.50\tยกเลิกโครงการ\t',
    ].join('\n')

    const result = parseProcurementPaste(pasted)

    expect(result).toEqual([
      {
        no: 1,
        agency: 'กรมท่าอากาศยาน',
        purchasingUnit: 'กรมท่าอากาศยาน',
        projectName: 'จ้างทดสอบระบบ (เลขที่โครงการ : 12345)',
        budgetTHB: 65000000,
        status: 'จัดทำสัญญา/บริหารสัญญา',
      },
      {
        no: 2,
        agency: 'บริษัท ท่าอากาศยานไทย จำกัด (มหาชน)',
        purchasingUnit: 'ท่าอากาศยานภูเก็ต',
        projectName: 'จ้างทดสอบระบบ 2',
        budgetTHB: 1234.5,
        status: 'ยกเลิกโครงการ',
      },
    ])
  })

  it('skips blank lines', () => {
    const pasted = '\n\n1\tA\tB\tC\t100\tStatus\t\n\n'
    expect(parseProcurementPaste(pasted)).toHaveLength(1)
  })

  it('skips lines with too few columns', () => {
    const pasted = '1\tA\tB\tOnly four cols'
    expect(parseProcurementPaste(pasted)).toEqual([])
  })

  it('skips lines with a non-numeric No. or Budget', () => {
    const badNo = 'x\tA\tB\tName\t100\tStatus'
    const badBudget = '1\tA\tB\tName\tnot-a-number\tStatus'
    expect(parseProcurementPaste(badNo)).toEqual([])
    expect(parseProcurementPaste(badBudget)).toEqual([])
  })

  it('skips lines missing a required text field', () => {
    const missingAgency = '1\t\tB\tName\t100\tStatus'
    expect(parseProcurementPaste(missingAgency)).toEqual([])
  })
})
