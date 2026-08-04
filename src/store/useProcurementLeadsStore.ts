import { create } from 'zustand'
import type { ProcurementLead } from '../data/types'

export interface ProcurementLeadsSnapshot {
  leads: ProcurementLead[]
  capturedDate: string
  updatedBy: string
  updatedAt: string
}

interface ProcurementLeadsState {
  snapshot: ProcurementLeadsSnapshot | null
  loading: boolean
  saving: boolean
  loaded: boolean
  error: string | null
  fetchSnapshot(): Promise<void>
  saveSnapshot(leads: ProcurementLead[], capturedDate: string): Promise<{ error?: string }>
  resetSnapshot(): Promise<{ error?: string }>
}

async function parseJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return await res.json()
  } catch {
    return {}
  }
}

/**
 * The Find Projects page's e-GP snapshot, persisted server-side (a single
 * shared row — see api/procurement/leads.ts) so a paste-refresh is visible to
 * every signed-in reviewer, not just the browser that pasted it. Falls back
 * to the built-in static PROCUREMENT_LEADS (in the page component) whenever
 * `snapshot` is null — no row saved yet, or the fetch failed (e.g. plain
 * `npm run dev` without the /api backend running).
 */
export const useProcurementLeadsStore = create<ProcurementLeadsState>((set) => ({
  snapshot: null,
  loading: false,
  saving: false,
  loaded: false,
  error: null,

  async fetchSnapshot() {
    set({ loading: true })
    try {
      const res = await fetch('/api/procurement/leads')
      const data = await parseJson(res)
      if (!res.ok) {
        set({ loading: false, loaded: true })
        return
      }
      set({ loading: false, loaded: true, snapshot: (data.snapshot as ProcurementLeadsSnapshot) ?? null })
    } catch {
      set({ loading: false, loaded: true })
    }
  },

  async saveSnapshot(leads, capturedDate) {
    set({ saving: true, error: null })
    try {
      const res = await fetch('/api/procurement/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads, capturedDate }),
      })
      const data = await parseJson(res)
      if (!res.ok) {
        const error = (data.error as string) ?? 'Failed to save snapshot'
        set({ saving: false, error })
        return { error }
      }
      set({ saving: false, snapshot: data.snapshot as ProcurementLeadsSnapshot })
      return {}
    } catch {
      const error = 'Failed to save snapshot — check your connection and try again'
      set({ saving: false, error })
      return { error }
    }
  },

  async resetSnapshot() {
    set({ saving: true, error: null })
    try {
      const res = await fetch('/api/procurement/leads', { method: 'DELETE' })
      const data = await parseJson(res)
      if (!res.ok) {
        const error = (data.error as string) ?? 'Failed to reset snapshot'
        set({ saving: false, error })
        return { error }
      }
      set({ saving: false, snapshot: null })
      return {}
    } catch {
      const error = 'Failed to reset snapshot — check your connection and try again'
      set({ saving: false, error })
      return { error }
    }
  },
}))
