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
import { useActiveProject } from '../../store/useActiveProject'

export function ResetToSeedDialog() {
  const [open, setOpen] = useState(false)
  const { resetToSeed } = useActiveProject()

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
            This discards every tick, manual override, Phase Progress workflow status/document
            metadata, and history log entry on this project — for every user, not just you — and
            restores the original seed data. This cannot be undone.
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
