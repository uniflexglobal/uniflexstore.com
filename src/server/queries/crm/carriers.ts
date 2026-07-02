import 'server-only'
import { db } from '@/server/db'
import type { Prisma, CarrierStatus } from '@prisma/client'

export type CarriersFilter = {
  dispatcherId?: string // omit to see every dispatcher's carriers (admin)
  status?: CarrierStatus
  search?: string
  page?: number
  pageSize?: number
}

export async function getCarriers(filter: CarriersFilter = {}) {
  const { dispatcherId, status, search, page = 1, pageSize = 25 } = filter

  const where: Prisma.CarrierWhereInput = {}
  if (dispatcherId) where.assignedDispatcherId = dispatcherId
  if (status) where.status = status
  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: 'insensitive' } },
      { contactName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { mcNumber: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [carriers, total] = await Promise.all([
    db.carrier.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        assignedDispatcher: { select: { id: true, name: true } },
        _count: { select: { trucks: true, drivers: true, documents: true } },
      },
    }),
    db.carrier.count({ where }),
  ])

  return { carriers, total, pages: Math.max(1, Math.ceil(total / pageSize)) }
}

export async function getCarrierById(id: string) {
  return db.carrier.findUnique({
    where: { id },
    include: {
      assignedDispatcher: { select: { id: true, name: true } },
      trucks: { orderBy: { createdAt: 'asc' } },
      drivers: {
        orderBy: { createdAt: 'asc' },
        include: { truck: { select: { id: true, unitNumber: true } } },
      },
      documents: {
        orderBy: { createdAt: 'desc' },
        include: { uploadedBy: { select: { id: true, name: true } } },
      },
      activity: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { staff: { select: { id: true, name: true } } },
      },
    },
  })
}
