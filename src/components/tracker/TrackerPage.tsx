import { useMemo } from 'react'
import { useTrackerStore } from '../../store/useTrackerStore'
import { selectItemsWithStatus } from '../../store/selectors'
import { TrackerTable } from './TrackerTable'

export function TrackerPage() {
  const rawItems = useTrackerStore((s) => s.items)
  const sheets = useTrackerStore((s) => s.sheets)
  const items = useMemo(
    () => selectItemsWithStatus({ items: rawItems, sheets }),
    [rawItems, sheets],
  )

  return (
    <div className="h-full overflow-auto p-6">
      <h1 className="mb-4 text-lg font-semibold">Tracker</h1>
      <TrackerTable items={items} />
    </div>
  )
}
