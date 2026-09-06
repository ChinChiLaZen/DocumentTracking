import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { CheckColumn, DetailSheet } from '../../data/types'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { TemplateSheetColumnsEditor } from './TemplateSheetColumnsEditor'
import { TemplateSheetRowsEditor } from './TemplateSheetRowsEditor'

function generateSheetId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return `sheet-${crypto.randomUUID()}`
  return `sheet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** Re-derives every row's `cells` map from the current column list — adding a
 *  column gives every row a fresh `false` for it, removing one drops the key
 *  from every row — so rows never carry a stale key (§ CheckRow.cells keyed
 *  by CheckColumn.key). */
function reconcileCells(sheet: DetailSheet, columns: CheckColumn[]): DetailSheet {
  const keys = columns.map((c) => c.key)
  return {
    ...sheet,
    columns,
    rows: sheet.rows.map((row) => ({
      ...row,
      cells: Object.fromEntries(keys.map((k) => [k, row.cells[k] ?? false])),
    })),
  }
}

export function TemplateSheetsEditor({
  sheets,
  onChange,
}: {
  sheets: DetailSheet[]
  onChange(sheets: DetailSheet[]): void
}) {
  const [activeId, setActiveId] = useState<string | undefined>(sheets[0]?.id)
  const active = sheets.find((s) => s.id === activeId) ?? sheets[0]

  function updateSheet(id: string, patch: Partial<DetailSheet>) {
    onChange(sheets.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function addSheet() {
    const id = generateSheetId()
    const next: DetailSheet = { id, itemNo: 0, title: 'New sheet', applicable: '', columns: [], rows: [] }
    onChange([...sheets, next])
    setActiveId(id)
  }

  function removeSheet(id: string) {
    const next = sheets.filter((s) => s.id !== id)
    onChange(next)
    if (activeId === id) setActiveId(next[0]?.id)
  }

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-xs text-muted-foreground">
        A detail sheet's <code>id</code> is what an item's "Detail sheet" picker (in the Items tab above)
        links to. Item Details renders every sheet generically from its own columns/rows, so any shape
        works here.
      </p>
      {sheets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No detail sheets yet.</p>
      ) : (
        <Tabs value={active?.id} onValueChange={setActiveId}>
          <TabsList className="h-auto flex-wrap">
            {sheets.map((s) => (
              <TabsTrigger key={s.id} value={s.id}>
                {s.title || s.id}
              </TabsTrigger>
            ))}
          </TabsList>
          {sheets.map((s) => (
            <TabsContent key={s.id} value={s.id} className="space-y-4 pt-2">
              <div className="flex items-end justify-between gap-4">
                <div className="grid max-w-md flex-1 gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor={`sheet-title-${s.id}`}>Title</Label>
                    <Input
                      id={`sheet-title-${s.id}`}
                      value={s.title}
                      onChange={(e) => updateSheet(s.id, { title: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`sheet-applicable-${s.id}`}>Applicable standard</Label>
                    <Input
                      id={`sheet-applicable-${s.id}`}
                      value={s.applicable}
                      onChange={(e) => updateSheet(s.id, { applicable: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSheet(s.id)}
                  aria-label={`Remove sheet ${s.title}`}
                >
                  <Trash2 /> Remove sheet
                </Button>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">Columns</h3>
                <TemplateSheetColumnsEditor
                  columns={s.columns}
                  onChange={(columns) => updateSheet(s.id, reconcileCells(s, columns))}
                />
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">Rows</h3>
                <TemplateSheetRowsEditor
                  rows={s.rows}
                  columns={s.columns}
                  onChange={(rows) => updateSheet(s.id, { rows })}
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
      <Button type="button" variant="outline" size="sm" onClick={addSheet}>
        Add sheet
      </Button>
    </div>
  )
}
