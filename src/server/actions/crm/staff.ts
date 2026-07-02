'use server'

import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '@/server/db'
import { requireCrmRole } from '@/lib/dal'
import { staffCreateSchema, staffUpdateSchema } from '@/lib/validations/crm'

export async function createStaff(data: z.infer<typeof staffCreateSchema>) {
  await requireCrmRole('CRM_ADMIN')
  const parsed = staffCreateSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const existing = await db.crmStaff.findUnique({ where: { email: parsed.data.email } })
  if (existing) return { error: 'A staff account with this email already exists' }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)

  await db.crmStaff.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
      phone: parsed.data.phone || null,
      isSeniorCaller: parsed.data.role === 'CALLER' ? parsed.data.isSeniorCaller : false,
    },
  })

  revalidatePath('/crm/staff')
  return { success: true }
}

export async function updateStaff(id: string, data: z.infer<typeof staffUpdateSchema>) {
  await requireCrmRole('CRM_ADMIN')
  const parsed = staffUpdateSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  await db.crmStaff.update({ where: { id }, data: parsed.data })
  revalidatePath('/crm/staff')
  return { success: true }
}
