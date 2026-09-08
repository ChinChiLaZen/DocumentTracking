import type { BoardTask, ProjectTaskBoard, ScheduleMilestone, TaskGroup, TaskStatus } from '../data/types'
import { parseIsoDate } from './schedule'

const DAY_MS = 24 * 60 * 60 * 1000

/** A task's effective due date — fixed date, or a milestone's date offset by
 *  dueOffsetDays, or undefined ('none' mode, a missing fixed date, or a
 *  milestone reference that no longer resolves because the milestone was
 *  deleted on the Project Management tab). Never throws on a stale
 *  dueMilestoneId — callers render a muted "milestone removed" state instead. */
export function resolveTaskDueDate(task: BoardTask, milestones: ScheduleMilestone[]): Date | undefined {
  if (task.dueDateMode === 'fixed') {
    return task.dueDate ? parseIsoDate(task.dueDate) : undefined
  }
  if (task.dueDateMode === 'milestone') {
    if (task.dueOffsetDays === undefined) return undefined
    const milestone = milestones.find((m) => m.id === task.dueMilestoneId)
    if (!milestone) return undefined
    return new Date(parseIsoDate(milestone.date).getTime() + task.dueOffsetDays * DAY_MS)
  }
  return undefined
}

/** A task is overdue when its resolved due date has passed and it isn't
 *  Done — a Blocked task past due still counts overdue, only Done exempts. */
export function isTaskOverdue(task: BoardTask, milestones: ScheduleMilestone[], today: Date = new Date()): boolean {
  if (task.status === 'Done') return false
  const due = resolveTaskDueDate(task, milestones)
  if (!due) return false
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return due.getTime() < startOfToday.getTime()
}

/** A group's progress — the rounded average of its tasks' own manual
 *  progressPercent (matching SchedulePhase.percentComplete's per-entity,
 *  manual convention), not a done/total task-count ratio, so a task sitting
 *  at InProgress/70% is reflected instead of counting as 0% until Done. */
export function groupProgressPercent(group: TaskGroup): number {
  if (group.tasks.length === 0) return 0
  const sum = group.tasks.reduce((acc, t) => acc + t.progressPercent, 0)
  return Math.round(sum / group.tasks.length)
}

export interface BoardStats {
  total: number
  done: number
  inProgress: number
  overdue: number
}

/** Board-wide totals for the header stat cards. */
export function computeBoardStats(
  board: ProjectTaskBoard,
  milestones: ScheduleMilestone[],
  today: Date = new Date(),
): BoardStats {
  const tasks = board.groups.flatMap((g) => g.tasks)
  return {
    total: tasks.length,
    done: tasks.filter((t) => t.status === 'Done').length,
    inProgress: tasks.filter((t) => t.status === 'InProgress').length,
    overdue: tasks.filter((t) => isTaskOverdue(t, milestones, today)).length,
  }
}

const ALL_TASK_STATUSES: TaskStatus[] = ['NotStarted', 'InProgress', 'PendingReview', 'Done', 'Blocked']

/** Per-status task counts across every group — every status key is always
 *  present (0 when unused) so the breakdown row never has to guard for a
 *  missing key. */
export function statusBreakdown(board: ProjectTaskBoard): Record<TaskStatus, number> {
  const counts = Object.fromEntries(ALL_TASK_STATUSES.map((s) => [s, 0])) as Record<TaskStatus, number>
  for (const group of board.groups) {
    for (const task of group.tasks) {
      counts[task.status] += 1
    }
  }
  return counts
}
