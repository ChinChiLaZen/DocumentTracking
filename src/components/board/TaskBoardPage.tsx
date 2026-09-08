import { Plus } from 'lucide-react'
import { useActiveProject } from '../../store/useActiveProject'
import { useAuthStore } from '../../store/useAuthStore'
import { computeBoardStats, statusBreakdown } from '../../domain/board'
import { TASK_STATUS_DEFS } from '../../domain/rules'
import { TASK_STATUS_BADGE_CLASS } from '../shared/statusStyles'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { BoardStatCards } from './BoardStatCards'
import { TaskGroupSection } from './TaskGroupSection'

export function TaskBoardPage() {
  const {
    taskBoard,
    schedule,
    addTaskGroup,
    updateTaskGroup,
    deleteTaskGroup,
    addBoardTask,
    updateBoardTask,
    deleteBoardTask,
  } = useActiveProject()
  const role = useAuthStore((s) => s.user?.role)
  const canEdit = role === 'admin' || role === 'ProjectManager'

  const stats = computeBoardStats(taskBoard, schedule.milestones)
  const breakdown = statusBreakdown(taskBoard)

  return (
    <div className="h-full space-y-6 overflow-auto p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Task Board</h1>
          <p className="text-sm text-muted-foreground">
            Free-form delivery tasks grouped into phases, independent of the checklist register.
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => addTaskGroup({ name: `Group ${taskBoard.groups.length + 1}` })}>
            <Plus />
            Add Group
          </Button>
        )}
      </div>

      <BoardStatCards stats={stats} />

      <div className="flex flex-wrap gap-2">
        {TASK_STATUS_DEFS.map((def) => (
          <Badge key={def.id} variant="outline" className={TASK_STATUS_BADGE_CLASS[def.id]}>
            {def.label}: {breakdown[def.id]}
          </Badge>
        ))}
      </div>

      {taskBoard.groups.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">
          No groups yet.{canEdit ? ' Add a group to start building the task board.' : ''}
        </p>
      ) : (
        <div className="space-y-4">
          {taskBoard.groups.map((group) => (
            <TaskGroupSection
              key={group.id}
              group={group}
              milestones={schedule.milestones}
              canEdit={canEdit}
              onRename={(name) => updateTaskGroup(group.id, { name })}
              onDeleteGroup={() => deleteTaskGroup(group.id)}
              onAddTask={() =>
                addBoardTask(group.id, {
                  name: '',
                  status: 'NotStarted',
                  priority: 'Medium',
                  progressPercent: 0,
                  dueDateMode: 'none',
                })
              }
              onUpdateTask={(taskId, patch) => updateBoardTask(group.id, taskId, patch)}
              onDeleteTask={(taskId) => deleteBoardTask(group.id, taskId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
