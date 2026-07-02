'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CrmFileUpload } from '@/components/crm/file-upload'
import { updateLoadDocuments } from '@/server/actions/crm/loads'

interface LoadDocumentsProps {
  loadId: string
  rateConUrl: string | null
  bolUrl: string | null
}

export function LoadDocuments({ loadId, rateConUrl, bolUrl }: LoadDocumentsProps) {
  const [, startTransition] = useTransition()

  function save(field: 'rateConUrl' | 'bolUrl', url: string) {
    startTransition(async () => {
      const result = await updateLoadDocuments(loadId, { [field]: url })
      if (result.error) toast.error(result.error)
      else toast.success(url ? 'Document uploaded' : 'Document removed')
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-[var(--text-secondary)]">Rate confirmation</p>
          <CrmFileUpload
            folder="uniflex/crm/loads"
            label="Upload rate confirmation"
            currentUrl={rateConUrl ?? undefined}
            onUpload={(url) => save('rateConUrl', url)}
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-[var(--text-secondary)]">Bill of lading (BOL)</p>
          <CrmFileUpload
            folder="uniflex/crm/loads"
            label="Upload BOL"
            currentUrl={bolUrl ?? undefined}
            onUpload={(url) => save('bolUrl', url)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
