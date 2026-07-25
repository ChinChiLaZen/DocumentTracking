import { useMemo } from 'react'
import { useTrackerStore } from '../../store/useTrackerStore'
import { selectItemsWithStatus } from '../../store/selectors'
import { TrackerTable } from '../tracker/TrackerTable'
import { PRIORITY_DEFS } from '../../domain/rules'
import type { Priority } from '../../data/types'

export function PriorityPage({ priority }: { priority: Priority }) {
  const rawItems = useTrackerStore((s) => s.items)
  const sheets = useTrackerStore((s) => s.sheets)
  const items = useMemo(() => {
    const withStatus = selectItemsWithStatus({ items: rawItems, sheets })
    return withStatus.filter((item) => item.priority === priority)
  }, [rawItems, sheets, priority])

  const def = PRIORITY_DEFS.find((d) => d.id === priority)!

  return (
    <div className="h-full overflow-auto p-6">
      <h1 className="mb-1 text-lg font-semibold">{def.label}</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        {def.description} Read-only mirror of the Tracker — no independent editing.
      </p>
      <TrackerTable items={items} />
    </div>
  )
}
