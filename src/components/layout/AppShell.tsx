import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Show, SignIn } from '@clerk/react'
import { useTrackerStore } from '../../store/useTrackerStore'

export function AppShell() {
  const hydrate = useTrackerStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Show when="signed-out">
        <div className="flex h-svh items-center justify-center bg-muted/40">
          <SignIn />
        </div>
      </Show>
      <Show when="signed-in">
        <Outlet />
      </Show>
    </>
  )
}
