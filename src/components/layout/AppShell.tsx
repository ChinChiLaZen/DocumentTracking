import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useTrackerStore } from '../../store/useTrackerStore'
import { useAuthStore } from '../../store/useAuthStore'

export function AppShell() {
  const hydrate = useTrackerStore((s) => s.hydrate)
  const initAuth = useAuthStore((s) => s.init)
  const user = useAuthStore((s) => s.user)
  const authLoading = useAuthStore((s) => s.loading)
  const location = useLocation()

  useEffect(() => {
    hydrate()
    initAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (authLoading) {
    return <div className="flex h-svh items-center justify-center text-sm text-muted-foreground">Loading…</div>
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return <Outlet />
}
