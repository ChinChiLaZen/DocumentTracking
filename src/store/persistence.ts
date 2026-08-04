import type { ProjectRecord } from '../data/types'

export interface ChecklistState {
  projects: ProjectRecord[]
  projectOrder: string[]
}

export interface PersistencePort {
  load(): Promise<ChecklistState | null>
  /** Fire-and-forget, debounced per project id — mirrors the old debounced
   *  localStorage write, just scoped to one project instead of everything. */
  saveProject(record: ProjectRecord): void
  /** Awaited, not debounced — the caller needs to know whether it actually
   *  succeeded (e.g. to roll back an optimistic local removal on failure). */
  deleteProject(projectId: string): Promise<{ error?: string }>
}

async function parseJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return await res.json()
  } catch {
    return {}
  }
}

/**
 * Production adapter — persists via api/projects/*, shared across every
 * signed-in user (Postgres-backed). Replaces the old localStorage adapter;
 * see CLAUDE.md §10 for why project data moved off per-browser storage.
 */
export function createApiPersistence(debounceMs = 600): PersistencePort {
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  async function putProject(record: ProjectRecord): Promise<void> {
    try {
      await fetch(`/api/projects/${encodeURIComponent(record.meta.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record }),
      })
    } catch {
      // Best-effort background sync — a later edit to the same project will
      // retry via its own debounced write. See CLAUDE.md §10's accepted-risk
      // note on this for the "user never touches this project again" case.
    }
  }

  return {
    async load() {
      try {
        const res = await fetch('/api/projects')
        if (!res.ok) return null
        const data = await parseJson(res)
        let projects = (data.projects as ProjectRecord[] | undefined) ?? []
        if (projects.length === 0) {
          projects = await seedFromDefaults()
        }
        return { projects, projectOrder: projects.map((p) => p.meta.id) }
      } catch {
        return null
      }
    },

    saveProject(record) {
      const id = record.meta.id
      const existing = timers.get(id)
      if (existing) clearTimeout(existing)
      timers.set(
        id,
        setTimeout(() => {
          timers.delete(id)
          void putProject(record)
        }, debounceMs),
      )
    },

    async deleteProject(projectId) {
      const existing = timers.get(projectId)
      if (existing) {
        clearTimeout(existing)
        timers.delete(projectId)
      }
      try {
        const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, { method: 'DELETE' })
        if (!res.ok) {
          const data = await parseJson(res)
          return { error: (data.error as string) ?? 'Failed to delete project' }
        }
        return {}
      } catch {
        return { error: 'Failed to delete project — check your connection and try again' }
      }
    },
  }
}

/** Bootstraps the shared table from the client's own seed data — only ever
 *  called when the server reports an empty project list. The server can't
 *  do this itself (api/ can't import src/data/*, see validateProjectRecord.ts
 *  on the server side), so this must be client-initiated. */
async function seedFromDefaults(): Promise<ProjectRecord[]> {
  const { INITIAL_PROJECTS } = await import('../data/initialProjects')
  try {
    const res = await fetch('/api/projects/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: INITIAL_PROJECTS }),
    })
    if (!res.ok) return []
    const data = await parseJson(res)
    return (data.projects as ProjectRecord[] | undefined) ?? []
  } catch {
    return []
  }
}

/** In-memory adapter for tests — no jsdom localStorage/fetch dependency, no
 *  debounce timers. `load()` returns null until something's been saved (same
 *  as the old localStorage adapter returning null on an empty key), so a
 *  store under test that never calls saveProject/deleteProject and then
 *  hydrates keeps its already-initialized INITIAL_PROJECTS state instead of
 *  being wiped to empty. */
export function createMemoryPersistence(): PersistencePort {
  let stored: ChecklistState | null = null

  function ensureStored(): ChecklistState {
    if (!stored) stored = { projects: [], projectOrder: [] }
    return stored
  }

  return {
    async load() {
      return stored
    },
    saveProject(record) {
      const state = ensureStored()
      const idx = state.projects.findIndex((p) => p.meta.id === record.meta.id)
      if (idx >= 0) {
        stored = { ...state, projects: state.projects.map((p, i) => (i === idx ? record : p)) }
      } else {
        stored = {
          projects: [...state.projects, record],
          projectOrder: [...state.projectOrder, record.meta.id],
        }
      }
    },
    async deleteProject(projectId) {
      const state = ensureStored()
      stored = {
        projects: state.projects.filter((p) => p.meta.id !== projectId),
        projectOrder: state.projectOrder.filter((id) => id !== projectId),
      }
      return {}
    },
  }
}
