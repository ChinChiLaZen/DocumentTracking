import { create } from 'zustand'

export interface ProcurementLeadDocument {
  id: number
  filename: string
  contentType: string
  fileSize: number
  uploadedBy: string
  uploadedAt: string
}

interface ProcurementDocumentsState {
  documents: ProcurementLeadDocument[]
  loading: boolean
  uploading: boolean
  error: string | null
  fetchDocuments(leadId: string): Promise<void>
  uploadDocument(leadId: string, file: File): Promise<{ error?: string }>
  deleteDocument(id: number): Promise<{ error?: string }>
}

async function parseJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return await res.json()
  } catch {
    return {}
  }
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // reader.result is "data:<mime>;base64,<data>" — strip the prefix.
      const result = reader.result as string
      const commaIndex = result.indexOf(',')
      resolve(commaIndex === -1 ? result : result.slice(commaIndex + 1))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export const useProcurementDocumentsStore = create<ProcurementDocumentsState>((set) => ({
  documents: [],
  loading: false,
  uploading: false,
  error: null,

  async fetchDocuments(leadId) {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`/api/procurement/documents?leadId=${encodeURIComponent(leadId)}`)
      const data = await parseJson(res)
      if (!res.ok) {
        set({ loading: false, error: (data.error as string) ?? 'Failed to load documents' })
        return
      }
      set({ loading: false, documents: (data.documents as ProcurementLeadDocument[]) ?? [] })
    } catch {
      set({ loading: false, error: 'Failed to load documents — check your connection' })
    }
  },

  async uploadDocument(leadId, file) {
    set({ uploading: true, error: null })
    try {
      const fileData = await readFileAsBase64(file)
      const res = await fetch('/api/procurement/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          fileData,
        }),
      })
      const data = await parseJson(res)
      if (!res.ok) {
        const error = (data.error as string) ?? 'Failed to upload document'
        set({ uploading: false, error })
        return { error }
      }
      set((state) => ({
        uploading: false,
        documents: [data.document as ProcurementLeadDocument, ...state.documents],
      }))
      return {}
    } catch {
      const error = 'Failed to upload document — check your connection and try again'
      set({ uploading: false, error })
      return { error }
    }
  },

  async deleteDocument(id) {
    try {
      const res = await fetch(`/api/procurement/documents/${id}`, { method: 'DELETE' })
      const data = await parseJson(res)
      if (!res.ok) return { error: (data.error as string) ?? 'Failed to delete document' }
      set((state) => ({ documents: state.documents.filter((d) => d.id !== id) }))
      return {}
    } catch {
      return { error: 'Failed to delete document — check your connection and try again' }
    }
  },
}))
