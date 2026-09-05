import { useEffect } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { ResetToSeedDialog } from './ResetToSeedDialog'
import { UserMenu } from '../auth/UserMenu'
import { useActiveProject } from '../../store/useActiveProject'
import { findCsiEntry, formatCsiEntry } from '../../data/csiMasterFormat'

const DEFAULT_TITLE = 'ITS Tracker'

interface TabDef {
  to: string
  label: string
  end?: boolean
}

// Project Management (Gantt-style schedule) is generic project-scheduling
// data, independent of checklist structure — shown for every templateKind,
// unlike the MAR-only tabs below.
const PROJECT_MANAGEMENT_TAB: TabDef = { to: '/schedule', label: 'Project Management' }

// BOQ Estimate — generic project-costing data independent of checklist
// structure — shown for every templateKind, same posture as Project
// Management above.
const BOQ_ESTIMATE_TAB: TabDef = { to: '/boq', label: 'BOQ Estimate' }

const MAR_TABS: TabDef[] = [
  { to: '', label: 'Dashboard', end: true },
  { to: '/tracker', label: 'Tracker' },
  { to: '/priority/a', label: 'Priority A' },
  { to: '/priority/b', label: 'Priority B' },
  { to: '/priority/c', label: 'Priority C' },
  { to: '/items', label: 'Item Details' },
  { to: '/phase', label: 'Phase Progress' },
  PROJECT_MANAGEMENT_TAB,
  BOQ_ESTIMATE_TAB,
  { to: '/guidelines', label: 'Guidelines' },
]

// AOT/DOA/adsb projects have no Group/Priority/checkbox detail sheets (§7) —
// the single Dashboard tab IS the full Phase Progress-style register, so
// Tracker/Priority/Item Details/Guidelines aren't linked. Project Management
// and BOQ Estimate are still generic project-level data, so both are
// included here too.
const SINGLE_TAB: TabDef[] = [
  { to: '', label: 'Dashboard', end: true },
  PROJECT_MANAGEMENT_TAB,
  BOQ_ESTIMATE_TAB,
]

function formatPreparedDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    date,
  )
}

export function ProjectShell() {
  const { notFound, meta, basePath } = useActiveProject()

  // The on-screen header is `no-print`, so the project's title only reaches a
  // printed page via the browser's own print header, which is drawn from
  // document.title — keep it in sync with whichever project is open instead
  // of the static app-wide default from index.html.
  useEffect(() => {
    if (!meta) return
    document.title = meta.title
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [meta?.title])

  if (notFound || !meta) {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Project not found.</p>
        <Link to="/" className="text-sm text-primary hover:underline">
          ← All Projects
        </Link>
      </div>
    )
  }

  const tabs =
    meta.templateKind === 'aot' || meta.templateKind === 'doa' || meta.templateKind === 'adsb'
      ? SINGLE_TAB
      : MAR_TABS
  const csiEntry = findCsiEntry(meta.projectType)

  return (
    <div className="flex h-svh flex-col">
      <header className="no-print bg-header-band text-white">
        <div className="flex items-start justify-between px-6 py-4">
          <div>
            <Link to="/" className="text-xs text-white/70 hover:underline">
              ← All Projects
            </Link>
            <h1 className="text-base font-semibold">{meta.title}</h1>
            <p className="text-xs text-white/70">
              {meta.scope} · {meta.vendor} · Prepared {formatPreparedDate(meta.preparedDate)}
              {csiEntry && <> · {formatCsiEntry(csiEntry)}</>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ResetToSeedDialog />
            <UserMenu dark />
          </div>
        </div>
        <nav className="flex gap-1 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={`${basePath}${tab.to}`}
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
      {/* The header above is `no-print` — without this, a printed page would carry
          no visible title at all (browsers only show document.title in their own
          print header/footer, which many users print with disabled). */}
      <h1 className="hidden px-6 pt-4 text-base font-semibold print:block">{meta.title}</h1>
      <main className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
