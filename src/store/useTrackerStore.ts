import { create } from 'zustand'
import type {
  CheckRow,
  DetailSheet,
  HistoryEntry,
  Item,
  LifecyclePhase,
  ProjectMeta,
  ProjectRecord,
  ProjectSchedule,
  ScheduleMilestone,
  SchedulePhase,
  Status,
  TemplateKind,
  WorkflowStatus,
} from '../data/types'
import { TEMPLATE_ITEMS, TEMPLATE_SHEETS } from '../data/checklistTemplate'
import { AOT_TEMPLATE_ITEMS } from '../data/aotTemplate'
import { DOA_TEMPLATE_ITEMS } from '../data/doaTemplate'
import { ADSB_TEMPLATE_ITEMS } from '../data/adsbTemplate'
import { INITIAL_PROJECTS } from '../data/initialProjects'
import type { PersistencePort } from './persistence'
import { createApiPersistence } from './persistence'

export interface ProjectRuntime {
  meta: ProjectMeta
  items: Item[]
  sheets: DetailSheet[]
  selectedRowIds: Record<string, Set<string>>
  history: HistoryEntry[]
  schedule: ProjectSchedule
}

const EMPTY_SCHEDULE: ProjectSchedule = { phases: [], milestones: [] }

export interface CreateProjectInput {
  title: string
  vendor: string
  scope: string
  preparedDate: string
  templateKind: TemplateKind
  defaultPhase?: LifecyclePhase // only meaningful when templateKind === 'mar'; ignored for 'aot'/'doa'/'adsb'
  projectType?: string // CSI MasterFormat code, e.g. "26 51 13" — see ProjectMeta.projectType
}

export type ItemMetaPatch = Partial<
  Pick<
    Item,
    | 'documentDate'
    | 'expiryDate'
    | 'responsiblePerson'
    | 'documentLink'
    | 'remark'
    | 'measured'
    | 'result'
    | 'employerResult'
    | 'employerRemark'
    // Admin-only static/definitional fields — see plan "Admin-only editing of
    // all static/definitional fields". Visibility/editability of these is
    // client-side-gated only (editable={role === 'admin'} at the call site),
    // but the actual writes persist through the same shared Postgres path as
    // every other item edit (persistProject → PUT /api/projects?id=X, see
    // CLAUDE.md §10) — so once "Save changes" is clicked, every user sees the
    // update on their next load, same as everything else in this store.
    | 'name'
    | 'standard'
    | 'requirement'
    | 'priority'
    | 'group'
    | 'importance'
    | 'docType'
    | 'site'
    | 'nameTh'
    | 'requirementTh'
    | 'torRef'
    | 'resp'
    | 'installPhase'
    | 'requiredEvidence'
    | 'requiredEvidenceTh'
    | 'hwPoint'
  >
>

export interface TrackerState {
  projects: Record<string, ProjectRuntime>
  projectOrder: string[]
  hydrated: boolean
  hydrating: boolean

  toggleCell(projectId: string, sheetId: string, rowId: string, columnKey: string): void
  setRowRemark(projectId: string, sheetId: string, rowId: string, remark: string): void
  updateRowText(
    projectId: string,
    sheetId: string,
    rowId: string,
    patch: Partial<Pick<CheckRow, 'description' | 'article' | 'section'>>,
  ): void
  updateColumnLabel(projectId: string, sheetId: string, columnKey: string, label: string): void
  updateSheetHeader(
    projectId: string,
    sheetId: string,
    patch: Partial<Pick<DetailSheet, 'title' | 'applicable'>>,
  ): void
  setManualStatus(projectId: string, itemNo: number, status: Status | undefined): void
  toggleRowSelection(projectId: string, sheetId: string, rowId: string): void
  selectAllRows(projectId: string, sheetId: string, on: boolean): void
  bulkSetCells(projectId: string, sheetId: string, value: boolean, scope: 'selected' | 'all'): void
  bulkToggleCells(projectId: string, sheetId: string, scope: 'selected' | 'all'): void
  resetToSeed(projectId: string): void
  createProject(input: CreateProjectInput): string
  deleteProject(projectId: string): Promise<{ error?: string }>
  updateProjectMeta(
    projectId: string,
    patch: Partial<Pick<ProjectMeta, 'title' | 'vendor' | 'scope' | 'preparedDate' | 'projectType'>>,
  ): void
  setWorkflowStatus(
    projectId: string,
    itemNo: number,
    status: WorkflowStatus | undefined,
    changedBy: string,
  ): void
  setPhase(
    projectId: string,
    itemNo: number,
    phase: LifecyclePhase | undefined,
    changedBy: string,
  ): void
  updateItemMeta(projectId: string, itemNo: number, patch: ItemMetaPatch, changedBy: string): void
  addSchedulePhase(projectId: string, input: Omit<SchedulePhase, 'id'>): void
  updateSchedulePhase(
    projectId: string,
    phaseId: string,
    patch: Partial<Omit<SchedulePhase, 'id'>>,
  ): void
  deleteSchedulePhase(projectId: string, phaseId: string): void
  addScheduleMilestone(projectId: string, input: Omit<ScheduleMilestone, 'id'>): void
  updateScheduleMilestone(
    projectId: string,
    milestoneId: string,
    patch: Partial<Omit<ScheduleMilestone, 'id'>>,
  ): void
  deleteScheduleMilestone(projectId: string, milestoneId: string): void
  updateScheduleMeta(projectId: string, patch: Partial<Pick<ProjectSchedule, 'contractStartDate'>>): void
  hydrate(): Promise<void>
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value))
}

function cloneItems(items: Item[]): Item[] {
  return items.map((item) => ({ ...item }))
}

function cloneSheets(sheets: DetailSheet[]): DetailSheet[] {
  return sheets.map((sheet) => ({
    ...sheet,
    rows: sheet.rows.map((row) => ({ ...row, cells: { ...row.cells } })),
  }))
}

function cloneSchedule(schedule: ProjectSchedule | undefined): ProjectSchedule {
  if (!schedule) return EMPTY_SCHEDULE
  return {
    phases: schedule.phases.map((p) => ({ ...p })),
    milestones: schedule.milestones.map((m) => ({ ...m })),
    contractStartDate: schedule.contractStartDate,
  }
}

function toRuntime(record: ProjectRecord): ProjectRuntime {
  return {
    meta: { ...record.meta },
    items: cloneItems(record.items),
    sheets: cloneSheets(record.sheets),
    selectedRowIds: {},
    history: [...record.history],
    schedule: cloneSchedule(record.schedule),
  }
}

function initialProjectsState(): { projects: Record<string, ProjectRuntime>; projectOrder: string[] } {
  const projects: Record<string, ProjectRuntime> = {}
  const projectOrder: string[] = []
  for (const record of INITIAL_PROJECTS) {
    projects[record.meta.id] = toRuntime(record)
    projectOrder.push(record.meta.id)
  }
  return { projects, projectOrder }
}

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function makeHistoryEntry(
  itemNo: number,
  field: HistoryEntry['field'],
  from: string | undefined,
  to: string | undefined,
  changedBy: string,
): HistoryEntry {
  return {
    id: generateId('history'),
    timestamp: new Date().toISOString(),
    itemNo,
    field,
    from,
    to,
    changedBy,
  }
}

/** The seed a given project resets to: its recorded initial data if it's one of
 *  the projects shipped with the app, otherwise the blank template for its own
 *  templateKind (the state every user-created project started at). */
function seedFor(
  projectId: string,
  templateKind: TemplateKind | undefined,
): { items: Item[]; sheets: DetailSheet[] } {
  const initial = INITIAL_PROJECTS.find((p) => p.meta.id === projectId)
  if (initial) return { items: cloneItems(initial.items), sheets: cloneSheets(initial.sheets) }
  if (templateKind === 'aot') return { items: cloneItems(AOT_TEMPLATE_ITEMS), sheets: [] }
  if (templateKind === 'doa') return { items: cloneItems(DOA_TEMPLATE_ITEMS), sheets: [] }
  if (templateKind === 'adsb') return { items: cloneItems(ADSB_TEMPLATE_ITEMS), sheets: [] }
  return { items: cloneItems(TEMPLATE_ITEMS), sheets: cloneSheets(TEMPLATE_SHEETS) }
}

export function createTrackerStore(persistence: PersistencePort = createApiPersistence()) {
  return create<TrackerState>()((set, get) => {
    function persistProject(projectId: string) {
      const project = get().projects[projectId]
      if (!project) return
      persistence.saveProject({
        meta: project.meta,
        items: project.items,
        sheets: project.sheets,
        history: project.history,
        schedule: project.schedule,
      })
    }

    function updateProject(
      projectId: string,
      updater: (project: ProjectRuntime) => ProjectRuntime,
    ) {
      set((state) => {
        const project = state.projects[projectId]
        if (!project) return state
        return { projects: { ...state.projects, [projectId]: updater(project) } }
      })
    }

    return {
      ...initialProjectsState(),
      hydrated: false,
      hydrating: false,

      toggleCell(projectId, sheetId, rowId, columnKey) {
        updateProject(projectId, (project) => ({
          ...project,
          sheets: project.sheets.map((sheet) =>
            sheet.id !== sheetId
              ? sheet
              : {
                  ...sheet,
                  rows: sheet.rows.map((row) =>
                    row.id !== rowId
                      ? row
                      : { ...row, cells: { ...row.cells, [columnKey]: !row.cells[columnKey] } },
                  ),
                },
          ),
        }))
        persistProject(projectId)
      },

      setRowRemark(projectId, sheetId, rowId, remark) {
        updateProject(projectId, (project) => ({
          ...project,
          sheets: project.sheets.map((sheet) =>
            sheet.id !== sheetId
              ? sheet
              : {
                  ...sheet,
                  rows: sheet.rows.map((row) => (row.id !== rowId ? row : { ...row, remark })),
                },
          ),
        }))
        persistProject(projectId)
      },

      updateRowText(projectId, sheetId, rowId, patch) {
        updateProject(projectId, (project) => ({
          ...project,
          sheets: project.sheets.map((sheet) =>
            sheet.id !== sheetId
              ? sheet
              : {
                  ...sheet,
                  rows: sheet.rows.map((row) => (row.id !== rowId ? row : { ...row, ...patch })),
                },
          ),
        }))
        persistProject(projectId)
      },

      updateColumnLabel(projectId, sheetId, columnKey, label) {
        updateProject(projectId, (project) => ({
          ...project,
          sheets: project.sheets.map((sheet) =>
            sheet.id !== sheetId
              ? sheet
              : {
                  ...sheet,
                  columns: sheet.columns.map((column) =>
                    column.key !== columnKey ? column : { ...column, label },
                  ),
                },
          ),
        }))
        persistProject(projectId)
      },

      updateSheetHeader(projectId, sheetId, patch) {
        updateProject(projectId, (project) => ({
          ...project,
          sheets: project.sheets.map((sheet) =>
            sheet.id !== sheetId ? sheet : { ...sheet, ...patch },
          ),
        }))
        persistProject(projectId)
      },

      setManualStatus(projectId, itemNo, status) {
        updateProject(projectId, (project) => ({
          ...project,
          items: project.items.map((item) =>
            item.no !== itemNo ? item : { ...item, manualStatus: status },
          ),
        }))
        persistProject(projectId)
      },

      toggleRowSelection(projectId, sheetId, rowId) {
        updateProject(projectId, (project) => {
          const current = new Set(project.selectedRowIds[sheetId] ?? [])
          if (current.has(rowId)) current.delete(rowId)
          else current.add(rowId)
          return { ...project, selectedRowIds: { ...project.selectedRowIds, [sheetId]: current } }
        })
      },

      selectAllRows(projectId, sheetId, on) {
        updateProject(projectId, (project) => {
          const sheet = project.sheets.find((s) => s.id === sheetId)
          const ids = on && sheet ? new Set(sheet.rows.map((r) => r.id)) : new Set<string>()
          return { ...project, selectedRowIds: { ...project.selectedRowIds, [sheetId]: ids } }
        })
      },

      bulkSetCells(projectId, sheetId, value, scope) {
        updateProject(projectId, (project) => ({
          ...project,
          sheets: project.sheets.map((sheet) => {
            if (sheet.id !== sheetId) return sheet
            const selected =
              scope === 'selected' ? (project.selectedRowIds[sheetId] ?? new Set<string>()) : null
            return {
              ...sheet,
              rows: sheet.rows.map((row) => {
                if (selected && !selected.has(row.id)) return row
                const cells = Object.fromEntries(Object.keys(row.cells).map((k) => [k, value]))
                return { ...row, cells }
              }),
            }
          }),
        }))
        persistProject(projectId)
      },

      bulkToggleCells(projectId, sheetId, scope) {
        updateProject(projectId, (project) => ({
          ...project,
          sheets: project.sheets.map((sheet) => {
            if (sheet.id !== sheetId) return sheet
            const selected =
              scope === 'selected' ? (project.selectedRowIds[sheetId] ?? new Set<string>()) : null
            return {
              ...sheet,
              rows: sheet.rows.map((row) => {
                if (selected && !selected.has(row.id)) return row
                const cells = Object.fromEntries(Object.entries(row.cells).map(([k, v]) => [k, !v]))
                return { ...row, cells }
              }),
            }
          }),
        }))
        persistProject(projectId)
      },

      resetToSeed(projectId) {
        const project = get().projects[projectId]
        if (!project) return
        const seed = seedFor(projectId, project.meta.templateKind)
        updateProject(projectId, (project) => ({
          ...project,
          ...seed,
          selectedRowIds: {},
          history: [],
          schedule: EMPTY_SCHEDULE,
        }))
        persistProject(projectId)
      },

      createProject({ title, vendor, scope, preparedDate, templateKind, defaultPhase, projectType }) {
        const id = generateId('project')
        const items =
          templateKind === 'aot'
            ? cloneItems(AOT_TEMPLATE_ITEMS) // each item keeps its own real phase — no bulk override
            : templateKind === 'doa'
              ? cloneItems(DOA_TEMPLATE_ITEMS) // each item keeps its own real phase — no bulk override
              : templateKind === 'adsb'
                ? cloneItems(ADSB_TEMPLATE_ITEMS) // each item keeps its own real installPhase — no bulk override
                : cloneItems(TEMPLATE_ITEMS).map((item) => ({
                    ...item,
                    phase: defaultPhase ?? 'AfterContract',
                  }))
        const sheets =
          templateKind === 'aot' || templateKind === 'doa' || templateKind === 'adsb'
            ? []
            : cloneSheets(TEMPLATE_SHEETS)
        const project: ProjectRuntime = {
          meta: { id, title, vendor, scope, preparedDate, templateKind, projectType },
          items,
          sheets,
          selectedRowIds: {},
          history: [],
          schedule: EMPTY_SCHEDULE,
        }
        set((state) => ({
          projects: { ...state.projects, [id]: project },
          projectOrder: [...state.projectOrder, id],
        }))
        persistProject(id)
        return id
      },

      updateProjectMeta(projectId, patch) {
        updateProject(projectId, (project) => ({ ...project, meta: { ...project.meta, ...patch } }))
        persistProject(projectId)
      },

      async deleteProject(projectId) {
        const removed = get().projects[projectId]
        if (!removed) return {}
        const removedIndex = get().projectOrder.indexOf(projectId)

        set((state) => {
          const { [projectId]: _removed, ...projects } = state.projects
          return { projects, projectOrder: state.projectOrder.filter((id) => id !== projectId) }
        })

        const { error } = await persistence.deleteProject(projectId)
        if (error) {
          // Roll back the optimistic removal — the server rejected the delete
          // (e.g. a non-admin somehow reached this, or a network failure).
          set((state) => {
            const order = [...state.projectOrder]
            order.splice(removedIndex, 0, projectId)
            return { projects: { ...state.projects, [projectId]: removed }, projectOrder: order }
          })
          return { error }
        }
        return {}
      },

      setWorkflowStatus(projectId, itemNo, status, changedBy) {
        const project = get().projects[projectId]
        const item = project?.items.find((i) => i.no === itemNo)
        if (!item || item.workflowStatus === status) return
        const entry = makeHistoryEntry(itemNo, 'workflowStatus', item.workflowStatus, status, changedBy)
        updateProject(projectId, (project) => ({
          ...project,
          items: project.items.map((it) => (it.no !== itemNo ? it : { ...it, workflowStatus: status })),
          history: [...project.history, entry],
        }))
        persistProject(projectId)
      },

      setPhase(projectId, itemNo, phase, changedBy) {
        const project = get().projects[projectId]
        const item = project?.items.find((i) => i.no === itemNo)
        if (!item || item.phase === phase) return
        const entry = makeHistoryEntry(itemNo, 'phase', item.phase, phase, changedBy)
        updateProject(projectId, (project) => ({
          ...project,
          items: project.items.map((it) => (it.no !== itemNo ? it : { ...it, phase })),
          history: [...project.history, entry],
        }))
        persistProject(projectId)
      },

      updateItemMeta(projectId, itemNo, patch, changedBy) {
        const project = get().projects[projectId]
        const item = project?.items.find((i) => i.no === itemNo)
        if (!item) return
        const entries: HistoryEntry[] = []
        for (const key of Object.keys(patch) as (keyof ItemMetaPatch)[]) {
          const to = patch[key]
          const from = item[key]
          if (from === to) continue
          entries.push(makeHistoryEntry(itemNo, key, from, to, changedBy))
        }
        if (entries.length === 0) return
        updateProject(projectId, (project) => ({
          ...project,
          items: project.items.map((it) => (it.no !== itemNo ? it : { ...it, ...patch })),
          history: [...project.history, ...entries],
        }))
        persistProject(projectId)
      },

      addSchedulePhase(projectId, input) {
        const phase: SchedulePhase = {
          ...input,
          id: generateId('phase'),
          percentComplete: clampPercent(input.percentComplete),
          weightPercent: input.weightPercent === undefined ? undefined : clampPercent(input.weightPercent),
        }
        updateProject(projectId, (project) => ({
          ...project,
          schedule: { ...project.schedule, phases: [...project.schedule.phases, phase] },
        }))
        persistProject(projectId)
      },

      updateSchedulePhase(projectId, phaseId, patch) {
        updateProject(projectId, (project) => ({
          ...project,
          schedule: {
            ...project.schedule,
            phases: project.schedule.phases.map((p) =>
              p.id !== phaseId
                ? p
                : {
                    ...p,
                    ...patch,
                    percentComplete:
                      patch.percentComplete === undefined
                        ? p.percentComplete
                        : clampPercent(patch.percentComplete),
                    weightPercent:
                      patch.weightPercent === undefined ? p.weightPercent : clampPercent(patch.weightPercent),
                  },
            ),
          },
        }))
        persistProject(projectId)
      },

      deleteSchedulePhase(projectId, phaseId) {
        updateProject(projectId, (project) => ({
          ...project,
          schedule: {
            ...project.schedule,
            phases: project.schedule.phases.filter((p) => p.id !== phaseId),
          },
        }))
        persistProject(projectId)
      },

      addScheduleMilestone(projectId, input) {
        const milestone: ScheduleMilestone = { ...input, id: generateId('milestone') }
        updateProject(projectId, (project) => ({
          ...project,
          schedule: { ...project.schedule, milestones: [...project.schedule.milestones, milestone] },
        }))
        persistProject(projectId)
      },

      updateScheduleMilestone(projectId, milestoneId, patch) {
        updateProject(projectId, (project) => ({
          ...project,
          schedule: {
            ...project.schedule,
            milestones: project.schedule.milestones.map((m) =>
              m.id !== milestoneId ? m : { ...m, ...patch },
            ),
          },
        }))
        persistProject(projectId)
      },

      deleteScheduleMilestone(projectId, milestoneId) {
        updateProject(projectId, (project) => ({
          ...project,
          schedule: {
            ...project.schedule,
            milestones: project.schedule.milestones.filter((m) => m.id !== milestoneId),
          },
        }))
        persistProject(projectId)
      },

      updateScheduleMeta(projectId, patch) {
        updateProject(projectId, (project) => ({
          ...project,
          schedule: { ...project.schedule, ...patch },
        }))
        persistProject(projectId)
      },

      async hydrate() {
        if (get().hydrating || get().hydrated) return
        set({ hydrating: true })
        const loaded = await persistence.load()
        if (loaded) {
          const projects: Record<string, ProjectRuntime> = {}
          for (const record of loaded.projects) {
            projects[record.meta.id] = {
              meta: record.meta,
              items: record.items,
              sheets: record.sheets,
              selectedRowIds: {},
              history: record.history ?? [],
              schedule: cloneSchedule(record.schedule),
            }
          }
          set({ projects, projectOrder: loaded.projectOrder, hydrated: true, hydrating: false })
        } else {
          // Fetch failed (offline, or `npm run dev` without the /api routes) —
          // keep the baked-in INITIAL_PROJECTS fallback already in the store.
          set({ hydrated: true, hydrating: false })
        }
      },
    }
  })
}

export const useTrackerStore = createTrackerStore()
