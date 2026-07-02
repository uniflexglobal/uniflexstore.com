import { getStaff } from '@/server/queries/crm/staff'
import { CrmTopbar } from '@/components/crm/topbar'
import { StaffManager } from './_components/staff-manager'

export const dynamic = 'force-dynamic'

export default async function StaffPage() {
  const staff = await getStaff()

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CrmTopbar title="Staff" />
      <main className="min-h-0 flex-1 overflow-y-auto p-6">
        <StaffManager staff={JSON.parse(JSON.stringify(staff))} />
      </main>
    </div>
  )
}
