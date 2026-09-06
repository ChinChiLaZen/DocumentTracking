import { create } from 'zustand'
import type { TemplateDefinition } from '../data/types'
import { cloneItems, cloneSheets } from '../domain/cloneChecklist'
import { BUILTIN_TEMPLATE_DEFS, mergeTemplates } from '../domain/templateRegistry'
import type { PersistencePort } from './persistence'
import { createApiPersistence } from './persistence'

export interface TemplateState {
  overrides: TemplateDefinition[]
  templates: TemplateDefinition[] // = mergeTemplates(overrides) — always includes all 4 built-ins
  hydrated: boolean
  hydrating: boolean
  hydrate(): Promise<void>
  createTemplate(def: Omit<TemplateDefinition, 'id' | 'isBuiltin'>): Promise<{ id?: string; error?: string }>
  updateTemplate(id: string, def: TemplateDefinition): Promise<{ error?: string }>
  deleteTemplate(id: string): Promise<{ error?: string }>
  duplicateTemplate(id: string): Promise<{ id?: string; error?: string }>
}

function generateTemplateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `custom-${crypto.randomUUID()}`
  }
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function createTemplateStore(persistence: PersistencePort = createApiPersistence()) {
  return create<TemplateState>()((set, get) => ({
    overrides: [],
    templates: mergeTemplates([]),
    hydrated: false,
    hydrating: false,

    async hydrate() {
      if (get().hydrating || get().hydrated) return
      set({ hydrating: true })
      const overrides = await persistence.loadTemplateOverrides()
      set({ overrides, templates: mergeTemplates(overrides), hydrated: true, hydrating: false })
    },

    // Optimistic-local-first, same posture as useTrackerStore's deleteProject
    // (CLAUDE.md §10): update local state immediately, fire the persistence
    // call, and roll back only if it actually fails — so a slow/flaky network
    // doesn't make the editor feel unresponsive, but a real failure is still
    // surfaced rather than silently lost.
    async createTemplate(def) {
      const id = generateTemplateId()
      const full: TemplateDefinition = { ...def, id, isBuiltin: false }
      set((state) => {
        const overrides = [...state.overrides, full]
        return { overrides, templates: mergeTemplates(overrides) }
      })
      const { error } = await persistence.saveTemplate(full)
      if (error) {
        set((state) => {
          const overrides = state.overrides.filter((t) => t.id !== id)
          return { overrides, templates: mergeTemplates(overrides) }
        })
        return { error }
      }
      return { id }
    },

    async updateTemplate(id, def) {
      const previous = get().overrides.find((t) => t.id === id)
      const full: TemplateDefinition = { ...def, id }
      set((state) => {
        const idx = state.overrides.findIndex((t) => t.id === id)
        const overrides = idx >= 0 ? state.overrides.map((t, i) => (i === idx ? full : t)) : [...state.overrides, full]
        return { overrides, templates: mergeTemplates(overrides) }
      })
      const { error } = await persistence.saveTemplate(full)
      if (error) {
        set((state) => {
          const overrides = previous
            ? state.overrides.map((t) => (t.id === id ? previous : t))
            : state.overrides.filter((t) => t.id !== id)
          return { overrides, templates: mergeTemplates(overrides) }
        })
        return { error }
      }
      return {}
    },

    async deleteTemplate(id) {
      const previous = get().overrides.find((t) => t.id === id)
      set((state) => {
        const overrides = state.overrides.filter((t) => t.id !== id)
        return { overrides, templates: mergeTemplates(overrides) }
      })
      const { error } = await persistence.deleteTemplateOverride(id)
      if (error) {
        set((state) => {
          const overrides = previous ? [...state.overrides, previous] : state.overrides
          return { overrides, templates: mergeTemplates(overrides) }
        })
        return { error }
      }
      return {}
    },

    async duplicateTemplate(id) {
      const source = get().templates.find((t) => t.id === id)
      if (!source) return { error: 'Template not found' }
      // Passing `source` directly (rather than destructuring off id/isBuiltin)
      // is fine — it's a variable, not an object literal, so TS's excess-
      // property check doesn't apply, and createTemplate only reads the
      // Omit<...,'id'|'isBuiltin'> fields it declares.
      return get().createTemplate({
        ...source,
        label: `${source.label} (Copy)`,
        groups: source.groups.map((g) => ({ ...g })),
        priorities: source.priorities.map((p) => ({ ...p })),
        criticalNotice: source.criticalNotice ? { ...source.criticalNotice, lines: [...source.criticalNotice.lines] } : undefined,
        items: cloneItems(source.items),
        sheets: cloneSheets(source.sheets),
      })
    },
  }))
}

export const useTemplateStore = createTemplateStore()

// Re-exported for convenience so callers don't need a separate import just to
// read the shipped defaults (e.g. a "reset to built-in default" action in the
// template editor).
export { BUILTIN_TEMPLATE_DEFS }
