'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { DocumentType } from '@prisma/client'
import { db } from '@/server/db'
import { requireCrmRole } from '@/lib/dal'

const documentSchema = z.object({
  carrierId: z.string().min(1),
  type: z.nativeEnum(DocumentType),
  fileUrl: z.string().min(1, 'File is required'),
  fileName: z.string().min(1),
  issuedAt: z.string().optional(),
  expiresAt: z.string().optional(),
})

export async function createDocument(data: z.infer<typeof documentSchema>) {
  const session = await requireCrmRole('DISPATCHER', 'CRM_ADMIN')
  const parsed = documentSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const carrier = await db.carrier.findUnique({
    where: { id: parsed.data.carrierId },
    select: { assignedDispatcherId: true },
  })
  if (!carrier) return { error: 'Carrier not found' }
  if (session.user.crmRole === 'DISPATCHER' && carrier.assignedDispatcherId !== session.user.id) {
    return { error: 'This carrier is not assigned to you' }
  }

  try {
    await db.document.create({
      data: {
        carrierId: parsed.data.carrierId,
        type: parsed.data.type,
        fileUrl: parsed.data.fileUrl,
        fileName: parsed.data.fileName,
        issuedAt: parsed.data.issuedAt ? new Date(parsed.data.issuedAt) : null,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
        uploadedById: session.user.id,
      },
    })
  } catch {
    return { error: 'Failed to save document' }
  }

  await db.activityLog.create({
    data: {
      staffId: session.user.id,
      carrierId: parsed.data.carrierId,
      type: 'document_upload',
      note: `${parsed.data.type} document uploaded`,
    },
  })

  revalidatePath(`/crm/carriers/${parsed.data.carrierId}`)
  revalidatePath('/crm/documents')
  return { success: true }
}

export async function deleteDocument(id: string) {
  const session = await requireCrmRole('DISPATCHER', 'CRM_ADMIN')

  const document = await db.document.findUnique({
    where: { id },
    include: { carrier: { select: { id: true, assignedDispatcherId: true } } },
  })
  if (!document) return { error: 'Document not found' }
  if (session.user.crmRole === 'DISPATCHER' && document.carrier.assignedDispatcherId !== session.user.id) {
    return { error: 'This carrier is not assigned to you' }
  }

  try {
    await db.document.delete({ where: { id } })
  } catch {
    return { error: 'Failed to delete document' }
  }

  await db.activityLog.create({
    data: {
      staffId: session.user.id,
      carrierId: document.carrierId,
      type: 'note',
      note: `${document.type} document deleted`,
    },
  })

  revalidatePath(`/crm/carriers/${document.carrierId}`)
  revalidatePath('/crm/documents')
  return { success: true }
}
