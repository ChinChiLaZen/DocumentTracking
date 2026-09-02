import * as ExcelJS from 'exceljs'
import type { MilestoneType, ProjectMeta, ProjectSchedule, SchedulePhase } from '../../data/types'
import {
  computeDateRange,
  durationDays,
  phaseColorIndex,
  totalWeightPercent,
  type DateRange,
} from '../schedule'
import type { PhaseWeightTotalState } from '../../components/shared/statusStyles'
import { MILESTONE_COLOR_HEX, PHASE_COLOR_HEX, SCHEDULE_COLORS, WEIGHT_BANNER_HEX } from './scheduleExcelFormat'
import { downloadBlob } from './download'
import { projectFileSlug } from './filename'

const DAY_MS = 24 * 60 * 60 * 1000

function thinBorder(): Partial<ExcelJS.Borders> {
  const side: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: SCHEDULE_COLORS.border } }
  return { top: side, left: side, bottom: side, right: side }
}

function phaseColor(phase: SchedulePhase) {
  return PHASE_COLOR_HEX[phaseColorIndex(phase.id)]
}

/** Same 3-way classification GanttChart.tsx uses locally (not exported from
 *  that component file, so duplicated here — a 2-line pure function). */
function weightTotalState(sum: number): PhaseWeightTotalState {
  if (sum === 100) return 'complete'
  return sum < 100 ? 'under' : 'over'
}

function weightTotalMessage(sum: number): string {
  if (sum === 100) return 'Total phase weight: 100% — fully allocated'
  if (sum < 100) return `Total phase weight: ${sum}% of 100% — ${100 - sum}% left to allocate`
  return `Total phase weight: ${sum}% of 100% — over by ${sum - 100}%`
}

function phaseLabel(phase: SchedulePhase): string {
  return phase.code ? `${phase.name} (${phase.code})` : phase.name
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

function buildOverviewSheet(wb: ExcelJS.Workbook, meta: ProjectMeta, schedule: ProjectSchedule) {
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

  const fields: [string, string][] = [
    ['Vendor', meta.vendor],
    ['Scope', meta.scope],
    ['Prepared date', meta.preparedDate],
    ['Contract start date', schedule.contractStartDate ?? ''],
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

// ---------------------------------------------------------------------------
// Phases
// ---------------------------------------------------------------------------

const PHASES_HEADER = ['Color', 'Phase', 'Start Date', 'End Date', 'Duration (days)', 'Weight %', '% Complete']

function buildPhasesSheet(wb: ExcelJS.Workbook, schedule: ProjectSchedule) {
  const ws = wb.addWorksheet('Phases', { views: [{ state: 'frozen', ySplit: 1, showGridLines: false }] })
  ws.columns = [{ width: 4 }, { width: 30 }, { width: 13 }, { width: 13 }, { width: 15 }, { width: 10 }, { width: 12 }]

  PHASES_HEADER.forEach((header, i) => {
    const cell = ws.getCell(1, i + 1)
    cell.value = header
    cell.font = { bold: true, color: { argb: SCHEDULE_COLORS.headerText } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SCHEDULE_COLORS.headerBg } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = thinBorder()
  })
  ws.getRow(1).height = 22

  schedule.phases.forEach((phase, i) => {
    const row = 2 + i
    const color = phaseColor(phase)
    const band = i % 2 === 1

    const swatch = ws.getCell(row, 1)
    swatch.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.fill } }
    swatch.border = thinBorder()

    const name = ws.getCell(row, 2)
    name.value = phaseLabel(phase)
    name.font = { bold: true, color: { argb: color.badgeText } }
    name.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.badgeBg } }
    name.border = thinBorder()

    const values: (string | number)[] = [
      phase.startDate,
      phase.endDate,
      durationDays(phase),
      phase.weightPercent ?? 0,
      phase.percentComplete,
    ]
    values.forEach((value, vi) => {
      const cell = ws.getCell(row, 3 + vi)
      cell.value = value
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: band ? SCHEDULE_COLORS.rowBandB : SCHEDULE_COLORS.rowBandA },
      }
      cell.border = thinBorder()
      cell.alignment = { horizontal: vi === 0 ? 'left' : 'center' }
    })
  })

  const footerRow = 2 + schedule.phases.length + 1
  const sum = totalWeightPercent(schedule.phases)
  const banner = WEIGHT_BANNER_HEX[weightTotalState(sum)]
  ws.mergeCells(footerRow, 1, footerRow, 6)
  const footerLabel = ws.getCell(footerRow, 1)
  footerLabel.value = weightTotalMessage(sum)
  footerLabel.font = { bold: true, color: { argb: banner.text } }
  footerLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: banner.bg } }
  footerLabel.border = thinBorder()
  const footerValue = ws.getCell(footerRow, 7)
  footerValue.value = sum
  footerValue.font = { bold: true, color: { argb: banner.text } }
  footerValue.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: banner.bg } }
  footerValue.border = thinBorder()
}

// ---------------------------------------------------------------------------
// Gantt (visual timeline)
// ---------------------------------------------------------------------------

const COL_SWATCH = 1
const COL_NAME = 2
const COL_WEEK_START = 3
const ROW_BANNER = 1
const ROW_MONTH = 2
const ROW_MILESTONE = 3
const ROW_PHASE_START = 4

interface WeekCol {
  start: Date
}

function weekColumns(range: DateRange): WeekCol[] {
  const cols: WeekCol[] = []
  let cursor = range.start.getTime()
  while (cursor < range.end.getTime()) {
    cols.push({ start: new Date(cursor) })
    cursor += 7 * DAY_MS
  }
  if (cols.length === 0) cols.push({ start: new Date(range.start) })
  return cols
}

function weekIndexForDate(date: Date, range: DateRange, weekCols: WeekCol[]): number {
  const days = Math.floor((date.getTime() - range.start.getTime()) / DAY_MS)
  const idx = Math.floor(days / 7)
  return Math.min(Math.max(idx, 0), weekCols.length - 1)
}

const MONTH_LABEL_FORMAT = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' })

interface MonthGroup {
  label: string
  startIdx: number
  endIdx: number
}

function monthGroups(weekCols: WeekCol[]): MonthGroup[] {
  const groups: MonthGroup[] = []
  weekCols.forEach((col, i) => {
    const label = MONTH_LABEL_FORMAT.format(col.start)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.endIdx = i
    else groups.push({ label, startIdx: i, endIdx: i })
  })
  return groups
}

function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`)
}

function buildGanttSheet(wb: ExcelJS.Workbook, schedule: ProjectSchedule) {
  const ws = wb.addWorksheet('Gantt', { views: [{ showGridLines: false }] })
  const range = computeDateRange(schedule.phases, schedule.milestones, schedule.contractStartDate)

  if (!range) {
    const cell = ws.getCell(1, 1)
    cell.value = 'No schedule data yet. Add a phase or milestone to get started.'
    cell.font = { italic: true, color: { argb: SCHEDULE_COLORS.dark } }
    ws.getColumn(1).width = 50
    return
  }

  const weekCols = weekColumns(range)
  const lastCol = COL_WEEK_START + weekCols.length - 1

  ws.getColumn(COL_SWATCH).width = 4
  ws.getColumn(COL_NAME).width = 28
  for (let i = 0; i < weekCols.length; i++) ws.getColumn(COL_WEEK_START + i).width = 2.6

  ws.views = [{ state: 'frozen', xSplit: COL_WEEK_START - 1, ySplit: ROW_PHASE_START - 1, showGridLines: false }]

  // Row 1 — weight-total banner, merged across every column.
  if (schedule.phases.length > 0) {
    const sum = totalWeightPercent(schedule.phases)
    const banner = WEIGHT_BANNER_HEX[weightTotalState(sum)]
    ws.mergeCells(ROW_BANNER, 1, ROW_BANNER, lastCol)
    const cell = ws.getCell(ROW_BANNER, 1)
    cell.value = weightTotalMessage(sum)
    cell.font = { bold: true, color: { argb: banner.text } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: banner.bg } }
    cell.border = thinBorder()
    ws.getRow(ROW_BANNER).height = 20
  }

  // Row 2 — merged month-label header across the timeline columns.
  for (const group of monthGroups(weekCols)) {
    const startCol = COL_WEEK_START + group.startIdx
    const endCol = COL_WEEK_START + group.endIdx
    if (endCol > startCol) ws.mergeCells(ROW_MONTH, startCol, ROW_MONTH, endCol)
    const cell = ws.getCell(ROW_MONTH, startCol)
    cell.value = group.label
    cell.font = { bold: true, size: 9, color: { argb: SCHEDULE_COLORS.dark } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SCHEDULE_COLORS.monthHeaderBg } }
    cell.alignment = { horizontal: 'center' }
  }

  // Row 3 — milestone markers, one per week-column (concatenated on collision).
  const milestoneNotes = new Map<number, string[]>()
  const milestoneTypeByCol = new Map<number, MilestoneType>()
  for (const milestone of schedule.milestones) {
    const idx = weekIndexForDate(parseIsoDate(milestone.date), range, weekCols)
    const col = COL_WEEK_START + idx
    const notes = milestoneNotes.get(col) ?? []
    notes.push(`${milestone.label} · ${milestone.date}`)
    milestoneNotes.set(col, notes)
    milestoneTypeByCol.set(col, milestone.type)
  }
  for (const [col, notes] of milestoneNotes) {
    const type = milestoneTypeByCol.get(col)
    if (!type) continue
    const color = MILESTONE_COLOR_HEX[type]
    const cell = ws.getCell(ROW_MILESTONE, col)
    cell.value = notes.length > 1 ? `◆×${notes.length}` : '◆'
    cell.font = { bold: true, size: 8, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.marker } }
    cell.alignment = { horizontal: 'center' }
    cell.note = notes.join('; ')
  }

  // Rows 4+ — one row per phase: a two-tone bar (track + leading percent-complete fill).
  if (schedule.phases.length === 0) {
    const cell = ws.getCell(ROW_PHASE_START, COL_NAME)
    cell.value = 'No phases yet.'
    cell.font = { italic: true, color: { argb: SCHEDULE_COLORS.dark } }
  }
  schedule.phases.forEach((phase, i) => {
    const row = ROW_PHASE_START + i
    const color = phaseColor(phase)

    const swatch = ws.getCell(row, COL_SWATCH)
    swatch.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.fill } }

    const name = ws.getCell(row, COL_NAME)
    name.value = phaseLabel(phase)
    name.font = { bold: true, size: 9, color: { argb: color.badgeText } }
    name.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.badgeBg } }
    name.alignment = { wrapText: true, vertical: 'middle' }

    const startIdx = weekIndexForDate(parseIsoDate(phase.startDate), range, weekCols)
    const endIdx = weekIndexForDate(parseIsoDate(phase.endDate), range, weekCols)
    const spanStart = Math.min(startIdx, endIdx)
    const spanEnd = Math.max(startIdx, endIdx)
    const spanLength = spanEnd - spanStart + 1
    const fillCount = Math.min(spanLength, Math.max(0, Math.round((spanLength * phase.percentComplete) / 100)))

    for (let idx = spanStart; idx <= spanEnd; idx++) {
      const cell = ws.getCell(row, COL_WEEK_START + idx)
      const filled = idx - spanStart < fillCount
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: filled ? color.fill : color.track },
      }
    }
  })

  // Contract-start reference column — closest Excel equivalent to the
  // on-screen dashed vertical line (no literal dashed multi-row rule in ExcelJS).
  if (schedule.contractStartDate) {
    const idx = weekIndexForDate(parseIsoDate(schedule.contractStartDate), range, weekCols)
    const col = COL_WEEK_START + idx
    const lastRow = Math.max(ROW_MONTH, ROW_PHASE_START + schedule.phases.length - 1)
    for (let row = ROW_MONTH; row <= lastRow; row++) {
      const cell = ws.getCell(row, col)
      cell.border = { left: { style: 'medium', color: { argb: SCHEDULE_COLORS.contractStartBorder } } }
    }
  }
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

function buildMilestonesSheet(wb: ExcelJS.Workbook, schedule: ProjectSchedule) {
  const ws = wb.addWorksheet('Milestones', { views: [{ state: 'frozen', ySplit: 1, showGridLines: false }] })
  ws.columns = [{ width: 32 }, { width: 14 }, { width: 16 }]

  ;['Milestone', 'Date', 'Type'].forEach((header, i) => {
    const cell = ws.getCell(1, i + 1)
    cell.value = header
    cell.font = { bold: true, color: { argb: SCHEDULE_COLORS.headerText } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SCHEDULE_COLORS.headerBg } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = thinBorder()
  })
  ws.getRow(1).height = 22

  schedule.milestones.forEach((milestone, i) => {
    const row = 2 + i
    const band = i % 2 === 1
    const bandFill = band ? SCHEDULE_COLORS.rowBandB : SCHEDULE_COLORS.rowBandA

    const label = ws.getCell(row, 1)
    label.value = milestone.label
    label.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bandFill } }
    label.border = thinBorder()

    const date = ws.getCell(row, 2)
    date.value = milestone.date
    date.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bandFill } }
    date.border = thinBorder()
    date.alignment = { horizontal: 'center' }

    const color = MILESTONE_COLOR_HEX[milestone.type]
    const type = ws.getCell(row, 3)
    type.value = milestone.type
    type.font = { bold: true, color: { argb: color.badgeText } }
    type.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.badgeBg } }
    type.border = {
      top: { style: 'thin', color: { argb: color.badgeBorder } },
      left: { style: 'thin', color: { argb: color.badgeBorder } },
      bottom: { style: 'thin', color: { argb: color.badgeBorder } },
      right: { style: 'thin', color: { argb: color.badgeBorder } },
    }
    type.alignment = { horizontal: 'center' }
  })
}

// ---------------------------------------------------------------------------
// Dispatch + download
// ---------------------------------------------------------------------------

export function buildScheduleWorkbook(meta: ProjectMeta, schedule: ProjectSchedule): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'ITS Tracker'
  wb.created = new Date()
  buildOverviewSheet(wb, meta, schedule)
  buildPhasesSheet(wb, schedule)
  buildGanttSheet(wb, schedule)
  buildMilestonesSheet(wb, schedule)
  return wb
}

export async function exportProjectSchedule(meta: ProjectMeta, schedule: ProjectSchedule): Promise<void> {
  const wb = buildScheduleWorkbook(meta, schedule)
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  downloadBlob(blob, `${projectFileSlug(meta)}-schedule.xlsx`)
}
