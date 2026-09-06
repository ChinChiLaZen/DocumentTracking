import { ListOrdered } from 'lucide-react'
import { CRITICAL_SEQUENCE } from '../../domain/rules'
import { OrderedRuleBanner } from '../shared/OrderedRuleBanner'

export function CriticalSequenceList({ lines = CRITICAL_SEQUENCE }: { lines?: string[] }) {
  return (
    <OrderedRuleBanner
      heading="Follow this order — do not skip a step"
      lines={lines}
      tone="amber"
      icon={ListOrdered}
    />
  )
}
