import { ListOrdered } from 'lucide-react'
import { CRITICAL_SEQUENCE } from '../../domain/rules'
import { OrderedRuleBanner } from '../shared/OrderedRuleBanner'

export function CriticalSequenceList() {
  return (
    <OrderedRuleBanner
      heading="Follow this order — do not skip a step"
      lines={CRITICAL_SEQUENCE}
      tone="amber"
      icon={ListOrdered}
    />
  )
}
