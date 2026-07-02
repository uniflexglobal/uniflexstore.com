import 'server-only'
import { db } from '@/server/db'
import type { Prisma, LoadStatus } from '@prisma/client'

export type LoadsFilter = {
  dispatcherId?: string
  carrierId?: string
  status?: LoadStatus
}

export async function getLoads(filter: LoadsFilter = {}) {
  const { dispatcherId, carrierId, status } = filter

  const where: Prisma.LoadWhereInput = {}
  if (dispatcherId) where.dispatcherId = dispatcherId
  if (carrierId) where.carrierId = carrierId
  if (status) where.status = status

  return db.load.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }],
    include: {
      carrier: { select: { id: true, companyName: true } },
      truck: { select: { id: true, unitNumber: true } },
      driver: { select: { id: true, name: true } },
      dispatcher: { select: { id: true, name: true } },
    },
  })
}

export async function getLoadById(id: string) {
  return db.load.findUnique({
    where: { id },
    include: {
      carrier: { select: { id: true, companyName: true, contactName: true, phone: true, email: true } },
      truck: { select: { id: true, unitNumber: true, equipmentType: true } },
      driver: { select: { id: true, name: true, phone: true } },
      dispatcher: { select: { id: true, name: true } },
      checkCalls: {
        orderBy: { createdAt: 'desc' },
        include: { loggedBy: { select: { id: true, name: true } } },
      },
    },
  })
}

/**
 * Carriers eligible to be booked for a new load. Only ACTIVE carriers —
 * onboarding/inactive/terminated carriers can't be dispatched. Scoped to a
 * single dispatcher's own book of business when provided (Dispatcher role);
 * omitted entirely for CRM_ADMIN, who can book against any active carrier.
 */
export async function getActiveCarriersForDispatch(dispatcherId?: string) {
  return db.carrier.findMany({
    where: {
      status: 'ACTIVE',
      ...(dispatcherId ? { assignedDispatcherId: dispatcherId } : {}),
    },
    select: { id: true, companyName: true },
    orderBy: { companyName: 'asc' },
  })
}

/** Trucks + drivers for a carrier, for the new-load form's cascading selects. */
export async function getCarrierFleet(carrierId: string) {
  const [trucks, drivers] = await Promise.all([
    db.truck.findMany({
      where: { carrierId, isActive: true },
      select: { id: true, unitNumber: true, equipmentType: true },
      orderBy: { unitNumber: 'asc' },
    }),
    db.driver.findMany({
      where: { carrierId, isActive: true },
      select: { id: true, name: true, truckId: true },
      orderBy: { name: 'asc' },
    }),
  ])
  return { trucks, drivers }
}
