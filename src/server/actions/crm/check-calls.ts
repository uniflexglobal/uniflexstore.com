'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/server/db'
import { requireCrmRole } from '@/lib/dal'

const logCheckCallSchema = z.object({
  loadId: z.string().min(1),
  note: z.string().min(1, 'Enter a note for this check call').trim(),
  location: z.string().trim().optional(),
})

export async function logCheckCall(data: z.infer<typeof logCheckCallSchema>) {
  const session = await requireCrmRole('DISPATCHER', 'CRM_ADMIN')
  const parsed = logCheckCallSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const load = await db.load.findUnique({ where: { id: parsed.data.loadId } })
  if (!load) return { error: 'Load not found' }
  if (session.user.crmRole === 'DISPATCHER' && load.dispatcherId !== session.user.id) {
    return { error: 'This load is not assigned to you' }
  }

  await db.checkCall.create({
    data: {
      loadId: load.id,
      note: parsed.data.note,
      location: parsed.data.location || null,
      loggedById: session.user.id,
    },
  })

  revalidatePath(`/crm/dispatch/loads/${load.id}`)
  return { success: true }
}
