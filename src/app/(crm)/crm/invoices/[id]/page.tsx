import { notFound } from 'next/navigation'
import { getSession } from '@/lib/dal'
import { getInvoiceById } from '@/server/queries/crm/invoices'
import { CrmTopbar } from '@/components/crm/topbar'
import { InvoiceDetail } from './_components/invoice-detail'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await getSession()
  const role = session!.user.crmRole as 'DISPATCHER' | 'CRM_ADMIN'

  const invoice = await getInvoiceById(id)
  if (!invoice) notFound()
  if (role === 'DISPATCHER' && invoice.carrier.assignedDispatcherId !== session!.user.id) notFound()

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CrmTopbar title={`Invoice ${invoice.invoiceNumber}`} />
      <main className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl">
          <InvoiceDetail invoice={JSON.parse(JSON.stringify(invoice))} />
        </div>
      </main>
    </div>
  )
}
