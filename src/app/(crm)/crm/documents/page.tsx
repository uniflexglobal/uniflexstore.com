import Link from 'next/link'
import { Eye } from 'lucide-react'
import { getSession } from '@/lib/dal'
import { getAllDocuments } from '@/server/queries/crm/documents'
import { CrmTopbar } from '@/components/crm/topbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { documentTypeLabels } from '@/config/crm'

export const dynamic = 'force-dynamic'

type ExpiryStatus = 'expired' | 'expiring' | 'valid' | 'none'

const EXPIRY_BADGE: Record<ExpiryStatus, { variant: 'destructive' | 'warning' | 'success' | 'secondary'; label: string }> = {
  expired: { variant: 'destructive', label: 'Expired' },
  expiring: { variant: 'warning', label: 'Expiring soon' },
  valid: { variant: 'success', label: 'Valid' },
  none: { variant: 'secondary', label: 'N/A' },
}

export default async function DocumentsDashboardPage() {
  const session = await getSession()
  const isAdmin = session!.user.crmRole === 'CRM_ADMIN'
  const staffId = session!.user.id

  const documents = await getAllDocuments({ dispatcherId: isAdmin ? undefined : staffId })

  const expiredCount = documents.filter((d) => d.expiryStatus === 'expired').length
  const expiringCount = documents.filter((d) => d.expiryStatus === 'expiring').length

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CrmTopbar title="Document Expiry Dashboard" />

      <main className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)]">
          <span>{documents.length} documents</span>
          {expiredCount > 0 && <Badge variant="destructive">{expiredCount} expired</Badge>}
          {expiringCount > 0 && <Badge variant="warning">{expiringCount} expiring soon</Badge>}
        </div>

        <div className="rounded-xl border border-[var(--border-default)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Carrier</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded by</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-[var(--text-muted)]">
                    No documents uploaded yet.
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((d) => {
                  const badge = EXPIRY_BADGE[d.expiryStatus]
                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Link href={`/crm/carriers/${d.carrier.id}`} className="text-sm font-medium text-[var(--text-primary)] hover:underline">
                          {d.carrier.companyName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-[var(--text-secondary)]">{documentTypeLabels[d.type]}</TableCell>
                      <TableCell className="text-sm text-[var(--text-muted)]">
                        {d.issuedAt ? new Date(d.issuedAt).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-[var(--text-muted)]">
                        {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-[var(--text-muted)]">{d.uploadedBy?.name ?? '—'}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" asChild>
                          <a href={d.fileUrl} target="_blank" rel="noreferrer">
                            <Eye className="h-3.5 w-3.5" /> View
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  )
}
