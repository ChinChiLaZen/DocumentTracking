import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Rollup } from '../../domain/derive'

export function IntegrityLine({ rollup }: { rollup: Rollup }) {
  const ok = rollup.integrityOK
  const Icon = ok ? CheckCircle2 : AlertTriangle
  return (
    <p
      className={cn(
        'flex items-center gap-1.5 border-l-4 pl-2 text-xs',
        ok ? 'border-l-emerald-500 text-emerald-700' : 'border-l-rose-500 text-rose-700',
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {ok
        ? 'Data integrity check passed — totals reconcile across items, priorities, and statuses.'
        : 'Data integrity check FAILED — totals do not reconcile. Investigate before relying on this dashboard.'}
    </p>
  )
}
