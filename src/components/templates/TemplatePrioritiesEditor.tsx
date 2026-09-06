import type { PriorityDef } from '../../data/types'
import { Input } from '../ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

/** Exactly 3 fixed rows (A/B/C) — a hasPriority template can relabel them but
 *  never add/remove, since derive.ts's rollup, the Priority route pages, and
 *  routes.tsx's 3 hardcoded /priority/a|b|c routes all assume exactly this
 *  shape (see data/types.ts's TemplateDefinition doc comment). */
export function TemplatePrioritiesEditor({
  priorities,
  onChange,
}: {
  priorities: PriorityDef[]
  onChange(priorities: PriorityDef[]): void
}) {
  function updateAt(index: number, patch: Partial<PriorityDef>) {
    onChange(priorities.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  return (
    <div className="max-w-3xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Id</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {priorities.map((p, i) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.id}</TableCell>
              <TableCell>
                <Input value={p.label} onChange={(e) => updateAt(i, { label: e.target.value })} aria-label={`Priority ${p.id} label`} />
              </TableCell>
              <TableCell>
                <Input
                  value={p.description}
                  onChange={(e) => updateAt(i, { description: e.target.value })}
                  aria-label={`Priority ${p.id} description`}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
