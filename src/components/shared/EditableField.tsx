import { useEffect, useState } from 'react'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'

interface EditableFieldProps {
  value: string
  onCommit(value: string): void
  as?: 'input' | 'textarea'
  placeholder?: string
  ariaLabel?: string
  className?: string
  /** When true, edits don't save on blur — an "Apply" button appears once the
   *  draft differs from the saved value, and only commits when clicked. */
  requireApply?: boolean
}

/** Admin-only inline text editor. Default: commits on blur (only if changed).
 *  With `requireApply`: shows an Apply button instead, so nothing saves until
 *  the reviewer explicitly confirms the change. */
export function EditableField({
  value,
  onCommit,
  as = 'input',
  placeholder,
  ariaLabel,
  className,
  requireApply,
}: EditableFieldProps) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])

  const isDirty = draft !== value

  function commit() {
    if (isDirty) onCommit(draft)
  }

  const Field = as === 'textarea' ? Textarea : Input

  return (
    <div className={requireApply ? 'flex items-start gap-1' : undefined}>
      <Field
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={requireApply ? undefined : commit}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={requireApply ? `flex-1 ${className ?? ''}` : className}
      />
      {requireApply && isDirty && (
        <Button type="button" size="sm" onClick={commit} aria-label={`Apply ${ariaLabel ?? 'change'}`}>
          Apply
        </Button>
      )}
    </div>
  )
}
