import { AlertTriangle, CheckCircle2, ClipboardList, Clock } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card'
import type { BoardStats } from '../../domain/board'

const CARDS: { label: string; key: keyof BoardStats; icon: typeof ClipboardList; textClass: string; borderClass: string }[] = [
  { label: 'Total Tasks', key: 'total', icon: ClipboardList, textClass: 'text-foreground', borderClass: 'border-l-slate-300' },
  { label: 'Done', key: 'done', icon: CheckCircle2, textClass: 'text-emerald-600', borderClass: 'border-l-emerald-500' },
  { label: 'In Progress', key: 'inProgress', icon: Clock, textClass: 'text-amber-600', borderClass: 'border-l-amber-500' },
  { label: 'Overdue', key: 'overdue', icon: AlertTriangle, textClass: 'text-rose-600', borderClass: 'border-l-rose-500' },
]

export function BoardStatCards({ stats }: { stats: BoardStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {CARDS.map(({ label, key, icon: Icon, textClass, borderClass }) => (
        <Card key={label} className={`border-l-4 ${borderClass}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardDescription>{label}</CardDescription>
              <Icon className={`size-4 ${textClass}`} aria-hidden="true" />
            </div>
            <CardTitle className={`text-2xl ${textClass}`}>{stats[key]}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
