import type { ScheduleMilestone, SchedulePhase } from '../data/types'

const DAY_MS = 24 * 60 * 60 * 1000
const SINGLE_POINT_PAD_DAYS = 14
const RANGE_PAD_FRACTION = 0.05
const MIN_BAR_WIDTH_PERCENT = 1.5

export interface DateRange {
  start: Date
  end: Date
}

function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`)
}

/** The visible date span for the Gantt chart — every phase start/end, every
 *  milestone date, and the contract start date, padded so edge items aren't
 *  clipped against the panel edge. Returns null for an empty schedule so
 *  callers can render an empty state instead of dividing by zero. */
export function computeDateRange(
  phases: SchedulePhase[],
  milestones: ScheduleMilestone[],
  contractStartDate?: string,
): DateRange | null {
  const dates: Date[] = []
  for (const phase of phases) {
    dates.push(parseIsoDate(phase.startDate), parseIsoDate(phase.endDate))
  }
  for (const milestone of milestones) {
    dates.push(parseIsoDate(milestone.date))
  }
  if (contractStartDate) dates.push(parseIsoDate(contractStartDate))

  if (dates.length === 0) return null

  const min = new Date(Math.min(...dates.map((d) => d.getTime())))
  const max = new Date(Math.max(...dates.map((d) => d.getTime())))

  if (min.getTime() === max.getTime()) {
    return {
      start: new Date(min.getTime() - SINGLE_POINT_PAD_DAYS * DAY_MS),
      end: new Date(max.getTime() + SINGLE_POINT_PAD_DAYS * DAY_MS),
    }
  }

  const pad = Math.max((max.getTime() - min.getTime()) * RANGE_PAD_FRACTION, DAY_MS)
  return { start: new Date(min.getTime() - pad), end: new Date(max.getTime() + pad) }
}

/** A date's position across the range as a percentage, clamped to [0, 100]. */
export function datePercent(date: Date, range: DateRange): number {
  const total = range.end.getTime() - range.start.getTime()
  if (total <= 0) return 0
  const percent = ((date.getTime() - range.start.getTime()) / total) * 100
  return Math.min(100, Math.max(0, percent))
}

export interface PhaseBarStyle {
  leftPercent: number
  widthPercent: number
}

/** A phase's bar position/width, with a minimum-width floor so very short
 *  phases stay visible/clickable. */
export function phaseBarStyle(phase: SchedulePhase, range: DateRange): PhaseBarStyle {
  const leftPercent = datePercent(parseIsoDate(phase.startDate), range)
  const rightPercent = datePercent(parseIsoDate(phase.endDate), range)
  const widthPercent = Math.max(rightPercent - leftPercent, MIN_BAR_WIDTH_PERCENT)
  return { leftPercent, widthPercent }
}

export interface MonthTick {
  label: string
  percent: number
}

const MONTH_LABEL_FORMAT = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' })

/** One tick per calendar month spanning the range, for the timeline's
 *  month-label header. */
export function monthTicks(range: DateRange): MonthTick[] {
  const ticks: MonthTick[] = []
  const cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1)
  const last = new Date(range.end.getFullYear(), range.end.getMonth(), 1)
  while (cursor.getTime() <= last.getTime()) {
    ticks.push({ label: MONTH_LABEL_FORMAT.format(cursor), percent: datePercent(cursor, range) })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return ticks
}

/** Inclusive day count — a phase starting and ending the same day is 1 day. */
export function durationDays(phase: SchedulePhase): number {
  const start = parseIsoDate(phase.startDate)
  const end = parseIsoDate(phase.endDate)
  return Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1
}
