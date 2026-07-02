'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/server/db'
import { requireCrmRole } from '@/lib/dal'

const driverSchema = z.object({
  carrierId: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  cdlNumber: z.string().optional(),
  truckId: z.string().optional(), // '' or omitted = unassigned
})

const driverUpdateSchema = driverSchema.partial().extend({ isActive: z.boolean().optional() })

async function assertCarrierAccess(carrierId: string, session: Awaited<ReturnType<typeof requireCrmRole>>) {
  const carrier = await db.carrier.findUnique({ where: { id: carrierId }, select: { assignedDispatcherId: true } })
  if (!carrier) return 'Carrier not found'
  if (session.user.crmRole === 'DISPATCHER' && carrier.assignedDispatcherId !== session.user.id) {
    return 'This carrier is not assigned to you'
  }
  return null
}

async function assertTruckBelongsToCarrier(truckId: string, carrierId: string) {
  const truck = await db.truck.findUnique({ where: { id: truckId } })
  if (!truck || truck.carrierId !== carrierId) return 'Selected truck does not belong to this carrier'
  return null
}

export async function createDriver(data: z.infer<typeof driverSchema>) {
  const session = await requireCrmRole('DISPATCHER', 'CRM_ADMIN')
  const parsed = driverSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const accessError = await assertCarrierAccess(parsed.data.carrierId, session)
  if (accessError) return { error: accessError }

  if (parsed.data.truckId) {
    const truckError = await assertTruckBelongsToCarrier(parsed.data.truckId, parsed.data.carrierId)
    if (truckError) return { error: truckError }
  }

  try {
    await db.driver.create({
      data: {
        carrierId: parsed.data.carrierId,
        name: parsed.data.name,
        phone: parsed.data.phone,
        cdlNumber: parsed.data.cdlNumber || null,
        truckId: parsed.data.truckId || null,
      },
    })
  } catch {
    return { error: 'Failed to add driver' }
  }

  await db.activityLog.create({
    data: {
      staffId: session.user.id,
      carrierId: parsed.data.carrierId,
      type: 'driver_added',
      note: `Driver ${parsed.data.name} added`,
    },
  })

  revalidatePath(`/crm/carriers/${parsed.data.carrierId}`)
  return { success: true }
}

export async function updateDriver(id: string, data: z.infer<typeof driverUpdateSchema>) {
  const session = await requireCrmRole('DISPATCHER', 'CRM_ADMIN')
  const parsed = driverUpdateSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const driver = await db.driver.findUnique({ where: { id } })
  if (!driver) return { error: 'Driver not found' }
  const accessError = await assertCarrierAccess(driver.carrierId, session)
  if (accessError) return { error: accessError }

  if (parsed.data.truckId) {
    const truckError = await assertTruckBelongsToCarrier(parsed.data.truckId, driver.carrierId)
    if (truckError) return { error: truckError }
  }

  try {
    await db.driver.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
        ...(parsed.data.cdlNumber !== undefined && { cdlNumber: parsed.data.cdlNumber || null }),
        ...(parsed.data.truckId !== undefined && { truckId: parsed.data.truckId || null }),
        ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
      },
    })
  } catch {
    return { error: 'Failed to update driver' }
  }

  revalidatePath(`/crm/carriers/${driver.carrierId}`)
  return { success: true }
}

export async function deactivateDriver(id: string) {
  const session = await requireCrmRole('DISPATCHER', 'CRM_ADMIN')

  const driver = await db.driver.findUnique({ where: { id } })
  if (!driver) return { error: 'Driver not found' }
  const accessError = await assertCarrierAccess(driver.carrierId, session)
  if (accessError) return { error: accessError }

  try {
    await db.driver.update({ where: { id }, data: { isActive: false } })
  } catch {
    return { error: 'Failed to deactivate driver' }
  }

  await db.activityLog.create({
    data: { staffId: session.user.id, carrierId: driver.carrierId, type: 'note', note: `Driver ${driver.name} deactivated` },
  })

  revalidatePath(`/crm/carriers/${driver.carrierId}`)
  return { success: true }
}
