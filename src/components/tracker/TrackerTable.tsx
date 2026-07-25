import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Badge } from '../ui/badge'
import type { ItemWithStatus } from '../../store/selectors'
import { checksDone, checksRequired, percent } from '../../domain/derive'
import { GROUP_DEFS } from '../../domain/rules'
import { GroupHeaderRow } from './GroupHeaderRow'
import { PRIORITY_BADGE_CLASS, STATUS_BADGE_CLASS } from '../shared/statusStyles'

const COLUMN_COUNT = 8

export function TrackerTable({ items }: { items: ItemWithStatus[] }) {
  const byNo = new Map(items.map((item) => [item.no, item]))

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Group</TableHead>
          <TableHead>Document Name</TableHead>
          <TableHead>Standard</TableHead>
          <TableHead>Requirement</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Remark</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {GROUP_DEFS.map((group) => {
          const groupItems = items.filter((item) => item.group === group.id)
          if (groupItems.length === 0) return null
          return (
            <Fragment key={group.id}>
              <GroupHeaderRow group={group} colSpan={COLUMN_COUNT} />
              {groupItems.map((item) => {
                const sheet = byNo.get(item.no)?.sheet
                const isManual = Boolean(item.manualStatus)
                return (
                  <TableRow key={item.no}>
                    <TableCell>{item.no}</TableCell>
                    <TableCell>{item.group}</TableCell>
                    <TableCell className="max-w-64 min-w-40 whitespace-normal break-words">
                      {item.detailSheetId ? (
                        <Link
                          to={`/items?item=${item.no}`}
                          className="text-primary hover:underline"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        item.name
                      )}
                      {sheet && (
                        <p className="derived-cell mt-0.5 w-fit rounded px-1 text-xs">
                          {checksDone(sheet)} of {checksRequired(sheet)} ·{' '}
                          {Math.round(percent(sheet) * 100)}%
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="max-w-64 min-w-48 whitespace-normal break-words text-muted-foreground">
                      {item.standard}
                    </TableCell>
                    <TableCell className="max-w-64 min-w-48 whitespace-normal break-words text-muted-foreground">
                      {item.requirement}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={PRIORITY_BADGE_CLASS[item.priority]}>
                        {item.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className={STATUS_BADGE_CLASS[item.status]}>
                          {item.status}
                        </Badge>
                        {isManual && (
                          <Badge variant="outline" className="text-xs">
                            MANUAL
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-64 min-w-48 whitespace-normal break-words text-muted-foreground">
                      {item.displayRemark}
                    </TableCell>
                  </TableRow>
                )
              })}
            </Fragment>
          )
        })}
      </TableBody>
    </Table>
  )
}
