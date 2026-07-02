import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getSession } from '@/lib/dal'
import { getInvoices } from '@/server/queries/crm/invoices'
import { CrmTopbar } from '@/components/crm/topbar'
import { Button } from '@/components/ui/button'
import { invoiceStatusLabels } from '@/config/crm'
import { InvoicesTable } from './_components/invoices-table'
import type { InvoiceStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

const STATUS_TABS: InvoiceStatus[] = ['DRAFT', 'SENT', 'UNPAID', 'OVERDUE', 'PAID', 'FACTORED']

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}

export default async function InvoicesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const session = await getSession()
  const role = session!.user.crmRole as 'DISPATCHER' | 'CRM_ADMIN'
  const staffId = session!.user.id

  const status = STATUS_TABS.includes(params.status as InvoiceStatus) ? (params.status as InvoiceStatus) : undefined
  const page = parseInt(params.page ?? '1')

  const { invoices, total } = await getInvoices({
    dispatcherId: role === 'DISPATCHER' ? staffId : undefined,
    // OVERDUE isn't a stored status — it's derived as UNPAID + past due.
    status: status && status !== 'OVERDUE' ? status : undefined,
    overdueOnly: status === 'OVERDUE',
    search: params.search,
    page,
  })

  const title = role === 'DISPATCHER' ? 'My Carrier Invoices' : 'Invoices'

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CrmTopbar
        title={title}
        action={
          <Link href="/crm/invoices/new">
            <Button size="sm">
              <Plus className="h-4 w-4" /> New Invoice
            </Button>
          </Link>
        }
      />
      <main className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <Link
            href="/crm/invoices"
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${!status ? 'bg-[var(--brand-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'}`}
          >
            All
          </Link>
          {STATUS_TABS.map((s) => (
            <Link
              key={s}
              href={`/crm/invoices?status=${s}`}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${status === s ? 'bg-[var(--brand-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'}`}
            >
              {invoiceStatusLabels[s]}
            </Link>
          ))}
        </div>

        <InvoicesTable invoices={JSON.parse(JSON.stringify(invoices))} total={total} page={page} search={params.search ?? ''} />
      </main>
    </div>
  )
}
