import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Copy, Pencil, Trash2 } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { useTemplateStore } from '../../store/useTemplateStore'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

/** Admin-only — reached via AddProjectDialog's "Manage Templates" link, not a
 *  persistent top-level nav item (see plan's clarification on entry point). */
export function TemplatesListPage() {
  const role = useAuthStore((s) => s.user?.role)
  const templates = useTemplateStore((s) => s.templates)
  const deleteTemplate = useTemplateStore((s) => s.deleteTemplate)
  const duplicateTemplate = useTemplateStore((s) => s.duplicateTemplate)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  if (role !== 'admin') {
    return <Navigate to="/" replace />
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    setError(null)
    const { error } = await deleteTemplate(id)
    setDeletingId(null)
    if (error) setError(error)
  }

  async function handleDuplicate(id: string) {
    const { id: newId, error } = await duplicateTemplate(id)
    if (error) {
      setError(error)
      return
    }
    if (newId) navigate(`/templates/${newId}`)
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Templates</h1>
          <p className="text-sm text-muted-foreground">
            Reconfigure a project's checklist template, or add a brand-new one — "Add Project" clones
            whichever template is picked there, fully unticked. Editing a template never changes
            projects that already exist.
          </p>
        </div>
        <Button onClick={() => navigate('/templates/new')}>New Template</Button>
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Label</TableHead>
            <TableHead>Kind</TableHead>
            <TableHead>Structure</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-medium">{t.label}</TableCell>
              <TableCell>
                <Badge variant="outline">{t.isBuiltin ? 'Built-in' : 'Custom'}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{t.tabSet === 'full' ? 'Full (MAR-style)' : 'Flat (single-tab)'}</Badge>
              </TableCell>
              <TableCell className="max-w-96 min-w-48 whitespace-normal break-words text-sm text-muted-foreground">
                {t.description}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Edit ${t.label}`}
                    onClick={() => navigate(`/templates/${t.id}`)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Duplicate ${t.label}`}
                    onClick={() => void handleDuplicate(t.id)}
                  >
                    <Copy />
                  </Button>
                  <Dialog>
                    {t.isBuiltin ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button variant="ghost" size="icon-xs" disabled aria-label={`Delete ${t.label}`}>
                                <Trash2 />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Built-in templates can't be deleted — only reconfigured.</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon-xs" aria-label={`Delete ${t.label}`}>
                          <Trash2 />
                        </Button>
                      </DialogTrigger>
                    )}
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete template?</DialogTitle>
                        <DialogDescription>
                          This permanently deletes "{t.label}". It fails if any project still uses it.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="destructive"
                          disabled={deletingId === t.id}
                          onClick={() => void handleDelete(t.id)}
                        >
                          {deletingId === t.id ? 'Deleting…' : 'Delete'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
