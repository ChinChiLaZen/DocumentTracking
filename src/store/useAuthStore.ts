import { create } from 'zustand'

interface AuthUser {
  email: string
}

interface AuthResult {
  error?: string
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  initialized: boolean
  init(): void
  signIn(email: string, password: string): Promise<AuthResult>
  signUp(email: string, password: string, inviteCode: string): Promise<AuthResult>
  signOut(): Promise<void>
}

async function parseJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return await res.json()
  } catch {
    return {}
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  init() {
    if (get().initialized) return
    set({ initialized: true })
    fetch('/api/auth/session')
      .then((res): Promise<Record<string, unknown>> => (res.ok ? parseJson(res) : Promise.resolve({})))
      .then((data) => set({ user: (data.user as AuthUser | undefined) ?? null, loading: false }))
      .catch(() => set({ loading: false }))
  },

  async signIn(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await parseJson(res)
    if (!res.ok) return { error: (data.error as string) ?? 'Sign in failed' }
    set({ user: { email: data.email as string } })
    return {}
  },

  async signUp(email, password, inviteCode) {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, inviteCode }),
    })
    const data = await parseJson(res)
    if (!res.ok) return { error: (data.error as string) ?? 'Sign up failed' }
    set({ user: { email: data.email as string } })
    return {}
  },

  async signOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    set({ user: null })
  },
}))
