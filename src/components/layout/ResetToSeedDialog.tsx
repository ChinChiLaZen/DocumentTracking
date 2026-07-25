import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { useTrackerStore } from '../../store/useTrackerStore'

export function ResetToSeedDialog() {
  const [open, setOpen] = useState(false)
  const resetToSeed = useTrackerStore((s) => s.resetToSeed)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white/80 hover:bg-white/10">
          Reset to seed
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset all data to seed?</DialogTitle>
          <DialogDescription>
            This discards every tick and manual override you've made and restores the original seed
            data. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              resetToSeed()
              setOpen(false)
            }}
          >
            Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
