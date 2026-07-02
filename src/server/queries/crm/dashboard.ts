import 'server-only'
import { db } from '@/server/db'
import type { CrmRole } from '@prisma/client'
import { getAllDocuments } from './documents'
import { getReportsSummaryStats } from './reports'

function startOfWeek(): Date {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday as start of week
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function getCallerDashboard(staffId: string) {
  const [callListCount, qualifiedThisWeek] = await Promise.all([
    db.prospect.count({
      where: { assignedToId: staffId, status: { notIn: ['QUALIFIED', 'NOT_INTERESTED', 'DO_NOT_CALL'] } },
    }),
    db.lead.count({ where: { qualifiedById: staffId, createdAt: { gte: startOfWeek() } } }),
  ])
  return { callListCount, qualifiedThisWeek }
}

export async function getDispatcherDashboard(staffId: string) {
  const [newlyAssigned, activeCarriers, documents] = await Promise.all([
    db.lead.count({ where: { assignedToId: staffId, status: 'ASSIGNED' } }),
    db.carrier.count({ where: { assignedDispatcherId: staffId, status: 'ACTIVE' } }),
    getAllDocuments({ dispatcherId: staffId }),
  ])
  const expiringDocs = documents.filter((d) => d.expiryStatus === 'expired' || d.expiryStatus === 'expiring').length
  return { newlyAssigned, activeCarriers, expiringDocs }
}

export async function getAdminDashboard() {
  const [totalProspects, totalLeads, awaitingAssignment, awaitingCount, totalCarriers, totalStaff, documents, summary] =
    await Promise.all([
      db.prospect.count(),
      db.lead.count(),
      db.lead.findMany({
        where: { status: 'AWAITING_ASSIGNMENT' },
        orderBy: { createdAt: 'asc' },
        take: 10,
        include: { qualifiedBy: { select: { name: true } } },
      }),
      db.lead.count({ where: { status: 'AWAITING_ASSIGNMENT' } }),
      db.carrier.count(),
      db.crmStaff.count({ where: { isActive: true } }),
      getAllDocuments(),
      getReportsSummaryStats(),
    ])
  const expiringDocs = documents.filter((d) => d.expiryStatus === 'expired' || d.expiryStatus === 'expiring').length
  return {
    totalProspects,
    totalLeads,
    awaitingAssignment,
    awaitingCount,
    totalCarriers,
    totalStaff,
    expiringDocs,
    activeCarriers: summary.activeCarriers,
    loadsThisMonth: summary.loadsThisMonth,
    revenueThisMonth: summary.revenueThisMonth,
  }
}

export async function getCrmDashboard(role: CrmRole, staffId: string) {
  if (role === 'CALLER') return { role, ...(await getCallerDashboard(staffId)) }
  if (role === 'DISPATCHER') return { role, ...(await getDispatcherDashboard(staffId)) }
  return { role, ...(await getAdminDashboard()) }
}
