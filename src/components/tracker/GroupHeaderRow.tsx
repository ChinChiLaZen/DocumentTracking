import { TableCell, TableRow } from '../ui/table'
import type { GroupDef } from '../../domain/rules'

export function GroupHeaderRow({ group, colSpan }: { group: GroupDef; colSpan: number }) {
  return (
    <TableRow className="bg-muted/60 hover:bg-muted/60">
      <TableCell colSpan={colSpan} className="font-semibold">
        {group.label}{' '}
        <span className="font-normal text-muted-foreground">(Items {group.itemRange})</span>
      </TableCell>
    </TableRow>
  )
}
