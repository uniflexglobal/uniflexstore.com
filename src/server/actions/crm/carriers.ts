'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/server/db'
import { requireCrmRole } from '@/lib/dal'
import { REQUIRED_ONBOARDING_DOCS } from '@/config/crm'

const updateCarrierSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Enter a valid email'),
  mcNumber: z.string().optional(),
  dotNumber: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

export async function updateCarrier(id: string, data: z.infer<typeof updateCarrierSchema>) {
  const session = await requireCrmRole('DISPATCHER', 'CRM_ADMIN')
  const parsed = updateCarrierSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const carrier = await db.carrier.findUnique({ where: { id } })
  if (!carrier) return { error: 'Carrier not found' }
  if (session.user.crmRole === 'DISPATCHER' && carrier.assignedDispatcherId !== session.user.id) {
    return { error: 'This carrier is not assigned to you' }
  }

  try {
    await db.carrier.update({
      where: { id },
      data: {
        companyName: parsed.data.companyName,
        contactName: parsed.data.contactName,
        phone: parsed.data.phone,
        email: parsed.data.email,
        mcNumber: parsed.data.mcNumber || null,
        dotNumber: parsed.data.dotNumber || null,
        address: parsed.data.address || null,
        notes: parsed.data.notes || null,
      },
    })
  } catch {
    return { error: 'Failed to update carrier' }
  }

  await db.activityLog.create({
    data: { staffId: session.user.id, carrierId: id, type: 'note', note: 'Carrier profile updated' },
  })

  revalidatePath(`/crm/carriers/${id}`)
  revalidatePath('/crm/carriers')
  return { success: true }
}

// ─── Mark carrier Active (onboarding complete) ────────────────────────

export async function markCarrierActive(id: string) {
  const session = await requireCrmRole('DISPATCHER', 'CRM_ADMIN')

  const carrier = await db.carrier.findUnique({ where: { id }, include: { documents: true } })
  if (!carrier) return { error: 'Carrier not found' }
  if (session.user.crmRole === 'DISPATCHER' && carrier.assignedDispatcherId !== session.user.id) {
    return { error: 'This carrier is not assigned to you' }
  }
  if (carrier.status !== 'ONBOARDING') return { error: 'Carrier is not in onboarding status' }

  // Re-validate server-side — never trust the client's checklist state alone.
  const presentTypes = new Set(carrier.documents.map((d) => d.type))
  const missing = REQUIRED_ONBOARDING_DOCS.filter((t) => !presentTypes.has(t))
  if (missing.length > 0) {
    return { error: `Missing required documents: ${missing.join(', ')}` }
  }

  try {
    await db.carrier.update({ where: { id }, data: { status: 'ACTIVE' } })
  } catch {
    return { error: 'Failed to activate carrier' }
  }

  await db.activityLog.create({
    data: {
      staffId: session.user.id,
      carrierId: id,
      type: 'status_change',
      note: 'Carrier marked Active — onboarding complete',
    },
  })

  revalidatePath(`/crm/carriers/${id}`)
  revalidatePath('/crm/carriers')
  revalidatePath('/crm')
  return { success: true }
}

// ─── Reassign (admin only) ────────────────────────────────────────────

export async function reassignCarrier(id: string, newDispatcherId: string) {
  const session = await requireCrmRole('CRM_ADMIN')

  try {
    await db.carrier.update({ where: { id }, data: { assignedDispatcherId: newDispatcherId } })
  } catch {
    return { error: 'Failed to reassign carrier' }
  }

  await db.activityLog.create({
    data: {
      staffId: session.user.id,
      carrierId: id,
      type: 'assign',
      note: 'Carrier reassigned to a different dispatcher',
    },
  })

  revalidatePath('/crm/carriers')
  revalidatePath(`/crm/carriers/${id}`)
  return { success: true }
}
