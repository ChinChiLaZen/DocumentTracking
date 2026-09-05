import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { DashboardShell } from './components/layout/DashboardShell'
import { ProjectShell } from './components/layout/ProjectShell'
import { ProjectIndexPage } from './components/layout/ProjectIndexPage'
import { ProjectsSummaryPage } from './components/projects/ProjectsSummaryPage'
import { ProjectsListPage } from './components/projects/ProjectsListPage'
import { FindProjectsPage } from './components/procurement/FindProjectsPage'
import { ProjectLeadDetailPage } from './components/procurement/ProjectLeadDetailPage'
import { MyTasksPage } from './components/tasks/MyTasksPage'
import { TeamPage } from './components/team/TeamPage'
import { UserManagementPage } from './components/users/UserManagementPage'
import { TrackerPage } from './components/tracker/TrackerPage'
import { PriorityPage } from './components/priority/PriorityPage'
import { ItemDetailsPage } from './components/itemDetails/ItemDetailsPage'
import { PhaseDashboardPage } from './components/phase/PhaseDashboardPage'
import { ProjectManagementPage } from './components/schedule/ProjectManagementPage'
import { BoqEstimatePage } from './components/boq/BoqEstimatePage'
import { GuidelinesPage } from './components/guidelines/GuidelinesPage'
import { AuthPage } from './components/auth/AuthPage'

export const router = createBrowserRouter([
  { path: '/auth', element: <AuthPage /> },
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        element: <DashboardShell />,
        children: [
          { index: true, element: <ProjectsSummaryPage /> },
          { path: 'projects', element: <ProjectsListPage /> },
          { path: 'find-projects', element: <FindProjectsPage /> },
          { path: 'find-projects/:leadId', element: <ProjectLeadDetailPage /> },
          { path: 'tasks', element: <MyTasksPage /> },
          { path: 'team', element: <TeamPage /> },
          { path: 'users', element: <UserManagementPage /> },
        ],
      },
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
          { path: 'schedule', element: <ProjectManagementPage /> },
          { path: 'boq', element: <BoqEstimatePage /> },
          { path: 'guidelines', element: <GuidelinesPage /> },
        ],
      },
    ],
  },
])
