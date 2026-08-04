import * as ExcelJS from 'exceljs'
import type { Item, ProjectMeta } from '../../data/types'
import { ADSB_INSTALL_PHASE_DEFS } from '../rules'
import {
  ADSB_COLORS,
  ADSB_CONTRACTOR_SUBTITLE,
  ADSB_CONTRACTOR_TITLE,
  ADSB_EMPLOYER_RESULT_TH,
  ADSB_EMPLOYER_SUBTITLE,
  ADSB_EMPLOYER_TITLE,
  ADSB_FONT,
  ADSB_HW_TH,
  ADSB_LEGEND,
  ADSB_META_FIELDS,
  ADSB_RESULT_TH,
} from './adsbFormat'
import { downloadBlob } from './download'
import { projectFileSlug } from './filename'

const HEADER_ROW = 13
const DATA_START_ROW = 14
const LAST_COL = 'K'

interface ColumnDef {
  header: string
  width: number
}

interface SummaryStatus {
  label: string
  color: string
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const side: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: ADSB_COLORS.border } }
  return { top: side, left: side, bottom: side, right: side }
}

function titleRow(
  ws: ExcelJS.Worksheet,
  row: number,
  text: string,
  opts: { size: number; bold?: boolean; italic?: boolean; color: string; height?: number },
) {
  ws.mergeCells(`A${row}:${LAST_COL}${row}`)
  const cell = ws.getCell(`A${row}`)
  cell.value = text
  cell.font = { name: ADSB_FONT, size: opts.size, bold: opts.bold, italic: opts.italic, color: { argb: opts.color } }
  cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
  if (opts.height) ws.getRow(row).height = opts.height
}

function metaFieldRows(ws: ExcelJS.Worksheet, startRow: number) {
  ADSB_META_FIELDS.forEach(([leftLabel, rightLabel], i) => {
    const row = startRow + i
    ws.getRow(row).height = 26
    const left = ws.getCell(`A${row}`)
    left.value = leftLabel
    left.font = { name: ADSB_FONT, size: 10, bold: true, color: { argb: ADSB_COLORS.dark } }
    left.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ADSB_COLORS.metaLabelBg } }
    left.alignment = { vertical: 'middle', wrapText: true }
    left.border = thinBorder()
    ws.mergeCells(`B${row}:E${row}`)
    const leftValue = ws.getCell(`B${row}`)
    leftValue.border = thinBorder()

    const right = ws.getCell(`F${row}`)
    right.value = rightLabel
    right.font = { name: ADSB_FONT, size: 10, bold: true, color: { argb: ADSB_COLORS.dark } }
    right.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ADSB_COLORS.metaLabelBg } }
    right.alignment = { vertical: 'middle', wrapText: true }
    right.border = thinBorder()
    ws.mergeCells(`G${row}:${LAST_COL}${row}`)
    const rightValue = ws.getCell(`G${row}`)
    rightValue.border = thinBorder()
  })
}

function legendRow(ws: ExcelJS.Worksheet, row: number) {
  ws.mergeCells(`A${row}:${LAST_COL}${row}`)
  const cell = ws.getCell(`A${row}`)
  cell.value = ADSB_LEGEND
  cell.font = { name: ADSB_FONT, size: 9, italic: true, color: { argb: ADSB_COLORS.grey } }
  cell.alignment = { vertical: 'middle', wrapText: true }
  ws.getRow(row).height = 24
}

/** Total + one COUNTIF cell per status, all formula-driven so the file stays correct if edited in Excel. */
function summaryRow(
  ws: ExcelJS.Worksheet,
  row: number,
  opts: { totalCol: string; resultCol: string; dataStart: number; dataEnd: number; statuses: SummaryStatus[] },
) {
  let col = 'A'
  const label = ws.getCell(`${col}${row}`)
  label.value = 'สรุป / Summary:'
  label.font = { name: ADSB_FONT, size: 10, bold: true, color: { argb: ADSB_COLORS.navy } }

  col = 'B'
  const totalLabel = ws.getCell(`${col}${row}`)
  totalLabel.value = 'จำนวนรายการ Total'
  totalLabel.font = { name: ADSB_FONT, size: 10, bold: true, color: { argb: ADSB_COLORS.dark } }
  const totalValue = ws.getCell('C' + row)
  totalValue.value = {
    formula: `COUNTIF(${opts.totalCol}${opts.dataStart}:${opts.totalCol}${opts.dataEnd},"?*")`,
  } as ExcelJS.CellFormulaValue
  totalValue.font = { name: ADSB_FONT, size: 10, bold: true, color: { argb: ADSB_COLORS.navy } }

  const cols = ['D', 'F', 'H']
  const valueCols = ['E', 'G', 'I']
  opts.statuses.forEach((status, i) => {
    const labelCell = ws.getCell(`${cols[i]}${row}`)
    labelCell.value = status.label
    labelCell.font = { name: ADSB_FONT, size: 10, bold: true, color: { argb: ADSB_COLORS.dark } }
    const valueCell = ws.getCell(`${valueCols[i]}${row}`)
    valueCell.value = {
      formula: `COUNTIF(${opts.resultCol}${opts.dataStart}:${opts.resultCol}${opts.dataEnd},"${status.label}")`,
    } as ExcelJS.CellFormulaValue
    valueCell.font = { name: ADSB_FONT, size: 10, bold: true, color: { argb: status.color } }
  })
  ws.getRow(row).height = 18
}

function headerRow(ws: ExcelJS.Worksheet, row: number, columns: ColumnDef[]) {
  columns.forEach((col, i) => {
    const cell = ws.getCell(row, i + 1)
    cell.value = col.header
    cell.font = { name: ADSB_FONT, size: 10, bold: true, color: { argb: ADSB_COLORS.headerText } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ADSB_COLORS.headerBg } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = thinBorder()
  })
  ws.getRow(row).height = 32
}

function phaseDividerRow(ws: ExcelJS.Worksheet, row: number, label: string) {
  ws.mergeCells(`A${row}:${LAST_COL}${row}`)
  const cell = ws.getCell(`A${row}`)
  cell.value = label
  cell.font = { name: ADSB_FONT, size: 10, bold: true, color: { argb: ADSB_COLORS.navy } }
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ADSB_COLORS.phaseDividerBg } }
  cell.alignment = { vertical: 'middle' }
  cell.border = thinBorder()
  ws.getRow(row).height = 20
}

function dataRow(ws: ExcelJS.Worksheet, row: number, values: (string | number)[], band: boolean) {
  values.forEach((value, i) => {
    const cell = ws.getCell(row, i + 1)
    cell.value = value
    cell.font = { name: ADSB_FONT, size: 10, color: { argb: ADSB_COLORS.dark } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: band ? ADSB_COLORS.rowBandB : ADSB_COLORS.rowBandA },
    }
    cell.alignment = { vertical: 'top', wrapText: true }
    cell.border = thinBorder()
  })
}

interface RoleSheetOptions {
  sheetName: string
  title: string
  subtitle: string
  meta: ProjectMeta
  items: Item[]
  columns: ColumnDef[]
  rowValues(item: Item): (string | number)[]
  resultColLetter: string
  statuses: SummaryStatus[]
}

function buildRoleSheet(wb: ExcelJS.Workbook, opts: RoleSheetOptions) {
  const ws = wb.addWorksheet(opts.sheetName, {
    views: [{ state: 'frozen', xSplit: 3, ySplit: HEADER_ROW, showGridLines: false }],
    pageSetup: { orientation: 'landscape', fitToWidth: 1, fitToHeight: 0 },
  })
  ws.columns = opts.columns.map((c) => ({ width: c.width }))

  const sections = ADSB_INSTALL_PHASE_DEFS.map((def) => ({
    def,
    items: opts.items.filter((item) => item.installPhase === def.id),
  })).filter((s) => s.items.length > 0)
  const totalRows = sections.reduce((sum, s) => sum + 1 + s.items.length, 0)
  const lastDataRow = DATA_START_ROW + totalRows - 1

  titleRow(ws, 1, opts.title, { size: 16, bold: true, color: ADSB_COLORS.navy, height: 24 })
  titleRow(ws, 2, opts.subtitle, { size: 12, bold: true, italic: true, color: ADSB_COLORS.grey, height: 18 })
  titleRow(ws, 3, opts.meta.title, { size: 11, bold: true, color: ADSB_COLORS.dark, height: 16 })
  titleRow(ws, 4, `${opts.meta.scope} — ${opts.meta.vendor}`, { size: 10, italic: true, color: ADSB_COLORS.grey, height: 14 })
  metaFieldRows(ws, 6)
  legendRow(ws, 10)
  summaryRow(ws, 11, {
    totalCol: 'B',
    resultCol: opts.resultColLetter,
    dataStart: DATA_START_ROW,
    dataEnd: Math.max(lastDataRow, DATA_START_ROW),
    statuses: opts.statuses,
  })
  headerRow(ws, HEADER_ROW, opts.columns)

  let row = DATA_START_ROW
  let band = false
  for (const section of sections) {
    phaseDividerRow(ws, row, `${section.def.label} (${section.items.length})`)
    row++
    for (const item of section.items) {
      dataRow(ws, row, opts.rowValues(item), band)
      band = !band
      row++
    }
  }
}

const CONTRACTOR_COLUMNS: ColumnDef[] = [
  { header: 'ลำดับ\nNo.', width: 8 },
  { header: 'รายการตรวจสอบ (ไทย)', width: 34 },
  { header: 'Checklist item (EN)', width: 34 },
  { header: 'ผู้รับผิดชอบ\nResp.', width: 11 },
  { header: 'อ้างอิงมาตรฐาน\nStd ref', width: 13 },
  { header: 'อ้างอิง TOR\nTOR ref', width: 10 },
  { header: 'เกณฑ์ยอมรับ (ไทย)', width: 28 },
  { header: 'Acceptance criteria (EN)', width: 28 },
  { header: 'ค่าที่วัดได้\nMeasured', width: 14 },
  { header: 'ผล\nResult', width: 12 },
  { header: 'หมายเหตุ\nRemark', width: 20 },
]

const EMPLOYER_COLUMNS: ColumnDef[] = [
  { header: 'ลำดับ\nNo.', width: 10 },
  { header: 'รายการตรวจรับ (ไทย)', width: 32 },
  { header: 'Acceptance item (EN)', width: 32 },
  { header: 'เกณฑ์ยอมรับ (ไทย)', width: 26 },
  { header: 'Acceptance criteria (EN)', width: 26 },
  { header: 'หลักฐาน (ไทย)', width: 22 },
  { header: 'Required evidence (EN)', width: 22 },
  { header: 'อ้างอิง TOR\nTOR ref', width: 10 },
  { header: 'จุดตรวจ\nH/W', width: 8 },
  { header: 'ผลการตรวจรับ\nResult', width: 14 },
  { header: 'หมายเหตุ\nRemark', width: 18 },
]

export function buildAdsbExcelWorkbook(items: Item[], meta: ProjectMeta): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'ITS Tracker'
  wb.created = new Date()

  buildRoleSheet(wb, {
    sheetName: '1-ผู้รับจ้าง Contractor',
    title: ADSB_CONTRACTOR_TITLE,
    subtitle: ADSB_CONTRACTOR_SUBTITLE,
    meta,
    items,
    columns: CONTRACTOR_COLUMNS,
    resultColLetter: 'J',
    statuses: [
      { label: ADSB_RESULT_TH.Pass, color: ADSB_COLORS.pass },
      { label: ADSB_RESULT_TH.Fail, color: ADSB_COLORS.fail },
      { label: ADSB_RESULT_TH.NotApplicable, color: ADSB_COLORS.na },
    ],
    rowValues: (item) => [
      item.code ?? String(item.no),
      item.nameTh ?? '',
      item.name,
      item.resp ?? '',
      item.standard,
      item.torRef ?? '',
      item.requirementTh ?? '',
      item.requirement,
      item.measured ?? '',
      item.result ? ADSB_RESULT_TH[item.result] : '',
      item.remark ?? '',
    ],
  })

  buildRoleSheet(wb, {
    sheetName: '2-ผู้ว่าจ้าง Employer',
    title: ADSB_EMPLOYER_TITLE,
    subtitle: ADSB_EMPLOYER_SUBTITLE,
    meta,
    items: items.filter((item) => item.employerIncluded),
    columns: EMPLOYER_COLUMNS,
    resultColLetter: 'J',
    statuses: [
      { label: ADSB_EMPLOYER_RESULT_TH.Accepted, color: ADSB_COLORS.pass },
      { label: ADSB_EMPLOYER_RESULT_TH.Conditional, color: ADSB_COLORS.na },
      { label: ADSB_EMPLOYER_RESULT_TH.Rejected, color: ADSB_COLORS.fail },
    ],
    rowValues: (item) => [
      item.code ?? String(item.no),
      item.nameTh ?? '',
      item.name,
      item.requirementTh ?? '',
      item.requirement,
      item.requiredEvidenceTh ?? '',
      item.requiredEvidence ?? '',
      item.torRef ?? '',
      item.hwPoint ? ADSB_HW_TH[item.hwPoint] : '',
      item.employerResult ? ADSB_EMPLOYER_RESULT_TH[item.employerResult] : '',
      item.employerRemark ?? '',
    ],
  })

  return wb
}

export async function exportAdsbExcel(items: Item[], meta: ProjectMeta): Promise<void> {
  const wb = buildAdsbExcelWorkbook(items, meta)
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  downloadBlob(blob, `${projectFileSlug(meta)}-ADS-B-Installation-Checklists.xlsx`)
}
