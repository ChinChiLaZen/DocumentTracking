import { describe, expect, it } from 'vitest'
import type { BoardTask, ProjectTaskBoard, ScheduleMilestone, TaskGroup } from '../data/types'
import { computeBoardStats, groupProgressPercent, isTaskOverdue, resolveTaskDueDate, statusBreakdown } from './board'

// parseIsoDate (schedule.ts, reused by board.ts) parses in LOCAL time, so
// comparing via toISOString() (UTC) would drift by the runner's timezone
// offset — format back using local date parts instead, matching how
// schedule.test.ts avoids the same trap by comparing Date objects directly.
function localIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function fixtureTask(overrides: Partial<BoardTask> = {}): BoardTask {
  return {
    id: 't1',
    name: 'Fixture Task',
    status: 'NotStarted',
    priority: 'Medium',
    progressPercent: 0,
    dueDateMode: 'none',
    ...overrides,
  }
}

function fixtureMilestone(overrides: Partial<ScheduleMilestone> = {}): ScheduleMilestone {
  return { id: 'm1', label: 'Fixture Milestone', date: '2026-06-15', type: 'Delivery', ...overrides }
}

function fixtureGroup(overrides: Partial<TaskGroup> = {}): TaskGroup {
  return { id: 'g1', name: 'Fixture Group', tasks: [], ...overrides }
}

describe('resolveTaskDueDate', () => {
  it('returns undefined for dueDateMode "none"', () => {
    expect(resolveTaskDueDate(fixtureTask({ dueDateMode: 'none' }), [])).toBeUndefined()
  })

  it('returns undefined for a fixed task with no dueDate', () => {
    expect(resolveTaskDueDate(fixtureTask({ dueDateMode: 'fixed' }), [])).toBeUndefined()
  })

  it('resolves a fixed date', () => {
    const due = resolveTaskDueDate(fixtureTask({ dueDateMode: 'fixed', dueDate: '2026-07-01' }), [])
    expect(due && localIso(due)).toBe('2026-07-01')
  })

  it('resolves a milestone date with a positive (after) offset', () => {
    const milestones = [fixtureMilestone({ id: 'm1', date: '2026-06-15' })]
    const task = fixtureTask({ dueDateMode: 'milestone', dueMilestoneId: 'm1', dueOffsetDays: 5 })
    const due = resolveTaskDueDate(task, milestones)
    expect(due && localIso(due)).toBe('2026-06-20')
  })

  it('resolves a milestone date with a negative (before) offset', () => {
    const milestones = [fixtureMilestone({ id: 'm1', date: '2026-06-15' })]
    const task = fixtureTask({ dueDateMode: 'milestone', dueMilestoneId: 'm1', dueOffsetDays: -5 })
    const due = resolveTaskDueDate(task, milestones)
    expect(due && localIso(due)).toBe('2026-06-10')
  })

  it('returns undefined when the referenced milestone no longer exists', () => {
    const task = fixtureTask({ dueDateMode: 'milestone', dueMilestoneId: 'missing', dueOffsetDays: 0 })
    expect(resolveTaskDueDate(task, [fixtureMilestone({ id: 'm1' })])).toBeUndefined()
  })

  it('returns undefined when a milestone task has no offset set', () => {
    const milestones = [fixtureMilestone({ id: 'm1' })]
    const task = fixtureTask({ dueDateMode: 'milestone', dueMilestoneId: 'm1' })
    expect(resolveTaskDueDate(task, milestones)).toBeUndefined()
  })
})

describe('isTaskOverdue', () => {
  const today = new Date('2026-06-15T00:00:00')

  it('is true for a past due date on a non-Done task', () => {
    const task = fixtureTask({ dueDateMode: 'fixed', dueDate: '2026-06-01', status: 'InProgress' })
    expect(isTaskOverdue(task, [], today)).toBe(true)
  })

  it('is false for the same past due date once the task is Done', () => {
    const task = fixtureTask({ dueDateMode: 'fixed', dueDate: '2026-06-01', status: 'Done' })
    expect(isTaskOverdue(task, [], today)).toBe(false)
  })

  it('is true for a Blocked task past due (only Done exempts)', () => {
    const task = fixtureTask({ dueDateMode: 'fixed', dueDate: '2026-06-01', status: 'Blocked' })
    expect(isTaskOverdue(task, [], today)).toBe(true)
  })

  it('is false when there is no resolvable due date, regardless of status', () => {
    const task = fixtureTask({ dueDateMode: 'none', status: 'InProgress' })
    expect(isTaskOverdue(task, [], today)).toBe(false)
  })

  it('is false for a future due date', () => {
    const task = fixtureTask({ dueDateMode: 'fixed', dueDate: '2026-07-01', status: 'InProgress' })
    expect(isTaskOverdue(task, [], today)).toBe(false)
  })
})

describe('groupProgressPercent', () => {
  it('returns 0 for an empty group', () => {
    expect(groupProgressPercent(fixtureGroup({ tasks: [] }))).toBe(0)
  })

  it('passes through a single task\'s own progress', () => {
    expect(groupProgressPercent(fixtureGroup({ tasks: [fixtureTask({ progressPercent: 42 })] }))).toBe(42)
  })

  it('rounds the average across multiple tasks (.5 rounds up)', () => {
    const tasks = [fixtureTask({ id: 't1', progressPercent: 10 }), fixtureTask({ id: 't2', progressPercent: 25 })]
    expect(groupProgressPercent(fixtureGroup({ tasks }))).toBe(18) // Math.round(17.5) === 18
  })
})

describe('computeBoardStats', () => {
  const today = new Date('2026-06-15T00:00:00')

  it('counts total/done/inProgress/overdue across multiple groups', () => {
    const board: ProjectTaskBoard = {
      groups: [
        fixtureGroup({
          id: 'g1',
          tasks: [
            fixtureTask({ id: 't1', status: 'Done' }),
            fixtureTask({ id: 't2', status: 'InProgress' }),
          ],
        }),
        fixtureGroup({
          id: 'g2',
          tasks: [
            fixtureTask({
              id: 't3',
              status: 'Blocked',
              dueDateMode: 'fixed',
              dueDate: '2026-06-01', // past due
            }),
            fixtureTask({ id: 't4', status: 'NotStarted' }),
          ],
        }),
      ],
    }
    const stats = computeBoardStats(board, [], today)
    expect(stats).toEqual({ total: 4, done: 1, inProgress: 1, overdue: 1 })
  })

  it('returns all zeros for an empty board', () => {
    expect(computeBoardStats({ groups: [] }, [], today)).toEqual({ total: 0, done: 0, inProgress: 0, overdue: 0 })
  })
})

describe('statusBreakdown', () => {
  it('always returns exactly the 5 status keys', () => {
    const result = statusBreakdown({ groups: [] })
    expect(Object.keys(result).sort()).toEqual(
      ['Blocked', 'Done', 'InProgress', 'NotStarted', 'PendingReview'].sort(),
    )
  })

  it('sums correctly across groups', () => {
    const board: ProjectTaskBoard = {
      groups: [
        fixtureGroup({ id: 'g1', tasks: [fixtureTask({ id: 't1', status: 'InProgress' })] }),
        fixtureGroup({
          id: 'g2',
          tasks: [
            fixtureTask({ id: 't2', status: 'InProgress' }),
            fixtureTask({ id: 't3', status: 'Done' }),
          ],
        }),
      ],
    }
    const result = statusBreakdown(board)
    expect(result.InProgress).toBe(2)
    expect(result.Done).toBe(1)
    expect(result.NotStarted).toBe(0)
    expect(result.PendingReview).toBe(0)
    expect(result.Blocked).toBe(0)
  })
})
