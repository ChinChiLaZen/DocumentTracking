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
      <div>
        <p className="mb-1 text-sm font-medium">
          Overall Submission — {rollup.byStatus.Submitted} of {rollup.totalItems} ({submittedPct}%)
        </p>
        <Progress value={submittedPct} />
      </div>
      <div>
        <p className="mb-1 text-sm font-medium">
          Checkbox Roll-up — {rollup.checkboxRollup.done} of {rollup.checkboxRollup.req} (
          {checkboxPct}%)
        </p>
        <Progress value={checkboxPct} />
      </div>
    </div>
  )
}
