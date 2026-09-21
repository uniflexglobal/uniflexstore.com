'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/server/db'
import { requireCrmRole } from '@/lib/dal'
import {
  prospectManualSchema,
  prospectImportRowSchema,
  callOutcomeSchema,
  qualifyLeadSchema,
} from '@/lib/validations/crm'
import { convertLeadToCarrierAssignment } from './_shared'

// ─── Manual add ───────────────────────────────────────────────────────

export async function createProspectManual(data: z.infer<typeof prospectManualSchema>) {
  const session = await requireCrmRole('CALLER', 'CRM_ADMIN')
  const parsed = prospectManualSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  // Callers default to assigning themselves. Admins leave it unassigned
  // unless they explicitly pick a caller — an admin isn't a valid "my call
  // list" owner, so silently assigning to them would hide the prospect.
  const assignedToId =
    parsed.data.assignedToId || (session.user.crmRole === 'CALLER' ? session.user.id : null)

  await db.prospect.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      truckType: parsed.data.truckType || null,
      route: parsed.data.route || null,
      message: parsed.data.message || null,
      source: 'MANUAL',
      assignedToId,
    },
  })

  revalidatePath('/crm/prospects')
  return { success: true }
}

// ─── Bulk CSV/Excel import ────────────────────────────────────────────

const importBatchSchema = z.object({
  rows: z.array(prospectImportRowSchema).min(1).max(2000),
  assignedToId: z.string().min(1),
  importBatch: z.string().optional(),
})

export async function bulkImportProspects(data: z.infer<typeof importBatchSchema>) {
  await requireCrmRole('CALLER', 'CRM_ADMIN')
  const parsed = importBatchSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const { rows, assignedToId, importBatch } = parsed.data

  await db.prospect.createMany({
    data: rows.map((r) => ({
      name: r.name,
      phone: r.phone,
      email: r.email || null,
      truckType: r.truckType || null,
      route: r.route || null,
      source: 'IMPORT' as const,
      assignedToId,
      importBatch: importBatch ?? null,
    })),
  })

  revalidatePath('/crm/prospects')
  return { success: true, count: rows.length }
}

// ─── Call outcome ─────────────────────────────────────────────────────

export async function logCallOutcome(data: z.infer<typeof callOutcomeSchema>) {
  const session = await requireCrmRole('CALLER', 'CRM_ADMIN')
  const parsed = callOutcomeSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const prospect = await db.prospect.findUnique({ where: { id: parsed.data.prospectId } })
  if (!prospect) return { error: 'Prospect not found' }
  if (session.user.crmRole === 'CALLER' && prospect.assignedToId !== session.user.id) {
    return { error: 'This prospect is not assigned to you' }
  }

  await db.prospect.update({
    where: { id: prospect.id },
    data: {
      status: parsed.data.status,
      callBackAt:
        parsed.data.status === 'CALL_BACK_LATER' && parsed.data.callBackAt
          ? new Date(parsed.data.callBackAt)
          : null,
    },
  })

  await db.activityLog.create({
    data: {
      staffId: session.user.id,
      prospectId: prospect.id,
      type: 'call',
      note: parsed.data.note || null,
    },
  })

  revalidatePath('/crm/prospects')
  return { success: true }
}

// ─── Qualify a prospect into a full Lead ──────────────────────────────

export async function qualifyLead(data: z.infer<typeof qualifyLeadSchema>) {
  const session = await requireCrmRole('CALLER', 'CRM_ADMIN')
  const parsed = qualifyLeadSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const prospect = await db.prospect.findUnique({ where: { id: parsed.data.prospectId } })
  if (!prospect) return { error: 'Prospect not found' }
  if (session.user.crmRole === 'CALLER' && prospect.assignedToId !== session.user.id) {
    return { error: 'This prospect is not assigned to you' }
  }
  if (prospect.qualifiedLeadId) return { error: 'This prospect has already been qualified' }

  // Admins qualifying directly are treated as "senior" for the direct-assign option.
  const isSeniorCaller =
    session.user.crmRole === 'CRM_ADMIN'
      ? true
      : ((await db.crmStaff.findUnique({ where: { id: session.user.id }, select: { isSeniorCaller: true } }))
          ?.isSeniorCaller ?? false)

  const lead = await db.lead.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      mcNumber: parsed.data.mcNumber || null,
      address: parsed.data.address || null,
      zipCode: parsed.data.zipCode || null,
      truckType: parsed.data.truckType,
      weightAllowed: parsed.data.weightAllowed || null,
      preferredRoute: parsed.data.preferredRoute || null,
      availableAt: parsed.data.availableAt ? new Date(parsed.data.availableAt) : null,
      notes: parsed.data.notes || null,
      qualifiedById: session.user.id,
      status: 'AWAITING_ASSIGNMENT',
    },
  })

  await db.prospect.update({
    where: { id: prospect.id },
    data: { status: 'QUALIFIED', qualifiedLeadId: lead.id },
  })

  await db.activityLog.create({
    data: { staffId: session.user.id, prospectId: prospect.id, leadId: lead.id, type: 'qualify' },
  })

  if (isSeniorCaller && parsed.data.assignToDispatcherId) {
    await convertLeadToCarrierAssignment(lead.id, parsed.data.assignToDispatcherId, session.user.id)
  }

  revalidatePath('/crm/prospects')
  revalidatePath('/crm/leads')
  revalidatePath('/crm')
  return { success: true }
}

// ─── Reassign (admin only) ────────────────────────────────────────────

export async function reassignProspect(prospectId: string, newCallerId: string) {
  await requireCrmRole('CRM_ADMIN')
  try {
    await db.prospect.update({ where: { id: prospectId }, data: { assignedToId: newCallerId } })
  } catch {
    return { error: 'Failed to reassign prospect' }
  }
  revalidatePath('/crm/prospects')
  return { success: true }
}
