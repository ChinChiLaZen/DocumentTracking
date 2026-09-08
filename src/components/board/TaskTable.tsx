import { Trash2 } from 'lucide-react'
import type { BoardTask, ScheduleMilestone, TaskDueDateMode, TaskGroup } from '../../data/types'
import { isTaskOverdue, resolveTaskDueDate } from '../../domain/board'
import { TASK_PRIORITY_DEFS, TASK_STATUS_DEFS } from '../../domain/rules'
import { TASK_PRIORITY_BADGE_CLASS, TASK_STATUS_BADGE_CLASS } from '../shared/statusStyles'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { EditableField } from '../shared/EditableField'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function formatDate(date: Date): string {
  return DATE_FORMAT.format(date)
}

interface TaskTableProps {
  group: TaskGroup
  milestones: ScheduleMilestone[]
  canEdit: boolean
  onUpdateTask(taskId: string, patch: Partial<Omit<BoardTask, 'id'>>): void
  onDeleteTask(taskId: string): void
}

export function TaskTable({ group, milestones, canEdit, onUpdateTask, onDeleteTask }: TaskTableProps) {
  if (group.tasks.length === 0) {
    return <p className="text-sm italic text-muted-foreground">No tasks yet.</p>
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-xs text-muted-foreground">
          <th className="py-1">Task Name</th>
          <th className="w-32 py-1">Assignee</th>
          <th className="w-36 py-1">Status</th>
          <th className="w-28 py-1">Priority</th>
          <th className="w-56 py-1">Due Date</th>
          <th className="w-24 py-1">Progress</th>
          {canEdit && <th className="w-8 py-1" />}
        </tr>
      </thead>
      <tbody>
        {group.tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            milestones={milestones}
            canEdit={canEdit}
            onUpdate={(patch) => onUpdateTask(task.id, patch)}
            onDelete={() => onDeleteTask(task.id)}
          />
        ))}
      </tbody>
    </table>
  )
}

function TaskRow({
  task,
  milestones,
  canEdit,
  onUpdate,
  onDelete,
}: {
  task: BoardTask
  milestones: ScheduleMilestone[]
  canEdit: boolean
  onUpdate(patch: Partial<Omit<BoardTask, 'id'>>): void
  onDelete(): void
}) {
  const overdue = isTaskOverdue(task, milestones)

  return (
    <tr className="border-b last:border-0 align-top">
      <td className="py-1.5">
        {canEdit ? (
          <EditableField
            value={task.name}
            onCommit={(name) => onUpdate({ name })}
            ariaLabel={`${task.name || 'Task'} name`}
          />
        ) : (
          task.name
        )}
      </td>
      <td className="py-1.5">
        {canEdit ? (
          <EditableField
            value={task.assignee ?? ''}
            onCommit={(assignee) => onUpdate({ assignee })}
            ariaLabel={`${task.name || 'Task'} assignee`}
            className="h-7 w-28"
          />
        ) : (
          (task.assignee ?? '—')
        )}
      </td>
      <td className="py-1.5">
        {canEdit ? (
          <Select value={task.status} onValueChange={(status) => onUpdate({ status: status as BoardTask['status'] })}>
            <SelectTrigger size="sm" className={TASK_STATUS_BADGE_CLASS[task.status]}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUS_DEFS.map((def) => (
                <SelectItem key={def.id} value={def.id}>
                  {def.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="outline" className={TASK_STATUS_BADGE_CLASS[task.status]}>
            {TASK_STATUS_DEFS.find((d) => d.id === task.status)?.label ?? task.status}
          </Badge>
        )}
      </td>
      <td className="py-1.5">
        {canEdit ? (
          <Select
            value={task.priority}
            onValueChange={(priority) => onUpdate({ priority: priority as BoardTask['priority'] })}
          >
            <SelectTrigger size="sm" className={TASK_PRIORITY_BADGE_CLASS[task.priority]}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITY_DEFS.map((def) => (
                <SelectItem key={def.id} value={def.id}>
                  {def.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="outline" className={TASK_PRIORITY_BADGE_CLASS[task.priority]}>
            {TASK_PRIORITY_DEFS.find((d) => d.id === task.priority)?.label ?? task.priority}
          </Badge>
        )}
      </td>
      <td className="py-1.5">
        {canEdit ? (
          <DueDateEditor task={task} milestones={milestones} onUpdate={onUpdate} />
        ) : (
          <DueDateReadout task={task} milestones={milestones} overdue={overdue} />
        )}
      </td>
      <td className="py-1.5">
        {canEdit ? (
          <Input
            type="number"
            min={0}
            max={100}
            className="h-7 w-16"
            value={task.progressPercent}
            aria-label={`${task.name || 'Task'} progress`}
            onChange={(e) => onUpdate({ progressPercent: Number(e.target.value) || 0 })}
          />
        ) : (
          `${task.progressPercent}%`
        )}
      </td>
      {canEdit && (
        <td className="py-1.5">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Delete ${task.name || 'task'}`}
            onClick={onDelete}
          >
            <Trash2 />
          </Button>
        </td>
      )}
    </tr>
  )
}

function DueDateReadout({
  task,
  milestones,
  overdue,
}: {
  task: BoardTask
  milestones: ScheduleMilestone[]
  overdue: boolean
}) {
  if (task.dueDateMode === 'none') return <span className="text-muted-foreground">—</span>
  const resolved = resolveTaskDueDate(task, milestones)
  if (!resolved) {
    return <span className="text-muted-foreground">— (milestone removed)</span>
  }
  const milestone =
    task.dueDateMode === 'milestone' ? milestones.find((m) => m.id === task.dueMilestoneId) : undefined
  return (
    <div>
      <span className={overdue ? 'font-medium text-rose-600' : undefined}>{formatDate(resolved)}</span>
      {milestone && <p className="text-xs text-muted-foreground">via {milestone.label}</p>}
      {overdue && <p className="text-xs font-medium text-rose-600">Overdue</p>}
    </div>
  )
}

function DueDateEditor({
  task,
  milestones,
  onUpdate,
}: {
  task: BoardTask
  milestones: ScheduleMilestone[]
  onUpdate(patch: Partial<Omit<BoardTask, 'id'>>): void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Select
        value={task.dueDateMode}
        onValueChange={(mode) => onUpdate({ dueDateMode: mode as TaskDueDateMode })}
      >
        <SelectTrigger size="sm" className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          <SelectItem value="fixed">Fixed date</SelectItem>
          <SelectItem value="milestone" disabled={milestones.length === 0}>
            Based on milestone{milestones.length === 0 ? ' (add one first)' : ''}
          </SelectItem>
        </SelectContent>
      </Select>

      {task.dueDateMode === 'fixed' && (
        <Input
          type="date"
          className="h-7 w-36"
          value={task.dueDate ?? ''}
          aria-label={`${task.name || 'Task'} due date`}
          onChange={(e) => onUpdate({ dueDate: e.target.value })}
        />
      )}

      {task.dueDateMode === 'milestone' && (
        <>
          <Select
            value={task.dueMilestoneId ?? ''}
            onValueChange={(dueMilestoneId) => onUpdate({ dueMilestoneId })}
          >
            <SelectTrigger size="sm" className="w-32">
              <SelectValue placeholder="Milestone" />
            </SelectTrigger>
            <SelectContent>
              {milestones.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            className="h-7 w-16"
            value={task.dueOffsetDays ?? 0}
            aria-label={`${task.name || 'Task'} days before/after milestone`}
            onChange={(e) => onUpdate({ dueOffsetDays: Number(e.target.value) || 0 })}
          />
          <span className="text-xs text-muted-foreground">days</span>
        </>
      )}
    </div>
  )
}
