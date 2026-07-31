import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { ScrollArea } from '../ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import type { HistoryEntry, HistoryField, Item } from '../../data/types'
import { filterHistory, selectHistorySorted } from '../../store/selectors'
import { LIFECYCLE_PHASE_DEFS, WORKFLOW_STATUS_DEFS } from '../../domain/rules'

const FIELD_LABEL: Record<HistoryField, string> = {
  workflowStatus: 'Workflow Status',
  phase: 'Phase',
  documentDate: 'Document Date',
  expiryDate: 'Expiry Date',
  responsiblePerson: 'Responsible Person',
  documentLink: 'Document Link',
}

const WORKFLOW_STATUS_LABEL = new Map<string, string>(
  WORKFLOW_STATUS_DEFS.map((def) => [def.id, def.label]),
)
const PHASE_VALUE_LABEL = new Map<string, string>(LIFECYCLE_PHASE_DEFS.map((def) => [def.id, def.label]))

/** Renders a raw stored field value (e.g. 'InstallationCommissioning') as its
 *  human label ('Installation & Commissioning') for workflowStatus/phase entries. */
function formatValue(field: HistoryField, value: string | undefined): string {
  if (value === undefined) return '—'
  if (field === 'workflowStatus') return WORKFLOW_STATUS_LABEL.get(value) ?? value
  if (field === 'phase') return PHASE_VALUE_LABEL.get(value) ?? value
  return value
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString()
}

export function HistoryDialog({ history, items }: { history: HistoryEntry[]; items: Item[] }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const itemByNo = useMemo(() => new Map(items.map((item) => [item.no, item])), [items])

  const visible = useMemo(
    () => filterHistory(selectHistorySorted(history), items, query),
    [history, items, query],
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          View History
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Status change history</DialogTitle>
          <DialogDescription>
            Every Phase Progress edit, logged automatically. Search by item number, name, or email.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search item number / name / email..."
        />
        <ScrollArea className="h-96 rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Time</TableHead>
                <TableHead scope="col">Item</TableHead>
                <TableHead scope="col">Field</TableHead>
                <TableHead scope="col">From → To</TableHead>
                <TableHead scope="col">By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {history.length === 0 ? 'No history yet.' : 'No entries match your search.'}
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatTimestamp(entry.timestamp)}
                    </TableCell>
                    <TableCell className="max-w-48 whitespace-normal break-words">
                      #{entry.itemNo} {itemByNo.get(entry.itemNo)?.name ?? ''}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{FIELD_LABEL[entry.field]}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatValue(entry.field, entry.from)} → {formatValue(entry.field, entry.to)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{entry.changedBy}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
