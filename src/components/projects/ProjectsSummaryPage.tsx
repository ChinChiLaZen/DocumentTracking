import { useTrackerStore } from '../../store/useTrackerStore'
import { selectAllProjectsSummary, selectDashboardStats } from '../../store/selectors'
import { DashboardStatCards } from './DashboardStatCards'
import { UserMenu } from '../auth/UserMenu'

export function ProjectsSummaryPage() {
  const projects = useTrackerStore((s) => s.projects)
  const projectOrder = useTrackerStore((s) => s.projectOrder)
  const summaries = selectAllProjectsSummary({ projects, projectOrder })
  const stats = selectDashboardStats(summaries)

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Vendor Approval / Material Approval Request tracking, across every project.
          </p>
        </div>
        <UserMenu />
      </div>

      <DashboardStatCards stats={stats} />
    </div>
  )
}
