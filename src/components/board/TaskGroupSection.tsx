import { Plus, Trash2 } from 'lucide-react'
import type { BoardTask, ScheduleMilestone, TaskGroup } from '../../data/types'
import { groupProgressPercent } from '../../domain/board'
import { EditableField } from '../shared/EditableField'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { TaskTable } from './TaskTable'

interface TaskGroupSectionProps {
  group: TaskGroup
  milestones: ScheduleMilestone[]
  canEdit: boolean
  onRename(name: string): void
  onDeleteGroup(): void
  onAddTask(): void
  onUpdateTask(taskId: string, patch: Partial<Omit<BoardTask, 'id'>>): void
  onDeleteTask(taskId: string): void
}

export function TaskGroupSection({
  group,
  milestones,
  canEdit,
  onRename,
  onDeleteGroup,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: TaskGroupSectionProps) {
  const progress = groupProgressPercent(group)

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {canEdit ? (
            <EditableField
              value={group.name}
              onCommit={onRename}
              ariaLabel={`Rename ${group.name}`}
              className="h-7 max-w-60 text-sm font-medium"
            />
          ) : (
            <p className="text-sm font-medium">{group.name}</p>
          )}
          <span className="text-xs text-muted-foreground">{group.tasks.length} tasks</span>
        </div>
        {canEdit && (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Delete ${group.name}`}
            onClick={onDeleteGroup}
          >
            <Trash2 />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Progress value={progress} className="max-w-xs" />
        <span className="text-xs text-muted-foreground">{progress}%</span>
      </div>

      <TaskTable
        group={group}
        milestones={milestones}
        canEdit={canEdit}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
      />

      {canEdit && (
        <Button variant="outline" size="sm" onClick={onAddTask}>
          <Plus />
          Add Task
        </Button>
      )}
    </div>
  )
}
