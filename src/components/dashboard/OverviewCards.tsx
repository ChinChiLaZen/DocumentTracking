import { cn } from '@/lib/utils'
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card'
import type { Rollup } from '../../domain/derive'
import { STATUS_CARD_ACCENT, TOTAL_CARD_ACCENT } from '../shared/statusStyles'

const CARDS: { label: string; key: keyof Rollup['byStatus'] | 'total' }[] = [
  { label: 'Total', key: 'total' },
  { label: 'Submitted', key: 'Submitted' },
  { label: 'In Progress', key: 'In Progress' },
  { label: 'Pending', key: 'Pending' },
  { label: 'Needs Revision', key: 'Needs Revision' },
  { label: 'Not Available', key: 'Not Available' },
]

export function OverviewCards({ rollup }: { rollup: Rollup }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {CARDS.map(({ label, key }) => {
        const value = key === 'total' ? rollup.totalItems : rollup.byStatus[key]
        const accent = key === 'total' ? TOTAL_CARD_ACCENT : STATUS_CARD_ACCENT[key]
        const Icon = accent.icon
        return (
          <Card key={label} className={cn('border-l-4', accent.borderClass)}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription>{label}</CardDescription>
                <Icon className={cn('size-4', accent.textClass)} aria-hidden="true" />
              </div>
              <CardTitle className={cn('text-2xl font-bold', accent.textClass)}>{value}</CardTitle>
            </CardHeader>
          </Card>
        )
      })}
    </div>
  )
}
