'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/server/db'
import { requireCrmRole } from '@/lib/dal'
import { assignDispatcherSchema } from '@/lib/validations/crm'
import { convertLeadToCarrierAssignment } from './_shared'

export async function assignDispatcher(data: z.infer<typeof assignDispatcherSchema>) {
  const session = await requireCrmRole('CRM_ADMIN')
  const parsed = assignDispatcherSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const lead = await db.lead.findUnique({ where: { id: parsed.data.leadId } })
  if (!lead) return { error: 'Lead not found' }
  if (lead.status !== 'AWAITING_ASSIGNMENT') return { error: 'This lead has already been assigned' }

  await convertLeadToCarrierAssignment(lead.id, parsed.data.dispatcherId, session.user.id)

  revalidatePath('/crm/leads')
  revalidatePath('/crm')
  return { success: true }
}

export async function markLeadLost(leadId: string, reason?: string) {
  const session = await requireCrmRole('CRM_ADMIN', 'DISPATCHER')

  const lead = await db.lead.findUnique({ where: { id: leadId } })
  if (!lead) return { error: 'Lead not found' }
  if (session.user.crmRole === 'DISPATCHER' && lead.assignedToId !== session.user.id) {
    return { error: 'This lead is not assigned to you' }
  }

  await db.lead.update({ where: { id: leadId }, data: { status: 'LOST', lostReason: reason || null } })
  await db.activityLog.create({
    data: { staffId: session.user.id, leadId, type: 'status_change', note: reason || 'Marked lost' },
  })

  revalidatePath('/crm/leads')
  return { success: true }
}
