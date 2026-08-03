import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { LIFECYCLE_PHASE_DEFS } from '../../domain/rules'
import { CSI_MASTER_FORMAT, formatCsiEntry, groupCsiByDivision } from '../../data/csiMasterFormat'
import type { LifecyclePhase, TemplateKind } from '../../data/types'

const CSI_DIVISION_GROUPS = groupCsiByDivision(CSI_MASTER_FORMAT)

const DEFAULT_PHASE: LifecyclePhase = 'AfterContract'

const TEMPLATE_OPTIONS: { id: TemplateKind; label: string; description: string }[] = [
  {
    id: 'mar',
    label: 'MAR — Vendor Approval Checklist',
    description: 'Starts from the same 28-item MAR checklist structure used by every MAR project, fully unticked.',
  },
  {
    id: 'aot',
    label: 'AOT — Bid Submission Checklist',
    description:
      "Clones the 94-item AOT (Airports of Thailand) bid-submission checklist across Phases 0-3 — Suvarnabhumi/AOT format. Each item keeps its own real phase and importance; there's no checkbox detail-sheet or Group/Priority for this template.",
  },
  {
    id: 'doa',
    label: 'DOA — 3-Airport Document Tracker',
    description:
      "Clones the 64-item DOA (Department of Airports) document tracker spanning Khon Kaen, Udon Thani and Surat Thani airports. Each item keeps its own real phase, document-type badge (Shared/Mandatory/Site-specific) and airport assignment; there's no checkbox detail-sheet or Group/Priority for this template.",
  },
  {
    id: 'adsb',
    label: 'ADS-B Installation Checklist — CATM Ground Station & Vehicle Terminal',
    description:
      "Clones the 96-item ADS-B ground-station/vehicle-terminal (CATM) installation checklist across 5 real phases (Design & Approval, Site Readiness, Installation, Testing & Commissioning, As-built & Handover). Each item carries bilingual (Thai/English) text plus its own real installation phase; 80 of the 96 also carry the Employer ITP's Required-evidence and Hold/Witness-point fields. No checkbox detail-sheet or Group/Priority for this template.",
  },
]

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function AddProjectDialog() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [vendor, setVendor] = useState('')
  const [scope, setScope] = useState('')
  const [preparedDate, setPreparedDate] = useState(today)
  const [templateKind, setTemplateKind] = useState<TemplateKind>('mar')
  const [defaultPhase, setDefaultPhase] = useState<LifecyclePhase>(DEFAULT_PHASE)
  const [projectType, setProjectType] = useState<string | undefined>(undefined)
  const createProject = useTrackerStore((s) => s.createProject)
  const navigate = useNavigate()

  function reset() {
    setTitle('')
    setVendor('')
    setScope('')
    setPreparedDate(today())
    setTemplateKind('mar')
    setDefaultPhase(DEFAULT_PHASE)
    setProjectType(undefined)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) reset()
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const id = createProject({
      title: title.trim(),
      vendor: vendor.trim(),
      scope: scope.trim(),
      preparedDate,
      templateKind,
      defaultPhase: templateKind === 'mar' ? defaultPhase : undefined,
      projectType,
    })
    setOpen(false)
    reset()
    navigate(`/projects/${id}`)
  }

  const selectedTemplate = TEMPLATE_OPTIONS.find((t) => t.id === templateKind)!

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">Add Project</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add a new project</DialogTitle>
            <DialogDescription>{selectedTemplate.description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="project-template">Template</Label>
              <Select
                value={templateKind}
                onValueChange={(value) => setTemplateKind(value as TemplateKind)}
              >
                <SelectTrigger id="project-template" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_OPTIONS.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="project-title">Project title</Label>
              <Input
                id="project-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="project-vendor">Vendor</Label>
              <Input id="project-vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="project-scope">Scope</Label>
              <Input id="project-scope" value={scope} onChange={(e) => setScope(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="project-type">Project Type</Label>
              <Select
                value={projectType}
                onValueChange={(value) => setProjectType(value)}
              >
                <SelectTrigger id="project-type" className="w-full">
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
              <Label htmlFor="project-date">Prepared date</Label>
              <Input
                id="project-date"
                type="date"
                value={preparedDate}
                onChange={(e) => setPreparedDate(e.target.value)}
              />
            </div>
            {templateKind === 'mar' && (
              <div className="grid gap-1.5">
                <Label htmlFor="project-phase">Default phase</Label>
                <Select
                  value={defaultPhase}
                  onValueChange={(value) => setDefaultPhase(value as LifecyclePhase)}
                >
                  <SelectTrigger id="project-phase" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LIFECYCLE_PHASE_DEFS.map((def, i) => (
                      <SelectItem key={def.id} value={def.id}>
                        Phase {i + 1} — {def.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
