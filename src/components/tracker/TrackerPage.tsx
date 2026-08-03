import { useMemo } from 'react'
import { useActiveProject } from '../../store/useActiveProject'
import { useAuthStore } from '../../store/useAuthStore'
import { selectItemsWithStatus } from '../../store/selectors'
import { TrackerTable } from './TrackerTable'

export function TrackerPage() {
  const { items: rawItems, sheets, basePath, updateItemMeta } = useActiveProject()
  const role = useAuthStore((s) => s.user?.role)
  const changedBy = useAuthStore((s) => s.user?.email) ?? 'Reviewer'
  const items = useMemo(
    () => selectItemsWithStatus({ items: rawItems, sheets }),
    [rawItems, sheets],
  )

  return (
    <div className="h-full overflow-auto p-6">
      <h1 className="mb-4 text-lg font-semibold">Tracker</h1>
      <TrackerTable
        items={items}
        basePath={basePath}
        editable={role === 'admin'}
        onFieldCommit={(itemNo, patch) => updateItemMeta(itemNo, patch, changedBy)}
      />
    </div>
  )
}
