import { describe, expect, it } from 'vitest'
import { mapEgpContractRecord } from './egpContract.js'

// Real record shape captured from a live EGP-CONTRACT API test call this
// session (keyword "ลานจอดอากาศยาน", year 2569) — see CLAUDE.md.
const SAMPLE_RECORD = {
  project_id: '67119538991',
  project_name: 'ประกวดราคาจ้างก่อสร้างงานฟื้นฟูทางหลวง',
  project_type_name: 'จ้างก่อสร้าง',
  dept_name: 'กรมทางหลวง',
  dept_sub_name: 'สำนักงานทางหลวงที่ 12',
  announce_date: '4 ธ.ค. 67',
  project_money: 50000000,
  price_build: 50000000,
  sum_price_agree: 49990000,
  year: 2568,
  project_status: 'ระหว่างดำเนินการ',
  contract: [
    {
      winner_tin: '0725538000641',
      winner_name: 'บริษัท ที.ดี.ดี. ก่อสร้าง จำกัด',
      contract_no: 'สพ.2/12/2568',
      contract_date: '7 ก.พ. 68',
      contract_finish_date: '6 ส.ค. 68',
      price_agree: 49990000,
      status: 'ระหว่างดำเนินการ',
    },
  ],
}

describe('mapEgpContractRecord', () => {
  it('flattens the record and its first contract into one row', () => {
    expect(mapEgpContractRecord(SAMPLE_RECORD, 3)).toEqual({
      no: 3,
      projectId: '67119538991',
      projectName: 'ประกวดราคาจ้างก่อสร้างงานฟื้นฟูทางหลวง',
      deptName: 'กรมทางหลวง',
      deptSubName: 'สำนักงานทางหลวงที่ 12',
      budgetTHB: 50000000,
      status: 'ระหว่างดำเนินการ',
      announceDate: '4 ธ.ค. 67',
      winnerName: 'บริษัท ที.ดี.ดี. ก่อสร้าง จำกัด',
      contractNo: 'สพ.2/12/2568',
      contractDate: '7 ก.พ. 68',
      priceAgreeTHB: 49990000,
    })
  })

  it('defaults every field for a project with no contract yet', () => {
    expect(mapEgpContractRecord({ project_id: 'x', project_name: 'y' }, 1)).toEqual({
      no: 1,
      projectId: 'x',
      projectName: 'y',
      deptName: '',
      deptSubName: '',
      budgetTHB: 0,
      status: '',
      announceDate: '',
      winnerName: '',
      contractNo: '',
      contractDate: '',
      priceAgreeTHB: 0,
    })
  })
})
