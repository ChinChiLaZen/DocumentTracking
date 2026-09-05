import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type RuleBannerTone = 'rose' | 'amber'

const TONE_CLASS: Record<RuleBannerTone, { container: string; icon: string }> = {
  rose: { container: 'border-rose-200 bg-rose-50 text-rose-800', icon: 'text-rose-600' },
  amber: { container: 'border-amber-200 bg-amber-50 text-amber-800', icon: 'text-amber-600' },
}

interface OrderedRuleBannerProps {
  heading: string
  lines: string[]
  tone: RuleBannerTone
  icon: LucideIcon
}

export function OrderedRuleBanner({ heading, lines, tone, icon: Icon }: OrderedRuleBannerProps) {
  const cls = TONE_CLASS[tone]
  return (
    <div className={cn('rounded-lg border p-4 text-sm', cls.container)}>
      <p className="mb-2 flex items-center gap-2 font-semibold">
        <Icon className={cn('size-4 shrink-0', cls.icon)} aria-hidden="true" />
        {heading}
      </p>
      <ol className="list-decimal space-y-1 pl-4">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
    </div>
  )
}
