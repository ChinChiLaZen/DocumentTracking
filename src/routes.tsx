import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { TrackerPage } from './components/tracker/TrackerPage'
import { PriorityPage } from './components/priority/PriorityPage'
import { ItemDetailsPage } from './components/itemDetails/ItemDetailsPage'
import { GuidelinesPage } from './components/guidelines/GuidelinesPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'tracker', element: <TrackerPage /> },
      { path: 'priority/a', element: <PriorityPage priority="A" /> },
      { path: 'priority/b', element: <PriorityPage priority="B" /> },
      { path: 'priority/c', element: <PriorityPage priority="C" /> },
      { path: 'items', element: <ItemDetailsPage /> },
      { path: 'guidelines', element: <GuidelinesPage /> },
    ],
  },
])
