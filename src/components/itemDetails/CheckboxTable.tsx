import { Fragment } from 'react'
import type { DetailSheet } from '../../data/types'
import { Checkbox } from '../ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

interface CheckboxTableProps {
  sheet: DetailSheet
  selectedRowIds: Set<string>
  onToggleCell: (rowId: string, columnKey: string) => void
  onToggleRowSelection: (rowId: string) => void
}

export function CheckboxTable({
  sheet,
  selectedRowIds,
  onToggleCell,
  onToggleRowSelection,
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
                {column.label}
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
              >
                <TableCell>
                  <Checkbox
                    checked={selectedRowIds.has(row.id)}
                    onCheckedChange={() => onToggleRowSelection(row.id)}
                    aria-label={`Select row — ${row.description}`}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">{row.article ?? ''}</TableCell>
                <TableCell>{row.description}</TableCell>
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
                <TableCell className="text-muted-foreground">{row.remark ?? ''}</TableCell>
              </TableRow>
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
