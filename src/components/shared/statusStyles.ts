import type {
  AdsbEmployerResult,
  AdsbHwPoint,
  AdsbResult,
  AotImportance,
  DoaDocType,
  MilestoneType,
  Priority,
  Status,
  WorkflowStatus,
} from '../../data/types'

/**
 * Matches the actual rendered palette of the two Lovable reference prototypes
 * (pattern-to-page-pal, check-chime-charm) — Tailwind's stock rose/amber/emerald/slate
 * scales, not the literal hex values in CLAUDE.md §9. Submitted, Needs Revision, and
 * Not Available never appear in the prototypes' seed data, so their colors are inferred
 * from the same rose/amber/emerald/slate system the observed statuses use.
 */
export const PRIORITY_BADGE_CLASS: Record<Priority, string> = {
  A: 'border-rose-200 bg-rose-100 text-rose-800',
  B: 'border-amber-200 bg-amber-100 text-amber-800',
  C: 'border-emerald-200 bg-emerald-100 text-emerald-800',
}

export const STATUS_BADGE_CLASS: Record<Status, string> = {
  Submitted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'In Progress': 'border-amber-200 bg-amber-50 text-amber-700',
  Pending: 'border-slate-200 bg-slate-100 text-slate-600',
  'Needs Revision': 'border-rose-200 bg-rose-50 text-rose-700',
  'Not Available': 'border-slate-300 bg-slate-200 text-slate-700',
}

/**
 * Phase Progress tab's workflow-status badges. Deliberately uses sky/violet —
 * two hues not used by STATUS_BADGE_CLASS above — so the two independent
 * status systems stay visually distinguishable wherever they appear together.
 */
export const WORKFLOW_STATUS_BADGE_CLASS: Record<WorkflowStatus, string> = {
  Pending: 'border-slate-200 bg-slate-100 text-slate-600',
  Preparing: 'border-sky-200 bg-sky-50 text-sky-700',
  AwaitingApproval: 'border-amber-200 bg-amber-50 text-amber-700',
  Ready: 'border-violet-200 bg-violet-50 text-violet-700',
  Submitted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

/** AOT's own criticality marker (⚠️สำคัญ/ปกติ/📌ประกอบ/ด่านสำคัญ) — independent of Priority. */
export const IMPORTANCE_BADGE_CLASS: Record<AotImportance, string> = {
  Critical: 'border-rose-200 bg-rose-100 text-rose-800',
  Normal: 'border-slate-200 bg-slate-100 text-slate-600',
  Supporting: 'border-sky-200 bg-sky-50 text-sky-700',
  CriticalCheckpoint: 'border-violet-200 bg-violet-100 text-violet-800',
}

/** DOA's own document classification badge (🟢ใช้ร่วม/🔴บังคับ/🔵เฉพาะสถานที่). */
export const DOC_TYPE_BADGE_CLASS: Record<DoaDocType, string> = {
  Shared: 'border-emerald-200 bg-emerald-100 text-emerald-800',
  Mandatory: 'border-rose-200 bg-rose-100 text-rose-800',
  SiteSpecific: 'border-sky-200 bg-sky-50 text-sky-700',
}

/** ADS-B checklist's Contractor self-check outcome (Pass/Fail/N.A.). */
export const RESULT_BADGE_CLASS: Record<AdsbResult, string> = {
  Pass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Fail: 'border-rose-200 bg-rose-50 text-rose-700',
  NotApplicable: 'border-slate-200 bg-slate-100 text-slate-600',
}

/** ADS-B checklist's separate Employer acceptance decision — independent of AdsbResult. */
export const EMPLOYER_RESULT_BADGE_CLASS: Record<AdsbEmployerResult, string> = {
  Accepted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Conditional: 'border-amber-200 bg-amber-50 text-amber-700',
  Rejected: 'border-rose-200 bg-rose-50 text-rose-700',
}

/** ADS-B checklist's Hold Point / Witness Point marker (Employer ITP only). */
export const HW_POINT_BADGE_CLASS: Record<AdsbHwPoint, string> = {
  Hold: 'border-rose-200 bg-rose-100 text-rose-800',
  Witness: 'border-sky-200 bg-sky-50 text-sky-700',
}

/** User Management page's account-status badge. */
export const ACCOUNT_STATUS_BADGE_CLASS: Record<'Active' | 'Deactivated', string> = {
  Active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Deactivated: 'border-slate-300 bg-slate-200 text-slate-700',
}

/** Project Management tab's Gantt milestone-type marker. */
export const MILESTONE_TYPE_BADGE_CLASS: Record<MilestoneType, string> = {
  Delivery: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Committee: 'border-sky-200 bg-sky-50 text-sky-700',
  Extension: 'border-amber-200 bg-amber-50 text-amber-700',
  Other: 'border-slate-200 bg-slate-100 text-slate-600',
}

/** Same hue-per-type mapping as MILESTONE_TYPE_BADGE_CLASS above, but as a
 *  solid fill (white icon on a solid chip) for the on-chart marker rather
 *  than the light badge treatment used in the milestone list. */
export const MILESTONE_TYPE_MARKER_CLASS: Record<MilestoneType, string> = {
  Delivery: 'bg-emerald-500',
  Committee: 'bg-sky-500',
  Extension: 'bg-amber-500',
  Other: 'bg-slate-500',
}

/** Project Management tab's phase-weight total banner — whether every
 *  phase's weightPercent (share of the total project) sums to exactly 100%. */
export type PhaseWeightTotalState = 'complete' | 'under' | 'over'

export const PHASE_WEIGHT_TOTAL_BADGE_CLASS: Record<PhaseWeightTotalState, string> = {
  complete: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  under: 'border-amber-200 bg-amber-50 text-amber-700',
  over: 'border-rose-200 bg-rose-50 text-rose-700',
}

export interface PhaseColorSlot {
  fill: string
  track: string
  badge: string
  accentBorder: string // border-l-{hue}-500 — kept as its own literal class, not derived
  // from `fill` at runtime, since Tailwind's build-time scanner only picks up
  // classes that appear as literal strings in source, not string-concatenated ones.
}

/**
 * Project Management tab's 8-slot categorical phase palette — dataviz-skill
 * validated (fixed hue order, CVD/contrast checked against a white surface;
 * see the "Make the Project Management tab more colorful" plan). Deliberately
 * avoids rose/amber/emerald/slate/sky/violet, which already carry status
 * meaning elsewhere in this app (STATUS_BADGE_CLASS/WORKFLOW_STATUS_BADGE_CLASS
 * above), so a phase color never reads as a status color. Index a phase into
 * this array via `phaseColorIndex(phase.id)` (domain/schedule.ts) — never by
 * array position, so deleting/reordering other phases can't repaint one.
 */
export const PHASE_COLOR_SLOTS: PhaseColorSlot[] = [
  { fill: 'bg-blue-500', track: 'bg-blue-100', badge: 'border-blue-300 bg-blue-100 text-blue-800', accentBorder: 'border-l-blue-500' },
  { fill: 'bg-orange-500', track: 'bg-orange-100', badge: 'border-orange-300 bg-orange-100 text-orange-800', accentBorder: 'border-l-orange-500' },
  { fill: 'bg-green-500', track: 'bg-green-100', badge: 'border-green-300 bg-green-100 text-green-800', accentBorder: 'border-l-green-500' },
  { fill: 'bg-fuchsia-500', track: 'bg-fuchsia-100', badge: 'border-fuchsia-300 bg-fuchsia-100 text-fuchsia-800', accentBorder: 'border-l-fuchsia-500' },
  { fill: 'bg-yellow-600', track: 'bg-yellow-100', badge: 'border-yellow-300 bg-yellow-100 text-yellow-800', accentBorder: 'border-l-yellow-600' },
  { fill: 'bg-indigo-500', track: 'bg-indigo-100', badge: 'border-indigo-300 bg-indigo-100 text-indigo-800', accentBorder: 'border-l-indigo-500' },
  { fill: 'bg-red-500', track: 'bg-red-100', badge: 'border-red-300 bg-red-100 text-red-800', accentBorder: 'border-l-red-500' },
  { fill: 'bg-teal-500', track: 'bg-teal-100', badge: 'border-teal-300 bg-teal-100 text-teal-800', accentBorder: 'border-l-teal-500' },
]

/** Find Projects page's e-GP status badge — the 4 real Thai status strings the portal itself uses. */
export const PROCUREMENT_STATUS_BADGE_CLASS: Record<string, string> = {
  อนุมัติสั่งซื้อสั่งจ้างและประกาศผู้ชนะการเสนอราคา: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'หนังสือเชิญชวน/ประกาศเชิญชวน': 'border-amber-200 bg-amber-50 text-amber-700',
  'จัดทำสัญญา/บริหารสัญญา': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  ยกเลิกโครงการ: 'border-rose-200 bg-rose-50 text-rose-700',
}
