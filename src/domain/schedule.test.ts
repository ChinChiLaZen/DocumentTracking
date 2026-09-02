import { describe, expect, it } from 'vitest'
import type { PhaseActivity, ScheduleMilestone, SchedulePhase } from '../data/types'
import {
  activityBarStyle,
  computeDateRange,
  datePercent,
  durationDays,
  minTickGapPercent,
  monthTicks,
  otherActivitiesWeightPercent,
  phaseBarStyle,
  phaseColorIndex,
  totalActivityWeightPercent,
  totalWeightPercent,
} from './schedule'

function fixturePhase(overrides: Partial<SchedulePhase> = {}): SchedulePhase {
  return {
    id: 'p1',
    name: 'Fixture Phase',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    percentComplete: 50,
    ...overrides,
  }
}

function fixtureMilestone(overrides: Partial<ScheduleMilestone> = {}): ScheduleMilestone {
  return {
    id: 'm1',
    label: 'Fixture Milestone',
    date: '2026-01-15',
    type: 'Delivery',
    ...overrides,
  }
}

function fixtureActivity(overrides: Partial<PhaseActivity> = {}): PhaseActivity {
  return {
    id: 'a1',
    name: 'Fixture Activity',
    startDate: '2026-01-05',
    endDate: '2026-01-10',
    percentComplete: 50,
    ...overrides,
  }
}

describe('computeDateRange', () => {
  it('returns null for an empty schedule', () => {
    expect(computeDateRange([], [])).toBeNull()
  })

  it('pads a single-point range (one milestone, no phases)', () => {
    const range = computeDateRange([], [fixtureMilestone({ date: '2026-06-15' })])
    expect(range).not.toBeNull()
    expect(range!.start.getTime()).toBeLessThan(new Date('2026-06-15T00:00:00').getTime())
    expect(range!.end.getTime()).toBeGreaterThan(new Date('2026-06-15T00:00:00').getTime())
  })

  it('spans min/max across mixed phases, milestones, and contractStartDate, with padding', () => {
    const phases = [fixturePhase({ startDate: '2026-03-01', endDate: '2026-04-01' })]
    const milestones = [fixtureMilestone({ date: '2026-05-01' })]
    const range = computeDateRange(phases, milestones, '2026-01-01')
    expect(range).not.toBeNull()
    // Padded start is before the earliest input date (contractStartDate).
    expect(range!.start.getTime()).toBeLessThan(new Date('2026-01-01T00:00:00').getTime())
    // Padded end is after the latest input date (the milestone).
    expect(range!.end.getTime()).toBeGreaterThan(new Date('2026-05-01T00:00:00').getTime())
  })

  it('covers an activity whose dates extend past its parent phase\'s own range', () => {
    const phases = [
      fixturePhase({
        startDate: '2026-03-01',
        endDate: '2026-04-01',
        activities: [fixtureActivity({ startDate: '2026-02-01', endDate: '2026-05-01' })],
      }),
    ]
    const range = computeDateRange(phases, [])
    expect(range).not.toBeNull()
    // Padded start is before the activity's start (earlier than the phase's own start).
    expect(range!.start.getTime()).toBeLessThan(new Date('2026-02-01T00:00:00').getTime())
    // Padded end is after the activity's end (later than the phase's own end).
    expect(range!.end.getTime()).toBeGreaterThan(new Date('2026-05-01T00:00:00').getTime())
  })
})

describe('datePercent', () => {
  const range = { start: new Date('2026-01-01T00:00:00'), end: new Date('2026-01-11T00:00:00') }

  it('clamps a date before the range to 0', () => {
    expect(datePercent(new Date('2025-01-01T00:00:00'), range)).toBe(0)
  })

  it('clamps a date after the range to 100', () => {
    expect(datePercent(new Date('2027-01-01T00:00:00'), range)).toBe(100)
  })

  it('computes the midpoint correctly', () => {
    expect(datePercent(new Date('2026-01-06T00:00:00'), range)).toBe(50)
  })
})

describe('phaseBarStyle', () => {
  it('enforces the minimum-width floor for a very short phase', () => {
    const range = { start: new Date('2026-01-01T00:00:00'), end: new Date('2027-01-01T00:00:00') }
    const phase = fixturePhase({ startDate: '2026-06-01', endDate: '2026-06-01' })
    const style = phaseBarStyle(phase, range)
    expect(style.widthPercent).toBeGreaterThanOrEqual(1.5)
  })
})

describe('activityBarStyle', () => {
  it('enforces the minimum-width floor for a very short activity', () => {
    const range = { start: new Date('2026-01-01T00:00:00'), end: new Date('2027-01-01T00:00:00') }
    const activity = fixtureActivity({ startDate: '2026-06-01', endDate: '2026-06-01' })
    const style = activityBarStyle(activity, range)
    expect(style.widthPercent).toBeGreaterThanOrEqual(1.5)
  })
})

describe('monthTicks', () => {
  it('produces one tick per calendar month, including partial edge months', () => {
    // Range spans Jan 15 - Mar 15, i.e. partial Jan and Mar plus full Feb.
    const range = { start: new Date('2026-01-15T00:00:00'), end: new Date('2026-03-15T00:00:00') }
    const ticks = monthTicks(range)
    expect(ticks.map((t) => t.label)).toEqual(['Jan 2026', 'Feb 2026', 'Mar 2026'])
  })
})

describe('minTickGapPercent', () => {
  it('returns 100 (no constraint) for fewer than 2 ticks', () => {
    expect(minTickGapPercent([])).toBe(100)
    expect(minTickGapPercent([{ label: 'Jan 2026', percent: 50 }])).toBe(100)
  })

  it('returns the smallest gap among evenly-spread ticks', () => {
    const range = { start: new Date('2026-01-15T00:00:00'), end: new Date('2026-03-15T00:00:00') }
    const ticks = monthTicks(range)
    const gap = minTickGapPercent(ticks)
    expect(gap).toBeGreaterThan(0)
    expect(gap).toBeLessThanOrEqual(100 / (ticks.length - 1) + 0.01)
  })

  it('catches a clustered pair of ticks near a padded range edge', () => {
    // A phase spanning most of September plus a short activity near the
    // Aug/Sept boundary — the exact shape that produced overlapping
    // "Aug 2026"/"Sept 2026" labels in the running app.
    const phases = [
      fixturePhase({
        startDate: '2026-09-01',
        endDate: '2026-09-22',
        activities: [fixtureActivity({ startDate: '2026-09-01', endDate: '2026-09-10' })],
      }),
    ]
    const range = computeDateRange(phases, [])
    expect(range).not.toBeNull()
    const gap = minTickGapPercent(monthTicks(range!))
    expect(gap).toBeLessThan(10)
  })
})

describe('durationDays', () => {
  it('counts a same-day phase as 1 day', () => {
    expect(durationDays(fixturePhase({ startDate: '2026-01-01', endDate: '2026-01-01' }))).toBe(1)
  })

  it('counts inclusively across multiple days', () => {
    expect(durationDays(fixturePhase({ startDate: '2026-01-01', endDate: '2026-01-31' }))).toBe(31)
  })

  it('also works on a PhaseActivity (structurally typed)', () => {
    expect(durationDays(fixtureActivity({ startDate: '2026-01-01', endDate: '2026-01-10' }))).toBe(10)
  })
})

describe('phaseColorIndex', () => {
  it('is deterministic — the same id always maps to the same slot', () => {
    const id = 'apron-p1'
    expect(phaseColorIndex(id)).toBe(phaseColorIndex(id))
  })

  it('is unaffected by other phases being added/removed/reordered (depends only on the id)', () => {
    const id = '3deb4e22-fbec-455a-b6de-969aba8974f2'
    expect(phaseColorIndex(id)).toBe(phaseColorIndex(id))
  })

  it('returns an index within the 8-slot palette', () => {
    for (const id of ['a', 'apron-p1', 'apron-p2', 'apron-p3', 'apron-p4', crypto.randomUUID()]) {
      const index = phaseColorIndex(id)
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThan(8)
    }
  })

  it('distributes distinct ids across more than one slot', () => {
    const ids = ['apron-p1', 'apron-p2', 'apron-p3', 'apron-p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10']
    const slots = new Set(ids.map(phaseColorIndex))
    expect(slots.size).toBeGreaterThan(1)
  })
})

describe('totalWeightPercent', () => {
  it('returns 0 for an empty phase list', () => {
    expect(totalWeightPercent([])).toBe(0)
  })

  it('treats an unset weightPercent as 0', () => {
    const phases = [fixturePhase({ id: 'p1' }), fixturePhase({ id: 'p2' })]
    expect(totalWeightPercent(phases)).toBe(0)
  })

  it('sums weightPercent across phases, matching a real งวดงาน split', () => {
    const phases = [
      fixturePhase({ id: 'p1', weightPercent: 15 }),
      fixturePhase({ id: 'p2', weightPercent: 70 }),
      fixturePhase({ id: 'p3', weightPercent: 10 }),
      fixturePhase({ id: 'p4', weightPercent: 5 }),
    ]
    expect(totalWeightPercent(phases)).toBe(100)
  })

  it('mixes set and unset weights', () => {
    const phases = [fixturePhase({ id: 'p1', weightPercent: 40 }), fixturePhase({ id: 'p2' })]
    expect(totalWeightPercent(phases)).toBe(40)
  })
})

describe('totalActivityWeightPercent', () => {
  it('returns 0 for a phase with no activities', () => {
    expect(totalActivityWeightPercent(fixturePhase())).toBe(0)
  })

  it('treats an unset weightPercent as 0', () => {
    const phase = fixturePhase({ activities: [fixtureActivity({ id: 'a1' }), fixtureActivity({ id: 'a2' })] })
    expect(totalActivityWeightPercent(phase)).toBe(0)
  })

  it('sums weightPercent across one phase\'s activities', () => {
    const phase = fixturePhase({
      activities: [
        fixtureActivity({ id: 'a1', weightPercent: 60 }),
        fixtureActivity({ id: 'a2', weightPercent: 40 }),
      ],
    })
    expect(totalActivityWeightPercent(phase)).toBe(100)
  })

  it('mixes set and unset weights, and is independent of other phases', () => {
    const phase = fixturePhase({
      activities: [fixtureActivity({ id: 'a1', weightPercent: 30 }), fixtureActivity({ id: 'a2' })],
    })
    expect(totalActivityWeightPercent(phase)).toBe(30)
  })
})

describe('otherActivitiesWeightPercent', () => {
  it('returns 0 for an empty activity list', () => {
    expect(otherActivitiesWeightPercent([])).toBe(0)
  })

  it('sums every activity when no id is excluded', () => {
    const activities = [
      fixtureActivity({ id: 'a1', weightPercent: 60 }),
      fixtureActivity({ id: 'a2', weightPercent: 30 }),
    ]
    expect(otherActivitiesWeightPercent(activities)).toBe(90)
  })

  it('excludes the activity being edited from the sum', () => {
    const activities = [
      fixtureActivity({ id: 'a1', weightPercent: 60 }),
      fixtureActivity({ id: 'a2', weightPercent: 30 }),
    ]
    expect(otherActivitiesWeightPercent(activities, 'a1')).toBe(30)
  })

  it('treats an unset weightPercent as 0', () => {
    const activities = [fixtureActivity({ id: 'a1' }), fixtureActivity({ id: 'a2', weightPercent: 25 })]
    expect(otherActivitiesWeightPercent(activities, 'a2')).toBe(0)
  })
})
