import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ProjectShell } from './components/layout/ProjectShell'
import { ProjectIndexPage } from './components/layout/ProjectIndexPage'
import { ProjectsSummaryPage } from './components/projects/ProjectsSummaryPage'
import { TrackerPage } from './components/tracker/TrackerPage'
import { PriorityPage } from './components/priority/PriorityPage'
import { ItemDetailsPage } from './components/itemDetails/ItemDetailsPage'
import { PhaseDashboardPage } from './components/phase/PhaseDashboardPage'
import { GuidelinesPage } from './components/guidelines/GuidelinesPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <ProjectsSummaryPage /> },
      {
        path: 'projects/:projectId',
        element: <ProjectShell />,
        children: [
          { index: true, element: <ProjectIndexPage /> },
          { path: 'tracker', element: <TrackerPage /> },
          { path: 'priority/a', element: <PriorityPage priority="A" /> },
          { path: 'priority/b', element: <PriorityPage priority="B" /> },
          { path: 'priority/c', element: <PriorityPage priority="C" /> },
          { path: 'items', element: <ItemDetailsPage /> },
          { path: 'phase', element: <PhaseDashboardPage /> },
          { path: 'guidelines', element: <GuidelinesPage /> },
        ],
      },
    ],
  },
])
