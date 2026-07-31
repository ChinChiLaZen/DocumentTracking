import { Link, NavLink, Outlet } from 'react-router-dom'
import { ResetToSeedDialog } from './ResetToSeedDialog'
import { useActiveProject } from '../../store/useActiveProject'
import { findCsiEntry, formatCsiEntry } from '../../data/csiMasterFormat'

const MAR_TABS = [
  { to: '', label: 'Dashboard', end: true },
  { to: '/tracker', label: 'Tracker' },
  { to: '/priority/a', label: 'Priority A' },
  { to: '/priority/b', label: 'Priority B' },
  { to: '/priority/c', label: 'Priority C' },
  { to: '/items', label: 'Item Details' },
  { to: '/phase', label: 'Phase Progress' },
  { to: '/guidelines', label: 'Guidelines' },
]

// AOT/DOA projects have no Group/Priority/checkbox detail sheets (§7) — the
// single Dashboard tab IS the full Phase Progress-style register, so
// Tracker/Priority/Item Details/Guidelines aren't linked.
const SINGLE_TAB = [{ to: '', label: 'Dashboard', end: true }]

function formatPreparedDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    date,
  )
}

export function ProjectShell() {
  const { notFound, meta, basePath } = useActiveProject()

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

  const tabs = meta.templateKind === 'aot' || meta.templateKind === 'doa' ? SINGLE_TAB : MAR_TABS
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
      <main className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
