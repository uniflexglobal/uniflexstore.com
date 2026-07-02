import 'server-only'
import { db } from '@/server/db'
import type { Prisma, ProspectStatus } from '@prisma/client'

export type ProspectsFilter = {
  assignedToId?: string // omit to see every caller's prospects (admin)
  status?: ProspectStatus
  search?: string
  page?: number
  pageSize?: number
}

export async function getProspects(filter: ProspectsFilter = {}) {
  const { assignedToId, status, search, page = 1, pageSize = 25 } = filter

  const where: Prisma.ProspectWhereInput = {}
  if (assignedToId) where.assignedToId = assignedToId
  if (status) where.status = status
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [prospects, total] = await Promise.all([
    db.prospect.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      // Untouched (NEW) prospects first, then oldest-first so nothing sits forever
      orderBy: [{ createdAt: 'asc' }],
      include: { assignedTo: { select: { id: true, name: true } } },
    }),
    db.prospect.count({ where }),
  ])

  return { prospects, total, pages: Math.max(1, Math.ceil(total / pageSize)) }
}

export async function getActiveCallers() {
  return db.crmStaff.findMany({
    where: { role: 'CALLER', isActive: true },
    select: { id: true, name: true, isSeniorCaller: true },
    orderBy: { name: 'asc' },
  })
}
