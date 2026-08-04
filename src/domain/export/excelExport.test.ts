import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { INITIAL_PROJECTS, UTAPAO_PROJECT_ID } from '../../data/initialProjects'
import { AOT_TEMPLATE_ITEMS } from '../../data/aotTemplate'
import { DOA_TEMPLATE_ITEMS } from '../../data/doaTemplate'
import { ADSB_TEMPLATE_ITEMS } from '../../data/adsbTemplate'
import { ADSB_INSTALL_PHASE_DEFS, DETAIL_SHEET_ORDER } from '../rules'
import { buildMarWorkbook, buildPhaseWorkbook } from './excelExport'
import { buildAdsbExcelWorkbook } from './adsbExcelExport'

function dataRowCount(ws: XLSX.WorkSheet): number {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][]
  return rows.length - 1 // minus header row
}

/** Tracker sheet interleaves a single-cell group-label row before each group — count only item rows (first cell is a number). */
function trackerItemRowCount(ws: XLSX.WorkSheet): number {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][]
  return rows.filter((row) => typeof row[0] === 'number').length
}

describe('buildMarWorkbook', () => {
  const utapao = INITIAL_PROJECTS.find((p) => p.meta.id === UTAPAO_PROJECT_ID)!
  const wb = buildMarWorkbook(utapao.items, utapao.sheets)

  it('has a Tracker sheet with 28 item rows', () => {
    expect(trackerItemRowCount(wb.Sheets['Tracker'])).toBe(28)
  })

  it('has a Dashboard Summary sheet', () => {
    expect(wb.SheetNames).toContain('Dashboard Summary')
  })

  it('has one sheet per detail sheet, named Item {no}, totalling 282 checkbox cells', () => {
    let total = 0
    for (const itemNo of DETAIL_SHEET_ORDER) {
      const sheetName = `Item ${itemNo}`
      expect(wb.SheetNames).toContain(sheetName)
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 }) as unknown[][]
      const sheet = utapao.sheets.find((s) => s.itemNo === itemNo)!
      total += sheet.rows.reduce((sum, row) => sum + Object.keys(row.cells).length, 0)
      // sanity: at least as many data rows as CheckRows (section dividers add extra rows)
      expect(rows.length - 1).toBeGreaterThanOrEqual(sheet.rows.length)
    }
    expect(total).toBe(282)
  })
})

describe('buildPhaseWorkbook', () => {
  it('produces a 94-row Register sheet for the AOT template', () => {
    const wb = buildPhaseWorkbook(AOT_TEMPLATE_ITEMS)
    expect(dataRowCount(wb.Sheets['Register'])).toBe(94)
    expect(wb.SheetNames).toContain('Summary')
  })

  it('produces a 64-row Register sheet for the DOA template', () => {
    const wb = buildPhaseWorkbook(DOA_TEMPLATE_ITEMS)
    expect(dataRowCount(wb.Sheets['Register'])).toBe(64)
    expect(wb.SheetNames).toContain('Summary')
  })
})

describe('buildAdsbExcelWorkbook', () => {
  const meta = INITIAL_PROJECTS.find((p) => p.meta.id === UTAPAO_PROJECT_ID)!.meta
  const wb = buildAdsbExcelWorkbook(ADSB_TEMPLATE_ITEMS, meta)

  const HEADER_BLOCK_ROWS = 13 // title(4) + spacer + meta(3) + spacer + legend + summary + spacer + column header

  function sectionCount(items: typeof ADSB_TEMPLATE_ITEMS) {
    return ADSB_INSTALL_PHASE_DEFS.filter((def) => items.some((item) => item.installPhase === def.id)).length
  }

  it('has both role sheets', () => {
    expect(wb.getWorksheet('1-ผู้รับจ้าง Contractor')).toBeDefined()
    expect(wb.getWorksheet('2-ผู้ว่าจ้าง Employer')).toBeDefined()
  })

  it('Contractor sheet has one row per item plus one phase-divider row per represented phase', () => {
    const ws = wb.getWorksheet('1-ผู้รับจ้าง Contractor')!
    const expectedRows = HEADER_BLOCK_ROWS + sectionCount(ADSB_TEMPLATE_ITEMS) + ADSB_TEMPLATE_ITEMS.length
    expect(ws.rowCount).toBe(expectedRows)
  })

  it('Employer sheet only includes the employerIncluded items', () => {
    const employerItems = ADSB_TEMPLATE_ITEMS.filter((item) => item.employerIncluded)
    const ws = wb.getWorksheet('2-ผู้ว่าจ้าง Employer')!
    const expectedRows = HEADER_BLOCK_ROWS + sectionCount(employerItems) + employerItems.length
    expect(ws.rowCount).toBe(expectedRows)
  })

  it('the summary row on the Contractor sheet uses live COUNTIF formulas, not hand-computed numbers', () => {
    const ws = wb.getWorksheet('1-ผู้รับจ้าง Contractor')!
    const totalCell = ws.getCell('C11')
    expect(typeof totalCell.value).toBe('object')
    expect((totalCell.value as { formula?: string }).formula).toContain('COUNTIF')
  })
})
