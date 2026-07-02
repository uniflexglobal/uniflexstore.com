import { getCommissions, getActiveStaff, getLoadOptions, getLeadOptions } from '@/server/queries/crm/commissions'
import { CrmTopbar } from '@/components/crm/topbar'
import { CommissionsManager } from './_components/commissions-manager'

export const dynamic = 'force-dynamic'

export default async function CommissionsPage() {
  const [{ commissions, total }, staff, loads, leads] = await Promise.all([
    getCommissions(),
    getActiveStaff(),
    getLoadOptions(),
    getLeadOptions(),
  ])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CrmTopbar title="Commissions" />
      <main className="min-h-0 flex-1 overflow-y-auto p-6">
        <CommissionsManager
          commissions={JSON.parse(JSON.stringify(commissions))}
          total={total}
          staff={staff}
          loads={loads}
          leads={leads}
        />
      </main>
    </div>
  )
}
