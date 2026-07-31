import { useEffect, useState } from 'react'
import { useActiveProject } from '../../store/useActiveProject'
import { selectOverallPhaseProgress, selectPhaseSummary } from '../../store/selectors'
import { CRITICAL_SEQUENCE } from '../../domain/rules'
import { AOT_CRITICAL_NOTICE } from '../../data/aotTemplate'
import { Progress } from '../ui/progress'
import { Button } from '../ui/button'
import { CriticalCutoffBanner } from './CriticalCutoffBanner'
import { PhaseCards } from './PhaseCards'
import { PhaseItemsTable } from './PhaseItemsTable'
import { HistoryDialog } from './HistoryDialog'
import type { Item } from '../../data/types'
import type { ItemMetaPatch } from '../../store/useTrackerStore'

type PendingPatch = Partial<
  Pick<Item, 'phase' | 'workflowStatus' | 'documentDate' | 'expiryDate' | 'responsiblePerson' | 'documentLink'>
>

// No per-user auth (Clerk was removed) — audit history entries attribute to
// this fixed label rather than a signed-in reviewer's identity.
const CHANGED_BY = 'Reviewer'

export function PhaseDashboardPage() {
  const { items, history, meta, setWorkflowStatus, setPhase, updateItemMeta } = useActiveProject()

  // Nothing in the table commits to the store until "Save changes" is
  // clicked — every edit (Phase, Workflow Status, both dates, Responsible
  // Person, Document Link) is staged here first. `items` only changes on a
  // real store mutation (Save, Reset-to-seed, switching projects), so it's
  // safe to clear pending edits whenever it changes.
  const [pending, setPending] = useState<Record<number, PendingPatch>>({})
  useEffect(() => setPending({}), [items])

  function stage(itemNo: number, patch: PendingPatch) {
    setPending((prev) => ({ ...prev, [itemNo]: { ...prev[itemNo], ...patch } }))
  }

  function handleSave() {
    for (const [itemNoStr, patch] of Object.entries(pending)) {
      const itemNo = Number(itemNoStr)
      const original = items.find((i) => i.no === itemNo)
      if (!original) continue
      if ('phase' in patch && patch.phase !== original.phase) setPhase(itemNo, patch.phase, CHANGED_BY)
      if ('workflowStatus' in patch && patch.workflowStatus !== original.workflowStatus) {
        setWorkflowStatus(itemNo, patch.workflowStatus, CHANGED_BY)
      }
      const metaPatch: ItemMetaPatch = {}
      for (const key of ['documentDate', 'expiryDate', 'responsiblePerson', 'documentLink'] as const) {
        if (key in patch && patch[key] !== original[key]) metaPatch[key] = patch[key]
      }
      if (Object.keys(metaPatch).length > 0) updateItemMeta(itemNo, metaPatch, CHANGED_BY)
    }
    setPending({})
  }

  const pendingCount = Object.keys(pending).length
  const dirtyNos = new Set(Object.keys(pending).map(Number))
  const displayItems = items.map((item) => (pending[item.no] ? { ...item, ...pending[item.no] } : item))

  const summaries = selectPhaseSummary(items)
  const overall = selectOverallPhaseProgress(items)
  const isAot = meta?.templateKind === 'aot'
  // DOA's reference tracker has no equivalent critical-cutoff notice to
  // transcribe (§ "never fabricate standards") — its banner is simply omitted.
  const isDoa = meta?.templateKind === 'doa'
  const bannerHeading = isAot
    ? 'จุดตัดสิทธิ์สำคัญ — Critical eligibility cutoff'
    : 'Critical cutoff — review sequence must not be skipped'
  const bannerLines = isAot ? AOT_CRITICAL_NOTICE : CRITICAL_SEQUENCE

  return (
    <div className="h-full space-y-6 overflow-auto p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Phase Progress</h1>
          <p className="text-sm text-muted-foreground">
            {overall.done} of {overall.total} items submitted ({overall.percent}%)
          </p>
          <Progress value={overall.percent} className="mt-2 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            disabled={pendingCount === 0}
            onClick={() => setPending({})}
          >
            Discard
          </Button>
          <Button disabled={pendingCount === 0} onClick={handleSave}>
            Save changes{pendingCount > 0 ? ` (${pendingCount})` : ''}
          </Button>
          <HistoryDialog history={history} items={items} />
        </div>
      </div>

      {!isDoa && <CriticalCutoffBanner heading={bannerHeading} lines={bannerLines} />}

      <PhaseCards summaries={summaries} />

      <PhaseItemsTable
        items={displayItems}
        dirtyNos={dirtyNos}
        onWorkflowStatusChange={(itemNo, status) => stage(itemNo, { workflowStatus: status })}
        onPhaseChange={(itemNo, phase) => stage(itemNo, { phase })}
        onMetaCommit={(itemNo, patch) => stage(itemNo, patch)}
      />
    </div>
  )
}
