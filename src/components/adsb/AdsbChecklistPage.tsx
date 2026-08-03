import { useEffect, useMemo, useState } from 'react'
import { Printer } from 'lucide-react'
import { useActiveProject } from '../../store/useActiveProject'
import { useAuthStore } from '../../store/useAuthStore'
import { selectAdsbProgress } from '../../store/selectors'
import { ADSB_INSTALL_PHASE_DEFS } from '../../domain/rules'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Progress } from '../ui/progress'
import { HistoryDialog } from '../phase/HistoryDialog'
import { AdsbStatCards } from './AdsbStatCards'
import { AdsbItemCard } from './AdsbItemCard'
import type { Item } from '../../data/types'
import type { ItemMetaPatch } from '../../store/useTrackerStore'

type PendingPatch = Partial<
  Pick<
    Item,
    | 'result'
    | 'employerResult'
    | 'remark'
    | 'employerRemark'
    | 'resp'
    | 'standard'
    | 'torRef'
    | 'hwPoint'
    | 'installPhase'
    | 'nameTh'
    | 'name'
    | 'requirementTh'
    | 'requirement'
    | 'requiredEvidenceTh'
    | 'requiredEvidence'
  >
>

const ALL_PHASES = '__all__'

function matchesSearch(item: Item, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    (item.code ?? '').toLowerCase().includes(q) ||
    item.name.toLowerCase().includes(q) ||
    (item.nameTh ?? '').toLowerCase().includes(q) ||
    (item.resp ?? '').toLowerCase().includes(q)
  )
}

function RoleView({
  role,
  items,
  displayItems,
  dirtyNos,
  editable,
  onCommit,
}: {
  role: 'contractor' | 'employer'
  /** Persisted items — drives progress/stat cards, which only move once "Save changes" is clicked. */
  items: Item[]
  /** `items` with any staged edits merged in — drives the rendered cards. */
  displayItems: Item[]
  dirtyNos?: Set<number>
  editable?: boolean
  onCommit(itemNo: number, patch: ItemMetaPatch): void
}) {
  const [query, setQuery] = useState('')
  const [phaseFilter, setPhaseFilter] = useState(ALL_PHASES)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const scopedItems =
    role === 'employer' ? displayItems.filter((item) => item.employerIncluded) : displayItems
  const progress = selectAdsbProgress(items, role)

  const filtered = scopedItems.filter(
    (item) =>
      matchesSearch(item, query) &&
      (phaseFilter === ALL_PHASES || item.installPhase === phaseFilter),
  )

  const sections = ADSB_INSTALL_PHASE_DEFS.map((def) => ({
    def,
    items: filtered.filter((item) => item.installPhase === def.id),
  })).filter((section) => section.items.length > 0)

  const labels =
    role === 'employer'
      ? { pass: 'ยอมรับ / Accepted', fail: 'ไม่ยอมรับ / Rejected', na: 'มีเงื่อนไข / Conditional' }
      : { pass: 'ผ่าน / Pass', fail: 'ไม่ผ่าน / Fail', na: 'N/A' }

  function toggleSection(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">
            {role === 'employer'
              ? 'แบบตรวจสอบและบันทึกการติดตั้ง (สำหรับผู้ว่าจ้าง)'
              : 'แบบตรวจสอบและบันทึกการติดตั้ง (สำหรับผู้รับจ้าง)'}
          </h2>
          <p className="text-xs text-muted-foreground">
            Installation Check & Record Sheet — for {role === 'employer' ? 'Employer' : 'Contractor'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">
            {progress.total === 0 ? 0 : Math.round((progress.reviewed / progress.total) * 100)}%
          </p>
          <p className="text-xs text-muted-foreground">
            {progress.reviewed}/{progress.total} reviewed
          </p>
        </div>
      </div>

      <AdsbStatCards progress={progress} labels={labels} />

      <div className="no-print flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items, IDs, or responsibility..."
          className="max-w-sm"
        />
        <Select value={phaseFilter} onValueChange={setPhaseFilter}>
          <SelectTrigger className="w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_PHASES}>All phases</SelectItem>
            {ADSB_INSTALL_PHASE_DEFS.map((def) => (
              <SelectItem key={def.id} value={def.id}>
                {def.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
          <Printer />
          Print
        </Button>
      </div>

      {sections.map(({ def, items: sectionItems }) => {
        const sectionDone = sectionItems.filter((item) => {
          const value = role === 'employer' ? item.employerResult : item.result
          return value !== undefined
        }).length
        const isCollapsed = collapsed.has(def.id)
        return (
          <div key={def.id}>
            <button
              type="button"
              onClick={() => toggleSection(def.id)}
              className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-medium hover:bg-muted/50"
            >
              <span>{def.label}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <Progress
                  value={
                    sectionItems.length === 0 ? 0 : Math.round((sectionDone / sectionItems.length) * 100)
                  }
                  className="w-24"
                />
                {sectionDone}/{sectionItems.length}
              </span>
            </button>
            <div className={`mt-2 space-y-2 ${isCollapsed ? 'hidden print:block' : ''}`}>
              {sectionItems.map((item) => (
                <AdsbItemCard
                  key={item.no}
                  item={item}
                  role={role}
                  dirty={dirtyNos?.has(item.no)}
                  editable={editable}
                  onCommit={onCommit}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function AdsbChecklistPage() {
  const { items, history, updateItemMeta } = useActiveProject()
  const changedBy = useAuthStore((s) => s.user?.email) ?? 'Reviewer'
  const isAdmin = useAuthStore((s) => s.user?.role) === 'admin'

  // Nothing here commits to the store until "Save changes" is clicked —
  // Pass/Fail/remarks and (admin) text edits are all staged locally first,
  // matching Phase Progress's pattern. `items` only changes on a real store
  // mutation (Save, Reset-to-seed, switching projects), so it's safe to clear
  // pending edits whenever it changes.
  const [pending, setPending] = useState<Record<number, PendingPatch>>({})
  useEffect(() => setPending({}), [items])

  const stage = useMemo(
    () => (itemNo: number, patch: PendingPatch) =>
      setPending((prev) => ({ ...prev, [itemNo]: { ...prev[itemNo], ...patch } })),
    [],
  )

  function handleSave() {
    for (const [itemNoStr, patch] of Object.entries(pending)) {
      const itemNo = Number(itemNoStr)
      const original = items.find((i) => i.no === itemNo)
      if (!original) continue
      const metaPatch: PendingPatch = {}
      for (const key of Object.keys(patch) as (keyof PendingPatch)[]) {
        if (patch[key] !== original[key]) (metaPatch as Record<string, unknown>)[key] = patch[key]
      }
      if (Object.keys(metaPatch).length > 0) updateItemMeta(itemNo, metaPatch, changedBy)
    }
    setPending({})
  }

  const pendingCount = Object.keys(pending).length
  const dirtyNos = new Set(Object.keys(pending).map(Number))
  const displayItems = items.map((item) => (pending[item.no] ? { ...item, ...pending[item.no] } : item))

  return (
    <div className="h-full space-y-4 overflow-auto p-6 print:h-auto print:overflow-visible">
      <div className="no-print flex items-center justify-end gap-2">
        <Button variant="ghost" disabled={pendingCount === 0} onClick={() => setPending({})}>
          Discard
        </Button>
        <Button disabled={pendingCount === 0} onClick={handleSave}>
          Save changes{pendingCount > 0 ? ` (${pendingCount})` : ''}
        </Button>
        <HistoryDialog history={history} items={items} />
      </div>
      <Tabs defaultValue="contractor">
        <TabsList className="no-print">
          <TabsTrigger value="contractor">ผู้รับจ้าง / Contractor</TabsTrigger>
          <TabsTrigger value="employer">ผู้ว่าจ้าง / Employer</TabsTrigger>
        </TabsList>
        <TabsContent value="contractor">
          <RoleView
            role="contractor"
            items={items}
            displayItems={displayItems}
            dirtyNos={dirtyNos}
            editable={isAdmin}
            onCommit={stage}
          />
        </TabsContent>
        <TabsContent value="employer">
          <RoleView
            role="employer"
            items={items}
            displayItems={displayItems}
            dirtyNos={dirtyNos}
            editable={isAdmin}
            onCommit={stage}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
