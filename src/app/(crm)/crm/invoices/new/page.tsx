import { getSession } from '@/lib/dal'
import { getDeliveredLoadsWithoutInvoice, getActiveCarriers } from '@/server/queries/crm/invoices'
import { CrmTopbar } from '@/components/crm/topbar'
import { NewInvoiceForm } from './_components/new-invoice-form'

export const dynamic = 'force-dynamic'

export default async function NewInvoicePage() {
  const session = await getSession()
  const role = session!.user.crmRole as 'DISPATCHER' | 'CRM_ADMIN'
  const staffId = session!.user.id

  const [loads, carriers] = await Promise.all([
    getDeliveredLoadsWithoutInvoice(role === 'DISPATCHER' ? staffId : undefined),
    getActiveCarriers(),
  ])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CrmTopbar title="New Invoice" />
      <main className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl">
          <NewInvoiceForm loads={JSON.parse(JSON.stringify(loads))} carriers={carriers} />
        </div>
      </main>
    </div>
  )
}
