import Link from 'next/link'
import { getSession } from '@/lib/dal'
import { getLeads, getActiveDispatchers } from '@/server/queries/crm/leads'
import { CrmTopbar } from '@/components/crm/topbar'
import { LeadsTable } from './_components/leads-table'
import type { LeadStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

const STATUSES: LeadStatus[] = ['AWAITING_ASSIGNMENT', 'ASSIGNED', 'SIGNED', 'LOST']

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const session = await getSession()
  const role = session!.user.crmRole as 'CALLER' | 'DISPATCHER' | 'CRM_ADMIN'
  const staffId = session!.user.id

  const status = STATUSES.includes(params.status as LeadStatus) ? (params.status as LeadStatus) : undefined
  const page = parseInt(params.page ?? '1')

  const { leads, total } = await getLeads({
    qualifiedById: role === 'CALLER' ? staffId : undefined,
    assignedToId: role === 'DISPATCHER' ? staffId : undefined,
    status,
    search: params.search,
    page,
  })

  const dispatchers = role === 'CRM_ADMIN' ? await getActiveDispatchers() : []

  const title = role === 'CALLER' ? 'My Qualified Leads' : role === 'DISPATCHER' ? 'My Assigned Leads' : 'All Leads'

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CrmTopbar title={title} />
      <main className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <Link
            href="/crm/leads"
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${!status ? 'bg-[var(--brand-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'}`}
          >
            All
          </Link>
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/crm/leads?status=${s}`}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${status === s ? 'bg-[var(--brand-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'}`}
            >
              {s.replace(/_/g, ' ')}
            </Link>
          ))}
        </div>

        <LeadsTable
          leads={JSON.parse(JSON.stringify(leads))}
          total={total}
          page={page}
          search={params.search ?? ''}
          role={role}
          dispatchers={dispatchers}
        />
      </main>
    </div>
  )
}
