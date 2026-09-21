import { Phone, ClipboardCheck, Truck, Users, ClipboardList, FileWarning, DollarSign, Package } from 'lucide-react'
import { getSession } from '@/lib/dal'
import { getCrmDashboard } from '@/server/queries/crm/dashboard'
import { getActiveDispatchers } from '@/server/queries/crm/leads'
import { CrmTopbar } from '@/components/crm/topbar'
import { StatCard } from '@/components/admin/stat-card'
import { AwaitingAssignmentQueue } from '@/components/crm/awaiting-assignment-queue'
import { formatUSD } from '@/lib/utils'

export default async function CrmDashboardPage() {
  const session = await getSession()
  const role = session!.user.crmRole as 'CALLER' | 'DISPATCHER' | 'CRM_ADMIN'
  const staffId = session!.user.id
  const stats = await getCrmDashboard(role, staffId)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CrmTopbar title="Dashboard" />
      <main className="min-h-0 flex-1 overflow-y-auto p-6">
        {stats.role === 'CALLER' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard title="On your call list" value={stats.callListCount} icon={Phone} />
            <StatCard title="Qualified this week" value={stats.qualifiedThisWeek} icon={ClipboardCheck} />
          </div>
        )}

        {stats.role === 'DISPATCHER' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard title="Newly assigned leads" value={stats.newlyAssigned} icon={ClipboardList} />
            <StatCard title="Active carriers" value={stats.activeCarriers} icon={Truck} />
            <StatCard
              title="Documents expiring"
              value={stats.expiringDocs}
              icon={FileWarning}
              iconColor={stats.expiringDocs > 0 ? 'text-[var(--warning)]' : undefined}
            />
          </div>
        )}

        {stats.role === 'CRM_ADMIN' && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total prospects" value={stats.totalProspects} icon={Phone} />
              <StatCard title="Total leads" value={stats.totalLeads} icon={ClipboardList} />
              <StatCard title="Active carriers" value={stats.activeCarriers} icon={Truck} />
              <StatCard title="Active staff" value={stats.totalStaff} icon={Users} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard title="Loads this month" value={stats.loadsThisMonth} icon={Package} />
              <StatCard title="Revenue this month" value={formatUSD(stats.revenueThisMonth)} icon={DollarSign} />
              <StatCard
                title="Documents expiring"
                value={stats.expiringDocs}
                icon={FileWarning}
                iconColor={stats.expiringDocs > 0 ? 'text-[var(--warning)]' : undefined}
              />
            </div>

            <div className="mt-8">
              <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                Awaiting assignment{stats.awaitingCount > 0 ? ` (${stats.awaitingCount})` : ''}
              </h2>
              <AwaitingAssignmentQueue
                leads={JSON.parse(JSON.stringify(stats.awaitingAssignment))}
                dispatchers={await getActiveDispatchers()}
              />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
