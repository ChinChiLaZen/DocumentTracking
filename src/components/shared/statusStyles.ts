import type {
  AdsbEmployerResult,
  AdsbHwPoint,
  AdsbResult,
  AotImportance,
  DoaDocType,
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
