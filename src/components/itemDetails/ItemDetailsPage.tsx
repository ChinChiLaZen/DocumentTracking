import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useActiveProject } from '../../store/useActiveProject'
import { useAuthStore } from '../../store/useAuthStore'
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
  article?: string
  description?: string
}

interface PendingSheetHeaderPatch {
  title?: string
  applicable?: string
}

function pendingKey(sheetId: string, rowId: string): string {
  return `${sheetId}:${rowId}`
}

function columnPendingKey(sheetId: string, columnKey: string): string {
  return `${sheetId}::${columnKey}`
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
    updateRowText,
    updateColumnLabel,
    updateSheetHeader,
    toggleRowSelection,
    selectAllRows,
  } = useActiveProject()
  const isAdmin = useAuthStore((s) => s.user?.role) === 'admin'

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
  const [pendingColumnLabels, setPendingColumnLabels] = useState<Record<string, string>>({})
  const [pendingSheetHeader, setPendingSheetHeader] = useState<
    Record<string, PendingSheetHeaderPatch>
  >({})
  useEffect(() => {
    setPending({})
    setPendingColumnLabels({})
    setPendingSheetHeader({})
  }, [sheets])

  const pendingCount =
    Object.keys(pending).length +
    Object.keys(pendingColumnLabels).length +
    Object.keys(pendingSheetHeader).length

  if (!sheet || !item) {
    return <div className="p-6 text-muted-foreground">No detail sheet found for this item.</div>
  }

  function mergeSheet(sheet: DetailSheet): DetailSheet {
    const headerPatch = pendingSheetHeader[sheet.id]
    return {
      ...sheet,
      ...(headerPatch ?? {}),
      columns: sheet.columns.map((column) => {
        const label = pendingColumnLabels[columnPendingKey(sheet.id, column.key)]
        return label === undefined ? column : { ...column, label }
      }),
      rows: sheet.rows.map((row) => {
        const patch = pending[pendingKey(sheet.id, row.id)]
        if (!patch) return row
        return {
          ...row,
          cells: patch.cells ? { ...row.cells, ...patch.cells } : row.cells,
          remark: patch.remark ?? row.remark,
          article: patch.article ?? row.article,
          description: patch.description ?? row.description,
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

  function stageArticle(rowId: string, article: string) {
    const key = pendingKey(sheet!.id, rowId)
    setPending((prev) => ({ ...prev, [key]: { ...prev[key], article } }))
  }

  function stageDescription(rowId: string, description: string) {
    const key = pendingKey(sheet!.id, rowId)
    setPending((prev) => ({ ...prev, [key]: { ...prev[key], description } }))
  }

  function stageColumnLabel(columnKey: string, label: string) {
    setPendingColumnLabels((prev) => ({ ...prev, [columnPendingKey(sheet!.id, columnKey)]: label }))
  }

  function stageSheetHeader(patch: PendingSheetHeaderPatch) {
    setPendingSheetHeader((prev) => ({
      ...prev,
      [sheet!.id]: { ...prev[sheet!.id], ...patch },
    }))
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
      const textPatch: { article?: string; description?: string } = {}
      if (patch.article !== undefined && patch.article !== (row.article ?? '')) {
        textPatch.article = patch.article
      }
      if (patch.description !== undefined && patch.description !== row.description) {
        textPatch.description = patch.description
      }
      if (Object.keys(textPatch).length > 0) updateRowText(sheetId, rowId, textPatch)
    }
    for (const [key, label] of Object.entries(pendingColumnLabels)) {
      const sepIndex = key.indexOf('::')
      const sheetId = key.slice(0, sepIndex)
      const columnKey = key.slice(sepIndex + 2)
      const targetSheet = sheets.find((s) => s.id === sheetId)
      const column = targetSheet?.columns.find((c) => c.key === columnKey)
      if (column && column.label !== label) updateColumnLabel(sheetId, columnKey, label)
    }
    for (const [sheetId, patch] of Object.entries(pendingSheetHeader)) {
      const targetSheet = sheets.find((s) => s.id === sheetId)
      if (!targetSheet) continue
      const headerPatch: { title?: string; applicable?: string } = {}
      if (patch.title !== undefined && patch.title !== targetSheet.title) headerPatch.title = patch.title
      if (patch.applicable !== undefined && patch.applicable !== targetSheet.applicable) {
        headerPatch.applicable = patch.applicable
      }
      if (Object.keys(headerPatch).length > 0) updateSheetHeader(sheetId, headerPatch)
    }
    setPending({})
    setPendingColumnLabels({})
    setPendingSheetHeader({})
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
          <Button
            variant="ghost"
            disabled={pendingCount === 0}
            onClick={() => {
              setPending({})
              setPendingColumnLabels({})
              setPendingSheetHeader({})
            }}
          >
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
          editable={isAdmin}
          onTitleChange={(title) => stageSheetHeader({ title })}
          onApplicableChange={(applicable) => stageSheetHeader({ applicable })}
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
            editable={isAdmin}
            onToggleCell={(rowId, columnKey) => {
              const current = displaySheet.rows.find((r) => r.id === rowId)?.cells[columnKey] ?? false
              stageCell(rowId, columnKey, !current)
            }}
            onToggleRowSelection={(rowId) => toggleRowSelection(sheet.id, rowId)}
            onRemarkChange={(rowId, remark) => stageRemark(rowId, remark)}
            onArticleChange={(rowId, article) => stageArticle(rowId, article)}
            onDescriptionChange={(rowId, description) => stageDescription(rowId, description)}
            onColumnLabelChange={(columnKey, label) => stageColumnLabel(columnKey, label)}
          />
        </div>
      </div>
    </div>
  )
}
