import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, ListTodo, UsersRound, Users } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'

const NAV_LINK_CLASS = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
    isActive ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted/50'
  }`

export function DashboardShell() {
  const role = useAuthStore((s) => s.user?.role)

  return (
    <div className="flex h-svh">
      <aside className="flex w-56 shrink-0 flex-col border-r bg-background">
        <div className="border-b px-4 py-4">
          <p className="text-sm font-semibold">MAR Tracker</p>
        </div>
        <nav className="flex-1 space-y-1 p-2" aria-label="Dashboard">
          <NavLink to="/" end className={NAV_LINK_CLASS}>
            <LayoutDashboard className="size-4" />
            Dashboard
          </NavLink>
          <NavLink to="/projects" className={NAV_LINK_CLASS}>
            <FolderKanban className="size-4" />
            Projects
          </NavLink>
          <NavLink to="/tasks" className={NAV_LINK_CLASS}>
            <ListTodo className="size-4" />
            My Tasks
          </NavLink>
          {role === 'admin' && (
            <NavLink to="/team" className={NAV_LINK_CLASS}>
              <UsersRound className="size-4" />
              Team
            </NavLink>
          )}
          {role === 'admin' && (
            <NavLink to="/users" className={NAV_LINK_CLASS}>
              <Users className="size-4" />
              User Management
            </NavLink>
          )}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
