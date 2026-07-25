import type { Priority } from '../../data/types'

export function PriorityPage({ priority }: { priority: Priority }) {
  return (
    <div className="p-6">
      <p className="text-muted-foreground">Priority {priority} — coming in Phase 6.</p>
    </div>
  )
}
