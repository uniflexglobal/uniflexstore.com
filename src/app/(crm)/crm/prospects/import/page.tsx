import { getSession } from '@/lib/dal'
import { getActiveCallers } from '@/server/queries/crm/prospects'
import { CrmTopbar } from '@/components/crm/topbar'
import { ImportProspectsForm } from './_components/import-prospects-form'

export default async function ImportProspectsPage() {
  const session = await getSession()
  const isAdmin = session!.user.crmRole === 'CRM_ADMIN'
  const callers = isAdmin ? await getActiveCallers() : []

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CrmTopbar title="Import Prospects" />
      <main className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl">
          <ImportProspectsForm isAdmin={isAdmin} callers={callers} selfId={session!.user.id} />
        </div>
      </main>
    </div>
  )
}
