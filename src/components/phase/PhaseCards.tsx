import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Progress } from '../ui/progress'
import type { PhaseBucketCounts, PhaseProgressSummary } from '../../store/selectors'

function PhaseCardBody({ label, counts, dashed }: { label: string; counts: PhaseBucketCounts; dashed?: boolean }) {
  return (
    <Card className={cn(dashed && 'border-dashed border-muted-foreground/40 bg-muted/20')}>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">
          {counts.done}/{counts.total}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={counts.percent} />
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
        <PhaseCardBody key={summary.phase.id} label={summary.phase.label} counts={summary} />
      ))}
    </div>
  )
}
