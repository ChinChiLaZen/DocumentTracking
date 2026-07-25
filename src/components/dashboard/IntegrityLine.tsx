import type { Rollup } from '../../domain/derive'

export function IntegrityLine({ rollup }: { rollup: Rollup }) {
  return (
    <p
      className={`text-xs ${rollup.integrityOK ? 'text-status-submitted' : 'text-status-needsrevision'}`}
    >
      {rollup.integrityOK
        ? '✓ Data integrity check passed — totals reconcile across items, priorities, and statuses.'
        : '⚠ Data integrity check FAILED — totals do not reconcile. Investigate before relying on this dashboard.'}
    </p>
  )
}
