import { CrmTopbar } from '@/components/crm/topbar'
import {
  getRevenueOverTime,
  getPipelineFunnel,
  getLoadsByDispatcher,
  getLeadsByCaller,
  getCommissionsByStaff,
  getReportsSummaryStats,
} from '@/server/queries/crm/reports'
import { ReportsStatCards } from './_components/reports-stat-cards'
import { RevenueOverTimeChart } from './_components/revenue-over-time-chart'
import { PipelineFunnel } from './_components/pipeline-funnel'
import { LoadsByDispatcherChart, LeadsByCallerChart } from './_components/staff-performance-charts'
import { CommissionSummary } from './_components/commission-summary'

export default async function CrmReportsPage() {
  const [summaryStats, revenueOverTime, pipelineFunnel, loadsByDispatcher, leadsByCaller, commissionsByStaff] =
    await Promise.all([
      getReportsSummaryStats(),
      getRevenueOverTime(),
      getPipelineFunnel(),
      getLoadsByDispatcher(),
      getLeadsByCaller(),
      getCommissionsByStaff(),
    ])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CrmTopbar title="Reports" />
      <main className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          <ReportsStatCards stats={summaryStats} />

          <div className="grid gap-4 lg:grid-cols-2">
            <RevenueOverTimeChart data={revenueOverTime} />
            <PipelineFunnel data={pipelineFunnel} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <LoadsByDispatcherChart data={loadsByDispatcher} />
            <LeadsByCallerChart data={leadsByCaller} />
          </div>

          <CommissionSummary data={commissionsByStaff} />
        </div>
      </main>
    </div>
  )
}
