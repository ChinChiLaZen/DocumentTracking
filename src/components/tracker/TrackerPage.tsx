import { useEffect, useMemo, useState } from 'react'
import { useActiveProject } from '../../store/useActiveProject'
import { useAuthStore } from '../../store/useAuthStore'
import { selectItemsWithStatus } from '../../store/selectors'
import { Button } from '../ui/button'
import { TrackerTable } from './TrackerTable'
import type { Item } from '../../data/types'

type PendingPatch = Partial<Pick<Item, 'group' | 'name' | 'standard' | 'requirement' | 'priority'>>

export function TrackerPage() {
  const { items: rawItems, sheets, basePath, updateItemMeta } = useActiveProject()
  const role = useAuthStore((s) => s.user?.role)
  const changedBy = useAuthStore((s) => s.user?.email) ?? 'Reviewer'
  const items = useMemo(
    () => selectItemsWithStatus({ items: rawItems, sheets }),
    [rawItems, sheets],
  )

  // Nothing here commits to the store until "Save changes" is clicked —
  // Group/Priority/Name/Standard/Requirement edits are all staged locally
  // first, matching Phase Progress's pattern. `items` only changes on a real
  // store mutation (Save, Reset-to-seed, switching projects), so it's safe to
  // clear pending edits whenever it changes.
  const [pending, setPending] = useState<Record<number, PendingPatch>>({})
  useEffect(() => setPending({}), [items])

  function stage(itemNo: number, patch: PendingPatch) {
    setPending((prev) => ({ ...prev, [itemNo]: { ...prev[itemNo], ...patch } }))
  }

  function handleSave() {
    for (const [itemNoStr, patch] of Object.entries(pending)) {
      const itemNo = Number(itemNoStr)
      const original = items.find((i) => i.no === itemNo)
      if (!original) continue
      const metaPatch: PendingPatch = {}
      for (const key of Object.keys(patch) as (keyof PendingPatch)[]) {
        if (patch[key] !== original[key]) (metaPatch as Record<string, unknown>)[key] = patch[key]
      }
      if (Object.keys(metaPatch).length > 0) updateItemMeta(itemNo, metaPatch, changedBy)
    }
    setPending({})
  }

  const pendingCount = Object.keys(pending).length
  const dirtyNos = new Set(Object.keys(pending).map(Number))
  const displayItems = items.map((item) => (pending[item.no] ? { ...item, ...pending[item.no] } : item))

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">Tracker</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" disabled={pendingCount === 0} onClick={() => setPending({})}>
            Discard
          </Button>
          <Button disabled={pendingCount === 0} onClick={handleSave}>
            Save changes{pendingCount > 0 ? ` (${pendingCount})` : ''}
          </Button>
        </div>
      </div>
      <TrackerTable
        items={displayItems}
        basePath={basePath}
        dirtyNos={dirtyNos}
        editable={role === 'admin'}
        onFieldCommit={(itemNo, patch) => stage(itemNo, patch)}
      />
    </div>
  )
}
