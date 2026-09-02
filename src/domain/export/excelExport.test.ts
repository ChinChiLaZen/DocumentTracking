import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import type * as ExcelJS from 'exceljs'
import { INITIAL_PROJECTS, UTAPAO_PROJECT_ID } from '../../data/initialProjects'
import { AOT_TEMPLATE_ITEMS } from '../../data/aotTemplate'
import { DOA_TEMPLATE_ITEMS } from '../../data/doaTemplate'
import { ADSB_TEMPLATE_ITEMS } from '../../data/adsbTemplate'
import { ADSB_INSTALL_PHASE_DEFS, DETAIL_SHEET_ORDER } from '../rules'
import { buildMarWorkbook, buildPhaseWorkbook } from './excelExport'
import { buildAdsbExcelWorkbook } from './adsbExcelExport'
import { buildScheduleWorkbook } from './scheduleExcelExport'
import { phaseColorIndex } from '../schedule'
import { PHASE_COLOR_HEX } from './scheduleExcelFormat'
import type { ProjectSchedule } from '../../data/types'

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

describe('buildScheduleWorkbook', () => {
  const meta = INITIAL_PROJECTS.find((p) => p.meta.id === UTAPAO_PROJECT_ID)!.meta
  const schedule: ProjectSchedule = {
    phases: [
      { id: 'phase-1', name: 'Design', code: 'P1', startDate: '2026-01-01', endDate: '2026-02-28', percentComplete: 50, weightPercent: 40 },
      { id: 'phase-2', name: 'Construction', code: 'P2', startDate: '2026-03-01', endDate: '2026-06-30', percentComplete: 20, weightPercent: 60 },
    ],
    milestones: [
      { id: 'm1', label: 'Kickoff', date: '2026-01-05', type: 'Delivery' },
      { id: 'm2', label: 'Steering Committee', date: '2026-04-01', type: 'Committee' },
    ],
    contractStartDate: '2026-01-01',
  }
  const wb = buildScheduleWorkbook(meta, schedule)

  it('has Overview, Phases, Gantt and Milestones sheets', () => {
    expect(wb.getWorksheet('Overview')).toBeDefined()
    expect(wb.getWorksheet('Phases')).toBeDefined()
    expect(wb.getWorksheet('Gantt')).toBeDefined()
    expect(wb.getWorksheet('Milestones')).toBeDefined()
  })

  it('Phases sheet has one row per phase plus a weight-total footer row, colored per phase palette', () => {
    const ws = wb.getWorksheet('Phases')!
    expect(ws.getCell(2, 2).value).toBe('Design (P1)')
    expect(ws.getCell(3, 2).value).toBe('Construction (P2)')
    const expectedFill = PHASE_COLOR_HEX[phaseColorIndex('phase-1')].fill
    expect((ws.getCell(2, 1).fill as ExcelJS.FillPattern).fgColor?.argb).toBe(expectedFill)
    const footerRow = 2 + schedule.phases.length + 1
    expect(ws.getCell(footerRow, 7).value).toBe(100) // 40 + 60 = 100% total weight
  })

  it('Gantt sheet reflects the fully-allocated weight banner and has milestone markers', () => {
    const ws = wb.getWorksheet('Gantt')!
    expect(ws.getCell(1, 1).value).toContain('100%')
    expect(ws.getCell(1, 1).value).toContain('fully allocated')
    let noteCount = 0
    ws.eachRow((row) => {
      row.eachCell((cell) => {
        if (cell.note) noteCount++
      })
    })
    expect(noteCount).toBe(2)
  })

  it('Milestones sheet lists both milestones with their type', () => {
    const ws = wb.getWorksheet('Milestones')!
    expect(ws.getCell(2, 1).value).toBe('Kickoff')
    expect(ws.getCell(2, 3).value).toBe('Delivery')
    expect(ws.getCell(3, 1).value).toBe('Steering Committee')
    expect(ws.getCell(3, 3).value).toBe('Committee')
  })

  it('handles an empty schedule without crashing', () => {
    const empty = buildScheduleWorkbook(meta, { phases: [], milestones: [] })
    expect(empty.getWorksheet('Gantt')!.getCell(1, 1).value).toContain('No schedule data yet')
  })
})
