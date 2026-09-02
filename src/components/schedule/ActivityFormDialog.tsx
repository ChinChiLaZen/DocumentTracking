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
import type { PhaseActivity } from '../../data/types'
import { otherActivitiesWeightPercent } from '../../domain/schedule'

interface ActivityFormDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  activity?: PhaseActivity // present when editing, absent when adding
  // The phase's current activities (including `activity` itself, if editing)
  // — used to block saving a weight% that would push the phase's activities
  // over 100%. Read fresh on every render, not seeded into useState, so it
  // doesn't need the remount-via-key treatment the other fields below do.
  existingActivities: PhaseActivity[]
  onSubmit(input: Omit<PhaseActivity, 'id'>): void
}

const BLANK = { name: '', startDate: '', endDate: '', percentComplete: 0, weightPercent: 0 }

/**
 * The caller must remount this component (e.g. `key={sessionCounter}`) each
 * time it opens for a new/different activity — local state is seeded once
 * from `activity` via lazy initializers, not re-synced via an effect, so
 * reusing the same instance across opens would show a stale draft.
 */
export function ActivityFormDialog({
  open,
  onOpenChange,
  activity,
  existingActivities,
  onSubmit,
}: ActivityFormDialogProps) {
  const [name, setName] = useState(activity?.name ?? BLANK.name)
  const [startDate, setStartDate] = useState(activity?.startDate ?? BLANK.startDate)
  const [endDate, setEndDate] = useState(activity?.endDate ?? BLANK.endDate)
  const [percentComplete, setPercentComplete] = useState(activity?.percentComplete ?? BLANK.percentComplete)
  const [weightPercent, setWeightPercent] = useState(activity?.weightPercent ?? BLANK.weightPercent)

  const dateOrderInvalid = Boolean(startDate && endDate && endDate < startDate)
  const otherWeightSum = otherActivitiesWeightPercent(existingActivities, activity?.id)
  const projectedWeightTotal = otherWeightSum + weightPercent
  const weightOverLimit = projectedWeightTotal > 100
  const canSubmit =
    name.trim() !== '' && startDate !== '' && endDate !== '' && !dateOrderInvalid && !weightOverLimit

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({
      name: name.trim(),
      startDate,
      endDate,
      percentComplete,
      weightPercent,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{activity ? 'Edit activity' : 'Add activity'}</DialogTitle>
            <DialogDescription>
              A sub-task under this phase, shown as an indented row on the Project Management timeline.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="activity-name">Name</Label>
              <Input
                id="activity-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Site survey"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="activity-start">Start date</Label>
                <Input
                  id="activity-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="activity-end">End date</Label>
                <Input
                  id="activity-end"
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
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="activity-percent">Percent complete</Label>
                <Input
                  id="activity-percent"
                  type="number"
                  min={0}
                  max={100}
                  value={percentComplete}
                  onChange={(e) => setPercentComplete(Number(e.target.value))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="activity-weight">Weight (% of phase)</Label>
                <Input
                  id="activity-weight"
                  type="number"
                  min={0}
                  max={100}
                  value={weightPercent}
                  onChange={(e) => setWeightPercent(Number(e.target.value))}
                />
              </div>
            </div>
            {weightOverLimit && (
              <p className="text-xs text-destructive">
                This would bring the phase's activities to {projectedWeightTotal}% — over the 100% limit by{' '}
                {projectedWeightTotal - 100}%.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {activity ? 'Save changes' : 'Add activity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
