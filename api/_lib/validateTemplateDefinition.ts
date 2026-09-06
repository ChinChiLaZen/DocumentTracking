// Mirrors src/data/types.ts's TemplateDefinition — kept as a local, loosely
// typed shape (not imported) since api/ and src/ are separate TS project
// references (see tsconfig.api.json) with no cross-project imports.
// Deliberately shallow: checks the envelope, not every Item/CheckRow/
// GroupDef/PriorityDef field — same posture already accepted for
// isValidProjectRecord in api/_lib/validateProjectRecord.ts.
export interface TemplateDefinitionInput {
  label: string
  description: string
  tabSet: 'full' | 'single'
  hasDetailSheets: boolean
  hasGroups: boolean
  hasPriority: boolean
  supportsDefaultPhase: boolean
  groups: unknown[]
  priorities: unknown[]
  criticalNotice?: unknown
  items: unknown[]
  sheets: unknown[]
  [key: string]: unknown
}

export function isValidTemplateDefinition(value: unknown): value is TemplateDefinitionInput {
  if (typeof value !== 'object' || value === null) return false
  const def = value as Record<string, unknown>

  if (typeof def.label !== 'string' || def.label.trim() === '') return false
  if (typeof def.description !== 'string') return false
  if (def.tabSet !== 'full' && def.tabSet !== 'single') return false
  if (typeof def.hasDetailSheets !== 'boolean') return false
  if (typeof def.hasGroups !== 'boolean') return false
  if (typeof def.hasPriority !== 'boolean') return false
  if (typeof def.supportsDefaultPhase !== 'boolean') return false
  if (!Array.isArray(def.groups)) return false
  if (!Array.isArray(def.priorities)) return false
  if (!Array.isArray(def.items)) return false
  if (!Array.isArray(def.sheets)) return false

  if (def.criticalNotice !== undefined) {
    if (typeof def.criticalNotice !== 'object' || def.criticalNotice === null) return false
    const notice = def.criticalNotice as Record<string, unknown>
    if (typeof notice.heading !== 'string') return false
    if (!Array.isArray(notice.lines)) return false
  }

  return true
}
