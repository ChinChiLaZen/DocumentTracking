import { describe, expect, it } from 'vitest'
import type { ScheduleMilestone, SchedulePhase } from '../data/types'
import { computeDateRange, datePercent, durationDays, monthTicks, phaseBarStyle } from './schedule'

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

describe('monthTicks', () => {
  it('produces one tick per calendar month, including partial edge months', () => {
    // Range spans Jan 15 - Mar 15, i.e. partial Jan and Mar plus full Feb.
    const range = { start: new Date('2026-01-15T00:00:00'), end: new Date('2026-03-15T00:00:00') }
    const ticks = monthTicks(range)
    expect(ticks.map((t) => t.label)).toEqual(['Jan 2026', 'Feb 2026', 'Mar 2026'])
  })
})

describe('durationDays', () => {
  it('counts a same-day phase as 1 day', () => {
    expect(durationDays(fixturePhase({ startDate: '2026-01-01', endDate: '2026-01-01' }))).toBe(1)
  })

  it('counts inclusively across multiple days', () => {
    expect(durationDays(fixturePhase({ startDate: '2026-01-01', endDate: '2026-01-31' }))).toBe(31)
  })
})
