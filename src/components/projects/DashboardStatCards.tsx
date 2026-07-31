import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card'
import type { DashboardStats } from '../../store/selectors'

const CARDS: { label: string; key: keyof DashboardStats }[] = [
  { label: 'Projects', key: 'projectCount' },
  { label: 'Total Items', key: 'totalItems' },
  { label: 'Submitted', key: 'totalDone' },
  { label: 'Overall Progress', key: 'percent' },
]

export function DashboardStatCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {CARDS.map(({ label, key }) => (
        <Card key={label}>
          <CardHeader>
            <CardDescription>{label}</CardDescription>
            <CardTitle className="text-2xl">
              {stats[key]}
              {key === 'percent' ? '%' : ''}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
