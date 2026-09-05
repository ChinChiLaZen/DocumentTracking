import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Badge } from '../ui/badge'
import { PRIORITY_BADGE_CLASS } from '../shared/statusStyles'

const LINKS: { to: string; label: string; className?: string }[] = [
  { to: '/tracker', label: 'Tracker' },
  { to: '/priority/a', label: 'Priority A', className: PRIORITY_BADGE_CLASS.A },
  { to: '/priority/b', label: 'Priority B', className: PRIORITY_BADGE_CLASS.B },
  { to: '/priority/c', label: 'Priority C', className: PRIORITY_BADGE_CLASS.C },
  { to: '/items', label: 'Item Details' },
  { to: '/phase', label: 'Phase Progress' },
  { to: '/guidelines', label: 'Guidelines' },
]

export function QuickNavigation({ basePath }: { basePath: string }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {LINKS.map((link) => (
        <li key={link.to}>
          <Badge asChild variant="outline" className={cn('cursor-pointer hover:opacity-80', link.className)}>
            <Link to={`${basePath}${link.to}`}>{link.label}</Link>
          </Badge>
        </li>
      ))}
    </ul>
  )
}
