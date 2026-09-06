import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { useTemplateStore } from '../../store/useTemplateStore'
import { BUILTIN_TEMPLATE_DEFS } from '../../domain/templateRegistry'
import type { Item, PriorityDef, TemplateDefinition } from '../../data/types'
import { Button } from '../ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { TemplateMetaPanel } from './TemplateMetaPanel'
import { TemplateGroupsEditor } from './TemplateGroupsEditor'
import { TemplatePrioritiesEditor } from './TemplatePrioritiesEditor'
import { TemplateItemsEditor } from './TemplateItemsEditor'
import { TemplateSheetsEditor } from './TemplateSheetsEditor'

const BLANK_PRIORITIES: PriorityDef[] = [
  { id: 'A', label: 'A', description: '' },
  { id: 'B', label: 'B', description: '' },
  { id: 'C', label: 'C', description: '' },
]

function blankDraft(): TemplateDefinition {
  return {
    id: '',
    isBuiltin: false,
    label: '',
    description: '',
    tabSet: 'single',
    hasDetailSheets: false,
    hasGroups: false,
    hasPriority: false,
    supportsDefaultPhase: false,
    groups: [],
    priorities: [],
    items: [],
    sheets: [],
  }
}

export function TemplateEditorPage() {
  const role = useAuthStore((s) => s.user?.role)
  const { templateId } = useParams<{ templateId: string }>()
  const isNew = templateId === 'new' || templateId === undefined
  const templates = useTemplateStore((s) => s.templates)
  const createTemplate = useTemplateStore((s) => s.createTemplate)
  const updateTemplate = useTemplateStore((s) => s.updateTemplate)
  const deleteTemplate = useTemplateStore((s) => s.deleteTemplate)
  const navigate = useNavigate()

  const existing = isNew ? undefined : templates.find((t) => t.id === templateId)
  const builtinDefault = isNew ? undefined : BUILTIN_TEMPLATE_DEFS.find((t) => t.id === templateId)
  const initial = useMemo<TemplateDefinition>(() => existing ?? blankDraft(), [existing])
  const [draft, setDraft] = useState<TemplateDefinition>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (role !== 'admin') return <Navigate to="/" replace />
  if (!isNew && !existing) return <Navigate to="/templates" replace />

  function patch(p: Partial<TemplateDefinition>) {
    setDraft((prev) => {
      const next = { ...prev, ...p }
      // Toggling Priority on for the first time seeds the fixed 3-row A/B/C
      // shape (§ data/types.ts's TemplateDefinition — always exactly 3).
      if (p.hasPriority && next.priorities.length !== 3) next.priorities = BLANK_PRIORITIES
      return next
    })
  }

  /**
   * The runtime link between an item and its checkbox sheet is
   * `sheet.itemNo === item.no` (see ItemDetailsPage.tsx, selectors.ts's
   * selectItemsWithStatus, excelExport.ts, wordExport.ts — every one of them
   * looks a sheet up via `new Map(sheets.map(s => [s.itemNo, s]))`).
   * `item.detailSheetId` itself is only ever checked for presence
   * (`!== undefined`) — its string value is never dereferenced against
   * `sheet.id` anywhere. So the "Detail sheet" picker in the Items tab (which
   * sets `detailSheetId`) doesn't by itself create a working link; this
   * derives each sheet's `itemNo` from whichever item currently references
   * it, keeping the two in sync every time items change.
   */
  function handleItemsChange(items: Item[]) {
    const itemNoBySheetId = new Map<string, number>()
    for (const item of items) {
      if (item.detailSheetId) itemNoBySheetId.set(item.detailSheetId, item.no)
    }
    const sheets = draft.sheets.map((sheet) => ({
      ...sheet,
      itemNo: itemNoBySheetId.get(sheet.id) ?? sheet.itemNo,
    }))
    patch({ items, sheets })
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const result = isNew ? await createTemplate(draft) : await updateTemplate(draft.id, draft)
    setSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    navigate('/templates')
  }

  async function handleResetToDefault() {
    if (!existing) return
    setSaving(true)
    setError(null)
    const result = await deleteTemplate(existing.id)
    setSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    navigate('/templates')
  }

  const canSave = draft.label.trim() !== '' && draft.description.trim() !== ''
  // A built-in with a LIVE override differs from its shipped default —
  // "Reset to shipped default" is only meaningful (and only shown) then.
  // mergeTemplates() reuses the exact BUILTIN_TEMPLATE_DEFS object by
  // reference when no override row exists, so reference inequality here
  // reliably detects "an override actually exists" rather than just "this
  // id happens to be one of the 4 built-in kinds" (every built-in's
  // isBuiltin is true regardless of whether it's overridden).
  const hasOverride = Boolean(existing?.isBuiltin && builtinDefault && existing !== builtinDefault)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">{isNew ? 'New Template' : `Edit — ${existing?.label}`}</h1>
          <p className="text-sm text-muted-foreground">
            Changes only affect projects created from this template after you save — existing projects
            are never retroactively changed.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {hasOverride && (
            <Button type="button" variant="ghost" disabled={saving} onClick={() => void handleResetToDefault()}>
              Reset to shipped default
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => navigate('/templates')} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" disabled={saving || !canSave} onClick={() => void handleSave()}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {error && <p className="px-6 pt-4 text-sm text-destructive">{error}</p>}

      <div className="min-h-0 flex-1 overflow-auto p-6">
        <Tabs defaultValue="meta">
          <TabsList>
            <TabsTrigger value="meta">Details</TabsTrigger>
            {draft.hasGroups && <TabsTrigger value="groups">Groups</TabsTrigger>}
            {draft.hasPriority && <TabsTrigger value="priorities">Priorities</TabsTrigger>}
            <TabsTrigger value="items">Items</TabsTrigger>
            {draft.hasDetailSheets && <TabsTrigger value="sheets">Detail sheets</TabsTrigger>}
          </TabsList>

          <TabsContent value="meta" className="pt-4">
            <TemplateMetaPanel draft={draft} onChange={patch} />
          </TabsContent>

          {draft.hasGroups && (
            <TabsContent value="groups" className="pt-4">
              <TemplateGroupsEditor groups={draft.groups} onChange={(groups) => patch({ groups })} />
            </TabsContent>
          )}

          {draft.hasPriority && (
            <TabsContent value="priorities" className="pt-4">
              <TemplatePrioritiesEditor
                priorities={draft.priorities}
                onChange={(priorities) => patch({ priorities })}
              />
            </TabsContent>
          )}

          <TabsContent value="items" className="pt-4">
            <TemplateItemsEditor
              items={draft.items}
              onChange={handleItemsChange}
              hasGroups={draft.hasGroups}
              hasPriority={draft.hasPriority}
              hasDetailSheets={draft.hasDetailSheets}
              groups={draft.groups}
              priorities={draft.priorities}
              sheets={draft.sheets}
            />
          </TabsContent>

          {draft.hasDetailSheets && (
            <TabsContent value="sheets" className="pt-4">
              <TemplateSheetsEditor sheets={draft.sheets} onChange={(sheets) => patch({ sheets })} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
