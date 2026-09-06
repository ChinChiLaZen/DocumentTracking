import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import type { GroupDef } from '../../data/types'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

function generateGroupId(existing: GroupDef[]): string {
  let n = existing.length + 1
  while (existing.some((g) => g.id === `G${n}`)) n++
  return `G${n}`
}

export function TemplateGroupsEditor({
  groups,
  onChange,
}: {
  groups: GroupDef[]
  onChange(groups: GroupDef[]): void
}) {
  function updateAt(index: number, patch: Partial<GroupDef>) {
    onChange(groups.map((g, i) => (i === index ? { ...g, ...patch } : g)))
  }

  function removeAt(index: number) {
    onChange(groups.filter((_, i) => i !== index))
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= groups.length) return
    const next = [...groups]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  function addGroup() {
    onChange([...groups, { id: generateGroupId(groups), label: '', itemRange: '' }])
  }

  return (
    <div className="max-w-3xl space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Id</TableHead>
            <TableHead>Label</TableHead>
            <TableHead className="w-32">Item range</TableHead>
            <TableHead className="w-28">Order</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group, i) => (
            <TableRow key={i}>
              <TableCell>
                <Input
                  value={group.id}
                  onChange={(e) => updateAt(i, { id: e.target.value })}
                  aria-label="Group id"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={group.label}
                  onChange={(e) => updateAt(i, { label: e.target.value })}
                  aria-label="Group label"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={group.itemRange ?? ''}
                  onChange={(e) => updateAt(i, { itemRange: e.target.value })}
                  aria-label="Group item range"
                  placeholder="e.g. 1–8"
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Move group up"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Move group down"
                    disabled={i === groups.length - 1}
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
                  aria-label="Remove group"
                  onClick={() => removeAt(i)}
                >
                  <Trash2 />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button type="button" variant="outline" size="sm" onClick={addGroup}>
        Add group
      </Button>
    </div>
  )
}
