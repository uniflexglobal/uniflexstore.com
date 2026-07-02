import { getSession } from '@/lib/dal'
import { CrmTopbar } from '@/components/crm/topbar'
import { getActiveCarriersForDispatch, getCarrierFleet } from '@/server/queries/crm/loads'
import { NewLoadForm } from './_components/new-load-form'

export const dynamic = 'force-dynamic'

export default async function NewLoadPage() {
  const session = await getSession()
  const role = session!.user.crmRole as 'DISPATCHER' | 'CRM_ADMIN'
  const staffId = session!.user.id

  const carriers = await getActiveCarriersForDispatch(role === 'DISPATCHER' ? staffId : undefined)

  // Preload each eligible carrier's trucks/drivers so the form's
  // carrier → truck/driver cascade works client-side without a
  // dedicated API route.
  const fleets = await Promise.all(carriers.map((c) => getCarrierFleet(c.id)))
  const fleetByCarrier = Object.fromEntries(carriers.map((c, i) => [c.id, fleets[i]]))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CrmTopbar title="New Load" />
      <main className="min-h-0 flex-1 overflow-y-auto p-6">
        <NewLoadForm carriers={carriers} fleetByCarrier={fleetByCarrier} />
      </main>
    </div>
  )
}
