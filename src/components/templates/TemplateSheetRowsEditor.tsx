import { Trash2 } from 'lucide-react'
import type { CheckColumn, CheckRow } from '../../data/types'
import { Input } from '../ui/input'
import { Checkbox } from '../ui/checkbox'
import { Button } from '../ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

function generateRowId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function TemplateSheetRowsEditor({
  rows,
  columns,
  onChange,
}: {
  rows: CheckRow[]
  columns: CheckColumn[]
  onChange(rows: CheckRow[]): void
}) {
  function updateAt(index: number, patch: Partial<CheckRow>) {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  function removeAt(index: number) {
    onChange(rows.filter((_, i) => i !== index))
  }

  function addRow() {
    const cells = Object.fromEntries(columns.map((c) => [c.key, false]))
    onChange([...rows, { id: generateRowId(), description: '', cells }])
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Article</TableHead>
              <TableHead className="min-w-48">Description</TableHead>
              {columns.map((c) => (
                <TableHead key={c.key} className="w-24 text-center">
                  {c.label || c.key}
                </TableHead>
              ))}
              <TableHead className="min-w-32">Remark</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Input
                    value={row.article ?? ''}
                    onChange={(e) => updateAt(i, { article: e.target.value })}
                    aria-label="Row article"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.description}
                    onChange={(e) => updateAt(i, { description: e.target.value })}
                    aria-label="Row description"
                  />
                </TableCell>
                {columns.map((c) => (
                  <TableCell key={c.key} className="text-center">
                    <Checkbox
                      checked={row.cells[c.key] ?? false}
                      onCheckedChange={(checked) =>
                        updateAt(i, { cells: { ...row.cells, [c.key]: checked === true } })
                      }
                      aria-label={`${row.description || 'Row'} — ${c.label || c.key}`}
                    />
                  </TableCell>
                ))}
                <TableCell>
                  <Input
                    value={row.remark ?? ''}
                    onChange={(e) => updateAt(i, { remark: e.target.value })}
                    aria-label="Row remark"
                  />
                </TableCell>
                <TableCell>
                  <Button type="button" variant="ghost" size="icon-xs" aria-label="Remove row" onClick={() => removeAt(i)}>
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        Add row
      </Button>
    </div>
  )
}
