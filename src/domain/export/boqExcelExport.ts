import * as ExcelJS from 'exceljs'
import type { BoqCategory, BoqEstimate, ProjectMeta } from '../../data/types'
import { summarizeBoq } from '../boq'
import { bahtText } from '../thaiBahtText'
import { formatThaiDate } from '../thaiDate'
import { downloadBlob } from './download'
import { projectFileSlug } from './filename'

// The real template (masterfile/BOQ Estimate.xlsx) uses no fills/colors
// anywhere — every cell's fill is null. This export intentionally does not
// import PHASE_COLOR_HEX/SCHEDULE_COLORS from scheduleExcelFormat.ts; it
// matches the source document's own black-border, no-fill visual language.
const FONT_TH = 'TH SarabunPSK'
const BLACK = 'FF000000'
const DARK_TEXT = 'FF1E293B'
const MONEY_FMT = '#,##0.00'
const ACCOUNTING_FMT = '_-* #,##0.00_-;-* #,##0.00_-;_-* "-"??_-;_-@_-'

const MONEY_COLS = [3, 5, 7] // C qty, E material unit price, G labor unit price — raw entries
const AMOUNT_COLS = [6, 8, 9] // F material amount, H labor amount, I line total — computed

function thinBorder(): Partial<ExcelJS.Borders> {
  const side: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: BLACK } }
  return { top: side, left: side, bottom: side, right: side }
}

interface CellOpts {
  bold?: boolean
  italic?: boolean
  size?: number
  align?: Partial<ExcelJS.Alignment>
  numFmt?: string
  border?: boolean
}

function setCell(ws: ExcelJS.Worksheet, row: number, col: number, value: ExcelJS.CellValue, opts: CellOpts = {}): ExcelJS.Cell {
  const cell = ws.getCell(row, col)
  cell.value = value
  cell.font = { name: FONT_TH, size: opts.size ?? 16, bold: opts.bold ?? false, italic: opts.italic ?? false }
  if (opts.align) cell.alignment = opts.align
  if (opts.numFmt) cell.numFmt = opts.numFmt
  if (opts.border) cell.border = thinBorder()
  return cell
}

function moneyFmtForCol(col: number): string | undefined {
  if (MONEY_COLS.includes(col)) return MONEY_FMT
  if (AMOUNT_COLS.includes(col)) return ACCOUNTING_FMT
  return undefined
}

// ---------------------------------------------------------------------------
// Pure row-layout calculator — no ExcelJS dependency, so both sheet builders
// (and a unit test) can share one guaranteed-consistent source of row
// numbers. Zero-line categories are omitted entirely; a rendered category
// keeps its ORIGINAL 1-based index (position in boq.categories), so exported
// numbering always matches the on-screen category numbering even when
// earlier categories are skipped.
// ---------------------------------------------------------------------------

const BOQ_DATA_START_ROW = 9

interface CategoryLayout {
  category: BoqCategory
  categoryNo: number
  headerRow: number
  firstLineRow: number
  lastLineRow: number
  subtotalRow: number
}

export interface BoqLayout {
  categories: CategoryLayout[]
  grandTotalRow: number | null
  firstCategoryNo: number | null
  lastCategoryNo: number | null
}

export function computeBoqLayout(boq: BoqEstimate): BoqLayout {
  let row = BOQ_DATA_START_ROW
  const categories: CategoryLayout[] = []
  boq.categories.forEach((category, categoryIndex) => {
    if (category.lines.length === 0) return
    const categoryNo = categoryIndex + 1
    const headerRow = row
    row += 1
    const firstLineRow = row
    row += category.lines.length
    const lastLineRow = row - 1
    const subtotalRow = row
    row += 1
    categories.push({ category, categoryNo, headerRow, firstLineRow, lastLineRow, subtotalRow })
  })
  if (categories.length === 0) {
    return { categories: [], grandTotalRow: null, firstCategoryNo: null, lastCategoryNo: null }
  }
  return {
    categories,
    grandTotalRow: row,
    firstCategoryNo: categories[0].categoryNo,
    lastCategoryNo: categories[categories.length - 1].categoryNo,
  }
}

/** "1.10" as a JS number is indistinguishable from 1.1 (Number('1.10') ===
 *  1.1) — an inherent limit of representing "N.NN" in a spreadsheet number
 *  cell, matching the pattern file's own design. Once a category reaches a
 *  10th+ line, write that one cell as text (still displaying identically)
 *  instead of silently colliding with line N.1. */
function lineNoValue(categoryNo: number, lineIndex: number): ExcelJS.CellValue {
  const lineNo = lineIndex + 1
  return lineNo >= 10 ? `${categoryNo}.${lineNo}` : Number(`${categoryNo}.${lineNo}`)
}

// ---------------------------------------------------------------------------
// BOQ sheet
// ---------------------------------------------------------------------------

function buildBoqSheet(wb: ExcelJS.Workbook, meta: ProjectMeta, layout: BoqLayout) {
  const ws = wb.addWorksheet('BOQ', { views: [{ showGridLines: false }] })
  ws.columns = [
    { width: 7.71 }, { width: 60.3 }, { width: 9.71 }, { width: 6.29 }, { width: 17.57 },
    { width: 17.57 }, { width: 17.57 }, { width: 17.57 }, { width: 17.57 }, { width: 22.43 },
  ]

  ws.mergeCells('A1:I1')
  setCell(ws, 1, 1, 'แบบแสดงรายการ ปริมาณงาน และราคา', {
    bold: true,
    size: 18,
    align: { horizontal: 'center', vertical: 'middle' },
  })
  ws.getRow(1).height = 24.95

  const topBottomBorder = {
    top: { style: 'thin' as const, color: { argb: BLACK } },
    bottom: { style: 'thin' as const, color: { argb: BLACK } },
  }
  const infoRow = (row: number, col: number, text: string, borders: Partial<ExcelJS.Borders>) => {
    const cell = ws.getCell(row, col)
    cell.value = text
    cell.font = { name: FONT_TH, size: 16 }
    cell.border = borders
  }
  infoRow(2, 2, `รายการประมาณราคา  ${meta.title}`, { bottom: topBottomBorder.bottom })
  ws.getRow(2).height = 24
  infoRow(3, 2, `สถานที่  ${meta.scope}`, topBottomBorder)
  ws.getRow(3).height = 24
  infoRow(4, 2, `หน่วยงานเจ้าของโครงการ     ${meta.vendor}`, topBottomBorder)
  ws.getRow(4).height = 24
  infoRow(5, 2, 'ประมาณการโดย ', topBottomBorder)
  infoRow(5, 5, `เมื่อวันที่     ${formatThaiDate(meta.preparedDate)}`, topBottomBorder)
  ws.getRow(5).height = 24
  ws.getRow(6).height = 18.75

  // Rows 7-8: two-row header (merges per the source template exactly).
  ws.mergeCells(7, 1, 8, 1)
  ws.mergeCells(7, 2, 8, 2)
  ws.mergeCells(7, 3, 8, 3)
  ws.mergeCells(7, 4, 8, 4)
  ws.mergeCells(7, 5, 7, 6)
  ws.mergeCells(7, 7, 7, 8)
  ws.mergeCells(7, 10, 8, 10)
  const headerCell = (row: number, col: number, text: string) =>
    setCell(ws, row, col, text, {
      bold: true,
      align: { horizontal: 'center', vertical: 'middle', wrapText: true },
      border: true,
    })
  headerCell(7, 1, 'ลำดับที่')
  headerCell(7, 2, 'รายการ')
  headerCell(7, 3, 'จำนวน')
  headerCell(7, 4, 'หน่วย')
  headerCell(7, 5, 'ราคาวัสดุสิ่งของ')
  headerCell(8, 5, 'ราคาต่อหน่วย')
  headerCell(8, 6, 'จำนวนเงิน')
  headerCell(7, 7, 'ค่าแรงงาน')
  headerCell(8, 7, 'ราคาต่อหน่วย')
  headerCell(8, 8, 'จำนวนเงิน')
  // Column I is deliberately NOT merged across rows 7-8 — a stacked two-line
  // label, matching the source template exactly.
  headerCell(7, 9, 'ค่าวัสดุและแรงงาน')
  headerCell(8, 9, 'รวม/บาท')
  headerCell(7, 10, 'หมายเหตุ')
  ws.getRow(7).height = 18.75
  ws.getRow(8).height = 18.75

  if (layout.categories.length === 0) {
    const cell = ws.getCell(BOQ_DATA_START_ROW, 1)
    cell.value = 'No categories yet.'
    cell.font = { name: FONT_TH, size: 16, italic: true, color: { argb: DARK_TEXT } }
    return
  }

  const blankRowCells = (row: number, fromCol: number, toCol: number, opts: CellOpts = {}) => {
    for (let col = fromCol; col <= toCol; col++) {
      setCell(ws, row, col, undefined, { ...opts, numFmt: moneyFmtForCol(col), border: true })
    }
  }

  for (const cat of layout.categories) {
    setCell(ws, cat.headerRow, 1, cat.categoryNo, { bold: true, align: { horizontal: 'center', vertical: 'middle' }, border: true })
    setCell(ws, cat.headerRow, 2, cat.category.name, {
      bold: true,
      align: { horizontal: 'left', vertical: 'middle', wrapText: true },
      border: true,
    })
    blankRowCells(cat.headerRow, 3, 10, { bold: true })

    cat.category.lines.forEach((line, lineIndex) => {
      const row = cat.firstLineRow + lineIndex
      setCell(ws, row, 1, lineNoValue(cat.categoryNo, lineIndex), {
        bold: true,
        align: { horizontal: 'center', vertical: 'middle' },
        border: true,
      })
      setCell(ws, row, 2, line.description, {
        bold: true,
        align: { horizontal: 'left', vertical: 'middle', wrapText: true },
        border: true,
      })
      setCell(ws, row, 3, line.quantity, { bold: true, numFmt: MONEY_FMT, align: { horizontal: 'center', vertical: 'middle' }, border: true })
      setCell(ws, row, 4, line.unit, { bold: true, align: { horizontal: 'center', vertical: 'middle' }, border: true })
      setCell(ws, row, 5, line.materialUnitCost, { bold: true, numFmt: MONEY_FMT, align: { horizontal: 'right', vertical: 'middle' }, border: true })
      setCell(
        ws, row, 6,
        { formula: `IF(AND(C${row}<>"",E${row}<>""),C${row}*E${row},"")` },
        { bold: true, numFmt: ACCOUNTING_FMT, align: { horizontal: 'right', vertical: 'middle' }, border: true },
      )
      setCell(ws, row, 7, line.laborUnitCost, { bold: true, numFmt: MONEY_FMT, align: { horizontal: 'right', vertical: 'middle' }, border: true })
      setCell(
        ws, row, 8,
        { formula: `IF(AND(C${row}<>"",G${row}<>""),C${row}*G${row},"")` },
        { bold: true, numFmt: ACCOUNTING_FMT, align: { horizontal: 'right', vertical: 'middle' }, border: true },
      )
      setCell(ws, row, 9, { formula: `SUM(F${row},H${row})` }, { bold: true, numFmt: ACCOUNTING_FMT, align: { horizontal: 'right', vertical: 'middle' }, border: true })
      setCell(ws, row, 10, line.remark ?? '', { bold: true, align: { horizontal: 'left', vertical: 'middle', wrapText: true }, border: true })
    })

    setCell(ws, cat.subtotalRow, 2, `รวมรายการที่ ${cat.categoryNo}`, {
      bold: true,
      align: { horizontal: 'left', vertical: 'middle' },
      border: true,
    })
    blankRowCells(cat.subtotalRow, 1, 1, { bold: true })
    blankRowCells(cat.subtotalRow, 3, 5, { bold: true })
    setCell(ws, cat.subtotalRow, 6, { formula: `SUM(F${cat.firstLineRow}:F${cat.lastLineRow})` }, {
      bold: true, numFmt: ACCOUNTING_FMT, align: { horizontal: 'right' }, border: true,
    })
    blankRowCells(cat.subtotalRow, 7, 7, { bold: true })
    setCell(ws, cat.subtotalRow, 8, { formula: `SUM(H${cat.firstLineRow}:H${cat.lastLineRow})` }, {
      bold: true, numFmt: ACCOUNTING_FMT, align: { horizontal: 'right' }, border: true,
    })
    setCell(ws, cat.subtotalRow, 9, { formula: `SUM(I${cat.firstLineRow}:I${cat.lastLineRow})` }, {
      bold: true, numFmt: ACCOUNTING_FMT, align: { horizontal: 'right' }, border: true,
    })
    blankRowCells(cat.subtotalRow, 10, 10, { bold: true })
  }

  if (layout.grandTotalRow !== null) {
    const row = layout.grandTotalRow
    setCell(ws, row, 2, `รวมรายการ ${layout.firstCategoryNo}-${layout.lastCategoryNo}`, {
      bold: true,
      align: { horizontal: 'left', vertical: 'middle' },
      border: true,
    })
    blankRowCells(row, 1, 1, { bold: true })
    blankRowCells(row, 3, 8, { bold: true })
    blankRowCells(row, 10, 10, { bold: true })
    const grandTotalFormula = layout.categories.map((c) => `I${c.subtotalRow}`).join('+')
    setCell(ws, row, 9, { formula: grandTotalFormula }, { bold: true, numFmt: ACCOUNTING_FMT, align: { horizontal: 'right' }, border: true })
  }
}

// ---------------------------------------------------------------------------
// Overview sheet
// ---------------------------------------------------------------------------

function buildOverviewSheet(wb: ExcelJS.Workbook, meta: ProjectMeta, boq: BoqEstimate, layout: BoqLayout) {
  const ws = wb.addWorksheet('Overview', { views: [{ showGridLines: false }] })
  ws.columns = [{ width: 8.57 }, { width: 60.4 }, { width: 22.6 }, { width: 22.6 }, { width: 22.6 }, { width: 23.7 }]

  ws.mergeCells('C7:D7')
  ws.mergeCells('A2:F2')
  ws.mergeCells('A3:F3')
  ws.mergeCells('A4:F4')
  ws.mergeCells('A5:F5')
  ws.mergeCells('A6:B6')
  ws.mergeCells('C15:F15')
  ws.mergeCells('C19:D19')
  ws.mergeCells('C20:D20')
  ws.mergeCells('C22:D22')
  ws.mergeCells('C23:D23')
  ws.mergeCells('C25:D25')
  ws.mergeCells('C26:D26')

  setCell(ws, 2, 1, 'สรุปผลการประเมินราคา', { bold: true, size: 20, align: { horizontal: 'center', vertical: 'middle' } })
  ws.getRow(2).height = 26

  setCell(ws, 3, 1, `ชื่อโครงการ      ${meta.title}`, { bold: true, size: 18, align: { vertical: 'middle' } })
  ws.getRow(3).height = 27.75
  setCell(ws, 4, 1, `สถานที่ดำเนินงาน   ${meta.scope}`, { bold: true, size: 18, align: { horizontal: 'left', vertical: 'middle' } })
  ws.getRow(4).height = 27.75
  setCell(ws, 5, 1, `หน่วยงานเจ้าของโครงการ     ${meta.vendor}`, { bold: true, size: 18, align: { vertical: 'middle', wrapText: true } })
  ws.getRow(5).height = 27.75

  setCell(ws, 6, 1, 'BOQ  ที่แนบ                  มีจำนวน  ')
  setCell(ws, 6, 3, 'แผ่น')

  setCell(ws, 7, 1, 'ประมาณการเมื่อวันที่')
  setCell(ws, 7, 3, formatThaiDate(meta.preparedDate))

  const headerLabels = ['ลำดับที่', 'รายการ', 'ค่าวัสดุและค่าแรงงาน', 'ค่าภาษีมูลค่าเพิ่ม', 'รวมราคาทั้งหมด', 'หมายเหตุ']
  headerLabels.forEach((text, i) => {
    setCell(ws, 9, i + 1, text, { bold: true, size: 20, align: { horizontal: 'center', vertical: 'middle' }, border: true })
  })
  setCell(ws, 10, 3, 'รวมเป็นเงิน (บาท)', { align: { horizontal: 'center' }, border: true })
  setCell(ws, 10, 4, `${boq.vatPercent}% (บาท)`, { align: { horizontal: 'center' }, border: true })
  setCell(ws, 10, 5, 'เป็นเงิน (บาท)', { align: { horizontal: 'center' }, border: true })
  setCell(ws, 10, 1, undefined, { border: true })
  setCell(ws, 10, 2, undefined, { border: true })
  setCell(ws, 10, 6, undefined, { border: true })

  setCell(ws, 11, 2, 'สรุปราคาทั้งโครงการ', { bold: true, size: 20 })

  const summary = summarizeBoq(boq)
  setCell(ws, 12, 1, 1, { align: { horizontal: 'center', vertical: 'middle' }, border: true })
  setCell(ws, 12, 2, meta.title, { align: { vertical: 'middle', wrapText: true }, border: true })
  ws.getRow(12).height = 117
  setCell(
    ws, 12, 3,
    layout.grandTotalRow !== null ? { formula: `BOQ!I${layout.grandTotalRow}` } : summary.subtotal,
    { numFmt: ACCOUNTING_FMT, align: { horizontal: 'right', vertical: 'middle' }, border: true },
  )
  setCell(ws, 12, 4, { formula: `C12*${boq.vatPercent}%` }, { numFmt: ACCOUNTING_FMT, align: { horizontal: 'right', vertical: 'middle' }, border: true })
  setCell(ws, 12, 5, { formula: 'C12+D12' }, { numFmt: ACCOUNTING_FMT, align: { horizontal: 'right', vertical: 'middle' }, border: true })
  setCell(ws, 12, 6, '*', { align: { horizontal: 'center', vertical: 'middle' }, border: true })

  setCell(ws, 13, 2, 'รวมค่าปรับปรุงเป็นเงินทั้งสิ้น')
  setCell(ws, 13, 6, { formula: 'E12' }, { numFmt: ACCOUNTING_FMT, align: { horizontal: 'right' } })

  setCell(ws, 14, 2, 'กำหนดเป็นราคากลาง')
  setCell(ws, 14, 6, { formula: 'F13' }, { numFmt: ACCOUNTING_FMT, align: { horizontal: 'right' } })

  setCell(ws, 15, 2, 'ตัวอักษร ')
  setCell(ws, 15, 3, bahtText(summary.netTotal), { align: { horizontal: 'left', vertical: 'middle' } })

  setCell(ws, 18, 2, 'ผู้เสนอราคา', { align: { horizontal: 'right' } })
  setCell(ws, 19, 3, '(                                                  )', { align: { horizontal: 'left', vertical: 'middle' } })
  setCell(ws, 19, 4, '(                                                  )', { align: { horizontal: 'left', vertical: 'middle' } })
  for (let row = 20; row <= 27; row++) ws.getRow(row).height = 18
}

// ---------------------------------------------------------------------------
// Dispatch + download
// ---------------------------------------------------------------------------

export function buildBoqWorkbook(meta: ProjectMeta, boq: BoqEstimate): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'ITS Tracker'
  wb.created = new Date()
  const layout = computeBoqLayout(boq)
  // Overview first, then BOQ — matches the source template's own tab order.
  buildOverviewSheet(wb, meta, boq, layout)
  buildBoqSheet(wb, meta, layout)
  return wb
}

export async function exportProjectBoq(meta: ProjectMeta, boq: BoqEstimate): Promise<void> {
  const wb = buildBoqWorkbook(meta, boq)
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  downloadBlob(blob, `${projectFileSlug(meta)}-boq.xlsx`)
}
