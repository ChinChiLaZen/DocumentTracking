import { create } from 'zustand'
import type { Role } from './useAuthStore'

export const ROLES: Role[] = ['admin', 'member', 'TeamLeader', 'ProjectManager', 'ProjectDirector']

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  member: 'Team member',
  TeamLeader: 'Team Leader',
  ProjectManager: 'Project Manager',
  ProjectDirector: 'Project Director',
}

export interface ManagedUser {
  id: number
  email: string
  role: Role
  isActive: boolean
  createdAt: string
}

interface UsersState {
  users: ManagedUser[]
  loading: boolean
  error: string | null
  fetchUsers(): Promise<void>
  createUser(email: string, password: string, role: Role): Promise<{ error?: string }>
  updateRole(id: number, role: Role): Promise<{ error?: string }>
  updateEmail(id: number, email: string): Promise<{ error?: string }>
  setActive(id: number, isActive: boolean): Promise<{ error?: string }>
  deleteUser(id: number): Promise<{ error?: string }>
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

  async createUser(email, password, role) {
    const res = await fetch('/api/auth/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    })
    const data = await parseJson(res)
    if (!res.ok) return { error: (data.error as string) ?? 'Failed to create user' }
    const created = data.user as ManagedUser
    set({ users: [...get().users, created] })
    return {}
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

  async updateEmail(id, email) {
    const res = await fetch(`/api/auth/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await parseJson(res)
    if (!res.ok) return { error: (data.error as string) ?? 'Failed to update email' }
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

  async deleteUser(id) {
    const res = await fetch(`/api/auth/users/${id}`, { method: 'DELETE' })
    const data = await parseJson(res)
    if (!res.ok) return { error: (data.error as string) ?? 'Failed to delete user' }
    set({ users: get().users.filter((u) => u.id !== id) })
    return {}
  },
}))
