import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { ResetToSeedDialog } from './ResetToSeedDialog'
import { useTrackerStore } from '../../store/useTrackerStore'

const TABS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/tracker', label: 'Tracker' },
  { to: '/priority/a', label: 'Priority A' },
  { to: '/priority/b', label: 'Priority B' },
  { to: '/priority/c', label: 'Priority C' },
  { to: '/items', label: 'Item Details' },
  { to: '/guidelines', label: 'Guidelines' },
]

export function AppShell() {
  const hydrate = useTrackerStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-svh flex-col">
      <header className="no-print bg-header-band text-white">
        <div className="flex items-start justify-between px-6 py-4">
          <div>
            <h1 className="text-base font-semibold">
              Civil Works — Second Runway &amp; Taxiway, U-Tapao International Airport
            </h1>
            <p className="text-xs text-white/70">
              Airfield Lighting, Section 28 01 00 · Airsafe Airport Equipment Co., Ltd. · Prepared 7
              July 2026
            </p>
          </div>
          <ResetToSeedDialog />
        </div>
        <nav className="flex gap-1 px-6" aria-label="Tabs">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `rounded-t px-3 py-2 text-sm ${
                  isActive ? 'bg-background text-foreground' : 'text-white/80 hover:bg-white/10'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
