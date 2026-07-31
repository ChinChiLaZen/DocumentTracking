import { useActiveProject } from '../../store/useActiveProject'
import { DashboardPage } from '../dashboard/DashboardPage'
import { PhaseDashboardPage } from '../phase/PhaseDashboardPage'

/** The project's index route — picks the right "home" view per templateKind. */
export function ProjectIndexPage() {
  const { meta } = useActiveProject()
  return meta?.templateKind === 'aot' || meta?.templateKind === 'doa' ? (
    <PhaseDashboardPage />
  ) : (
    <DashboardPage />
  )
}
