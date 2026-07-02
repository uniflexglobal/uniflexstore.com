'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/server/db'
import { requireCrmRole } from '@/lib/dal'
import { TRUCK_TYPES } from '@/config/crm'

const truckSchema = z.object({
  carrierId: z.string().min(1),
  unitNumber: z.string().min(1, 'Unit number is required'),
  equipmentType: z.enum(TRUCK_TYPES),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  vin: z.string().optional(),
})

const truckUpdateSchema = truckSchema.partial().extend({ isActive: z.boolean().optional() })

async function assertCarrierAccess(carrierId: string, session: Awaited<ReturnType<typeof requireCrmRole>>) {
  const carrier = await db.carrier.findUnique({ where: { id: carrierId }, select: { assignedDispatcherId: true } })
  if (!carrier) return 'Carrier not found'
  if (session.user.crmRole === 'DISPATCHER' && carrier.assignedDispatcherId !== session.user.id) {
    return 'This carrier is not assigned to you'
  }
  return null
}

export async function createTruck(data: z.infer<typeof truckSchema>) {
  const session = await requireCrmRole('DISPATCHER', 'CRM_ADMIN')
  const parsed = truckSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const accessError = await assertCarrierAccess(parsed.data.carrierId, session)
  if (accessError) return { error: accessError }

  try {
    await db.truck.create({
      data: {
        carrierId: parsed.data.carrierId,
        unitNumber: parsed.data.unitNumber,
        equipmentType: parsed.data.equipmentType,
        make: parsed.data.make || null,
        model: parsed.data.model || null,
        year: parsed.data.year ?? null,
        vin: parsed.data.vin || null,
      },
    })
  } catch {
    return { error: 'Failed to add truck' }
  }

  await db.activityLog.create({
    data: {
      staffId: session.user.id,
      carrierId: parsed.data.carrierId,
      type: 'truck_added',
      note: `Truck ${parsed.data.unitNumber} added`,
    },
  })

  revalidatePath(`/crm/carriers/${parsed.data.carrierId}`)
  return { success: true }
}

export async function updateTruck(id: string, data: z.infer<typeof truckUpdateSchema>) {
  const session = await requireCrmRole('DISPATCHER', 'CRM_ADMIN')
  const parsed = truckUpdateSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const truck = await db.truck.findUnique({ where: { id } })
  if (!truck) return { error: 'Truck not found' }
  const accessError = await assertCarrierAccess(truck.carrierId, session)
  if (accessError) return { error: accessError }

  try {
    await db.truck.update({
      where: { id },
      data: {
        ...(parsed.data.unitNumber !== undefined && { unitNumber: parsed.data.unitNumber }),
        ...(parsed.data.equipmentType !== undefined && { equipmentType: parsed.data.equipmentType }),
        ...(parsed.data.make !== undefined && { make: parsed.data.make || null }),
        ...(parsed.data.model !== undefined && { model: parsed.data.model || null }),
        ...(parsed.data.year !== undefined && { year: parsed.data.year ?? null }),
        ...(parsed.data.vin !== undefined && { vin: parsed.data.vin || null }),
        ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
      },
    })
  } catch {
    return { error: 'Failed to update truck' }
  }

  revalidatePath(`/crm/carriers/${truck.carrierId}`)
  return { success: true }
}

export async function deactivateTruck(id: string) {
  const session = await requireCrmRole('DISPATCHER', 'CRM_ADMIN')

  const truck = await db.truck.findUnique({ where: { id } })
  if (!truck) return { error: 'Truck not found' }
  const accessError = await assertCarrierAccess(truck.carrierId, session)
  if (accessError) return { error: accessError }

  try {
    await db.truck.update({ where: { id }, data: { isActive: false } })
  } catch {
    return { error: 'Failed to deactivate truck' }
  }

  await db.activityLog.create({
    data: { staffId: session.user.id, carrierId: truck.carrierId, type: 'note', note: `Truck ${truck.unitNumber} deactivated` },
  })

  revalidatePath(`/crm/carriers/${truck.carrierId}`)
  return { success: true }
}
