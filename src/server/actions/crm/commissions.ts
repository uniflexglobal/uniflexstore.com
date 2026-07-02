'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/server/db'
import { requireCrmRole } from '@/lib/dal'

// type is intentionally free text (no enum) — commission rules aren't
// confirmed yet, see prisma/schema.prisma comment on Commission.type.
const createCommissionSchema = z.object({
  staffId: z.string().min(1, 'Staff member is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  type: z.string().trim().min(1, 'Type is required').max(100),
  loadId: z.string().optional(),
  leadId: z.string().optional(),
})

export async function createCommission(data: z.infer<typeof createCommissionSchema>) {
  await requireCrmRole('CRM_ADMIN')
  const parsed = createCommissionSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const { staffId, amount, type, loadId, leadId } = parsed.data

  const staff = await db.crmStaff.findUnique({ where: { id: staffId } })
  if (!staff) return { error: 'Staff member not found' }

  await db.commission.create({
    data: {
      staffId,
      amount,
      type,
      loadId: loadId || null,
      leadId: leadId || null,
    },
  })

  revalidatePath('/crm/commissions')
  return { success: true }
}

// Toggle — sets paidAt on first call, clears it if called again (e.g. to
// undo a mistaken mark). This is a manual ledger, so both directions matter.
export async function markCommissionPaid(id: string) {
  await requireCrmRole('CRM_ADMIN')

  const commission = await db.commission.findUnique({ where: { id } })
  if (!commission) return { error: 'Commission not found' }

  await db.commission.update({
    where: { id },
    data: { paidAt: commission.paidAt ? null : new Date() },
  })

  revalidatePath('/crm/commissions')
  return { success: true }
}
