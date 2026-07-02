import 'server-only'
import { db } from '@/server/db'
import type { Prisma, LeadStatus } from '@prisma/client'

export type LeadsFilter = {
  assignedToId?: string // Dispatcher's own leads
  qualifiedById?: string // Caller's own qualified history
  status?: LeadStatus
  search?: string
  page?: number
  pageSize?: number
}

export async function getLeads(filter: LeadsFilter = {}) {
  const { assignedToId, qualifiedById, status, search, page = 1, pageSize = 25 } = filter

  const where: Prisma.LeadWhereInput = {}
  if (assignedToId) where.assignedToId = assignedToId
  if (qualifiedById) where.qualifiedById = qualifiedById
  if (status) where.status = status
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { mcNumber: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [leads, total] = await Promise.all([
    db.lead.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ createdAt: 'asc' }],
      include: {
        qualifiedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    }),
    db.lead.count({ where }),
  ])

  return { leads, total, pages: Math.max(1, Math.ceil(total / pageSize)) }
}

export async function getActiveDispatchers() {
  return db.crmStaff.findMany({
    where: { role: 'DISPATCHER', isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}
