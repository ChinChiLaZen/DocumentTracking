import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTrackerStore } from '../../store/useTrackerStore'
import { DETAIL_SHEET_ORDER } from '../../domain/rules'
import { effectiveStatus } from '../../domain/derive'
import { SheetSidebar } from './SheetSidebar'
import { DetailPanelHeader } from './DetailPanelHeader'
import { BulkActionsBar } from './BulkActionsBar'
import { CheckboxTable } from './CheckboxTable'

export function ItemDetailsPage() {
  const [searchParams] = useSearchParams()
  const items = useTrackerStore((s) => s.items)
  const sheets = useTrackerStore((s) => s.sheets)
  const selectedRowIds = useTrackerStore((s) => s.selectedRowIds)
  const toggleCell = useTrackerStore((s) => s.toggleCell)
  const setRowRemark = useTrackerStore((s) => s.setRowRemark)
  const toggleRowSelection = useTrackerStore((s) => s.toggleRowSelection)
  const selectAllRows = useTrackerStore((s) => s.selectAllRows)
  const bulkSetCells = useTrackerStore((s) => s.bulkSetCells)
  const bulkToggleCells = useTrackerStore((s) => s.bulkToggleCells)

  const sheetsByItemNo = useMemo(() => new Map(sheets.map((s) => [s.itemNo, s])), [sheets])

  const requestedItem = Number(searchParams.get('item'))
  const selectedItemNo = DETAIL_SHEET_ORDER.includes(requestedItem)
    ? requestedItem
    : DETAIL_SHEET_ORDER[0]

  const sheet = sheetsByItemNo.get(selectedItemNo)
  const item = items.find((i) => i.no === selectedItemNo)

  if (!sheet || !item) {
    return <div className="p-6 text-muted-foreground">No detail sheet found for this item.</div>
  }

  const rowSelection = selectedRowIds[sheet.id] ?? new Set<string>()
  const scope = rowSelection.size > 0 ? 'selected' : 'all'
  const status = effectiveStatus(item, sheet)

  return (
    <div className="flex h-full">
      <SheetSidebar sheetsByItemNo={sheetsByItemNo} selectedItemNo={selectedItemNo} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DetailPanelHeader
          item={item}
          status={status}
          isManual={Boolean(item.manualStatus)}
          sheet={sheet}
        />
        <BulkActionsBar
          totalRows={sheet.rows.length}
          selectedCount={rowSelection.size}
          onSelectAll={(on) => selectAllRows(sheet.id, on)}
          onCheckAll={() => bulkSetCells(sheet.id, true, scope)}
          onUncheckAll={() => bulkSetCells(sheet.id, false, scope)}
          onToggleAll={() => bulkToggleCells(sheet.id, scope)}
        />
        <div className="min-h-0 flex-1">
          <CheckboxTable
            sheet={sheet}
            selectedRowIds={rowSelection}
            onToggleCell={(rowId, columnKey) => toggleCell(sheet.id, rowId, columnKey)}
            onToggleRowSelection={(rowId) => toggleRowSelection(sheet.id, rowId)}
            onRemarkChange={(rowId, remark) => setRowRemark(sheet.id, rowId, remark)}
          />
        </div>
      </div>
    </div>
  )
}
