import { useState, type FormEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { MILESTONE_TYPE_DEFS } from '../../domain/rules'
import type { MilestoneType, ScheduleMilestone } from '../../data/types'

interface MilestoneFormDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  milestone?: ScheduleMilestone // present when editing, absent when adding
  onSubmit(input: Omit<ScheduleMilestone, 'id'>): void
}

const BLANK = { label: '', date: '', type: 'Other' as MilestoneType }

/**
 * The caller must remount this component (e.g. `key={sessionCounter}`) each
 * time it opens for a new/different milestone — local state is seeded once
 * from `milestone` via lazy initializers, not re-synced via an effect, so
 * reusing the same instance across opens would show a stale draft.
 */
export function MilestoneFormDialog({
  open,
  onOpenChange,
  milestone,
  onSubmit,
}: MilestoneFormDialogProps) {
  const [label, setLabel] = useState(milestone?.label ?? BLANK.label)
  const [date, setDate] = useState(milestone?.date ?? BLANK.date)
  const [type, setType] = useState<MilestoneType>(milestone?.type ?? BLANK.type)

  const canSubmit = label.trim() !== '' && date !== ''

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({ label: label.trim(), date, type })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{milestone ? 'Edit milestone' : 'Add milestone'}</DialogTitle>
            <DialogDescription>
              A dated marker plotted on the Project Management timeline (e.g. a delivery date or
              committee meeting).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="milestone-label">Label</Label>
              <Input
                id="milestone-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Deliver Phase 5"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="milestone-date">Date</Label>
              <Input
                id="milestone-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="milestone-type">Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as MilestoneType)}>
                <SelectTrigger id="milestone-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MILESTONE_TYPE_DEFS.map((def) => (
                    <SelectItem key={def.id} value={def.id}>
                      {def.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {milestone ? 'Save changes' : 'Add milestone'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
