import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/dal'
import { getCarrierById } from '@/server/queries/crm/carriers'
import { getDocumentExpiryStatus } from '@/server/queries/crm/documents'
import { CrmTopbar } from '@/components/crm/topbar'
import { CarrierDetail } from './_components/carrier-detail'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CarrierDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await getSession()
  const isAdmin = session!.user.crmRole === 'CRM_ADMIN'
  const staffId = session!.user.id

  const carrier = await getCarrierById(id)
  if (!carrier) notFound()
  if (!isAdmin && carrier.assignedDispatcherId !== staffId) redirect('/crm/carriers')

  // Expiry status is derived here (server-side) and passed down as a plain
  // field so the client Documents tab never needs to import the server-only
  // query module.
  const carrierWithExpiry = {
    ...carrier,
    documents: carrier.documents.map((d) => ({ ...d, expiryStatus: getDocumentExpiryStatus(d.expiresAt) })),
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CrmTopbar title={carrier.companyName} />
      <main className="min-h-0 flex-1 overflow-y-auto p-6">
        <CarrierDetail carrier={JSON.parse(JSON.stringify(carrierWithExpiry))} />
      </main>
    </div>
  )
}
