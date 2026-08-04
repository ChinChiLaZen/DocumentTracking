import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Trash2, Upload } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { PROCUREMENT_STATUS_BADGE_CLASS } from '../shared/statusStyles'
import { PROCUREMENT_LEADS } from '../../data/procurementLeads'
import { useProcurementLeadsStore } from '../../store/useProcurementLeadsStore'
import { useProcurementDocumentsStore } from '../../store/useProcurementDocumentsStore'
import { getLeadId } from '../../domain/procurementLeadId'

function formatTHB(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ProjectLeadDetailPage() {
  const { leadId = '' } = useParams<{ leadId: string }>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const snapshot = useProcurementLeadsStore((s) => s.snapshot)
  const snapshotLoaded = useProcurementLeadsStore((s) => s.loaded)
  const fetchSnapshot = useProcurementLeadsStore((s) => s.fetchSnapshot)

  const documents = useProcurementDocumentsStore((s) => s.documents)
  const docsLoading = useProcurementDocumentsStore((s) => s.loading)
  const uploading = useProcurementDocumentsStore((s) => s.uploading)
  const docsError = useProcurementDocumentsStore((s) => s.error)
  const fetchDocuments = useProcurementDocumentsStore((s) => s.fetchDocuments)
  const uploadDocument = useProcurementDocumentsStore((s) => s.uploadDocument)
  const deleteDocument = useProcurementDocumentsStore((s) => s.deleteDocument)

  useEffect(() => {
    if (!snapshotLoaded) void fetchSnapshot()
  }, [snapshotLoaded, fetchSnapshot])

  useEffect(() => {
    if (leadId) void fetchDocuments(leadId)
  }, [leadId, fetchDocuments])

  const sourceLeads = snapshot?.leads ?? PROCUREMENT_LEADS
  const lead = useMemo(() => sourceLeads.find((l) => getLeadId(l) === leadId), [sourceLeads, leadId])

  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return
    setUploadError(null)
    const result = await uploadDocument(leadId, file)
    if (result.error) setUploadError(result.error)
  }

  if (snapshotLoaded && !lead) {
    return (
      <div className="h-full overflow-auto p-6">
        <Link to="/find-projects" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Find Projects
        </Link>
        <p className="text-sm text-muted-foreground">
          This project isn&rsquo;t in the current snapshot anymore — it may have been deleted or the snapshot was
          replaced.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6">
      <Link to="/find-projects" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back to Find Projects
      </Link>

      {lead && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{lead.projectName}</CardTitle>
              <CardDescription>
                {lead.agency} · {lead.purchasingUnit}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-4 text-sm">
              <span>Budget: {formatTHB(lead.budgetTHB)} THB</span>
              <Badge
                variant="outline"
                className={PROCUREMENT_STATUS_BADGE_CLASS[lead.status] ?? 'border-slate-200 bg-slate-50 text-slate-700'}
              >
                {lead.status}
              </Badge>
            </CardContent>
          </Card>

          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold">Documents</h2>
            <div>
              <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => void handleFileChosen(e)} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload />
                {uploading ? 'Uploading…' : 'Upload document'}
              </Button>
            </div>
          </div>
          {uploadError && <p className="mb-2 text-sm text-destructive">{uploadError}</p>}
          {docsError && <p className="mb-2 text-sm text-destructive">{docsError}</p>}

          {docsLoading && documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-4 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{doc.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(doc.fileSize)} · uploaded by {doc.uploadedBy} on{' '}
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button type="button" variant="ghost" size="icon-sm" asChild>
                      <a
                        href={`/api/procurement/documents/${doc.id}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Download ${doc.filename}`}
                      >
                        <Download />
                      </a>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${doc.filename}`}
                      onClick={() => void deleteDocument(doc.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
