'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { Plus, FileText, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { CrmFileUpload } from '@/components/crm/file-upload'
import { createDocument, deleteDocument } from '@/server/actions/crm/documents'
import { documentTypeLabels } from '@/config/crm'
import type { DocumentType } from '@prisma/client'

type ExpiryStatus = 'expired' | 'expiring' | 'valid' | 'none'

export type DocumentRow = {
  id: string
  type: DocumentType
  fileUrl: string
  fileName: string
  issuedAt: string | null
  expiresAt: string | null
  expiryStatus: ExpiryStatus
  uploadedBy: { id: string; name: string } | null
}

const EXPIRY_BADGE: Record<ExpiryStatus, { variant: 'destructive' | 'warning' | 'success' | 'secondary'; label: string }> = {
  expired: { variant: 'destructive', label: 'Expired' },
  expiring: { variant: 'warning', label: 'Expiring soon' },
  valid: { variant: 'success', label: 'Valid' },
  none: { variant: 'secondary', label: 'N/A' },
}

const DOC_TYPES: DocumentType[] = ['W9', 'COI', 'AUTHORITY_LETTER', 'DISPATCH_AGREEMENT', 'OTHER']

interface FormValues {
  type: DocumentType
  issuedAt: string
  expiresAt: string
}

export function DocumentsTab({ carrierId, documents }: { carrierId: string; documents: DocumentRow[] }) {
  const [showForm, setShowForm] = useState(false)
  const [fileUrl, setFileUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [pending, startTransition] = useTransition()
  const { register, handleSubmit, watch, setValue, reset } = useForm<FormValues>({
    defaultValues: { type: 'W9', issuedAt: '', expiresAt: '' },
  })
  const type = watch('type')

  function openNew() {
    reset({ type: 'W9', issuedAt: '', expiresAt: '' })
    setFileUrl('')
    setFileName('')
    setShowForm(true)
  }

  const onSubmit = (data: FormValues) => {
    if (!fileUrl) {
      toast.error('Upload a file first')
      return
    }
    startTransition(async () => {
      const result = await createDocument({
        carrierId,
        type: data.type,
        fileUrl,
        fileName,
        issuedAt: data.issuedAt || undefined,
        expiresAt: data.expiresAt || undefined,
      })
      if (result.error) toast.error(result.error)
      else {
        toast.success('Document uploaded')
        setShowForm(false)
      }
    })
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteDocument(id)
      if (result.error) toast.error(result.error)
      else toast.success('Document deleted')
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-muted)]">{documents.length} documents</p>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" /> Upload document
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)]">
        {documents.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--text-muted)]">No documents uploaded yet.</p>
        ) : (
          <div className="divide-y divide-[var(--border-default)]">
            {documents.map((d) => {
              const badge = EXPIRY_BADGE[d.expiryStatus]
              return (
                <div key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-subtle)]">
                      <FileText className="h-4 w-4 text-[var(--text-muted)]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{documentTypeLabels[d.type]}</p>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        {d.expiresAt ? `Expires ${new Date(d.expiresAt).toLocaleDateString()}` : 'No expiry set'}
                        {d.uploadedBy ? ` · Uploaded by ${d.uploadedBy.name}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" asChild>
                      <a href={d.fileUrl} target="_blank" rel="noreferrer">
                        <Eye className="h-3.5 w-3.5" /> View
                      </a>
                    </Button>
                    <Button size="sm" variant="ghost" disabled={pending} onClick={() => remove(d.id)} aria-label="Delete document">
                      <Trash2 className="h-3.5 w-3.5 text-[var(--error)]" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="doc-type">Document type *</Label>
              <Select value={type} onValueChange={(v) => setValue('type', v as DocumentType)}>
                <SelectTrigger id="doc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {documentTypeLabels[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>File *</Label>
              <CrmFileUpload
                folder="uniflex/crm/documents"
                onUpload={(url, name) => {
                  setFileUrl(url)
                  setFileName(name)
                }}
                currentUrl={fileUrl || undefined}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="doc-issued">Issued date</Label>
                <Input id="doc-issued" type="date" {...register('issuedAt')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doc-expires">Expires date</Label>
                <Input id="doc-expires" type="date" {...register('expiresAt')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={pending} disabled={!fileUrl}>
                Upload
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
