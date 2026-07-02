'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/server/db'
import { requireCrmRole } from '@/lib/dal'

const createInvoiceSchema = z.object({
  loadId: z.string().optional(),
  carrierId: z.string().min(1, 'Carrier is required'),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
})

// Draft -> Sent and Sent -> Unpaid have no side effects, so they share this
// generic action. Unpaid -> Paid goes through markPaid (it also has to sync
// the Load), and Sent/Unpaid -> Factored goes through markSentToFactoring.
const FORWARD_TRANSITIONS: Record<string, string> = {
  DRAFT: 'SENT',
  SENT: 'UNPAID',
}

async function assertCarrierAccess(carrierId: string, crmRole: string, staffId: string) {
  if (crmRole !== 'DISPATCHER') return null
  const carrier = await db.carrier.findUnique({ where: { id: carrierId } })
  if (!carrier || carrier.assignedDispatcherId !== staffId) {
    return 'You are not assigned to this carrier'
  }
  return null
}

export async function createInvoice(data: z.infer<typeof createInvoiceSchema>) {
  const session = await requireCrmRole('CRM_ADMIN', 'DISPATCHER')
  const parsed = createInvoiceSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const { loadId, invoiceNumber, amount, dueDate, notes } = parsed.data
  let carrierId = parsed.data.carrierId

  if (loadId) {
    const load = await db.load.findUnique({ where: { id: loadId }, include: { invoice: true } })
    if (!load) return { error: 'Load not found' }
    if (load.invoice) return { error: 'This load already has an invoice' }
    if (load.status !== 'DELIVERED') return { error: 'Only delivered loads can be invoiced' }
    // Trust the load's own carrier, not whatever the client submitted.
    carrierId = load.carrierId
  }

  const accessError = await assertCarrierAccess(carrierId, session.user.crmRole as string, session.user.id)
  if (accessError) return { error: accessError }

  const existingNumber = await db.invoice.findUnique({ where: { invoiceNumber } })
  if (existingNumber) return { error: 'An invoice with this number already exists' }

  await db.$transaction(async (tx) => {
    await tx.invoice.create({
      data: {
        loadId: loadId || null,
        carrierId,
        invoiceNumber,
        amount,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
      },
    })
    // Keep the Load's own status in sync with the dispatch-fee invoice
    // lifecycle — LOAD_STATUS_ORDER already models INVOICED as the step
    // between DELIVERED and PAID, so this just fulfills that ordering
    // instead of leaving the dispatch board to drift out of sync.
    if (loadId) {
      await tx.load.update({ where: { id: loadId }, data: { status: 'INVOICED' } })
    }
  })

  revalidatePath('/crm/invoices')
  revalidatePath('/crm/dispatch')
  return { success: true }
}

export async function updateInvoiceStatus(id: string, status: 'SENT' | 'UNPAID') {
  const session = await requireCrmRole('CRM_ADMIN', 'DISPATCHER')

  const invoice = await db.invoice.findUnique({ where: { id }, include: { carrier: true } })
  if (!invoice) return { error: 'Invoice not found' }
  if (session.user.crmRole === 'DISPATCHER' && invoice.carrier.assignedDispatcherId !== session.user.id) {
    return { error: 'You are not assigned to this carrier' }
  }
  if (FORWARD_TRANSITIONS[invoice.status] !== status) {
    return { error: `Cannot move invoice from ${invoice.status} to ${status}` }
  }

  await db.invoice.update({ where: { id }, data: { status } })
  revalidatePath('/crm/invoices')
  revalidatePath(`/crm/invoices/${id}`)
  return { success: true }
}

// Records that the invoice's info was handed to the carrier's factoring
// company. FACTORED is a real InvoiceStatus (already labeled in
// config/crm.ts as "Sent to factoring"), so this treats factoring as an
// alternate branch off Sent/Unpaid rather than a side note — the invoice
// can still later be markPaid'd once the factoring company actually pays
// out, since there's no live factoring API to confirm that automatically.
export async function markSentToFactoring(id: string) {
  const session = await requireCrmRole('CRM_ADMIN', 'DISPATCHER')

  const invoice = await db.invoice.findUnique({ where: { id }, include: { carrier: true } })
  if (!invoice) return { error: 'Invoice not found' }
  if (session.user.crmRole === 'DISPATCHER' && invoice.carrier.assignedDispatcherId !== session.user.id) {
    return { error: 'You are not assigned to this carrier' }
  }
  if (invoice.status !== 'SENT' && invoice.status !== 'UNPAID') {
    return { error: 'Invoice must be sent to the carrier before it can be routed to factoring' }
  }

  await db.invoice.update({
    where: { id },
    data: { sentToFactoringAt: new Date(), status: 'FACTORED' },
  })
  revalidatePath('/crm/invoices')
  revalidatePath(`/crm/invoices/${id}`)
  return { success: true }
}

export async function markPaid(id: string) {
  const session = await requireCrmRole('CRM_ADMIN', 'DISPATCHER')

  const invoice = await db.invoice.findUnique({ where: { id }, include: { carrier: true } })
  if (!invoice) return { error: 'Invoice not found' }
  if (session.user.crmRole === 'DISPATCHER' && invoice.carrier.assignedDispatcherId !== session.user.id) {
    return { error: 'You are not assigned to this carrier' }
  }
  if (invoice.status === 'PAID') return { error: 'Invoice is already marked paid' }
  if (invoice.status === 'DRAFT') return { error: 'Send the invoice before marking it paid' }

  await db.$transaction(async (tx) => {
    await tx.invoice.update({ where: { id }, data: { status: 'PAID', paidAt: new Date() } })
    // A paid dispatch-fee invoice means the load is fully closed out —
    // flip the Load's own status to PAID too so the dispatch board (which
    // owns LoadStatus display) doesn't need a separate reconciliation pass.
    if (invoice.loadId) {
      await tx.load.update({ where: { id: invoice.loadId }, data: { status: 'PAID' } })
    }
  })

  revalidatePath('/crm/invoices')
  revalidatePath(`/crm/invoices/${id}`)
  revalidatePath('/crm/dispatch')
  return { success: true }
}
