import { Trash2 } from 'lucide-react'
import type { CheckColumn } from '../../data/types'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

function generateColumnKey(existing: CheckColumn[]): string {
  let n = existing.length + 1
  while (existing.some((c) => c.key === `col${n}`)) n++
  return `col${n}`
}

/** Adding/removing a column here doesn't touch rows directly — the parent
 *  (TemplateSheetsEditor) re-derives every row's `cells` map from the
 *  resulting column list afterward, so rows never carry a stale key. */
export function TemplateSheetColumnsEditor({
  columns,
  onChange,
}: {
  columns: CheckColumn[]
  onChange(columns: CheckColumn[]): void
}) {
  function updateAt(index: number, patch: Partial<CheckColumn>) {
    onChange(columns.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }

  function removeAt(index: number) {
    onChange(columns.filter((_, i) => i !== index))
  }

  function addColumn() {
    const key = generateColumnKey(columns)
    onChange([...columns, { key, label: '' }])
  }

  return (
    <div className="max-w-2xl space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-40">Key</TableHead>
            <TableHead>Label</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {columns.map((column, i) => (
            <TableRow key={i}>
              <TableCell>
                <Input value={column.key} onChange={(e) => updateAt(i, { key: e.target.value })} aria-label="Column key" />
              </TableCell>
              <TableCell>
                <Input
                  value={column.label}
                  onChange={(e) => updateAt(i, { label: e.target.value })}
                  aria-label="Column label"
                />
              </TableCell>
              <TableCell>
                <Button type="button" variant="ghost" size="icon-xs" aria-label="Remove column" onClick={() => removeAt(i)}>
                  <Trash2 />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button type="button" variant="outline" size="sm" onClick={addColumn}>
        Add column
      </Button>
    </div>
  )
}
