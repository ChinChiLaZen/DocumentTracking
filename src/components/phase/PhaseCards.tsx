import { FileSearch, Gavel, FileSignature, Wrench, ShieldCheck, Settings, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Progress } from '../ui/progress'
import { PHASE_COLOR_SLOTS } from '../shared/statusStyles'
import { phaseColorIndex } from '../../domain/schedule'
import type { LifecyclePhase } from '../../data/types'
import type { PhaseBucketCounts, PhaseProgressSummary } from '../../store/selectors'

const PHASE_ICON: Record<LifecyclePhase, typeof FileSearch> = {
  PreBidding: FileSearch,
  Bidding: Gavel,
  AfterContract: FileSignature,
  InstallationCommissioning: Wrench,
  Warranty: ShieldCheck,
  OperationMaintenance: Settings,
  Other: Circle,
}

function PhaseCardBody({
  label,
  counts,
  dashed,
  phaseId,
}: {
  label: string
  counts: PhaseBucketCounts
  dashed?: boolean
  phaseId?: LifecyclePhase
}) {
  const slot = phaseId ? PHASE_COLOR_SLOTS[phaseColorIndex(phaseId)] : undefined
  const Icon = phaseId ? PHASE_ICON[phaseId] : undefined
  return (
    <Card
      className={cn(
        dashed && 'border-dashed border-muted-foreground/40 bg-muted/20',
        slot && cn('border-l-4', slot.accentBorder),
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardDescription>{label}</CardDescription>
          {Icon && <Icon className={cn('size-4', slot?.icon)} aria-hidden="true" />}
        </div>
        <CardTitle className="text-2xl">
          {counts.done}/{counts.total}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={counts.percent} className={slot?.track} indicatorClassName={slot?.fill} />
        <p className="mt-1 text-xs text-muted-foreground">
          {counts.percent}% submitted
          {counts.inPreparation > 0 && ` · ${counts.inPreparation} in preparation`}
        </p>
      </CardContent>
    </Card>
  )
}

export function PhaseCards({ summaries }: { summaries: PhaseProgressSummary }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <PhaseCardBody label="Unassigned" counts={summaries.unassigned} dashed />
      {summaries.phases.map((summary) => (
        <PhaseCardBody
          key={summary.phase.id}
          label={summary.phase.label}
          counts={summary}
          phaseId={summary.phase.id}
        />
      ))}
    </div>
  )
}
