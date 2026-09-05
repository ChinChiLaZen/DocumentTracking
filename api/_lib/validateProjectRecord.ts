// Mirrors src/data/types.ts's ProjectRecord — kept as a local, loosely-typed
// shape (not imported) since api/ and src/ are separate TS project references
// (see tsconfig.api.json) with no cross-project imports. Deliberately shallow:
// checks the envelope, not every Item/CheckRow field, since a full mirror of
// types.ts can't live here — same posture already accepted for isValidLead in
// api/procurement/leads.ts.
export interface ProjectRecordInput {
  meta: {
    id: string
    title: string
    vendor: string
    scope: string
    preparedDate: string
    [key: string]: unknown
  }
  items: unknown[]
  sheets: unknown[]
  history?: unknown[]
  schedule?: unknown
  boq?: unknown
}

export function isValidProjectRecord(value: unknown): value is ProjectRecordInput {
  if (typeof value !== 'object' || value === null) return false
  const record = value as {
    meta?: unknown
    items?: unknown
    sheets?: unknown
    history?: unknown
    schedule?: unknown
    boq?: unknown
  }

  if (typeof record.meta !== 'object' || record.meta === null) return false
  const meta = record.meta as Record<string, unknown>
  const requiredStringFields = ['id', 'title', 'vendor', 'scope', 'preparedDate']
  for (const field of requiredStringFields) {
    if (typeof meta[field] !== 'string' || (meta[field] as string).trim() === '') return false
  }

  if (!Array.isArray(record.items)) return false
  if (!Array.isArray(record.sheets)) return false
  if (record.history !== undefined && !Array.isArray(record.history)) return false

  if (record.schedule !== undefined) {
    if (typeof record.schedule !== 'object' || record.schedule === null) return false
    const schedule = record.schedule as Record<string, unknown>
    if (schedule.phases !== undefined && !Array.isArray(schedule.phases)) return false
    if (schedule.milestones !== undefined && !Array.isArray(schedule.milestones)) return false
    if (Array.isArray(schedule.phases)) {
      for (const phase of schedule.phases as Record<string, unknown>[]) {
        if (phase.activities !== undefined && !Array.isArray(phase.activities)) return false
      }
    }
  }

  if (record.boq !== undefined) {
    if (typeof record.boq !== 'object' || record.boq === null) return false
    const boq = record.boq as Record<string, unknown>
    if (boq.categories !== undefined && !Array.isArray(boq.categories)) return false
    if (Array.isArray(boq.categories)) {
      for (const category of boq.categories as Record<string, unknown>[]) {
        if (category.lines !== undefined && !Array.isArray(category.lines)) return false
      }
    }
  }

  return true
}
