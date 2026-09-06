import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useTrackerStore } from '../../store/useTrackerStore'
import { useTemplateStore } from '../../store/useTemplateStore'
import { useAuthStore } from '../../store/useAuthStore'

export function AppShell() {
  const hydrate = useTrackerStore((s) => s.hydrate)
  const hydrated = useTrackerStore((s) => s.hydrated)
  const hydrateTemplates = useTemplateStore((s) => s.hydrate)
  const templatesHydrated = useTemplateStore((s) => s.hydrated)
  const initAuth = useAuthStore((s) => s.init)
  const user = useAuthStore((s) => s.user)
  const authLoading = useAuthStore((s) => s.loading)
  const location = useLocation()

  useEffect(() => {
    // Templates must be hydrated before createProject/resetToSeed can
    // resolve a project's templateKind against the (possibly
    // admin-overridden) registry — see domain/templateRegistry.ts.
    void hydrateTemplates()
    void hydrate()
    initAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (authLoading || !hydrated || !templatesHydrated) {
    return <div className="flex h-svh items-center justify-center text-sm text-muted-foreground">Loading…</div>
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return <Outlet />
}
