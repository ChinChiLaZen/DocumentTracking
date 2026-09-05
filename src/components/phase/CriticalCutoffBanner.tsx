import { AlertTriangle } from 'lucide-react'
import { OrderedRuleBanner } from '../shared/OrderedRuleBanner'

interface CriticalCutoffBannerProps {
  heading: string
  lines: string[]
}

export function CriticalCutoffBanner({ heading, lines }: CriticalCutoffBannerProps) {
  return <OrderedRuleBanner heading={heading} lines={lines} tone="rose" icon={AlertTriangle} />
}
