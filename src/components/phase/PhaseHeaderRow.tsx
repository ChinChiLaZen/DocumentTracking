import { TableCell, TableRow } from '../ui/table'

export function PhaseHeaderRow({ label, colSpan }: { label: string; colSpan: number }) {
  return (
    <TableRow className="bg-muted/60 hover:bg-muted/60">
      <TableCell colSpan={colSpan} className="font-semibold">
        {label}
      </TableCell>
    </TableRow>
  )
}
