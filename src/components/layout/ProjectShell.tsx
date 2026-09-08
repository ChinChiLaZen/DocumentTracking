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

// Task Board — Monday.com-style free-form task tracker, independent of
// checklist structure — shown for every templateKind, same posture as
// Project Management/BOQ Estimate above.
const TASK_BOARD_TAB: TabDef = { to: '/board', label: 'Task Board' }

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
  TASK_BOARD_TAB,
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
  TASK_BOARD_TAB,
]

function formatPreparedDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    date,
  )
}

export function ProjectShell() {
  const { notFound, meta, basePath, template } = useActiveProject()

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

  const tabs = template.tabSet === 'full' ? MAR_TABS : SINGLE_TAB
  const csiEntry = findCsiEntry(meta.projectType)

  return (
    <div className="flex h-svh flex-col">
      <header className="no-print border-b border-border bg-background">
        <div className="flex items-start justify-between px-6 py-4">
          <div>
            <Link to="/" className="text-xs text-muted-foreground hover:underline">
              ← All Projects
            </Link>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {meta.scope}
              {csiEntry && <> · {formatCsiEntry(csiEntry)}</>}
            </p>
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{meta.title}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {meta.vendor} · Prepared {formatPreparedDate(meta.preparedDate)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Preparation Date
              </p>
              <p className="text-sm font-medium text-foreground">
                {formatPreparedDate(meta.preparedDate)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ResetToSeedDialog />
              <UserMenu />
            </div>
          </div>
        </div>
        <nav className="flex gap-4 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={`${basePath}${tab.to}`}
              end={tab.end}
              className={({ isActive }) =>
                `border-b-2 px-1 py-2 text-sm ${
                  isActive
                    ? 'border-foreground font-medium text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
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
