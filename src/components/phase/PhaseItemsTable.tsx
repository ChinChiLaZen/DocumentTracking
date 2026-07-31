import { Fragment } from 'react'
import { ExternalLink } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { PhaseHeaderRow } from './PhaseHeaderRow'
import { LIFECYCLE_PHASE_DEFS, WORKFLOW_STATUS_DEFS } from '../../domain/rules'
import { DOC_TYPE_BADGE_CLASS, IMPORTANCE_BADGE_CLASS } from '../shared/statusStyles'
import { DOA_SITE_LABEL } from '../../data/doaTemplate'
import { Badge } from '../ui/badge'
import type { Item, LifecyclePhase, WorkflowStatus } from '../../data/types'
import type { ItemMetaPatch } from '../../store/useTrackerStore'

const UNSET = '__unset__'
const COLUMN_COUNT = 8

interface PhaseItemsTableProps {
  items: Item[]
  disabled: boolean
  /** Item numbers with unsaved staged edits (§ Save changes) — rows get a highlight. */
  dirtyNos?: Set<number>
  onWorkflowStatusChange(itemNo: number, status: WorkflowStatus | undefined): void
  onPhaseChange(itemNo: number, phase: LifecyclePhase | undefined): void
  onMetaCommit(itemNo: number, patch: ItemMetaPatch): void
}

export function PhaseItemsTable({
  items,
  disabled,
  dirtyNos,
  onWorkflowStatusChange,
  onPhaseChange,
  onMetaCommit,
}: PhaseItemsTableProps) {
  const sections: { label: string; items: Item[] }[] = [
    { label: 'Unassigned', items: items.filter((item) => item.phase === undefined) },
    ...LIFECYCLE_PHASE_DEFS.map((phase) => ({
      label: phase.label,
      items: items.filter((item) => item.phase === phase.id),
    })),
  ]

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">#</TableHead>
          <TableHead scope="col">Document Name</TableHead>
          <TableHead scope="col">Phase</TableHead>
          <TableHead scope="col">Workflow Status</TableHead>
          <TableHead scope="col">Document Date</TableHead>
          <TableHead scope="col">Expiry Date</TableHead>
          <TableHead scope="col">Responsible Person</TableHead>
          <TableHead scope="col">Document Link</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sections.map((section) => {
          if (section.items.length === 0) return null
          return (
            <Fragment key={section.label}>
              <PhaseHeaderRow label={section.label} colSpan={COLUMN_COUNT} />
              {section.items.map((item) => (
                <TableRow
                  key={item.no}
                  className={dirtyNos?.has(item.no) ? 'border-l-2 border-l-amber-400' : undefined}
                >
                  <TableCell className="whitespace-nowrap">{item.code ?? item.no}</TableCell>
                  <TableCell className="max-w-64 min-w-40 whitespace-normal break-words">
                    {item.name}
                    {item.code && (
                      <div className="mt-1 space-y-1">
                        {item.importance && (
                          <Badge variant="outline" className={IMPORTANCE_BADGE_CLASS[item.importance]}>
                            {item.importance}
                          </Badge>
                        )}
                        {item.docType && (
                          <Badge variant="outline" className={DOC_TYPE_BADGE_CLASS[item.docType]}>
                            {item.docType}
                          </Badge>
                        )}
                        {item.site && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            {DOA_SITE_LABEL[item.site]}
                          </span>
                        )}
                        {(item.standard || item.requirement) && (
                          <p className="text-xs text-muted-foreground">
                            {item.requirement}
                            {item.requirement && item.standard && ' — '}
                            {item.standard}
                          </p>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      disabled={disabled}
                      value={item.phase ?? UNSET}
                      onValueChange={(value) =>
                        onPhaseChange(item.no, value === UNSET ? undefined : (value as LifecyclePhase))
                      }
                    >
                      <SelectTrigger size="sm" aria-label={`${item.name} — phase`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNSET}>—</SelectItem>
                        {LIFECYCLE_PHASE_DEFS.map((def) => (
                          <SelectItem key={def.id} value={def.id}>
                            {def.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      disabled={disabled}
                      value={item.workflowStatus ?? UNSET}
                      onValueChange={(value) =>
                        onWorkflowStatusChange(
                          item.no,
                          value === UNSET ? undefined : (value as WorkflowStatus),
                        )
                      }
                    >
                      <SelectTrigger size="sm" aria-label={`${item.name} — workflow status`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNSET}>—</SelectItem>
                        {WORKFLOW_STATUS_DEFS.map((def) => (
                          <SelectItem key={def.id} value={def.id}>
                            {def.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      disabled={disabled}
                      value={item.documentDate ?? ''}
                      aria-label={`${item.name} — document date`}
                      onChange={(e) => {
                        const value = e.target.value || undefined
                        if (value !== item.documentDate) onMetaCommit(item.no, { documentDate: value })
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      disabled={disabled}
                      value={item.expiryDate ?? ''}
                      aria-label={`${item.name} — expiry date`}
                      onChange={(e) => {
                        const value = e.target.value || undefined
                        if (value !== item.expiryDate) onMetaCommit(item.no, { expiryDate: value })
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      disabled={disabled}
                      value={item.responsiblePerson ?? ''}
                      placeholder="Name"
                      aria-label={`${item.name} — responsible person`}
                      onChange={(e) => {
                        const value = e.target.value || undefined
                        if (value !== item.responsiblePerson)
                          onMetaCommit(item.no, { responsiblePerson: value })
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Input
                        disabled={disabled}
                        value={item.documentLink ?? ''}
                        placeholder="https://..."
                        aria-label={`${item.name} — document link`}
                        onChange={(e) => {
                          const value = e.target.value || undefined
                          if (value !== item.documentLink)
                            onMetaCommit(item.no, { documentLink: value })
                        }}
                      />
                      {item.documentLink && (
                        <Button variant="ghost" size="icon-xs" asChild>
                          <a
                            href={item.documentLink}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open ${item.name}'s document link`}
                          >
                            <ExternalLink />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Fragment>
          )
        })}
      </TableBody>
    </Table>
  )
}
