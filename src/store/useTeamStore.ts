import { create } from 'zustand'

export interface TeamMember {
  id: number
  email: string
  counts: {
    toDo: number
    inProgress: number
    awaitingReview: number
    done: number
  }
}

interface TeamState {
  team: TeamMember[]
  loading: boolean
  error: string | null
  fetchTeam(): Promise<void>
}

async function parseJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return await res.json()
  } catch {
    return {}
  }
}

export const useTeamStore = create<TeamState>((set) => ({
  team: [],
  loading: false,
  error: null,

  async fetchTeam() {
    set({ loading: true, error: null })
    const res = await fetch('/api/auth/team')
    const data = await parseJson(res)
    if (!res.ok) {
      set({ loading: false, error: (data.error as string) ?? 'Failed to load team' })
      return
    }
    set({ loading: false, team: (data.team as TeamMember[]) ?? [] })
  },
}))
