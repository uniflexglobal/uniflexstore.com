import Link from 'next/link'
import { Upload } from 'lucide-react'
import { getSession } from '@/lib/dal'
import { db } from '@/server/db'
import { getProspects, getActiveCallers } from '@/server/queries/crm/prospects'
import { getActiveDispatchers } from '@/server/queries/crm/leads'
import { CrmTopbar } from '@/components/crm/topbar'
import { Button } from '@/components/ui/button'
import { ProspectsTable } from './_components/prospects-table'
import type { ProspectStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

const STATUSES: ProspectStatus[] = ['NEW', 'NO_ANSWER', 'CALL_BACK_LATER', 'NOT_INTERESTED', 'DO_NOT_CALL', 'QUALIFIED']

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}

export default async function ProspectsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const session = await getSession()
  const isAdmin = session!.user.crmRole === 'CRM_ADMIN'
  const staffId = session!.user.id

  const status = STATUSES.includes(params.status as ProspectStatus) ? (params.status as ProspectStatus) : undefined
  const page = parseInt(params.page ?? '1')

  const { prospects, total } = await getProspects({
    assignedToId: isAdmin ? undefined : staffId,
    status,
    search: params.search,
    page,
  })

  const [callers, dispatchers, seniorFlag] = await Promise.all([
    isAdmin ? getActiveCallers() : Promise.resolve([]),
    getActiveDispatchers(),
    isAdmin
      ? Promise.resolve(true)
      : db.crmStaff.findUnique({ where: { id: staffId }, select: { isSeniorCaller: true } }).then((s) => s?.isSeniorCaller ?? false),
  ])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CrmTopbar
        title={isAdmin ? 'All Prospects' : 'Call List'}
        action={
          <Link href="/crm/prospects/import">
            <Button size="sm" variant="outline">
              <Upload className="h-4 w-4" /> Import
            </Button>
          </Link>
        }
      />

      <main className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <Link
            href="/crm/prospects"
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${!status ? 'bg-[var(--brand-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'}`}
          >
            All
          </Link>
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/crm/prospects?status=${s}`}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${status === s ? 'bg-[var(--brand-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'}`}
            >
              {s.replace(/_/g, ' ')}
            </Link>
          ))}
        </div>

        <ProspectsTable
          prospects={JSON.parse(JSON.stringify(prospects))}
          total={total}
          page={page}
          search={params.search ?? ''}
          isAdmin={isAdmin}
          isSeniorCaller={seniorFlag}
          callers={callers}
          dispatchers={dispatchers}
        />
      </main>
    </div>
  )
}
