import { useActiveProject } from '../../store/useActiveProject'
import { DashboardPage } from '../dashboard/DashboardPage'
import { PhaseDashboardPage } from '../phase/PhaseDashboardPage'
import { AdsbChecklistPage } from '../adsb/AdsbChecklistPage'

/** The project's index route — picks the right "home" view per templateKind.
 *  adsb stays a hardcoded literal check (accepted exception, see
 *  domain/templateRegistry.ts's plan notes) — its bespoke dual
 *  contractor/employer sign-off flow isn't generalizable to custom
 *  templates.
 *
 *  Keyed on `tabSet`, NOT `hasDetailSheets` — ProjectShell.tsx's tab bar is
 *  also keyed on `tabSet`, and the two must never disagree: DashboardPage
 *  assumes a 'full' template (checkbox rollup, By-Priority table, Quick
 *  Navigation links into Tracker/Priority/Item Details/Guidelines), all of
 *  which only exist in the 'full' tab set. A 'single' template with
 *  hasDetailSheets somehow true would otherwise render DashboardPage with
 *  dead Quick-Navigation links into tabs the nav bar doesn't expose. */
export function ProjectIndexPage() {
  const { meta, template } = useActiveProject()
  if (meta?.templateKind === 'adsb') return <AdsbChecklistPage />
  return template.tabSet === 'full' ? <DashboardPage /> : <PhaseDashboardPage />
}
