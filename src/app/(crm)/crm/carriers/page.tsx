import Link from 'next/link'
import { getSession } from '@/lib/dal'
import { getCarriers } from '@/server/queries/crm/carriers'
import { getActiveDispatchers } from '@/server/queries/crm/leads'
import { CrmTopbar } from '@/components/crm/topbar'
import { carrierStatusLabels } from '@/config/crm'
import { CarriersTable } from './_components/carriers-table'
import type { CarrierStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

const STATUSES: CarrierStatus[] = ['ONBOARDING', 'ACTIVE', 'INACTIVE', 'TERMINATED']

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}

export default async function CarriersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const session = await getSession()
  const isAdmin = session!.user.crmRole === 'CRM_ADMIN'
  const staffId = session!.user.id

  const status = STATUSES.includes(params.status as CarrierStatus) ? (params.status as CarrierStatus) : undefined
  const page = parseInt(params.page ?? '1')

  const { carriers, total } = await getCarriers({
    dispatcherId: isAdmin ? undefined : staffId,
    status,
    search: params.search,
    page,
  })

  const dispatchers = isAdmin ? await getActiveDispatchers() : []

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CrmTopbar title={isAdmin ? 'All Carriers' : 'My Carriers'} />

      <main className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <Link
            href="/crm/carriers"
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${!status ? 'bg-[var(--brand-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'}`}
          >
            All
          </Link>
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/crm/carriers?status=${s}`}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${status === s ? 'bg-[var(--brand-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'}`}
            >
              {carrierStatusLabels[s]}
            </Link>
          ))}
        </div>

        <CarriersTable
          carriers={JSON.parse(JSON.stringify(carriers))}
          total={total}
          page={page}
          search={params.search ?? ''}
          isAdmin={isAdmin}
          dispatchers={dispatchers}
        />
      </main>
    </div>
  )
}
