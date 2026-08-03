import type { DetailSheet, HistoryEntry, Item, ProjectMeta, Status } from '../data/types'
import { effectiveStatus, item3Remark, rollup as deriveRollup, type Rollup } from '../domain/derive'
import { LIFECYCLE_PHASE_DEFS, type LifecyclePhaseDef } from '../domain/rules'

export interface DataSlice {
  items: Item[]
  sheets: DetailSheet[]
}

export interface ItemWithStatus extends Item {
  status: Status
  sheet?: DetailSheet
  /** item.remark, except Item 3 whose remark is always generated (§6.5) — never hand-typed. */
  displayRemark?: string
}

export function selectItemsWithStatus(state: DataSlice): ItemWithStatus[] {
  const sheetByItemNo = new Map(state.sheets.map((s) => [s.itemNo, s]))
  return state.items.map((item) => {
    const sheet = sheetByItemNo.get(item.no)
    const displayRemark = item.no === 3 && sheet ? item3Remark(sheet) : item.remark
    return { ...item, status: effectiveStatus(item, sheet), sheet, displayRemark }
  })
}

export function selectRollup(state: DataSlice): Rollup {
  return deriveRollup(state.items, state.sheets)
}

export function selectSheetById(state: DataSlice, id: string): DetailSheet | undefined {
  return state.sheets.find((s) => s.id === id)
}

export interface ProjectSummary {
  meta: ProjectMeta
  done: number
  total: number
  percent: number
}

/**
 * Per-project summary for the Projects Summary cards. Branches per
 * `templateKind`: AOT/DOA projects have no Group/Priority (§5.2), so
 * `rollup()` (which indexes by Priority) is never called on them — they use
 * the same workflowStatus-based progress as the Phase Progress tab instead.
 * adsb projects never set workflowStatus (their own dedicated checklist page
 * uses `result`/`employerResult` instead), so they get their own branch using
 * `selectAdsbProgress` — `done` = Contractor Pass count, matching every other
 * template's "done" meaning "fully complete," not merely "reviewed."
 */
export function selectAllProjectsSummary(state: {
  projects: Record<string, DataSlice & { meta: ProjectMeta }>
  projectOrder: string[]
}): ProjectSummary[] {
  return state.projectOrder.map((id) => {
    const project = state.projects[id]
    if (project.meta.templateKind === 'adsb') {
      const progress = selectAdsbProgress(project.items, 'contractor')
      const total = progress.total
      const done = progress.pass
      const percent = total === 0 ? 0 : Math.round((done / total) * 100)
      return { meta: project.meta, done, total, percent }
    }
    if (project.meta.templateKind === 'aot' || project.meta.templateKind === 'doa') {
      const progress = selectOverallPhaseProgress(project.items)
      return { meta: project.meta, ...progress }
    }
    const rollup = deriveRollup(project.items, project.sheets)
    const total = rollup.totalItems
    const done = rollup.byStatus.Submitted
    const percent = total === 0 ? 0 : Math.round((done / total) * 100)
    return { meta: project.meta, done, total, percent }
  })
}

export interface AdsbProgress {
  total: number
  pass: number
  fail: number
  na: number
  pending: number
  reviewed: number
}

/**
 * Per-role progress for the ADS-B checklist page. 'contractor' counts over all
 * items by `result` (Pass/Fail/NotApplicable); 'employer' counts over only the
 * `employerIncluded` items by `employerResult` (Accepted/Conditional/Rejected).
 * `reviewed` = pass+fail+na, matching the reference prototype's own "X/Y
 * reviewed" framing (any recorded outcome counts as reviewed, not just Pass).
 */
export function selectAdsbProgress(items: Item[], role: 'contractor' | 'employer'): AdsbProgress {
  const scoped = role === 'employer' ? items.filter((item) => item.employerIncluded) : items
  const total = scoped.length
  let pass = 0
  let fail = 0
  let na = 0
  for (const item of scoped) {
    const value = role === 'employer' ? item.employerResult : item.result
    if (value === 'Pass' || value === 'Accepted') pass++
    else if (value === 'Fail' || value === 'Rejected') fail++
    else if (value === 'NotApplicable' || value === 'Conditional') na++
  }
  const reviewed = pass + fail + na
  return { total, pass, fail, na, pending: total - reviewed, reviewed }
}

export interface DashboardStats {
  projectCount: number
  totalItems: number
  totalDone: number
  percent: number
}

/** Cross-project totals for the post-login landing page's stat row — sums the same
 * {done,total} figures already shown per-project card, never recomputes anything new. */
export function selectDashboardStats(summaries: ProjectSummary[]): DashboardStats {
  const projectCount = summaries.length
  const totalItems = summaries.reduce((sum, s) => sum + s.total, 0)
  const totalDone = summaries.reduce((sum, s) => sum + s.done, 0)
  const percent = totalItems === 0 ? 0 : Math.round((totalDone / totalItems) * 100)
  return { projectCount, totalItems, totalDone, percent }
}

export interface PhaseBucketCounts {
  total: number
  done: number
  percent: number
  inPreparation: number
}

export interface PhaseSummary extends PhaseBucketCounts {
  phase: LifecyclePhaseDef
}

export interface PhaseProgressSummary {
  phases: PhaseSummary[] // exactly LIFECYCLE_PHASE_DEFS.length entries, in order
  unassigned: PhaseBucketCounts // items with phase === undefined — distinct from the real 'Other' phase
}

function summarizePhaseBucket(bucketItems: Item[]): PhaseBucketCounts {
  const total = bucketItems.length
  const done = bucketItems.filter((item) => item.workflowStatus === 'Submitted').length
  const inPreparation = bucketItems.filter(
    (item) => item.workflowStatus === 'Preparing' || item.workflowStatus === 'AwaitingApproval',
  ).length
  return { total, done, percent: total === 0 ? 0 : Math.round((done / total) * 100), inPreparation }
}

/** Per-lifecycle-phase rollup for the Phase Progress tab — done = workflowStatus 'Submitted' only. */
export function selectPhaseSummary(items: Item[]): PhaseProgressSummary {
  const phases = LIFECYCLE_PHASE_DEFS.map((phase) => ({
    phase,
    ...summarizePhaseBucket(items.filter((item) => item.phase === phase.id)),
  }))
  const unassigned = summarizePhaseBucket(items.filter((item) => item.phase === undefined))
  return { phases, unassigned }
}

export interface OverallPhaseProgress {
  total: number
  done: number
  percent: number
}

export function selectOverallPhaseProgress(items: Item[]): OverallPhaseProgress {
  const total = items.length
  const done = items.filter((item) => item.workflowStatus === 'Submitted').length
  return { total, done, percent: total === 0 ? 0 : Math.round((done / total) * 100) }
}

/** Newest-first, for the history dialog's default display order. */
export function selectHistorySorted(history: HistoryEntry[]): HistoryEntry[] {
  return [...history].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

/** Matches an entry's item number, item name, or changedBy email against a free-text query. */
export function filterHistory(entries: HistoryEntry[], items: Item[], query: string): HistoryEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return entries
  const itemByNo = new Map(items.map((item) => [item.no, item]))
  return entries.filter((entry) => {
    const item = itemByNo.get(entry.itemNo)
    return (
      String(entry.itemNo).includes(q) ||
      item?.name.toLowerCase().includes(q) ||
      entry.changedBy.toLowerCase().includes(q)
    )
  })
}
