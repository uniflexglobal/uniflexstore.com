'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/server/db'
import { requireCrmRole } from '@/lib/dal'
import type { LoadStatus } from '@prisma/client'

// ─── Validation (kept local to this file — see leads.ts/prospects.ts convention) ─

const createLoadSchema = z.object({
  carrierId: z.string().min(1, 'Select a carrier'),
  truckId: z.string().optional(),
  driverId: z.string().optional(),
  loadNumber: z.string().min(1, 'Load number is required').trim(),
  broker: z.string().trim().optional(),
  originCity: z.string().min(1, 'Origin city is required').trim(),
  originState: z.string().min(1, 'Origin state is required').trim(),
  destCity: z.string().min(1, 'Destination city is required').trim(),
  destState: z.string().min(1, 'Destination state is required').trim(),
  pickupAt: z.string().optional(),
  deliveryAt: z.string().optional(),
  rate: z.coerce.number().positive('Rate must be greater than 0'),
  dispatchFeePct: z.coerce.number().min(0, 'Must be 0 or greater').max(100, 'Must be 100 or less').optional(),
  notes: z.string().trim().optional(),
})

const updateDocumentsSchema = z
  .object({
    rateConUrl: z.string().trim().optional(),
    bolUrl: z.string().trim().optional(),
  })
  .refine((d) => d.rateConUrl !== undefined || d.bolUrl !== undefined, 'Nothing to update')

// Only the forward path this vertical drives day-to-day. INVOICED → PAID is
// owned by the Invoicing vertical, not this board.
const FORWARD_TRANSITIONS: Record<LoadStatus, LoadStatus[]> = {
  BOOKED: ['DISPATCHED'],
  DISPATCHED: ['IN_TRANSIT'],
  IN_TRANSIT: ['DELIVERED'],
  DELIVERED: [],
  INVOICED: [],
  PAID: [],
  CANCELLED: [],
}

// A load can only be cancelled while it's still in the dispatcher's hands —
// once it's been invoiced/paid, cancelling needs to go through Invoicing.
const CANCELLABLE_FROM: LoadStatus[] = ['BOOKED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED']

async function assertLoadAccess(loadId: string, session: Awaited<ReturnType<typeof requireCrmRole>>) {
  const load = await db.load.findUnique({ where: { id: loadId } })
  if (!load) return { error: 'Load not found' as const }
  if (session.user.crmRole === 'DISPATCHER' && load.dispatcherId !== session.user.id) {
    return { error: 'This load is not assigned to you' as const }
  }
  return { load }
}

// ─── Create ────────────────────────────────────────────────────────────

export async function createLoad(data: z.input<typeof createLoadSchema>) {
  const session = await requireCrmRole('DISPATCHER', 'CRM_ADMIN')
  const parsed = createLoadSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const carrier = await db.carrier.findUnique({ where: { id: parsed.data.carrierId } })
  if (!carrier) return { error: 'Carrier not found' }
  if (carrier.status !== 'ACTIVE') return { error: 'Only active carriers can be dispatched' }
  if (session.user.crmRole === 'DISPATCHER' && carrier.assignedDispatcherId !== session.user.id) {
    return { error: 'This carrier is not assigned to you' }
  }

  if (parsed.data.truckId) {
    const truck = await db.truck.findUnique({ where: { id: parsed.data.truckId } })
    if (!truck || truck.carrierId !== carrier.id) return { error: 'Selected truck does not belong to this carrier' }
  }
  if (parsed.data.driverId) {
    const driver = await db.driver.findUnique({ where: { id: parsed.data.driverId } })
    if (!driver || driver.carrierId !== carrier.id) return { error: 'Selected driver does not belong to this carrier' }
  }

  const existing = await db.load.findUnique({ where: { loadNumber: parsed.data.loadNumber } })
  if (existing) return { error: 'A load with this load number already exists' }

  const load = await db.load.create({
    data: {
      carrierId: carrier.id,
      truckId: parsed.data.truckId || null,
      driverId: parsed.data.driverId || null,
      dispatcherId: session.user.id,
      loadNumber: parsed.data.loadNumber,
      broker: parsed.data.broker || null,
      originCity: parsed.data.originCity,
      originState: parsed.data.originState,
      destCity: parsed.data.destCity,
      destState: parsed.data.destState,
      pickupAt: parsed.data.pickupAt ? new Date(parsed.data.pickupAt) : null,
      deliveryAt: parsed.data.deliveryAt ? new Date(parsed.data.deliveryAt) : null,
      rate: parsed.data.rate,
      dispatchFeePct: parsed.data.dispatchFeePct ?? null,
      notes: parsed.data.notes || null,
    },
  })

  await db.activityLog.create({
    data: {
      staffId: session.user.id,
      carrierId: carrier.id,
      loadId: load.id,
      type: 'status_change',
      note: `Load ${load.loadNumber} booked (${load.originCity}, ${load.originState} → ${load.destCity}, ${load.destState})`,
    },
  })

  revalidatePath('/crm/dispatch')
  return { success: true, loadId: load.id }
}

// ─── Status transitions ────────────────────────────────────────────────

export async function updateLoadStatus(loadId: string, status: LoadStatus) {
  const session = await requireCrmRole('DISPATCHER', 'CRM_ADMIN')

  const access = await assertLoadAccess(loadId, session)
  if ('error' in access) return access
  const { load } = access

  if (load.status === status) return { error: 'Load is already in this status' }

  if (status === 'CANCELLED') {
    if (!CANCELLABLE_FROM.includes(load.status)) {
      return { error: 'This load can no longer be cancelled' }
    }
  } else if (!FORWARD_TRANSITIONS[load.status].includes(status)) {
    return { error: `Cannot move a load directly from ${load.status} to ${status}` }
  }

  if (status === 'DELIVERED') {
    const checkCallCount = await db.checkCall.count({ where: { loadId } })
    if (checkCallCount === 0) {
      return { error: 'Log at least one check call before marking this load delivered' }
    }
  }

  await db.load.update({ where: { id: loadId }, data: { status } })

  await db.activityLog.create({
    data: {
      staffId: session.user.id,
      carrierId: load.carrierId,
      loadId: load.id,
      type: 'status_change',
      note: `Load ${load.loadNumber} moved from ${load.status} to ${status}`,
    },
  })

  revalidatePath('/crm/dispatch')
  revalidatePath(`/crm/dispatch/loads/${loadId}`)
  return { success: true }
}

// ─── Documents ──────────────────────────────────────────────────────────

export async function updateLoadDocuments(loadId: string, data: z.infer<typeof updateDocumentsSchema>) {
  const session = await requireCrmRole('DISPATCHER', 'CRM_ADMIN')
  const parsed = updateDocumentsSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const access = await assertLoadAccess(loadId, session)
  if ('error' in access) return access

  await db.load.update({
    where: { id: loadId },
    data: {
      ...(parsed.data.rateConUrl !== undefined ? { rateConUrl: parsed.data.rateConUrl || null } : {}),
      ...(parsed.data.bolUrl !== undefined ? { bolUrl: parsed.data.bolUrl || null } : {}),
    },
  })

  revalidatePath(`/crm/dispatch/loads/${loadId}`)
  return { success: true }
}
