import { useMemo } from 'react'
import { useActiveProject } from '../../store/useActiveProject'
import { selectItemsWithStatus } from '../../store/selectors'
import { TrackerTable } from './TrackerTable'

export function TrackerPage() {
  const { items: rawItems, sheets, basePath } = useActiveProject()
  const items = useMemo(
    () => selectItemsWithStatus({ items: rawItems, sheets }),
    [rawItems, sheets],
  )

  return (
    <div className="h-full overflow-auto p-6">
      <h1 className="mb-4 text-lg font-semibold">Tracker</h1>
      <TrackerTable items={items} basePath={basePath} />
    </div>
  )
}
