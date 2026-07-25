import { Checkbox } from '../ui/checkbox'
import { Button } from '../ui/button'

interface BulkActionsBarProps {
  totalRows: number
  selectedCount: number
  onSelectAll: (on: boolean) => void
  onCheckAll: () => void
  onUncheckAll: () => void
  onToggleAll: () => void
}

export function BulkActionsBar({
  totalRows,
  selectedCount,
  onSelectAll,
  onCheckAll,
  onUncheckAll,
  onToggleAll,
}: BulkActionsBarProps) {
  const scopeLabel = selectedCount > 0 ? `${selectedCount} selected` : 'all rows'

  return (
    <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-2">
      <Checkbox
        checked={selectedCount > 0 && selectedCount === totalRows}
        onCheckedChange={(checked) => onSelectAll(Boolean(checked))}
        aria-label="Select all rows"
      />
      <span className="text-xs text-muted-foreground">{scopeLabel}</span>
      <div className="ml-auto flex gap-2">
        <Button variant="outline" size="sm" onClick={onCheckAll}>
          Check all cells
        </Button>
        <Button variant="outline" size="sm" onClick={onUncheckAll}>
          Uncheck all cells
        </Button>
        <Button variant="outline" size="sm" onClick={onToggleAll}>
          Toggle cells
        </Button>
      </div>
    </div>
  )
}
