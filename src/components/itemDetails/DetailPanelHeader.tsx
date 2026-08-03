import type { DetailSheet, Item, Status } from '../../data/types'
import { checksDone, checksRequired, percent } from '../../domain/derive'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { EditableField } from '../shared/EditableField'
import { PRIORITY_BADGE_CLASS, STATUS_BADGE_CLASS } from '../shared/statusStyles'

interface DetailPanelHeaderProps {
  item: Item
  status: Status
  isManual: boolean
  sheet: DetailSheet
  /** Admin-only inline editing of the sheet's title/applicable text. */
  editable?: boolean
  onTitleChange?: (title: string) => void
  onApplicableChange?: (applicable: string) => void
}

export function DetailPanelHeader({
  item,
  status,
  isManual,
  sheet,
  editable,
  onTitleChange,
  onApplicableChange,
}: DetailPanelHeaderProps) {
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
      {editable ? (
        <div className="mt-1 space-y-1">
          <EditableField
            value={sheet.title}
            onCommit={(value) => onTitleChange?.(value)}
            ariaLabel="Sheet title"
            className="text-lg font-semibold"
          />
          <EditableField
            value={sheet.applicable}
            onCommit={(value) => onApplicableChange?.(value)}
            ariaLabel="Sheet applicable standard"
            className="text-xs text-muted-foreground"
          />
        </div>
      ) : (
        <>
          <h2 className="mt-1 text-lg font-semibold">{sheet.title}</h2>
          <p className="text-xs text-muted-foreground">{sheet.applicable}</p>
        </>
      )}
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
