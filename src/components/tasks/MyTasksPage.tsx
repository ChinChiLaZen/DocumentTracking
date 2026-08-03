import { useEffect, useState, type FormEvent } from 'react'
import { useTasksStore, type Task, type TaskStatus } from '../../store/useTasksStore'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'ToDo', label: 'To Do' },
  { status: 'InProgress', label: 'In Progress' },
  { status: 'AwaitingReview', label: 'Awaiting Review' },
  { status: 'Done', label: 'Done' },
]

function TaskCard({ task }: { task: Task }) {
  const setStatus = useTasksStore((s) => s.setStatus)
  const removeTask = useTasksStore((s) => s.removeTask)

  return (
    <Card>
      <CardContent className="space-y-2 py-3">
        <p className="text-sm">{task.title}</p>
        <div className="flex items-center gap-2">
          <Select value={task.status} onValueChange={(value) => setStatus(task.id, value as TaskStatus)}>
            <SelectTrigger size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLUMNS.map((c) => (
                <SelectItem key={c.status} value={c.status}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => removeTask(task.id)}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function MyTasksPage() {
  const { tasks, loading, error, fetchTasks, addTask } = useTasksStore()
  const [title, setTitle] = useState('')

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    addTask(title.trim())
    setTitle('')
  }

  return (
    <div className="h-full overflow-auto p-6">
      <h1 className="text-lg font-semibold">My Tasks</h1>
      <p className="mb-6 text-sm text-muted-foreground">Manage your own personal to-do list.</p>

      <form onSubmit={handleAdd} className="mb-6 flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
          className="max-w-sm"
        />
        <Button type="submit">Add</Button>
      </form>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((column) => (
            <div key={column.status}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-sm">
                    {column.label}
                    <span className="text-muted-foreground">
                      {tasks.filter((t) => t.status === column.status).length}
                    </span>
                  </CardTitle>
                </CardHeader>
              </Card>
              <div className="mt-2 space-y-2">
                {tasks
                  .filter((t) => t.status === column.status)
                  .map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
