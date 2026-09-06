import { useMemo } from 'react'
import { useActiveProject } from '../../store/useActiveProject'
import { selectItemsWithStatus } from '../../store/selectors'
import { TrackerTable } from '../tracker/TrackerTable'
import { PRIORITY_DEFS } from '../../domain/rules'
import type { Priority } from '../../data/types'

export function PriorityPage({ priority }: { priority: Priority }) {
  const { items: rawItems, sheets, basePath, template } = useActiveProject()
  const items = useMemo(() => {
    const withStatus = selectItemsWithStatus({ items: rawItems, sheets })
    return withStatus.filter((item) => item.priority === priority)
  }, [rawItems, sheets, priority])

  // Falls back to the built-in A/B/C defs if the resolved template somehow
  // doesn't define this priority id (defensive only — every hasPriority
  // template is constrained to exactly the 3 built-in ids, see
  // data/types.ts's TemplateDefinition).
  const def = template.priorities.find((d) => d.id === priority) ?? PRIORITY_DEFS.find((d) => d.id === priority)!

  return (
    <div className="h-full overflow-auto p-6">
      <h1 className="mb-1 text-lg font-semibold">{def.label}</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        {def.description} Read-only mirror of the Tracker — no independent editing.
      </p>
      <TrackerTable items={items} basePath={basePath} groups={template.groups} priorities={template.priorities} />
    </div>
  )
}
