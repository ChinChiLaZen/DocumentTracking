import { create } from 'zustand'

export interface ManagedUser {
  id: number
  email: string
  role: 'admin' | 'member'
  isActive: boolean
  createdAt: string
}

interface UsersState {
  users: ManagedUser[]
  loading: boolean
  error: string | null
  fetchUsers(): Promise<void>
  updateRole(id: number, role: 'admin' | 'member'): Promise<{ error?: string }>
  setActive(id: number, isActive: boolean): Promise<{ error?: string }>
}

async function parseJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return await res.json()
  } catch {
    return {}
  }
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  loading: false,
  error: null,

  async fetchUsers() {
    set({ loading: true, error: null })
    const res = await fetch('/api/auth/users')
    const data = await parseJson(res)
    if (!res.ok) {
      set({ loading: false, error: (data.error as string) ?? 'Failed to load users' })
      return
    }
    set({ loading: false, users: (data.users as ManagedUser[]) ?? [] })
  },

  async updateRole(id, role) {
    const res = await fetch(`/api/auth/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    const data = await parseJson(res)
    if (!res.ok) return { error: (data.error as string) ?? 'Failed to update role' }
    const updated = data.user as ManagedUser
    set({ users: get().users.map((u) => (u.id === id ? updated : u)) })
    return {}
  },

  async setActive(id, isActive) {
    const res = await fetch(`/api/auth/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    })
    const data = await parseJson(res)
    if (!res.ok) return { error: (data.error as string) ?? 'Failed to update status' }
    const updated = data.user as ManagedUser
    set({ users: get().users.map((u) => (u.id === id ? updated : u)) })
    return {}
  },
}))
