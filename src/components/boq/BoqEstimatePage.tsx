import { useState } from 'react'
import { Download, Plus, Trash2 } from 'lucide-react'
import { useActiveProject } from '../../store/useActiveProject'
import { useAuthStore } from '../../store/useAuthStore'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { EditableField } from '../shared/EditableField'
import { PHASE_COLOR_SLOTS } from '../shared/statusStyles'
import { phaseColorIndex } from '../../domain/schedule'
import { lineTotal, categoryTotal } from '../../domain/boq'
import { exportProjectBoq } from '../../domain/export/boqExcelExport'
import { BoqSummaryCard } from './BoqSummaryCard'
import type { BoqCategory } from '../../data/types'

const CURRENCY_FORMAT = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
function formatCurrency(value: number): string {
  return CURRENCY_FORMAT.format(value)
}

export function BoqEstimatePage() {
  const {
    meta,
    boq,
    addBoqCategory,
    updateBoqCategory,
    deleteBoqCategory,
    addBoqLine,
    updateBoqLine,
    deleteBoqLine,
    updateBoqMeta,
  } = useActiveProject()
  const role = useAuthStore((s) => s.user?.role)
  const canEdit = role === 'admin' || role === 'ProjectManager'

  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(boq.categories[0]?.id)

  return (
    <div className="h-full space-y-6 overflow-auto p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">BOQ Estimate</h1>
          <p className="text-sm text-muted-foreground">Bill-of-quantities cost estimate, split into categories.</p>
        </div>
        <div className="flex items-center gap-2">
          {meta && (
            <Button variant="outline" onClick={() => void exportProjectBoq(meta, boq)}>
              <Download />
              Export to Excel
            </Button>
          )}
          {canEdit && (
            <Button onClick={() => addBoqCategory({ name: `Category ${boq.categories.length + 1}` })}>
              Add Category
            </Button>
          )}
        </div>
      </div>

      {boq.categories.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">
          No categories yet.{canEdit ? ' Add a category to start building the estimate.' : ''}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <Tabs value={activeCategoryId ?? boq.categories[0]?.id} onValueChange={setActiveCategoryId}>
            <TabsList>
              {boq.categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {boq.categories.map((category, categoryIndex) => (
              <TabsContent key={category.id} value={category.id} className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  {canEdit ? (
                    <EditableField
                      value={category.name}
                      onCommit={(name) => updateBoqCategory(category.id, { name })}
                      ariaLabel={`Rename ${category.name}`}
                      className="h-7 max-w-60 text-sm font-medium"
                    />
                  ) : (
                    <p className="text-sm font-medium">{category.name}</p>
                  )}
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Delete ${category.name}`}
                      onClick={() => deleteBoqCategory(category.id)}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </div>

                <BoqLineTable
                  category={category}
                  categoryIndex={categoryIndex}
                  canEdit={canEdit}
                  onUpdateLine={(lineId, patch) => updateBoqLine(category.id, lineId, patch)}
                  onDeleteLine={(lineId) => deleteBoqLine(category.id, lineId)}
                />

                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      addBoqLine(category.id, {
                        description: '',
                        quantity: 0,
                        unit: '',
                        materialUnitCost: 0,
                        laborUnitCost: 0,
                      })
                    }
                  >
                    <Plus />
                    Add Item
                  </Button>
                )}

                <div className="flex items-center justify-end gap-2 border-t pt-2 text-sm font-semibold">
                  <span>Category subtotal</span>
                  <span>{formatCurrency(categoryTotal(category))}</span>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <BoqSummaryCard boq={boq} canEdit={canEdit} onVatPercentChange={(vatPercent) => updateBoqMeta({ vatPercent })} />
        </div>
      )}
    </div>
  )
}

interface BoqLineTableProps {
  category: BoqCategory
  categoryIndex: number
  canEdit: boolean
  onUpdateLine(lineId: string, patch: Partial<Omit<BoqCategory['lines'][number], 'id'>>): void
  onDeleteLine(lineId: string): void
}

function BoqLineTable({ category, categoryIndex, canEdit, onUpdateLine, onDeleteLine }: BoqLineTableProps) {
  const color = PHASE_COLOR_SLOTS[phaseColorIndex(category.id)]

  if (category.lines.length === 0) {
    return <p className="text-sm italic text-muted-foreground">No items yet.</p>
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-xs text-muted-foreground">
          <th className="w-12 py-1">No.</th>
          <th className="py-1">Description</th>
          <th className="w-20 py-1">Qty</th>
          <th className="w-20 py-1">Unit</th>
          <th className="w-28 py-1">Material/Unit</th>
          <th className="w-28 py-1">Labor/Unit</th>
          <th className="w-28 py-1 text-right">Total</th>
          {canEdit && <th className="w-8 py-1" />}
        </tr>
      </thead>
      <tbody>
        {category.lines.map((line, lineIndex) => (
          <tr key={line.id} className="border-b last:border-0">
            <td className={`py-1 text-xs font-medium ${color.icon}`}>
              {categoryIndex + 1}.{lineIndex + 1}
            </td>
            <td className="py-1">
              {canEdit ? (
                <EditableField
                  value={line.description}
                  onCommit={(description) => onUpdateLine(line.id, { description })}
                  ariaLabel={`Item ${categoryIndex + 1}.${lineIndex + 1} description`}
                />
              ) : (
                line.description
              )}
            </td>
            <td className="py-1">
              {canEdit ? (
                <Input
                  type="number"
                  min={0}
                  className="h-7 w-16"
                  value={line.quantity}
                  aria-label={`Item ${categoryIndex + 1}.${lineIndex + 1} quantity`}
                  onChange={(e) => onUpdateLine(line.id, { quantity: Number(e.target.value) || 0 })}
                />
              ) : (
                line.quantity
              )}
            </td>
            <td className="py-1">
              {canEdit ? (
                <EditableField
                  value={line.unit}
                  onCommit={(unit) => onUpdateLine(line.id, { unit })}
                  ariaLabel={`Item ${categoryIndex + 1}.${lineIndex + 1} unit`}
                  className="h-7 w-16"
                />
              ) : (
                line.unit
              )}
            </td>
            <td className="py-1">
              {canEdit ? (
                <Input
                  type="number"
                  min={0}
                  className="h-7 w-24"
                  value={line.materialUnitCost}
                  aria-label={`Item ${categoryIndex + 1}.${lineIndex + 1} material cost per unit`}
                  onChange={(e) => onUpdateLine(line.id, { materialUnitCost: Number(e.target.value) || 0 })}
                />
              ) : (
                formatCurrency(line.materialUnitCost)
              )}
            </td>
            <td className="py-1">
              {canEdit ? (
                <Input
                  type="number"
                  min={0}
                  className="h-7 w-24"
                  value={line.laborUnitCost}
                  aria-label={`Item ${categoryIndex + 1}.${lineIndex + 1} labor cost per unit`}
                  onChange={(e) => onUpdateLine(line.id, { laborUnitCost: Number(e.target.value) || 0 })}
                />
              ) : (
                formatCurrency(line.laborUnitCost)
              )}
            </td>
            <td className="py-1 text-right font-medium">{formatCurrency(lineTotal(line))}</td>
            {canEdit && (
              <td className="py-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Delete item ${categoryIndex + 1}.${lineIndex + 1}`}
                  onClick={() => onDeleteLine(line.id)}
                >
                  <Trash2 />
                </Button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
