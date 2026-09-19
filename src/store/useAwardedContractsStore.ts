import { create } from 'zustand'
import type { AwardedContractLead } from '../data/types'

export interface AwardedContractsSnapshot {
  leads: AwardedContractLead[]
  keyword: string
  year: number
  subUnit: string | null
  agency: string | null
  updatedBy: string
  updatedAt: string
}

interface AwardedContractsState {
  snapshot: AwardedContractsSnapshot | null
  loading: boolean
  refreshing: boolean
  loaded: boolean
  error: string | null
  fetchSnapshot(): Promise<void>
  refresh(keyword: string, year: number, subUnit?: string, agency?: string): Promise<{ error?: string }>
}

async function parseJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return await res.json()
  } catch {
    return {}
  }
}

/**
 * The Awarded Contracts page's EGP-CONTRACT snapshot, persisted server-side
 * (a single shared row — see api/procurement/leads.ts's `?resource=contracts`
 * branch) so a refresh is visible to every signed-in reviewer. Unlike
 * useProcurementLeadsStore, `refresh` triggers a real live server-side fetch
 * from the EGP-CONTRACT API — no manual paste, since that API has no
 * Cloudflare gate (see CLAUDE.md).
 */
export const useAwardedContractsStore = create<AwardedContractsState>((set) => ({
  snapshot: null,
  loading: false,
  refreshing: false,
  loaded: false,
  error: null,

  async fetchSnapshot() {
    set({ loading: true })
    try {
      const res = await fetch('/api/procurement/leads?resource=contracts')
      const data = await parseJson(res)
      if (!res.ok) {
        set({ loading: false, loaded: true })
        return
      }
      set({ loading: false, loaded: true, snapshot: (data.snapshot as AwardedContractsSnapshot) ?? null })
    } catch {
      set({ loading: false, loaded: true })
    }
  },

  async refresh(keyword, year, subUnit, agency) {
    set({ refreshing: true, error: null })
    try {
      const res = await fetch('/api/procurement/leads?resource=contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, year, subUnit, agency }),
      })
      const data = await parseJson(res)
      if (!res.ok) {
        const error = (data.error as string) ?? 'Failed to refresh from EGP-CONTRACT'
        set({ refreshing: false, error })
        return { error }
      }
      set({ refreshing: false, snapshot: data.snapshot as AwardedContractsSnapshot })
      return {}
    } catch {
      const error = 'Failed to refresh — check your connection and try again'
      set({ refreshing: false, error })
      return { error }
    }
  },
}))
