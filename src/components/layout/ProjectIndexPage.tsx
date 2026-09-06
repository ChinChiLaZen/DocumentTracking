import { useActiveProject } from '../../store/useActiveProject'
import { DashboardPage } from '../dashboard/DashboardPage'
import { PhaseDashboardPage } from '../phase/PhaseDashboardPage'
import { AdsbChecklistPage } from '../adsb/AdsbChecklistPage'

/** The project's index route — picks the right "home" view per templateKind.
 *  adsb stays a hardcoded literal check (accepted exception, see
 *  domain/templateRegistry.ts's plan notes) — its bespoke dual
 *  contractor/employer sign-off flow isn't generalizable to custom
 *  templates, unlike the hasDetailSheets-driven mar-vs-phase split below. */
export function ProjectIndexPage() {
  const { meta, template } = useActiveProject()
  if (meta?.templateKind === 'adsb') return <AdsbChecklistPage />
  return template.hasDetailSheets ? <DashboardPage /> : <PhaseDashboardPage />
}
