'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CrmFileUploadProps {
  onUpload: (url: string, fileName: string) => void
  folder?: string
  accept?: string
  label?: string
  currentUrl?: string
  className?: string
}

/**
 * Document/PDF-oriented upload for the CRM (rate confirmations, BOLs,
 * insurance certs, W-9s). Posts to /api/crm/upload — same Cloudinary
 * backend as the admin panel's upload, but guarded by requireCrmAuth()
 * instead of requireAdmin() so Dispatchers/Callers can use it too.
 */
export function CrmFileUpload({
  onUpload,
  folder = 'uniflex/crm',
  accept = 'application/pdf,image/*',
  label = 'Upload file',
  currentUrl,
  className,
}: CrmFileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)

    const form = new FormData()
    form.append('file', file)
    form.append('folder', folder)

    try {
      const res = await fetch('/api/crm/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? 'Upload failed')
      setPreview(data.url)
      onUpload(data.url, data.fileName ?? file.name)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />

      {preview ? (
        <div className="group relative">
          <div className="flex h-16 w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] text-sm text-[var(--text-secondary)]">
            <FileText className="h-4 w-4" />
            File uploaded
          </div>
          <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => {
                setPreview(null)
                onUpload('', '')
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-600 hover:bg-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-5 text-sm text-[var(--text-muted)] transition-all hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)]',
            uploading && 'cursor-not-allowed opacity-60'
          )}
        >
          {uploading ? (
            <div className="h-5 w-5 motion-safe:animate-spin rounded-full border-2 border-[var(--brand-accent)] border-t-transparent" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
          <span>{uploading ? 'Uploading…' : label}</span>
        </button>
      )}

      {error && <p className="mt-1.5 text-xs text-[var(--error)]">{error}</p>}
    </div>
  )
}
