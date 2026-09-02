import { useState } from 'react'
import { Download } from 'lucide-react'
import { useActiveProject } from '../../store/useActiveProject'
import { useAuthStore } from '../../store/useAuthStore'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { GanttChart } from './GanttChart'
import { PhaseFormDialog } from './PhaseFormDialog'
import { MilestoneFormDialog } from './MilestoneFormDialog'
import { exportProjectSchedule } from '../../domain/export/scheduleExcelExport'
import type { ScheduleMilestone, SchedulePhase } from '../../data/types'

export function ProjectManagementPage() {
  const {
    meta,
    schedule,
    addSchedulePhase,
    updateSchedulePhase,
    deleteSchedulePhase,
    addScheduleMilestone,
    updateScheduleMilestone,
    deleteScheduleMilestone,
    updateScheduleMeta,
  } = useActiveProject()
  const role = useAuthStore((s) => s.user?.role)
  const canEdit = role === 'admin' || role === 'ProjectManager'

  const [phaseDialogOpen, setPhaseDialogOpen] = useState(false)
  const [editingPhase, setEditingPhase] = useState<SchedulePhase | undefined>(undefined)
  // Bumped on every open so PhaseFormDialog/MilestoneFormDialog remount fresh
  // (their local form state is seeded once from props, not re-synced via an
  // effect) instead of showing a stale draft from a previous open.
  const [phaseDialogSession, setPhaseDialogSession] = useState(0)
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<ScheduleMilestone | undefined>(undefined)
  const [milestoneDialogSession, setMilestoneDialogSession] = useState(0)

  function openAddPhase() {
    setEditingPhase(undefined)
    setPhaseDialogSession((s) => s + 1)
    setPhaseDialogOpen(true)
  }
  function openEditPhase(phase: SchedulePhase) {
    setEditingPhase(phase)
    setPhaseDialogSession((s) => s + 1)
    setPhaseDialogOpen(true)
  }
  function handlePhaseSubmit(input: Omit<SchedulePhase, 'id'>) {
    if (editingPhase) updateSchedulePhase(editingPhase.id, input)
    else addSchedulePhase(input)
  }

  function openAddMilestone() {
    setEditingMilestone(undefined)
    setMilestoneDialogSession((s) => s + 1)
    setMilestoneDialogOpen(true)
  }
  function openEditMilestone(milestone: ScheduleMilestone) {
    setEditingMilestone(milestone)
    setMilestoneDialogSession((s) => s + 1)
    setMilestoneDialogOpen(true)
  }
  function handleMilestoneSubmit(input: Omit<ScheduleMilestone, 'id'>) {
    if (editingMilestone) updateScheduleMilestone(editingMilestone.id, input)
    else addScheduleMilestone(input)
  }

  return (
    <div className="h-full space-y-6 overflow-auto p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Project Management</h1>
          <p className="text-sm text-muted-foreground">
            Delivery phases and milestones, plotted on a timeline.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Label htmlFor="contract-start" className="text-xs text-muted-foreground">
              Contract start date
            </Label>
            <Input
              id="contract-start"
              type="date"
              className="h-7 w-40 text-xs"
              value={schedule.contractStartDate ?? ''}
              disabled={!canEdit}
              onChange={(e) => updateScheduleMeta({ contractStartDate: e.target.value || undefined })}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {meta && (
            <Button variant="outline" onClick={() => void exportProjectSchedule(meta, schedule)}>
              <Download />
              Export to Excel
            </Button>
          )}
          {canEdit && (
            <>
              <Button variant="outline" onClick={openAddMilestone}>
                Add Milestone
              </Button>
              <Button onClick={openAddPhase}>Add Phase</Button>
            </>
          )}
        </div>
      </div>

      <GanttChart
        phases={schedule.phases}
        milestones={schedule.milestones}
        contractStartDate={schedule.contractStartDate}
        canEdit={canEdit}
        onEditPhase={openEditPhase}
        onDeletePhase={deleteSchedulePhase}
        onEditMilestone={openEditMilestone}
        onDeleteMilestone={deleteScheduleMilestone}
      />

      <PhaseFormDialog
        key={`phase-${phaseDialogSession}`}
        open={phaseDialogOpen}
        onOpenChange={setPhaseDialogOpen}
        phase={editingPhase}
        onSubmit={handlePhaseSubmit}
      />
      <MilestoneFormDialog
        key={`milestone-${milestoneDialogSession}`}
        open={milestoneDialogOpen}
        onOpenChange={setMilestoneDialogOpen}
        milestone={editingMilestone}
        onSubmit={handleMilestoneSubmit}
      />
    </div>
  )
}
