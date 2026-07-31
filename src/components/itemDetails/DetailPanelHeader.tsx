import type { DetailSheet, Item, Status } from '../../data/types'
import { checksDone, checksRequired, percent } from '../../domain/derive'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { PRIORITY_BADGE_CLASS, STATUS_BADGE_CLASS } from '../shared/statusStyles'

interface DetailPanelHeaderProps {
  item: Item
  status: Status
  isManual: boolean
  sheet: DetailSheet
}

export function DetailPanelHeader({ item, status, isManual, sheet }: DetailPanelHeaderProps) {
  const required = checksRequired(sheet)
  const done = checksDone(sheet)
  const pct = Math.round(percent(sheet) * 100)

  return (
    <div className="border-b p-4">
      <div className="flex items-center gap-2">
        {item.priority && (
          <Badge variant="outline" className={PRIORITY_BADGE_CLASS[item.priority]}>
            {item.priority}
          </Badge>
        )}
        <span className="text-sm text-muted-foreground">
          Item {item.no} · {item.group}
        </span>
      </div>
      <h2 className="mt-1 text-lg font-semibold">{sheet.title}</h2>
      <p className="text-xs text-muted-foreground">{sheet.applicable}</p>
      <div className="mt-2 flex items-center gap-2">
        <Badge variant="outline" className={STATUS_BADGE_CLASS[status]}>
          {status}
        </Badge>
        {isManual && (
          <Badge variant="outline" className="text-xs">
            MANUAL
          </Badge>
        )}
      </div>
      <div className="mt-3 max-w-md">
        <p className="mb-1 text-xs text-muted-foreground">
          {done} of {required} checks ticked · {pct}%
        </p>
        <Progress value={pct} />
      </div>
    </div>
  )
}
