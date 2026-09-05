import { useMemo } from 'react'
import { useActiveProject } from '../../store/useActiveProject'
import { selectRollup } from '../../store/selectors'
import { ExportMenu } from '../shared/ExportMenu'
import { OverviewCards } from './OverviewCards'
import { SubmissionProgress } from './SubmissionProgress'
import { ByPriorityTable } from './ByPriorityTable'
import { CriticalSequenceList } from './CriticalSequenceList'
import { QuickNavigation } from './QuickNavigation'
import { IntegrityLine } from './IntegrityLine'

export function DashboardPage() {
  const { items, sheets, meta, basePath } = useActiveProject()
  const rollup = useMemo(() => selectRollup({ items, sheets }), [items, sheets])

  return (
    <div className="h-full space-y-6 overflow-auto p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        {meta && <ExportMenu project={{ meta, items, sheets }} />}
      </div>

      <OverviewCards rollup={rollup} />
      <SubmissionProgress rollup={rollup} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold">By Priority</h2>
          <ByPriorityTable rollup={rollup} />
        </div>
        <div>
          <CriticalSequenceList />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold">Quick Navigation</h2>
        <QuickNavigation basePath={basePath} />
      </div>

      <IntegrityLine rollup={rollup} />
    </div>
  )
}
