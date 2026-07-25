import { useMemo } from 'react'
import { useTrackerStore } from '../../store/useTrackerStore'
import { selectRollup } from '../../store/selectors'
import { OverviewCards } from './OverviewCards'
import { SubmissionProgress } from './SubmissionProgress'
import { ByPriorityTable } from './ByPriorityTable'
import { CriticalSequenceList } from './CriticalSequenceList'
import { QuickNavigation } from './QuickNavigation'
import { IntegrityLine } from './IntegrityLine'

export function DashboardPage() {
  const items = useTrackerStore((s) => s.items)
  const sheets = useTrackerStore((s) => s.sheets)
  const rollup = useMemo(() => selectRollup({ items, sheets }), [items, sheets])

  return (
    <div className="h-full space-y-6 overflow-auto p-6">
      <h1 className="text-lg font-semibold">Dashboard</h1>

      <OverviewCards rollup={rollup} />
      <SubmissionProgress rollup={rollup} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold">By Priority</h2>
          <ByPriorityTable rollup={rollup} />
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold">Critical Sequence</h2>
          <CriticalSequenceList />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold">Quick Navigation</h2>
        <QuickNavigation />
      </div>

      <IntegrityLine rollup={rollup} />
    </div>
  )
}
