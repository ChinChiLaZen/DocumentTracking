import type { Priority, Status } from '../../data/types'

/** §9 design tokens, mapped to Badge className overrides (shadcn has no matching variant names). */
export const PRIORITY_BADGE_CLASS: Record<Priority, string> = {
  A: 'border-priority-a/30 bg-priority-a/10 text-priority-a',
  B: 'border-priority-b/30 bg-priority-b/10 text-priority-b',
  C: 'border-priority-c/30 bg-priority-c/10 text-priority-c',
}

export const STATUS_BADGE_CLASS: Record<Status, string> = {
  Submitted: 'border-status-submitted/30 bg-status-submitted/10 text-status-submitted',
  'In Progress': 'border-status-inprogress/30 bg-status-inprogress/10 text-status-inprogress',
  Pending: 'border-status-pending/30 bg-status-pending/10 text-status-pending',
  'Needs Revision':
    'border-status-needsrevision/30 bg-status-needsrevision/10 text-status-needsrevision',
  'Not Available':
    'border-status-notavailable/30 bg-status-notavailable/10 text-status-notavailable',
}
