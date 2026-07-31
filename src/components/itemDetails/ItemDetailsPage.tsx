import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useActiveProject } from '../../store/useActiveProject'
import { DETAIL_SHEET_ORDER } from '../../domain/rules'
import { effectiveStatus } from '../../domain/derive'
import { Button } from '../ui/button'
import { SheetSidebar } from './SheetSidebar'
import { DetailPanelHeader } from './DetailPanelHeader'
import { BulkActionsBar } from './BulkActionsBar'
import { CheckboxTable } from './CheckboxTable'
import type { DetailSheet } from '../../data/types'

type PendingCells = Record<string, boolean> // keyed by CheckColumn.key

interface PendingRowPatch {
  cells?: PendingCells
  remark?: string
}

function pendingKey(sheetId: string, rowId: string): string {
  return `${sheetId}:${rowId}`
}

export function ItemDetailsPage() {
  const [searchParams] = useSearchParams()
  const {
    items,
    sheets,
    selectedRowIds,
    basePath,
    toggleCell,
    setRowRemark,
    toggleRowSelection,
    selectAllRows,
  } = useActiveProject()

  const sheetsByItemNo = useMemo(() => new Map(sheets.map((s) => [s.itemNo, s])), [sheets])

  const requestedItem = Number(searchParams.get('item'))
  const selectedItemNo = DETAIL_SHEET_ORDER.includes(requestedItem)
    ? requestedItem
    : DETAIL_SHEET_ORDER[0]

  const sheet = sheetsByItemNo.get(selectedItemNo)
  const item = items.find((i) => i.no === selectedItemNo)

  // Nothing here commits to the store until "Save changes" is clicked —
  // checkbox ticks, Remark edits, and bulk actions are all staged locally
  // first, keyed by `${sheetId}:${rowId}`. `sheets` only changes on a real
  // store mutation (Save, Reset-to-seed, switching projects), so it's safe
  // to clear pending edits whenever it changes.
  const [pending, setPending] = useState<Record<string, PendingRowPatch>>({})
  useEffect(() => setPending({}), [sheets])

  const pendingCount = Object.keys(pending).length

  if (!sheet || !item) {
    return <div className="p-6 text-muted-foreground">No detail sheet found for this item.</div>
  }

  function mergeSheet(sheet: DetailSheet): DetailSheet {
    return {
      ...sheet,
      rows: sheet.rows.map((row) => {
        const patch = pending[pendingKey(sheet.id, row.id)]
        if (!patch) return row
        return {
          ...row,
          cells: patch.cells ? { ...row.cells, ...patch.cells } : row.cells,
          remark: patch.remark ?? row.remark,
        }
      }),
    }
  }

  const displaySheet = mergeSheet(sheet)
  const dirtyRowIds = new Set(
    Object.keys(pending)
      .filter((key) => key.startsWith(`${sheet.id}:`))
      .map((key) => key.slice(sheet.id.length + 1)),
  )

  function stageCell(rowId: string, columnKey: string, value: boolean) {
    const key = pendingKey(sheet!.id, rowId)
    setPending((prev) => ({
      ...prev,
      [key]: { ...prev[key], cells: { ...prev[key]?.cells, [columnKey]: value } },
    }))
  }

  function stageRemark(rowId: string, remark: string) {
    const key = pendingKey(sheet!.id, rowId)
    setPending((prev) => ({ ...prev, [key]: { ...prev[key], remark } }))
  }

  function stageBulk(mode: 'check' | 'uncheck' | 'toggle') {
    const rowSelection = selectedRowIds[sheet!.id] ?? new Set<string>()
    const targetRows =
      rowSelection.size > 0
        ? displaySheet.rows.filter((r) => rowSelection.has(r.id))
        : displaySheet.rows
    setPending((prev) => {
      const next = { ...prev }
      for (const row of targetRows) {
        const key = pendingKey(sheet!.id, row.id)
        const cells: PendingCells = {}
        for (const column of sheet!.columns) {
          const current = row.cells[column.key] ?? false
          cells[column.key] = mode === 'check' ? true : mode === 'uncheck' ? false : !current
        }
        next[key] = { ...next[key], cells: { ...next[key]?.cells, ...cells } }
      }
      return next
    })
  }

  function handleSave() {
    for (const [key, patch] of Object.entries(pending)) {
      const sepIndex = key.indexOf(':')
      const sheetId = key.slice(0, sepIndex)
      const rowId = key.slice(sepIndex + 1)
      const targetSheet = sheets.find((s) => s.id === sheetId)
      const row = targetSheet?.rows.find((r) => r.id === rowId)
      if (!row) continue
      if (patch.cells) {
        for (const [columnKey, value] of Object.entries(patch.cells)) {
          if ((row.cells[columnKey] ?? false) !== value) toggleCell(sheetId, rowId, columnKey)
        }
      }
      if (patch.remark !== undefined && patch.remark !== (row.remark ?? '')) {
        setRowRemark(sheetId, rowId, patch.remark)
      }
    }
    setPending({})
  }

  const rowSelection = selectedRowIds[sheet.id] ?? new Set<string>()
  const status = effectiveStatus(item, displaySheet)

  return (
    <div className="flex h-full">
      <SheetSidebar
        sheetsByItemNo={sheetsByItemNo}
        selectedItemNo={selectedItemNo}
        basePath={basePath}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-end gap-2 border-b px-4 py-2">
          <Button variant="ghost" disabled={pendingCount === 0} onClick={() => setPending({})}>
            Discard
          </Button>
          <Button disabled={pendingCount === 0} onClick={handleSave}>
            Save changes{pendingCount > 0 ? ` (${pendingCount})` : ''}
          </Button>
        </div>
        <DetailPanelHeader
          item={item}
          status={status}
          isManual={Boolean(item.manualStatus)}
          sheet={displaySheet}
        />
        <BulkActionsBar
          totalRows={sheet.rows.length}
          selectedCount={rowSelection.size}
          onSelectAll={(on) => selectAllRows(sheet.id, on)}
          onCheckAll={() => stageBulk('check')}
          onUncheckAll={() => stageBulk('uncheck')}
          onToggleAll={() => stageBulk('toggle')}
        />
        <div className="min-h-0 flex-1">
          <CheckboxTable
            sheet={displaySheet}
            selectedRowIds={rowSelection}
            dirtyRowIds={dirtyRowIds}
            onToggleCell={(rowId, columnKey) => {
              const current = displaySheet.rows.find((r) => r.id === rowId)?.cells[columnKey] ?? false
              stageCell(rowId, columnKey, !current)
            }}
            onToggleRowSelection={(rowId) => toggleRowSelection(sheet.id, rowId)}
            onRemarkChange={(rowId, remark) => stageRemark(rowId, remark)}
          />
        </div>
      </div>
    </div>
  )
}
