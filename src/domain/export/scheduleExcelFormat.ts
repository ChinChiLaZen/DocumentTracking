import type { MilestoneType } from '../../data/types'
import type { PhaseWeightTotalState } from '../../components/shared/statusStyles'

/**
 * Hex/ARGB translations of the Tailwind classes `statusStyles.ts` uses for
 * the Project Management tab's Gantt chart — that file only stores Tailwind
 * class strings (build-time CSS), so the Excel export needs the actual color
 * values. Standard Tailwind v3 default-palette hex values; keep in sync with
 * `PHASE_COLOR_SLOTS`/`MILESTONE_TYPE_BADGE_CLASS`/`PHASE_WEIGHT_TOTAL_BADGE_CLASS`
 * in `src/components/shared/statusStyles.ts` if those ever change.
 */

export interface PhaseColorHex {
  fill: string
  track: string
  badgeBorder: string
  badgeBg: string
  badgeText: string
}

/** Index order must match `PHASE_COLOR_SLOTS` in statusStyles.ts exactly —
 *  indexed the same way, via `phaseColorIndex(phase.id)`. */
export const PHASE_COLOR_HEX: PhaseColorHex[] = [
  { fill: 'FF3B82F6', track: 'FFDBEAFE', badgeBorder: 'FF93C5FD', badgeBg: 'FFDBEAFE', badgeText: 'FF1E40AF' }, // blue
  { fill: 'FFF97316', track: 'FFFFEDD5', badgeBorder: 'FFFDBA74', badgeBg: 'FFFFEDD5', badgeText: 'FF9A3412' }, // orange
  { fill: 'FF22C55E', track: 'FFDCFCE7', badgeBorder: 'FF86EFAC', badgeBg: 'FFDCFCE7', badgeText: 'FF166534' }, // green
  { fill: 'FFD946EF', track: 'FFFAE8FF', badgeBorder: 'FFF0ABFC', badgeBg: 'FFFAE8FF', badgeText: 'FF86198F' }, // fuchsia
  { fill: 'FFCA8A04', track: 'FFFEF9C3', badgeBorder: 'FFFDE047', badgeBg: 'FFFEF9C3', badgeText: 'FF854D0E' }, // yellow
  { fill: 'FF6366F1', track: 'FFE0E7FF', badgeBorder: 'FFA5B4FC', badgeBg: 'FFE0E7FF', badgeText: 'FF3730A3' }, // indigo
  { fill: 'FFEF4444', track: 'FFFEE2E2', badgeBorder: 'FFFCA5A5', badgeBg: 'FFFEE2E2', badgeText: 'FF991B1B' }, // red
  { fill: 'FF14B8A6', track: 'FFCCFBF1', badgeBorder: 'FF5EEAD4', badgeBg: 'FFCCFBF1', badgeText: 'FF115E59' }, // teal
]

export interface MilestoneColorHex {
  marker: string
  badgeBorder: string
  badgeBg: string
  badgeText: string
}

export const MILESTONE_COLOR_HEX: Record<MilestoneType, MilestoneColorHex> = {
  Delivery: { marker: 'FF10B981', badgeBorder: 'FFA7F3D0', badgeBg: 'FFECFDF5', badgeText: 'FF047857' },
  Committee: { marker: 'FF0EA5E9', badgeBorder: 'FFBAE6FD', badgeBg: 'FFF0F9FF', badgeText: 'FF0369A1' },
  Extension: { marker: 'FFF59E0B', badgeBorder: 'FFFDE68A', badgeBg: 'FFFFFBEB', badgeText: 'FFB45309' },
  Other: { marker: 'FF64748B', badgeBorder: 'FFE2E8F0', badgeBg: 'FFF1F5F9', badgeText: 'FF475569' },
}

export interface WeightBannerHex {
  border: string
  bg: string
  text: string
}

export const WEIGHT_BANNER_HEX: Record<PhaseWeightTotalState, WeightBannerHex> = {
  complete: { border: 'FFA7F3D0', bg: 'FFECFDF5', text: 'FF047857' },
  under: { border: 'FFFDE68A', bg: 'FFFFFBEB', text: 'FFB45309' },
  over: { border: 'FFFECDD3', bg: 'FFFFF1F2', text: 'FFBE123C' },
}

/** Structural colors for the schedule export — a small, generic palette
 *  (not project-specific, unlike ADSB_COLORS in adsbFormat.ts). */
export const SCHEDULE_COLORS = {
  headerBg: 'FF1F2937', // slate-800
  headerText: 'FFFFFFFF',
  border: 'FFCBD5E1', // slate-300
  labelBg: 'FFF1F5F9', // slate-100
  rowBandA: 'FFFFFFFF',
  rowBandB: 'FFF8FAFC', // slate-50
  monthHeaderBg: 'FFE2E8F0', // slate-200
  contractStartBorder: 'FF475569', // slate-600
  dark: 'FF1E293B', // slate-800 text
} as const
