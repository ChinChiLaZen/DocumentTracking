import { useState, type FormEvent } from 'react'
import { Pencil } from 'lucide-react'
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
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { useTrackerStore } from '../../store/useTrackerStore'
import { CSI_MASTER_FORMAT, formatCsiEntry, groupCsiByDivision } from '../../data/csiMasterFormat'
import type { ProjectMeta } from '../../data/types'

const CSI_DIVISION_GROUPS = groupCsiByDivision(CSI_MASTER_FORMAT)

interface EditProjectDialogProps {
  meta: ProjectMeta
}

export function EditProjectDialog({ meta }: EditProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(meta.title)
  const [vendor, setVendor] = useState(meta.vendor)
  const [scope, setScope] = useState(meta.scope)
  const [preparedDate, setPreparedDate] = useState(meta.preparedDate)
  const [projectType, setProjectType] = useState<string | undefined>(meta.projectType)
  const updateProjectMeta = useTrackerStore((s) => s.updateProjectMeta)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      // Re-sync from the latest meta each time the dialog opens, in case
      // another user changed it since this browser last loaded the page.
      setTitle(meta.title)
      setVendor(meta.vendor)
      setScope(meta.scope)
      setPreparedDate(meta.preparedDate)
      setProjectType(meta.projectType)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    updateProjectMeta(meta.id, {
      title: title.trim(),
      vendor: vendor.trim(),
      scope: scope.trim(),
      preparedDate,
      projectType,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Edit ${meta.title}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit project details</DialogTitle>
            <DialogDescription>
              Updates this project's title, vendor, scope, type, and prepared date for every user. The
              checklist structure itself (template/items) is not affected.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-project-title">Project title</Label>
              <Input
                id="edit-project-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-project-vendor">Vendor</Label>
              <Input id="edit-project-vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-project-scope">Scope</Label>
              <Input id="edit-project-scope" value={scope} onChange={(e) => setScope(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-project-type">Project Type</Label>
              <Select value={projectType} onValueChange={(value) => setProjectType(value)}>
                <SelectTrigger id="edit-project-type" className="w-full">
                  <SelectValue placeholder="Select a CSI MasterFormat section (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {CSI_DIVISION_GROUPS.map((group) => (
                    <SelectGroup key={group.division}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.entries.map((entry) => (
                        <SelectItem key={entry.code} value={entry.code}>
                          {formatCsiEntry(entry)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-project-date">Prepared date</Label>
              <Input
                id="edit-project-date"
                type="date"
                value={preparedDate}
                onChange={(e) => setPreparedDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
