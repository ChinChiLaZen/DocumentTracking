import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Badge } from '../ui/badge'
import type { Rollup } from '../../domain/derive'
import { PRIORITY_DEFS } from '../../domain/rules'
import { PRIORITY_BADGE_CLASS, PRIORITY_TEXT_CLASS } from '../shared/statusStyles'
import type { PriorityDef } from '../../data/types'

export function ByPriorityTable({ rollup, priorities = PRIORITY_DEFS }: { rollup: Rollup; priorities?: PriorityDef[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Priority</TableHead>
          <TableHead scope="col">Total</TableHead>
          <TableHead scope="col">Submitted</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {priorities.map((def) => {
          const { total, done } = rollup.byPriority[def.id]
          return (
            <TableRow key={def.id}>
              <TableCell>
                <Badge variant="outline" className={PRIORITY_BADGE_CLASS[def.id]}>
                  {def.label}
                </Badge>
              </TableCell>
              <TableCell>{total}</TableCell>
              <TableCell className={cn('font-semibold', PRIORITY_TEXT_CLASS[def.id])}>{done}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
