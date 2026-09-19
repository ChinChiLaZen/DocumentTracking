import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { useAwardedContractsStore } from '../../store/useAwardedContractsStore'
import { useAuthStore } from '../../store/useAuthStore'
import { EGP_SEARCH_KEYWORD } from '../../data/procurementLeads'
import { AGENCY_OPTIONS, SUB_UNIT_OPTIONS } from '../../data/egpContractFilters'

function formatTHB(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function currentBuddhistYear(): number {
  return new Date().getFullYear() + 543
}

const ALL_SUB_UNITS = '__all__'
const ALL_AGENCIES = '__all__'

export function AwardedContractsPage() {
  const [keyword, setKeyword] = useState(EGP_SEARCH_KEYWORD)
  const [year, setYear] = useState(currentBuddhistYear())
  const [subUnit, setSubUnit] = useState(ALL_SUB_UNITS)
  const [agency, setAgency] = useState(ALL_AGENCIES)

  const snapshot = useAwardedContractsStore((s) => s.snapshot)
  const loaded = useAwardedContractsStore((s) => s.loaded)
  const refreshing = useAwardedContractsStore((s) => s.refreshing)
  const error = useAwardedContractsStore((s) => s.error)
  const fetchSnapshot = useAwardedContractsStore((s) => s.fetchSnapshot)
  const refresh = useAwardedContractsStore((s) => s.refresh)

  const role = useAuthStore((s) => s.user?.role)
  const canRefresh = role === 'admin' || role === 'ProjectManager'

  useEffect(() => {
    if (!loaded) void fetchSnapshot()
  }, [loaded, fetchSnapshot])

  const leads = snapshot?.leads ?? []

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Awarded Contracts</h1>
          <p className="text-sm text-muted-foreground">
            Live from Thailand&rsquo;s official EGP-CONTRACT open-data API — already-awarded government
            procurement contracts, not open bid opportunities. For open opportunities to bid on, see{' '}
            <span className="font-medium">Find Projects</span> instead.
            {snapshot && (
              <>
                {' '}
                Last refreshed by {snapshot.updatedBy} ({snapshot.leads.length} results for &ldquo;
                {snapshot.keyword}&rdquo;, FY{snapshot.year}
                {snapshot.subUnit && <>, sub-unit &ldquo;{snapshot.subUnit}&rdquo;</>}
                {snapshot.agency && <>, agency &ldquo;{snapshot.agency}&rdquo;</>}).
              </>
            )}
          </p>
        </div>
        {canRefresh && (
          <div className="flex items-center gap-2">
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Keyword..."
              aria-label="EGP-CONTRACT search keyword"
              className="w-48"
            />
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              aria-label="Budget year (Buddhist calendar)"
              className="w-24"
            />
            <Select value={subUnit} onValueChange={setSubUnit} disabled={refreshing}>
              <SelectTrigger className="w-auto min-w-40" aria-label="Sub-unit">
                <SelectValue placeholder="Sub-unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SUB_UNITS}>All sub-units</SelectItem>
                {SUB_UNIT_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={agency} onValueChange={setAgency} disabled={refreshing}>
              <SelectTrigger className="w-auto min-w-40" aria-label="Agency">
                <SelectValue placeholder="Agency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_AGENCIES}>All agencies</SelectItem>
                {AGENCY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={refreshing || keyword.trim() === ''}
              onClick={() =>
                void refresh(
                  keyword.trim(),
                  year,
                  subUnit === ALL_SUB_UNITS ? undefined : subUnit,
                  agency === ALL_AGENCIES ? undefined : agency,
                )
              }
            >
              <RefreshCw className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing…' : 'Refresh from EGP-CONTRACT'}
            </Button>
          </div>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {leads.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {loaded ? 'No data yet — click "Refresh from EGP-CONTRACT" to fetch.' : 'Loading…'}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">#</TableHead>
              <TableHead scope="col">Agency</TableHead>
              <TableHead scope="col">Sub-unit</TableHead>
              <TableHead scope="col">Project Name</TableHead>
              <TableHead scope="col">Budget (THB)</TableHead>
              <TableHead scope="col">Winner</TableHead>
              <TableHead scope="col">Contract No.</TableHead>
              <TableHead scope="col">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.projectId || lead.no}>
                <TableCell>{lead.no}</TableCell>
                <TableCell className="max-w-48 min-w-32 whitespace-normal break-words">{lead.deptName}</TableCell>
                <TableCell className="max-w-48 min-w-32 whitespace-normal break-words">{lead.deptSubName}</TableCell>
                <TableCell className="max-w-96 min-w-48 whitespace-normal break-words">{lead.projectName}</TableCell>
                <TableCell className="text-right whitespace-nowrap">{formatTHB(lead.budgetTHB)}</TableCell>
                <TableCell className="max-w-48 min-w-32 whitespace-normal break-words">{lead.winnerName}</TableCell>
                <TableCell className="whitespace-nowrap">{lead.contractNo}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    {lead.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
