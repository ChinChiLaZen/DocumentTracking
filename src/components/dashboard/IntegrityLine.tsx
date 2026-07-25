import type { Rollup } from '../../domain/derive'

export function IntegrityLine({ rollup }: { rollup: Rollup }) {
  return (
    <p className={`text-xs ${rollup.integrityOK ? 'text-emerald-700' : 'text-rose-700'}`}>
      {rollup.integrityOK
        ? '✓ Data integrity check passed — totals reconcile across items, priorities, and statuses.'
        : '⚠ Data integrity check FAILED — totals do not reconcile. Investigate before relying on this dashboard.'}
    </p>
  )
}
