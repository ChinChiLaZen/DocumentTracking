import { Link } from 'react-router-dom'

const LINKS = [
  { to: '/tracker', label: 'Tracker' },
  { to: '/priority/a', label: 'Priority A' },
  { to: '/priority/b', label: 'Priority B' },
  { to: '/priority/c', label: 'Priority C' },
  { to: '/items', label: 'Item Details' },
  { to: '/guidelines', label: 'Guidelines' },
]

export function QuickNavigation() {
  return (
    <ul className="flex flex-wrap gap-3 text-sm">
      {LINKS.map((link) => (
        <li key={link.to}>
          <Link to={link.to} className="text-primary hover:underline">
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}
