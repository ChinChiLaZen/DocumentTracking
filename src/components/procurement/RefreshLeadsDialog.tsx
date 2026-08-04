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
import { Textarea } from '../ui/textarea'
import { parseProcurementPaste } from '../../domain/parseProcurementPaste'
import type { ProcurementLead } from '../../data/types'

export function RefreshLeadsDialog({
  saving,
  saveError,
  onApply,
}: {
  saving: boolean
  saveError: string | null
  onApply(leads: ProcurementLead[]): Promise<{ error?: string }>
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')

  const parsed = parseProcurementPaste(text)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setText('')
  }

  async function handleApply() {
    if (parsed.length === 0) return
    const result = await onApply(parsed)
    if (!result.error) handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Update snapshot
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update the e-GP snapshot</DialogTitle>
          <DialogDescription>
            After viewing fresh results on the live e-GP search (opened via &ldquo;Search live on e-GP&rdquo;),
            select the results table&rsquo;s data rows and copy them (Ctrl+C), then paste below. Parsed rows are
            appended after the existing list (renumbered to continue the sequence) and saved for every
            reviewer — nothing is fetched automatically.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste copied table rows here..."
          className="min-h-40 font-mono text-xs"
          aria-label="Pasted e-GP table rows"
        />
        <p className="text-sm text-muted-foreground">
          {text.trim() === ''
            ? 'No text pasted yet.'
            : parsed.length === 0
              ? "Couldn't parse any rows — make sure you copied the table's data rows, not just plain text."
              : `Parsed ${parsed.length} row${parsed.length === 1 ? '' : 's'}.`}
        </p>
        {saveError && <p className="text-sm text-destructive">{saveError}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" disabled={parsed.length === 0 || saving} onClick={handleApply}>
            {saving ? 'Saving…' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
