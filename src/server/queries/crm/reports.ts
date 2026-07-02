import 'server-only'
import { db } from '@/server/db'
import { decimalToNumber } from '@/lib/utils'

// ─── Revenue over time (paid invoices, bucketed by month) ─────────────

export type RevenuePoint = { month: string; revenue: number; invoices: number }

export async function getRevenueOverTime(months = 6): Promise<RevenuePoint[]> {
  const since = new Date()
  since.setMonth(since.getMonth() - (months - 1))
  since.setDate(1)
  since.setHours(0, 0, 0, 0)

  const paidInvoices = await db.invoice.findMany({
    where: { status: 'PAID', paidAt: { gte: since } },
    select: { amount: true, paidAt: true },
  })

  // JS-side bucketing by month, mirroring the daily-bucketing approach used
  // in src/server/queries/admin/analytics.ts (findMany + Map, not raw SQL).
  const bucketMap = new Map<string, { revenue: number; invoices: number }>()
  for (const inv of paidInvoices) {
    const d = inv.paidAt ?? new Date()
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const existing = bucketMap.get(key) ?? { revenue: 0, invoices: 0 }
    existing.revenue += decimalToNumber(inv.amount)
    existing.invoices += 1
    bucketMap.set(key, existing)
  }

  // Ensure every month in the range appears, even with zero revenue, so the
  // chart always renders a full axis instead of collapsing to sparse points.
  const points: RevenuePoint[] = []
  const cursor = new Date(since)
  for (let i = 0; i < months; i++) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
    const label = cursor.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    const bucket = bucketMap.get(key) ?? { revenue: 0, invoices: 0 }
    points.push({ month: label, revenue: bucket.revenue, invoices: bucket.invoices })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return points
}

// ─── Pipeline conversion funnel ────────────────────────────────────────

export type FunnelStage = { stage: string; count: number }

export async function getPipelineFunnel(): Promise<FunnelStage[]> {
  // A Lead record only ever exists because a Prospect was qualified into one,
  // and a Carrier only exists because a Lead was assigned to a Dispatcher —
  // so each stage's raw count is already the funnel count at that stage.
  const [prospects, leads, carriers, activeCarriers] = await Promise.all([
    db.prospect.count(),
    db.lead.count(),
    db.carrier.count(),
    db.carrier.count({ where: { status: 'ACTIVE' } }),
  ])

  return [
    { stage: 'Prospects', count: prospects },
    { stage: 'Qualified leads', count: leads },
    { stage: 'Carriers assigned', count: carriers },
    { stage: 'Active carriers', count: activeCarriers },
  ]
}

// ─── Loads per dispatcher ───────────────────────────────────────────────

export type DispatcherLoadCount = { staffId: string; name: string; count: number }

export async function getLoadsByDispatcher(): Promise<DispatcherLoadCount[]> {
  const grouped = await db.load.groupBy({
    by: ['dispatcherId'],
    _count: true,
    where: { dispatcherId: { not: null } },
  })

  if (grouped.length === 0) return []

  const staffIds = grouped.map((g) => g.dispatcherId).filter((id): id is string => id !== null)
  const staff = await db.crmStaff.findMany({ where: { id: { in: staffIds } }, select: { id: true, name: true } })

  return grouped
    .map((g) => ({
      staffId: g.dispatcherId as string,
      name: staff.find((s) => s.id === g.dispatcherId)?.name ?? 'Unknown',
      count: g._count,
    }))
    .sort((a, b) => b.count - a.count)
}

// ─── Leads qualified per caller ─────────────────────────────────────────

export type CallerLeadCount = { staffId: string; name: string; count: number }

export async function getLeadsByCaller(): Promise<CallerLeadCount[]> {
  const grouped = await db.lead.groupBy({
    by: ['qualifiedById'],
    _count: true,
    where: { qualifiedById: { not: null } },
  })

  if (grouped.length === 0) return []

  const staffIds = grouped.map((g) => g.qualifiedById).filter((id): id is string => id !== null)
  const staff = await db.crmStaff.findMany({ where: { id: { in: staffIds } }, select: { id: true, name: true } })

  return grouped
    .map((g) => ({
      staffId: g.qualifiedById as string,
      name: staff.find((s) => s.id === g.qualifiedById)?.name ?? 'Unknown',
      count: g._count,
    }))
    .sort((a, b) => b.count - a.count)
}

// ─── Commission summary per staff (paid vs unpaid) ──────────────────────

export type StaffCommissionSummary = { staffId: string; name: string; paid: number; unpaid: number; total: number }

export async function getCommissionsByStaff(): Promise<StaffCommissionSummary[]> {
  const [paidGrouped, unpaidGrouped] = await Promise.all([
    db.commission.groupBy({ by: ['staffId'], _sum: { amount: true }, where: { paidAt: { not: null } } }),
    db.commission.groupBy({ by: ['staffId'], _sum: { amount: true }, where: { paidAt: null } }),
  ])

  const staffIds = Array.from(new Set([...paidGrouped.map((g) => g.staffId), ...unpaidGrouped.map((g) => g.staffId)]))
  if (staffIds.length === 0) return []

  const staff = await db.crmStaff.findMany({ where: { id: { in: staffIds } }, select: { id: true, name: true } })

  return staffIds
    .map((staffId) => {
      const paid = decimalToNumber(paidGrouped.find((g) => g.staffId === staffId)?._sum.amount ?? 0)
      const unpaid = decimalToNumber(unpaidGrouped.find((g) => g.staffId === staffId)?._sum.amount ?? 0)
      return {
        staffId,
        name: staff.find((s) => s.id === staffId)?.name ?? 'Unknown',
        paid,
        unpaid,
        total: paid + unpaid,
      }
    })
    .sort((a, b) => b.total - a.total)
}

// ─── Headline stat cards ────────────────────────────────────────────────

export type ReportsSummaryStats = {
  activeCarriers: number
  loadsThisMonth: number
  revenueThisMonth: number
  avgDispatchFeePct: number
}

export async function getReportsSummaryStats(): Promise<ReportsSummaryStats> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [activeCarriers, loadsThisMonth, revenueThisMonth, feePctAgg] = await Promise.all([
    db.carrier.count({ where: { status: 'ACTIVE' } }),
    db.load.count({ where: { createdAt: { gte: startOfMonth } } }),
    db.invoice.aggregate({ _sum: { amount: true }, where: { status: 'PAID', paidAt: { gte: startOfMonth } } }),
    db.load.aggregate({ _avg: { dispatchFeePct: true }, where: { dispatchFeePct: { not: null } } }),
  ])

  return {
    activeCarriers,
    loadsThisMonth,
    revenueThisMonth: decimalToNumber(revenueThisMonth._sum.amount ?? 0),
    avgDispatchFeePct: decimalToNumber(feePctAgg._avg.dispatchFeePct ?? 0),
  }
}
