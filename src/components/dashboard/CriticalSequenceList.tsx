import { CRITICAL_SEQUENCE } from '../../domain/rules'

export function CriticalSequenceList() {
  return (
    <ol className="list-decimal space-y-2 pl-5 text-sm">
      {CRITICAL_SEQUENCE.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  )
}
