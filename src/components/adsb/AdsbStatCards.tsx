import type { AdsbProgress } from '../../store/selectors'

interface AdsbStatCardsProps {
  progress: AdsbProgress
  /** Role-specific labels — Contractor: Pass/Fail/N.A.; Employer: Accepted/Conditional/Rejected. */
  labels: { pass: string; fail: string; na: string }
}

const BOXES: { key: keyof AdsbProgress; className: string }[] = [
  { key: 'pass', className: 'bg-emerald-50 text-emerald-700' },
  { key: 'fail', className: 'bg-rose-50 text-rose-700' },
  { key: 'na', className: 'bg-amber-50 text-amber-700' },
]

export function AdsbStatCards({ progress, labels }: AdsbStatCardsProps) {
  const labelFor: Record<'pass' | 'fail' | 'na', string> = labels
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {BOXES.map(({ key, className }) => (
        <div key={key} className={`rounded-lg p-3 ${className}`}>
          <p className="text-2xl font-semibold">{progress[key]}</p>
          <p className="text-xs">{labelFor[key as 'pass' | 'fail' | 'na']}</p>
        </div>
      ))}
      <div className="rounded-lg bg-slate-100 p-3 text-slate-600">
        <p className="text-2xl font-semibold">{progress.pending}</p>
        <p className="text-xs">Pending</p>
      </div>
    </div>
  )
}
