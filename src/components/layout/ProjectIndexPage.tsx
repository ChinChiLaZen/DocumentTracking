import { useActiveProject } from '../../store/useActiveProject'
import { DashboardPage } from '../dashboard/DashboardPage'
import { PhaseDashboardPage } from '../phase/PhaseDashboardPage'
import { AdsbChecklistPage } from '../adsb/AdsbChecklistPage'

/** The project's index route — picks the right "home" view per templateKind. */
export function ProjectIndexPage() {
  const { meta } = useActiveProject()
  if (meta?.templateKind === 'adsb') return <AdsbChecklistPage />
  return meta?.templateKind === 'aot' || meta?.templateKind === 'doa' ? (
    <PhaseDashboardPage />
  ) : (
    <DashboardPage />
  )
}
