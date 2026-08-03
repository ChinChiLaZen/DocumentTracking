import { create } from 'zustand'

export type TaskStatus = 'ToDo' | 'InProgress' | 'AwaitingReview' | 'Done'

export interface Task {
  id: number
  title: string
  status: TaskStatus
  createdAt: string
}

interface TasksState {
  tasks: Task[]
  loading: boolean
  error: string | null
  fetchTasks(): Promise<void>
  addTask(title: string): Promise<{ error?: string }>
  setStatus(id: number, status: TaskStatus): Promise<{ error?: string }>
  removeTask(id: number): Promise<{ error?: string }>
}

async function parseJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return await res.json()
  } catch {
    return {}
  }
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  async fetchTasks() {
    set({ loading: true, error: null })
    const res = await fetch('/api/tasks')
    const data = await parseJson(res)
    if (!res.ok) {
      set({ loading: false, error: (data.error as string) ?? 'Failed to load tasks' })
      return
    }
    set({ loading: false, tasks: (data.tasks as Task[]) ?? [] })
  },

  async addTask(title) {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    const data = await parseJson(res)
    if (!res.ok) return { error: (data.error as string) ?? 'Failed to add task' }
    set({ tasks: [...get().tasks, data.task as Task] })
    return {}
  },

  async setStatus(id, status) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await parseJson(res)
    if (!res.ok) return { error: (data.error as string) ?? 'Failed to update task' }
    const updated = data.task as Task
    set({ tasks: get().tasks.map((t) => (t.id === id ? updated : t)) })
    return {}
  },

  async removeTask(id) {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    const data = await parseJson(res)
    if (!res.ok) return { error: (data.error as string) ?? 'Failed to delete task' }
    set({ tasks: get().tasks.filter((t) => t.id !== id) })
    return {}
  },
}))
