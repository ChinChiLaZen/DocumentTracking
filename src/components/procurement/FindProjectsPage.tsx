import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { PROCUREMENT_STATUS_BADGE_CLASS } from '../shared/statusStyles'
import { RefreshLeadsDialog } from './RefreshLeadsDialog'
import {
  buildEgpSearchUrl,
  EGP_SEARCH_KEYWORD,
  PROCUREMENT_LEADS,
  PROCUREMENT_LEADS_BUDGET_YEAR,
  PROCUREMENT_LEADS_CAPTURED_DATE,
} from '../../data/procurementLeads'
import { useProcurementLeadsStore } from '../../store/useProcurementLeadsStore'
import { getLeadId } from '../../domain/procurementLeadId'
import type { ProcurementLead } from '../../data/types'

const ALL_UNITS = '__all__'
const ALL_STATUSES = '__all__'

function formatTHB(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Days between the snapshot's capture date and today — drives the staleness badge below. Never negative (clamped) since a capture date is always in the past. */
function daysSinceCaptured(capturedDate: string): number {
  const capturedAt = new Date(`${capturedDate}T00:00:00Z`).getTime()
  const now = Date.now()
  return Math.max(0, Math.floor((now - capturedAt) / (1000 * 60 * 60 * 24)))
}

/** No live refresh is possible (e-GP is Cloudflare-gated — see procurementLeads.ts), so this is purely a visual cue for "go check e-GP and paste an update." Thresholds are a rough heuristic, not an SLA. */
function stalenessBadgeClass(days: number): string {
  if (days <= 2) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (days <= 6) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-rose-200 bg-rose-50 text-rose-700'
}

function stalenessLabel(days: number): string {
  if (days === 0) return 'Updated today'
  return `Updated ${days} day${days === 1 ? '' : 's'} ago`
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

const DEFAULT_TITLE = 'ITS Tracker'

export function FindProjectsPage() {
  const [nameQuery, setNameQuery] = useState('')
  const [unitFilter, setUnitFilter] = useState(ALL_UNITS)
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES)
  const [egpKeyword, setEgpKeyword] = useState(EGP_SEARCH_KEYWORD)
  const [selectedNos, setSelectedNos] = useState<Set<number>>(new Set())

  const snapshot = useProcurementLeadsStore((s) => s.snapshot)
  const snapshotLoaded = useProcurementLeadsStore((s) => s.loaded)
  const saving = useProcurementLeadsStore((s) => s.saving)
  const saveError = useProcurementLeadsStore((s) => s.error)
  const fetchSnapshot = useProcurementLeadsStore((s) => s.fetchSnapshot)
  const saveSnapshot = useProcurementLeadsStore((s) => s.saveSnapshot)
  const resetSnapshot = useProcurementLeadsStore((s) => s.resetSnapshot)

  useEffect(() => {
    if (!snapshotLoaded) void fetchSnapshot()
  }, [snapshotLoaded, fetchSnapshot])

  const sourceLeads = snapshot?.leads ?? PROCUREMENT_LEADS
  const capturedDate = snapshot?.capturedDate ?? PROCUREMENT_LEADS_CAPTURED_DATE

  // Scoped to airport purchasing units only — excludes the incidental keyword
  // matches (hospital drone pads, a ministry vegetation-maintenance unit) that
  // aren't actually airport procurement, per the user's request to query only
  // Purchasing Units containing "ท่าอากาศยาน" (airport).
  const airportLeads = useMemo(
    () => sourceLeads.filter((lead) => lead.purchasingUnit.includes('ท่าอากาศยาน')),
    [sourceLeads],
  )

  const purchasingUnits = useMemo(
    () => Array.from(new Set(airportLeads.map((lead) => lead.purchasingUnit))).sort((a, b) => a.localeCompare(b, 'th')),
    [airportLeads],
  )

  const statuses = useMemo(
    () => Array.from(new Set(airportLeads.map((lead) => lead.status))).sort((a, b) => a.localeCompare(b, 'th')),
    [airportLeads],
  )

  const staleDays = daysSinceCaptured(capturedDate)

  // Reflects staleness in the browser tab title too, so it's visible without
  // switching to this tab (e.g. after opening "Search live on e-GP" in a new
  // one) — same document.title-sync pattern ProjectShell.tsx uses.
  useEffect(() => {
    document.title = `Find Projects (${stalenessLabel(staleDays)}) — ITS Tracker`
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [staleDays])

  const filtered = useMemo(() => {
    const q = nameQuery.trim().toLowerCase()
    return airportLeads.filter(
      (lead) =>
        (unitFilter === ALL_UNITS || lead.purchasingUnit === unitFilter) &&
        (statusFilter === ALL_STATUSES || lead.status === statusFilter) &&
        (q === '' || lead.projectName.toLowerCase().includes(q)),
    )
  }, [airportLeads, nameQuery, unitFilter, statusFilter])

  async function handleApplyPaste(newLeads: ProcurementLead[]) {
    // Append, not replace — renumber the pasted rows to continue the existing
    // "ลำดับ" sequence (e-GP's own No. column always restarts at 1 per search,
    // so reusing it verbatim would collide with rows already saved).
    const maxNo = sourceLeads.reduce((max, lead) => Math.max(max, lead.no), 0)
    const renumbered = newLeads.map((lead, i) => ({ ...lead, no: maxNo + i + 1 }))
    const combined = [...sourceLeads, ...renumbered]

    const result = await saveSnapshot(combined, todayISO())
    if (!result.error) {
      setSelectedNos(new Set())
      setUnitFilter(ALL_UNITS)
      setStatusFilter(ALL_STATUSES)
    }
    return result
  }

  function toggleRow(no: number, checked: boolean) {
    setSelectedNos((prev) => {
      const next = new Set(prev)
      if (checked) next.add(no)
      else next.delete(no)
      return next
    })
  }

  function toggleAllShown(checked: boolean) {
    setSelectedNos((prev) => {
      const next = new Set(prev)
      for (const lead of filtered) {
        if (checked) next.add(lead.no)
        else next.delete(lead.no)
      }
      return next
    })
  }

  // Deletes the checked rows from the current list (built-in or DB-backed)
  // and saves what's left — or clears the DB row entirely (falling back to
  // the built-in snapshot) if that empties the list, since the snapshot
  // can't be saved as an empty array (see api/procurement/leads.ts's
  // validation). No renumbering needed here: the displayed "#" is always the
  // row's position in the currently-shown list (see the table body below),
  // not the stored `no` — so it already starts at 1 no matter what's stored.
  async function handleDeleteSelected() {
    const remaining = sourceLeads.filter((lead) => !selectedNos.has(lead.no))
    const result = remaining.length === 0 ? await resetSnapshot() : await saveSnapshot(remaining, todayISO())
    if (!result.error) {
      setSelectedNos(new Set())
      setUnitFilter(ALL_UNITS)
      setStatusFilter(ALL_STATUSES)
    }
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Find Projects</h1>
            <Badge variant="outline" className={stalenessBadgeClass(staleDays)}>
              {stalenessLabel(staleDays)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Snapshot of {airportLeads.length} airport-purchasing-unit e-GP results (of {sourceLeads.length} total)
            {snapshot
              ? `, last updated by ${snapshot.updatedBy}`
              : ` for “${EGP_SEARCH_KEYWORD}”, FY${PROCUREMENT_LEADS_BUDGET_YEAR}`}{' '}
            — captured {capturedDate}. Not live: search results aren&rsquo;t fetched automatically — use
            &ldquo;Update snapshot&rdquo; after checking e-GP yourself.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={egpKeyword}
            onChange={(e) => setEgpKeyword(e.target.value)}
            placeholder="e-GP search keyword..."
            aria-label="e-GP search keyword"
            className="w-56"
          />
          <Button type="button" variant="outline" size="sm" asChild>
            <a href={buildEgpSearchUrl(egpKeyword.trim())} target="_blank" rel="noreferrer">
              <ExternalLink />
              Search live on e-GP
            </a>
          </Button>
          <RefreshLeadsDialog saving={saving} saveError={saveError} onApply={handleApplyPaste} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={saving || selectedNos.size === 0}
            onClick={() => void handleDeleteSelected()}
          >
            Delete snapshot{selectedNos.size > 0 ? ` (${selectedNos.size})` : ''}
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={nameQuery}
          onChange={(e) => setNameQuery(e.target.value)}
          placeholder="Filter by project name..."
          className="max-w-sm"
        />
        <Select value={unitFilter} onValueChange={setUnitFilter}>
          <SelectTrigger className="w-auto min-w-48">
            <SelectValue placeholder="Purchasing unit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_UNITS}>All purchasing units</SelectItem>
            {purchasingUnits.map((unit) => (
              <SelectItem key={unit} value={unit}>
                {unit}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-auto min-w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {filtered.length} of {airportLeads.length} shown
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="w-8">
              <Checkbox
                checked={filtered.length > 0 && filtered.every((lead) => selectedNos.has(lead.no))}
                onCheckedChange={(checked) => toggleAllShown(checked === true)}
                aria-label="Select all shown rows"
              />
            </TableHead>
            <TableHead scope="col">#</TableHead>
            <TableHead scope="col">Agency</TableHead>
            <TableHead scope="col">Purchasing Unit</TableHead>
            <TableHead scope="col">Project Name</TableHead>
            <TableHead scope="col">Budget (THB)</TableHead>
            <TableHead scope="col">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((lead, index) => (
            <TableRow key={lead.no}>
              <TableCell>
                <Checkbox
                  checked={selectedNos.has(lead.no)}
                  onCheckedChange={(checked) => toggleRow(lead.no, checked === true)}
                  aria-label={`Select row ${index + 1}`}
                />
              </TableCell>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="max-w-48 min-w-32 whitespace-normal break-words">{lead.agency}</TableCell>
              <TableCell className="max-w-48 min-w-32 whitespace-normal break-words">
                {lead.purchasingUnit}
              </TableCell>
              <TableCell className="max-w-96 min-w-48 whitespace-normal break-words">
                <Link to={`/find-projects/${getLeadId(lead)}`} className="text-primary hover:underline">
                  {lead.projectName}
                </Link>
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">{formatTHB(lead.budgetTHB)}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={PROCUREMENT_STATUS_BADGE_CLASS[lead.status] ?? 'border-slate-200 bg-slate-50 text-slate-700'}
                >
                  {lead.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
