import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { EditableField } from '../shared/EditableField'
import type { ItemWithStatus } from '../../store/selectors'
import { checksDone, checksRequired, percent } from '../../domain/derive'
import { GROUP_DEFS, PRIORITY_DEFS } from '../../domain/rules'
import { GroupHeaderRow } from './GroupHeaderRow'
import { PRIORITY_BADGE_CLASS, STATUS_BADGE_CLASS } from '../shared/statusStyles'
import type { ItemMetaPatch } from '../../store/useTrackerStore'
import type { GroupId, Priority } from '../../data/types'

const COLUMN_COUNT = 8

interface TrackerTableProps {
  items: ItemWithStatus[]
  basePath: string
  /** Admin-only inline editing of Group/Name/Standard/Requirement/Priority — omit for read-only views (e.g. Priority A/B/C). */
  editable?: boolean
  onFieldCommit?(itemNo: number, patch: ItemMetaPatch): void
}

export function TrackerTable({ items, basePath, editable, onFieldCommit }: TrackerTableProps) {
  const byNo = new Map(items.map((item) => [item.no, item]))

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">#</TableHead>
          <TableHead scope="col">Group</TableHead>
          <TableHead scope="col">Document Name</TableHead>
          <TableHead scope="col">Standard</TableHead>
          <TableHead scope="col">Requirement</TableHead>
          <TableHead scope="col">Priority</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Remark</TableHead>
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
                    <TableCell>
                      {editable ? (
                        <Select
                          value={item.group ?? ''}
                          onValueChange={(value) => onFieldCommit?.(item.no, { group: value as GroupId })}
                        >
                          <SelectTrigger size="sm" aria-label={`${item.name} — group`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GROUP_DEFS.map((def) => (
                              <SelectItem key={def.id} value={def.id}>
                                {def.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        item.group
                      )}
                    </TableCell>
                    <TableCell className="max-w-64 min-w-40 whitespace-normal break-words">
                      {editable ? (
                        <EditableField
                          value={item.name}
                          onCommit={(value) => onFieldCommit?.(item.no, { name: value })}
                          ariaLabel={`${item.name} — name`}
                          requireApply
                        />
                      ) : item.detailSheetId ? (
                        <Link
                          to={`${basePath}/items?item=${item.no}`}
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
                      {editable ? (
                        <EditableField
                          as="textarea"
                          value={item.standard}
                          onCommit={(value) => onFieldCommit?.(item.no, { standard: value })}
                          ariaLabel={`${item.name} — standard`}
                          requireApply
                        />
                      ) : (
                        item.standard
                      )}
                    </TableCell>
                    <TableCell className="max-w-64 min-w-48 whitespace-normal break-words text-muted-foreground">
                      {editable ? (
                        <EditableField
                          as="textarea"
                          value={item.requirement}
                          onCommit={(value) => onFieldCommit?.(item.no, { requirement: value })}
                          ariaLabel={`${item.name} — requirement`}
                          requireApply
                        />
                      ) : (
                        item.requirement
                      )}
                    </TableCell>
                    <TableCell>
                      {editable ? (
                        <Select
                          value={item.priority ?? ''}
                          onValueChange={(value) =>
                            onFieldCommit?.(item.no, { priority: value as Priority })
                          }
                        >
                          <SelectTrigger size="sm" aria-label={`${item.name} — priority`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIORITY_DEFS.map((def) => (
                              <SelectItem key={def.id} value={def.id}>
                                {def.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        item.priority && (
                          <Badge variant="outline" className={PRIORITY_BADGE_CLASS[item.priority]}>
                            {item.priority}
                          </Badge>
                        )
                      )}
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
