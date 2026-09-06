import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import type { DetailSheet, GroupDef, Item, PriorityDef } from '../../data/types'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

const NONE = '__none__'

export function TemplateItemsEditor({
  items,
  onChange,
  hasGroups,
  hasPriority,
  hasDetailSheets,
  groups,
  priorities,
  sheets,
}: {
  items: Item[]
  onChange(items: Item[]): void
  hasGroups: boolean
  hasPriority: boolean
  hasDetailSheets: boolean
  groups: GroupDef[]
  priorities: PriorityDef[]
  sheets: DetailSheet[]
}) {
  function updateAt(index: number, patch: Partial<Item>) {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  function removeAt(index: number) {
    onChange(items.filter((_, i) => i !== index).map((it, i) => ({ ...it, no: i + 1 })))
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next.map((it, i) => ({ ...it, no: i + 1 })))
  }

  function addItem() {
    onChange([...items, { no: items.length + 1, name: '', standard: '', requirement: '' }])
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              {hasGroups && <TableHead className="w-28">Group</TableHead>}
              <TableHead className="min-w-48">Name</TableHead>
              <TableHead className="min-w-40">Standard</TableHead>
              <TableHead className="min-w-40">Requirement</TableHead>
              {hasPriority && <TableHead className="w-24">Priority</TableHead>}
              {hasDetailSheets && <TableHead className="w-40">Detail sheet</TableHead>}
              <TableHead className="w-28">Order</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, i) => (
              <TableRow key={i}>
                <TableCell>{item.no}</TableCell>
                {hasGroups && (
                  <TableCell>
                    <Select
                      value={item.group ?? NONE}
                      onValueChange={(value) => updateAt(i, { group: value === NONE ? undefined : value })}
                    >
                      <SelectTrigger size="sm" aria-label={`Item ${item.no} group`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>—</SelectItem>
                        {groups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                )}
                <TableCell>
                  <Textarea
                    value={item.name}
                    onChange={(e) => updateAt(i, { name: e.target.value })}
                    aria-label={`Item ${item.no} name`}
                    rows={2}
                  />
                </TableCell>
                <TableCell>
                  <Textarea
                    value={item.standard}
                    onChange={(e) => updateAt(i, { standard: e.target.value })}
                    aria-label={`Item ${item.no} standard`}
                    rows={2}
                  />
                </TableCell>
                <TableCell>
                  <Textarea
                    value={item.requirement}
                    onChange={(e) => updateAt(i, { requirement: e.target.value })}
                    aria-label={`Item ${item.no} requirement`}
                    rows={2}
                  />
                </TableCell>
                {hasPriority && (
                  <TableCell>
                    <Select
                      value={item.priority ?? NONE}
                      onValueChange={(value) =>
                        updateAt(i, { priority: value === NONE ? undefined : (value as Item['priority']) })
                      }
                    >
                      <SelectTrigger size="sm" aria-label={`Item ${item.no} priority`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>—</SelectItem>
                        {priorities.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                )}
                {hasDetailSheets && (
                  <TableCell>
                    <Select
                      value={item.detailSheetId ?? NONE}
                      onValueChange={(value) => updateAt(i, { detailSheetId: value === NONE ? undefined : value })}
                    >
                      <SelectTrigger size="sm" aria-label={`Item ${item.no} detail sheet`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>None</SelectItem>
                        {sheets.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.title || s.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Move item ${item.no} up`}
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Move item ${item.no} down`}
                      disabled={i === items.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      <ArrowDown />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Remove item ${item.no}`}
                    onClick={() => removeAt(i)}
                  >
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        Add item
      </Button>
    </div>
  )
}
