import { Truck, Package, DollarSign, Percent } from 'lucide-react'
import { StatCard } from '@/components/admin/stat-card'
import { formatUSD } from '@/lib/utils'
import type { ReportsSummaryStats } from '@/server/queries/crm/reports'

interface ReportsStatCardsProps {
  stats: ReportsSummaryStats
}

export function ReportsStatCards({ stats }: ReportsStatCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Active carriers" value={stats.activeCarriers} icon={Truck} />
      <StatCard title="Loads this month" value={stats.loadsThisMonth} icon={Package} />
      <StatCard title="Revenue this month" value={formatUSD(stats.revenueThisMonth)} icon={DollarSign} />
      <StatCard title="Avg. dispatch fee" value={`${stats.avgDispatchFeePct.toFixed(1)}%`} icon={Percent} />
    </div>
  )
}
