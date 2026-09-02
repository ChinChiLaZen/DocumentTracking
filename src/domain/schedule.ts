import type { PhaseActivity, ScheduleMilestone, SchedulePhase } from '../data/types'

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
 *  phase activity's start/end (activities aren't constrained to fall within
 *  their parent phase's dates, so the range must cover them independently),
 *  every milestone date, and the contract start date, padded so edge items
 *  aren't clipped against the panel edge. Returns null for an empty schedule
 *  so callers can render an empty state instead of dividing by zero. */
export function computeDateRange(
  phases: SchedulePhase[],
  milestones: ScheduleMilestone[],
  contractStartDate?: string,
): DateRange | null {
  const dates: Date[] = []
  for (const phase of phases) {
    dates.push(parseIsoDate(phase.startDate), parseIsoDate(phase.endDate))
    for (const activity of phase.activities ?? []) {
      dates.push(parseIsoDate(activity.startDate), parseIsoDate(activity.endDate))
    }
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

/** An activity's bar position/width — same math as phaseBarStyle, kept as a
 *  separate named function (rather than widening phaseBarStyle's type) so
 *  call sites read unambiguously as phase-bar vs activity-bar. */
export function activityBarStyle(activity: PhaseActivity, range: DateRange): PhaseBarStyle {
  const leftPercent = datePercent(parseIsoDate(activity.startDate), range)
  const rightPercent = datePercent(parseIsoDate(activity.endDate), range)
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

/** Inclusive day count — an entry starting and ending the same day is 1 day.
 *  Structurally typed so it applies to both SchedulePhase and PhaseActivity. */
export function durationDays(entry: { startDate: string; endDate: string }): number {
  const start = parseIsoDate(entry.startDate)
  const end = parseIsoDate(entry.endDate)
  return Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1
}

/** Sum of every phase's weightPercent — the "share of the total project"
 *  axis (independent of percentComplete), which a reviewer is expected to
 *  allocate to exactly 100% across all phases. Unset weights count as 0. */
export function totalWeightPercent(phases: SchedulePhase[]): number {
  return phases.reduce((sum, p) => sum + (p.weightPercent ?? 0), 0)
}

/** Sum of one phase's activities' weightPercent — the per-phase analogue of
 *  totalWeightPercent, since each phase's activities are expected to
 *  allocate to 100% of THAT PHASE independently of other phases' totals.
 *  Unset weights count as 0; a phase with no activities returns 0. */
export function totalActivityWeightPercent(phase: SchedulePhase): number {
  return (phase.activities ?? []).reduce((sum, a) => sum + (a.weightPercent ?? 0), 0)
}

const PHASE_COLOR_SLOT_COUNT = 8

/** A stable categorical color slot [0, 8) for a phase, derived from its own
 *  id rather than its position in the array — so deleting or reordering
 *  other phases never repaints this one's color (dataviz skill's "color
 *  follows the entity, never its rank"). */
export function phaseColorIndex(phaseId: string): number {
  let hash = 0
  for (let i = 0; i < phaseId.length; i++) {
    hash = (hash * 31 + phaseId.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % PHASE_COLOR_SLOT_COUNT
}
