import type { TemplateDefinition } from '../../data/types'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Checkbox } from '../ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

type MetaFields = Pick<
  TemplateDefinition,
  | 'label'
  | 'description'
  | 'tabSet'
  | 'hasDetailSheets'
  | 'hasGroups'
  | 'hasPriority'
  | 'supportsDefaultPhase'
>

export function TemplateMetaPanel({
  draft,
  onChange,
}: {
  draft: MetaFields
  onChange(patch: Partial<MetaFields>): void
}) {
  return (
    <div className="grid max-w-2xl gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="template-label">Label</Label>
        <Input id="template-label" value={draft.label} onChange={(e) => onChange({ label: e.target.value })} />
        <p className="text-xs text-muted-foreground">Shown in Add Project's Template picker.</p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="template-description">Description</Label>
        <Textarea
          id="template-description"
          value={draft.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="template-tabset">Tab set</Label>
        <Select value={draft.tabSet} onValueChange={(value) => onChange({ tabSet: value as 'full' | 'single' })}>
          <SelectTrigger id="template-tabset" className="w-full max-w-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Full (Dashboard, Tracker, Priority A/B/C, Item Details, Phase Progress)</SelectItem>
            <SelectItem value="single">Flat (Dashboard only, workflow-status driven)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Project Management and BOQ Estimate tabs always show for every template, regardless of this choice.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="template-groups"
          checked={draft.hasGroups}
          onCheckedChange={(checked) => onChange({ hasGroups: checked === true })}
        />
        <Label htmlFor="template-groups">Items are organized into named groups (e.g. MAR's G1-G5)</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="template-priority"
          checked={draft.hasPriority}
          onCheckedChange={(checked) => onChange({ hasPriority: checked === true })}
        />
        <Label htmlFor="template-priority">
          Items carry a Priority (A/B/C) — always exactly 3 levels, relabel below but can't add/remove
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="template-sheets"
          checked={draft.hasDetailSheets}
          onCheckedChange={(checked) => onChange({ hasDetailSheets: checked === true })}
        />
        <Label htmlFor="template-sheets">Items can have a checkbox detail sheet</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="template-default-phase"
          checked={draft.supportsDefaultPhase}
          onCheckedChange={(checked) => onChange({ supportsDefaultPhase: checked === true })}
        />
        <Label htmlFor="template-default-phase">
          Add Project shows a "Default phase" picker, bulk-applied to every item at creation
        </Label>
      </div>
    </div>
  )
}
