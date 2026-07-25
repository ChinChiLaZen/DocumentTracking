import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card'
import type { Rollup } from '../../domain/derive'
import { STATUS_BADGE_CLASS } from '../shared/statusStyles'

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
        const colorClass = key === 'total' ? '' : STATUS_BADGE_CLASS[key].split(' ').pop()
        return (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className={`text-2xl ${colorClass ?? ''}`}>{value}</CardTitle>
            </CardHeader>
          </Card>
        )
      })}
    </div>
  )
}
