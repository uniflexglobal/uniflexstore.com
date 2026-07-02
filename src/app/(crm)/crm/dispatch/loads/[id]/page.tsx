import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getSession } from '@/lib/dal'
import { getLoadById } from '@/server/queries/crm/loads'
import { CrmTopbar } from '@/components/crm/topbar'
import { Badge } from '@/components/ui/badge'
import { loadStatusLabels, loadStatusVariant } from '@/config/crm'
import { LoadStatusMenu } from '@/components/crm/load-status-menu'
import { LoadInfoCard } from './_components/load-info-card'
import { LoadDocuments } from './_components/load-documents'
import { CheckCallLog } from './_components/check-call-log'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LoadDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await getSession()
  const role = session!.user.crmRole as 'DISPATCHER' | 'CRM_ADMIN'
  const staffId = session!.user.id

  const load = await getLoadById(id)
  if (!load) notFound()
  if (role === 'DISPATCHER' && load.dispatcherId !== staffId) redirect('/crm/dispatch')

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CrmTopbar title={load.loadNumber} />
      <main className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
        <Link
          href="/crm/dispatch"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to dispatch board
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">{load.loadNumber}</h1>
            <Badge variant={loadStatusVariant[load.status]}>{loadStatusLabels[load.status] ?? load.status}</Badge>
          </div>
          <LoadStatusMenu loadId={load.id} loadNumber={load.loadNumber} currentStatus={load.status} size="md" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <LoadInfoCard load={JSON.parse(JSON.stringify(load))} />
            <LoadDocuments loadId={load.id} rateConUrl={load.rateConUrl} bolUrl={load.bolUrl} />
          </div>
          <CheckCallLog loadId={load.id} checkCalls={JSON.parse(JSON.stringify(load.checkCalls))} />
        </div>
      </main>
    </div>
  )
}
