import { useParams } from 'react-router-dom'
import type {
  CheckRow,
  DetailSheet,
  HistoryEntry,
  Item,
  LifecyclePhase,
  ProjectMeta,
  ProjectSchedule,
  ScheduleMilestone,
  SchedulePhase,
  Status,
  WorkflowStatus,
} from '../data/types'
import type { ItemMetaPatch } from './useTrackerStore'
import { useTrackerStore } from './useTrackerStore'

export interface ActiveProject {
  projectId: string
  notFound: boolean
  meta: ProjectMeta | undefined
  items: Item[]
  sheets: DetailSheet[]
  selectedRowIds: Record<string, Set<string>>
  history: HistoryEntry[]
  schedule: ProjectSchedule
  basePath: string
  toggleCell(sheetId: string, rowId: string, columnKey: string): void
  setRowRemark(sheetId: string, rowId: string, remark: string): void
  updateRowText(
    sheetId: string,
    rowId: string,
    patch: Partial<Pick<CheckRow, 'description' | 'article' | 'section'>>,
  ): void
  updateColumnLabel(sheetId: string, columnKey: string, label: string): void
  updateSheetHeader(sheetId: string, patch: Partial<Pick<DetailSheet, 'title' | 'applicable'>>): void
  setManualStatus(itemNo: number, status: Status | undefined): void
  toggleRowSelection(sheetId: string, rowId: string): void
  selectAllRows(sheetId: string, on: boolean): void
  bulkSetCells(sheetId: string, value: boolean, scope: 'selected' | 'all'): void
  bulkToggleCells(sheetId: string, scope: 'selected' | 'all'): void
  resetToSeed(): void
  setWorkflowStatus(itemNo: number, status: WorkflowStatus | undefined, changedBy: string): void
  setPhase(itemNo: number, phase: LifecyclePhase | undefined, changedBy: string): void
  updateItemMeta(itemNo: number, patch: ItemMetaPatch, changedBy: string): void
  addSchedulePhase(input: Omit<SchedulePhase, 'id'>): void
  updateSchedulePhase(phaseId: string, patch: Partial<Omit<SchedulePhase, 'id'>>): void
  deleteSchedulePhase(phaseId: string): void
  addScheduleMilestone(input: Omit<ScheduleMilestone, 'id'>): void
  updateScheduleMilestone(milestoneId: string, patch: Partial<Omit<ScheduleMilestone, 'id'>>): void
  deleteScheduleMilestone(milestoneId: string): void
  updateScheduleMeta(patch: Partial<Pick<ProjectSchedule, 'contractStartDate'>>): void
}

/**
 * Resolves the project named by the `:projectId` route param and pre-curries
 * every store action with it, so pages read/write their project's data
 * without threading projectId through each call site.
 */
export function useActiveProject(): ActiveProject {
  const { projectId = '' } = useParams<{ projectId: string }>()
  const project = useTrackerStore((s) => s.projects[projectId])
  const toggleCellAction = useTrackerStore((s) => s.toggleCell)
  const setRowRemarkAction = useTrackerStore((s) => s.setRowRemark)
  const updateRowTextAction = useTrackerStore((s) => s.updateRowText)
  const updateColumnLabelAction = useTrackerStore((s) => s.updateColumnLabel)
  const updateSheetHeaderAction = useTrackerStore((s) => s.updateSheetHeader)
  const setManualStatusAction = useTrackerStore((s) => s.setManualStatus)
  const toggleRowSelectionAction = useTrackerStore((s) => s.toggleRowSelection)
  const selectAllRowsAction = useTrackerStore((s) => s.selectAllRows)
  const bulkSetCellsAction = useTrackerStore((s) => s.bulkSetCells)
  const bulkToggleCellsAction = useTrackerStore((s) => s.bulkToggleCells)
  const resetToSeedAction = useTrackerStore((s) => s.resetToSeed)
  const setWorkflowStatusAction = useTrackerStore((s) => s.setWorkflowStatus)
  const setPhaseAction = useTrackerStore((s) => s.setPhase)
  const updateItemMetaAction = useTrackerStore((s) => s.updateItemMeta)
  const addSchedulePhaseAction = useTrackerStore((s) => s.addSchedulePhase)
  const updateSchedulePhaseAction = useTrackerStore((s) => s.updateSchedulePhase)
  const deleteSchedulePhaseAction = useTrackerStore((s) => s.deleteSchedulePhase)
  const addScheduleMilestoneAction = useTrackerStore((s) => s.addScheduleMilestone)
  const updateScheduleMilestoneAction = useTrackerStore((s) => s.updateScheduleMilestone)
  const deleteScheduleMilestoneAction = useTrackerStore((s) => s.deleteScheduleMilestone)
  const updateScheduleMetaAction = useTrackerStore((s) => s.updateScheduleMeta)

  const basePath = `/projects/${projectId}`

  return {
    projectId,
    notFound: !project,
    meta: project?.meta,
    items: project?.items ?? [],
    sheets: project?.sheets ?? [],
    selectedRowIds: project?.selectedRowIds ?? {},
    history: project?.history ?? [],
    schedule: project?.schedule ?? { phases: [], milestones: [] },
    basePath,
    toggleCell: (sheetId, rowId, columnKey) => toggleCellAction(projectId, sheetId, rowId, columnKey),
    setRowRemark: (sheetId, rowId, remark) => setRowRemarkAction(projectId, sheetId, rowId, remark),
    updateRowText: (sheetId, rowId, patch) => updateRowTextAction(projectId, sheetId, rowId, patch),
    updateColumnLabel: (sheetId, columnKey, label) =>
      updateColumnLabelAction(projectId, sheetId, columnKey, label),
    updateSheetHeader: (sheetId, patch) => updateSheetHeaderAction(projectId, sheetId, patch),
    setManualStatus: (itemNo, status) => setManualStatusAction(projectId, itemNo, status),
    toggleRowSelection: (sheetId, rowId) => toggleRowSelectionAction(projectId, sheetId, rowId),
    selectAllRows: (sheetId, on) => selectAllRowsAction(projectId, sheetId, on),
    bulkSetCells: (sheetId, value, scope) => bulkSetCellsAction(projectId, sheetId, value, scope),
    bulkToggleCells: (sheetId, scope) => bulkToggleCellsAction(projectId, sheetId, scope),
    resetToSeed: () => resetToSeedAction(projectId),
    setWorkflowStatus: (itemNo, status, changedBy) =>
      setWorkflowStatusAction(projectId, itemNo, status, changedBy),
    setPhase: (itemNo, phase, changedBy) => setPhaseAction(projectId, itemNo, phase, changedBy),
    updateItemMeta: (itemNo, patch, changedBy) =>
      updateItemMetaAction(projectId, itemNo, patch, changedBy),
    addSchedulePhase: (input) => addSchedulePhaseAction(projectId, input),
    updateSchedulePhase: (phaseId, patch) => updateSchedulePhaseAction(projectId, phaseId, patch),
    deleteSchedulePhase: (phaseId) => deleteSchedulePhaseAction(projectId, phaseId),
    addScheduleMilestone: (input) => addScheduleMilestoneAction(projectId, input),
    updateScheduleMilestone: (milestoneId, patch) =>
      updateScheduleMilestoneAction(projectId, milestoneId, patch),
    deleteScheduleMilestone: (milestoneId) => deleteScheduleMilestoneAction(projectId, milestoneId),
    updateScheduleMeta: (patch) => updateScheduleMetaAction(projectId, patch),
  }
}
