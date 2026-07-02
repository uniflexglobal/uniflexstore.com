import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getSession } from '@/lib/dal'
import { db } from '@/server/db'
import { getLoads } from '@/server/queries/crm/loads'
import { CrmTopbar } from '@/components/crm/topbar'
import { buttonVariants } from '@/components/ui/button'
import { DispatchBoard } from './_components/dispatch-board'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ dispatcherId?: string }>
}

export default async function DispatchPage({ searchParams }: PageProps) {
  const params = await searchParams
  const session = await getSession()
  const role = session!.user.crmRole as 'DISPATCHER' | 'CRM_ADMIN'
  const staffId = session!.user.id

  const dispatcherFilter = role === 'DISPATCHER' ? staffId : params.dispatcherId || undefined

  const [loads, dispatchers] = await Promise.all([
    getLoads({ dispatcherId: dispatcherFilter }),
    role === 'CRM_ADMIN'
      ? db.crmStaff.findMany({
          where: { role: 'DISPATCHER', isActive: true },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([]),
  ])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CrmTopbar
        title="Dispatch Board"
        action={
          <Link href="/crm/dispatch/loads/new" className={buttonVariants({ size: 'sm' })}>
            <Plus className="h-4 w-4" /> New Load
          </Link>
        }
      />
      <main className="min-h-0 flex-1 overflow-y-auto p-6">
        <DispatchBoard
          loads={JSON.parse(JSON.stringify(loads))}
          role={role}
          dispatchers={dispatchers}
          selectedDispatcherId={params.dispatcherId ?? ''}
        />
      </main>
    </div>
  )
}
