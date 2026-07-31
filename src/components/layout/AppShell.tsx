import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useTrackerStore } from '../../store/useTrackerStore'

export function AppShell() {
  const hydrate = useTrackerStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <Outlet />
}
