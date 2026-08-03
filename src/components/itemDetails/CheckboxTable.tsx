import { Fragment } from 'react'
import type { DetailSheet } from '../../data/types'
import { Checkbox } from '../ui/checkbox'
import { Input } from '../ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

interface CheckboxTableProps {
  sheet: DetailSheet
  selectedRowIds: Set<string>
  /** Row ids with unsaved staged edits (§ Save changes) — rows get a highlight. */
  dirtyRowIds?: Set<string>
  /** Admin-only inline editing of article/description/column labels. */
  editable?: boolean
  onToggleCell: (rowId: string, columnKey: string) => void
  onToggleRowSelection: (rowId: string) => void
  onRemarkChange: (rowId: string, remark: string) => void
  onArticleChange?: (rowId: string, article: string) => void
  onDescriptionChange?: (rowId: string, description: string) => void
  onColumnLabelChange?: (columnKey: string, label: string) => void
}

const inlineInputClass =
  'w-full min-w-32 rounded border border-transparent bg-transparent px-1 py-0.5 outline-none hover:border-input focus:border-ring focus:bg-background focus:ring-3 focus:ring-ring/50'

export function CheckboxTable({
  sheet,
  selectedRowIds,
  dirtyRowIds,
  editable,
  onToggleCell,
  onToggleRowSelection,
  onRemarkChange,
  onArticleChange,
  onDescriptionChange,
  onColumnLabelChange,
}: CheckboxTableProps) {
  const colSpan = 3 + sheet.columns.length + 1

  if (sheet.rows.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No checks defined for this sheet.
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            <TableHead className="w-8" scope="col" />
            <TableHead scope="col">ARTICLE (TOR)</TableHead>
            <TableHead scope="col">DESCRIPTION</TableHead>
            {sheet.columns.map((column) => (
              <TableHead key={column.key} scope="col">
                {editable ? (
                  <Input
                    value={column.label}
                    onChange={(e) => onColumnLabelChange?.(column.key, e.target.value)}
                    aria-label={`${sheet.title} — ${column.label} column label`}
                    className="h-7 min-w-24 text-xs font-medium"
                  />
                ) : (
                  column.label
                )}
              </TableHead>
            ))}
            <TableHead scope="col">REMARK</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sheet.rows.map((row) => (
            <Fragment key={row.id}>
              {row.section && (
                <TableRow key={`${row.id}-section`}>
                  <TableCell
                    colSpan={colSpan}
                    className="bg-muted font-medium text-muted-foreground"
                  >
                    {row.section}
                  </TableCell>
                </TableRow>
              )}
              <TableRow
                key={row.id}
                data-state={selectedRowIds.has(row.id) ? 'selected' : undefined}
                className={dirtyRowIds?.has(row.id) ? 'border-l-2 border-l-amber-400' : undefined}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedRowIds.has(row.id)}
                    onCheckedChange={() => onToggleRowSelection(row.id)}
                    aria-label={`Select row — ${row.description}`}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {editable ? (
                    <input
                      type="text"
                      className={`${inlineInputClass} text-muted-foreground`}
                      value={row.article ?? ''}
                      onChange={(e) => onArticleChange?.(row.id, e.target.value)}
                      aria-label={`${sheet.title} — ${row.description} — Article`}
                    />
                  ) : (
                    (row.article ?? '')
                  )}
                </TableCell>
                <TableCell>
                  {editable ? (
                    <input
                      type="text"
                      className={inlineInputClass}
                      value={row.description}
                      onChange={(e) => onDescriptionChange?.(row.id, e.target.value)}
                      aria-label={`${sheet.title} — Description`}
                    />
                  ) : (
                    row.description
                  )}
                </TableCell>
                {sheet.columns.map((column) => {
                  const checked = row.cells[column.key] ?? false
                  return (
                    <TableCell key={column.key}>
                      <div className="relative inline-flex size-4 items-center justify-center">
                        <Checkbox
                          className="peer data-[state=checked]:border-emerald-300 data-[state=checked]:bg-emerald-100 data-[state=checked]:text-emerald-700"
                          checked={checked}
                          onCheckedChange={() => onToggleCell(row.id, column.key)}
                          aria-label={`${sheet.title} — ${row.description} — ${column.label}`}
                        />
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 hidden items-center justify-center text-muted-foreground peer-data-[state=unchecked]:flex"
                        >
                          ·
                        </span>
                      </div>
                    </TableCell>
                  )
                })}
                <TableCell>
                  <input
                    type="text"
                    className="w-full min-w-32 rounded border border-transparent bg-transparent px-1 py-0.5 text-muted-foreground outline-none hover:border-input focus:border-ring focus:bg-background focus:ring-3 focus:ring-ring/50"
                    value={row.remark ?? ''}
                    onChange={(e) => onRemarkChange(row.id, e.target.value)}
                    aria-label={`${sheet.title} — ${row.description} — Remark`}
                  />
                </TableCell>
              </TableRow>
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
