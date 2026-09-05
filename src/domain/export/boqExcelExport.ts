import * as ExcelJS from 'exceljs'
import type { BoqCategory, BoqEstimate, ProjectMeta } from '../../data/types'
import { categoryTotal, lineTotal, summarizeBoq } from '../boq'
import { phaseColorIndex } from '../schedule'
import { PHASE_COLOR_HEX, SCHEDULE_COLORS } from './scheduleExcelFormat'
import { downloadBlob } from './download'
import { projectFileSlug } from './filename'

function thinBorder(): Partial<ExcelJS.Borders> {
  const side: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: SCHEDULE_COLORS.border } }
  return { top: side, left: side, bottom: side, right: side }
}

function buildOverviewSheet(wb: ExcelJS.Workbook, meta: ProjectMeta, boq: BoqEstimate) {
  const ws = wb.addWorksheet('Overview', { views: [{ showGridLines: false }] })
  ws.getColumn(1).width = 22
  ws.getColumn(2).width = 60

  ws.mergeCells(1, 1, 1, 2)
  const title = ws.getCell(1, 1)
  title.value = meta.title
  title.font = { size: 16, bold: true, color: { argb: SCHEDULE_COLORS.dark } }
  ws.getRow(1).height = 24

  ws.mergeCells(2, 1, 2, 2)
  const subtitle = ws.getCell(2, 1)
  subtitle.value = `${meta.scope} — ${meta.vendor}`
  subtitle.font = { size: 11, italic: true, color: { argb: SCHEDULE_COLORS.dark } }
  ws.getRow(2).height = 18

  const summary = summarizeBoq(boq)
  const fields: [string, string][] = [
    ['Vendor', meta.vendor],
    ['Scope', meta.scope],
    ['Prepared date', meta.preparedDate],
    ['Subtotal', summary.subtotal.toFixed(2)],
    [`VAT (${boq.vatPercent}%)`, summary.vatAmount.toFixed(2)],
    ['Net Total', summary.netTotal.toFixed(2)],
  ]
  fields.forEach(([label, value], i) => {
    const row = 4 + i
    const labelCell = ws.getCell(row, 1)
    labelCell.value = label
    labelCell.font = { bold: true, color: { argb: SCHEDULE_COLORS.dark } }
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SCHEDULE_COLORS.labelBg } }
    labelCell.border = thinBorder()
    const valueCell = ws.getCell(row, 2)
    valueCell.value = value
    valueCell.border = thinBorder()
  })
}

const BOQ_HEADER = ['No.', 'Category', 'Description', 'Qty', 'Unit', 'Material/Unit', 'Labor/Unit', 'Total']

function buildBoqSheet(wb: ExcelJS.Workbook, boq: BoqEstimate) {
  const ws = wb.addWorksheet('BOQ', { views: [{ state: 'frozen', ySplit: 1, showGridLines: false }] })
  ws.columns = [
    { width: 8 },
    { width: 20 },
    { width: 34 },
    { width: 8 },
    { width: 10 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
  ]

  BOQ_HEADER.forEach((header, i) => {
    const cell = ws.getCell(1, i + 1)
    cell.value = header
    cell.font = { bold: true, color: { argb: SCHEDULE_COLORS.headerText } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SCHEDULE_COLORS.headerBg } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = thinBorder()
  })
  ws.getRow(1).height = 22

  if (boq.categories.length === 0) {
    const cell = ws.getCell(2, 1)
    cell.value = 'No categories yet.'
    cell.font = { italic: true, color: { argb: SCHEDULE_COLORS.dark } }
    return
  }

  let row = 2
  boq.categories.forEach((category: BoqCategory, categoryIndex) => {
    const color = PHASE_COLOR_HEX[phaseColorIndex(category.id)]
    category.lines.forEach((line, lineIndex) => {
      const catCell = ws.getCell(row, 2)
      catCell.value = category.name
      catCell.font = { bold: true, color: { argb: color.badgeText } }
      catCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.badgeBg } }
      catCell.border = thinBorder()

      ws.getCell(row, 1).value = `${categoryIndex + 1}.${lineIndex + 1}`
      ws.getCell(row, 3).value = line.description
      ws.getCell(row, 4).value = line.quantity
      ws.getCell(row, 5).value = line.unit
      ws.getCell(row, 6).value = line.materialUnitCost
      ws.getCell(row, 7).value = line.laborUnitCost
      ws.getCell(row, 8).value = lineTotal(line)
      for (let col = 1; col <= 8; col++) {
        if (col === 2) continue
        ws.getCell(row, col).border = thinBorder()
      }
      row += 1
    })

    ws.mergeCells(row, 1, row, 7)
    const subtotalLabel = ws.getCell(row, 1)
    subtotalLabel.value = `${category.name} subtotal`
    subtotalLabel.font = { bold: true }
    subtotalLabel.border = thinBorder()
    const subtotalValue = ws.getCell(row, 8)
    subtotalValue.value = categoryTotal(category)
    subtotalValue.font = { bold: true }
    subtotalValue.border = thinBorder()
    row += 1
  })

  const summary = summarizeBoq(boq)
  const totals: [string, number][] = [
    ['Subtotal', summary.subtotal],
    [`VAT (${boq.vatPercent}%)`, summary.vatAmount],
    ['Net Total', summary.netTotal],
  ]
  totals.forEach(([label, value]) => {
    ws.mergeCells(row, 1, row, 7)
    const labelCell = ws.getCell(row, 1)
    labelCell.value = label
    labelCell.font = { bold: true, color: { argb: SCHEDULE_COLORS.headerText } }
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SCHEDULE_COLORS.headerBg } }
    labelCell.border = thinBorder()
    const valueCell = ws.getCell(row, 8)
    valueCell.value = value
    valueCell.font = { bold: true, color: { argb: SCHEDULE_COLORS.headerText } }
    valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SCHEDULE_COLORS.headerBg } }
    valueCell.border = thinBorder()
    row += 1
  })
}

export function buildBoqWorkbook(meta: ProjectMeta, boq: BoqEstimate): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'ITS Tracker'
  wb.created = new Date()
  buildOverviewSheet(wb, meta, boq)
  buildBoqSheet(wb, boq)
  return wb
}

export async function exportProjectBoq(meta: ProjectMeta, boq: BoqEstimate): Promise<void> {
  const wb = buildBoqWorkbook(meta, boq)
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  downloadBlob(blob, `${projectFileSlug(meta)}-boq.xlsx`)
}
