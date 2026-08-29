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
import type { SchedulePhase } from '../../data/types'

interface PhaseFormDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  phase?: SchedulePhase // present when editing, absent when adding
  onSubmit(input: Omit<SchedulePhase, 'id'>): void
}

const BLANK = { name: '', code: '', startDate: '', endDate: '', percentComplete: 0 }

/**
 * The caller must remount this component (e.g. `key={sessionCounter}`) each
 * time it opens for a new/different phase — local state is seeded once from
 * `phase` via lazy initializers, not re-synced via an effect, so reusing the
 * same instance across opens would show a stale draft.
 */
export function PhaseFormDialog({ open, onOpenChange, phase, onSubmit }: PhaseFormDialogProps) {
  const [name, setName] = useState(phase?.name ?? BLANK.name)
  const [code, setCode] = useState(phase?.code ?? BLANK.code)
  const [startDate, setStartDate] = useState(phase?.startDate ?? BLANK.startDate)
  const [endDate, setEndDate] = useState(phase?.endDate ?? BLANK.endDate)
  const [percentComplete, setPercentComplete] = useState(phase?.percentComplete ?? BLANK.percentComplete)

  const dateOrderInvalid = Boolean(startDate && endDate && endDate < startDate)
  const canSubmit = name.trim() !== '' && startDate !== '' && endDate !== '' && !dateOrderInvalid

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({
      name: name.trim(),
      code: code.trim() || undefined,
      startDate,
      endDate,
      percentComplete,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{phase ? 'Edit phase' : 'Add phase'}</DialogTitle>
            <DialogDescription>
              A named delivery phase shown as a row on the Project Management timeline.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="phase-name">Name</Label>
              <Input
                id="phase-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Phase 4 (DM)"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="phase-code">Code (optional)</Label>
              <Input
                id="phase-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. DM"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="phase-start">Start date</Label>
                <Input
                  id="phase-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="phase-end">End date</Label>
                <Input
                  id="phase-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            {dateOrderInvalid && (
              <p className="text-xs text-destructive">End date must be on or after the start date.</p>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="phase-percent">Percent complete</Label>
              <Input
                id="phase-percent"
                type="number"
                min={0}
                max={100}
                value={percentComplete}
                onChange={(e) => setPercentComplete(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {phase ? 'Save changes' : 'Add phase'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
