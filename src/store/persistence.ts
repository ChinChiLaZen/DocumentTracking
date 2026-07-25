import type { DetailSheet, Item } from '../data/types'

export interface ChecklistState {
  items: Item[]
  sheets: DetailSheet[]
}

export interface PersistencePort {
  load(): ChecklistState | null
  save(state: ChecklistState): void
}

export const STORAGE_KEY = 'airsafe-mar-tracker/v1'

export function createLocalStoragePersistence(debounceMs = 300): PersistencePort {
  let timer: ReturnType<typeof setTimeout> | undefined

  return {
    load(): ChecklistState | null {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return null
        return JSON.parse(raw) as ChecklistState
      } catch {
        return null
      }
    },
    save(state: ChecklistState): void {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      }, debounceMs)
    },
  }
}

/** In-memory adapter for tests — no jsdom localStorage dependency, no debounce timers. */
export function createMemoryPersistence(): PersistencePort {
  let stored: ChecklistState | null = null
  return {
    load: () => stored,
    save: (state) => {
      stored = state
    },
  }
}
