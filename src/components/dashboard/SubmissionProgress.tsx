import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Progress } from '../ui/progress'
import type { Rollup } from '../../domain/derive'

export function SubmissionProgress({ rollup }: { rollup: Rollup }) {
  const submittedPct = Math.round((rollup.byStatus.Submitted / rollup.totalItems) * 100)
  const checkboxPct =
    rollup.checkboxRollup.req === 0
      ? 0
      : Math.round((rollup.checkboxRollup.done / rollup.checkboxRollup.req) * 100)

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Overall Submission</CardTitle>
            <span className="text-2xl font-bold">{submittedPct}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-1 text-xs text-muted-foreground">
            {rollup.byStatus.Submitted} / {rollup.totalItems} items submitted
          </p>
          <Progress value={submittedPct} indicatorClassName="bg-foreground" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Checkbox Roll-up</CardTitle>
            <span className="text-2xl font-bold">{checkboxPct}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-1 text-xs text-muted-foreground">
            {rollup.checkboxRollup.done} / {rollup.checkboxRollup.req} individual checks ticked
          </p>
          <Progress value={checkboxPct} indicatorClassName="bg-foreground" />
        </CardContent>
      </Card>
    </div>
  )
}
