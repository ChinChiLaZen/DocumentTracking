import type { Priority, Status } from '../../data/types'

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
