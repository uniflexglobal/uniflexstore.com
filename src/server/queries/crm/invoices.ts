import 'server-only'
import { db } from '@/server/db'
import type { Prisma, InvoiceStatus } from '@prisma/client'

export type InvoicesFilter = {
  dispatcherId?: string // Dispatcher's own carriers' invoices
  status?: InvoiceStatus
  // OVERDUE is never stored on the row (see AGENTS.md spec) — it's derived
  // as UNPAID + past-due dueDate. This flag lets the "Overdue" tab filter
  // for that combination without a fake enum value round-tripping the DB.
  overdueOnly?: boolean
  search?: string
  page?: number
  pageSize?: number
}

export async function getInvoices(filter: InvoicesFilter = {}) {
  const { dispatcherId, status, overdueOnly, search, page = 1, pageSize = 25 } = filter

  const where: Prisma.InvoiceWhereInput = {}
  if (dispatcherId) where.carrier = { assignedDispatcherId: dispatcherId }
  if (overdueOnly) {
    where.status = 'UNPAID'
    where.dueDate = { lt: new Date() }
  } else if (status) {
    where.status = status
  }
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: 'insensitive' } },
      { carrier: { companyName: { contains: search, mode: 'insensitive' } } },
      { load: { loadNumber: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [invoices, total] = await Promise.all([
    db.invoice.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        carrier: { select: { id: true, companyName: true } },
        load: { select: { id: true, loadNumber: true } },
      },
    }),
    db.invoice.count({ where }),
  ])

  return { invoices, total, pages: Math.max(1, Math.ceil(total / pageSize)) }
}

export async function getInvoiceById(id: string) {
  return db.invoice.findUnique({
    where: { id },
    include: {
      carrier: { select: { id: true, companyName: true, assignedDispatcherId: true } },
      load: {
        select: {
          id: true,
          loadNumber: true,
          rate: true,
          dispatchFeePct: true,
          status: true,
          originCity: true,
          originState: true,
          destCity: true,
          destState: true,
        },
      },
    },
  })
}

// Load picker for the "new invoice" form — only loads that are ready to be
// billed (DELIVERED) and don't already have an invoice attached.
export async function getDeliveredLoadsWithoutInvoice(dispatcherId?: string) {
  return db.load.findMany({
    where: {
      status: 'DELIVERED',
      invoice: null,
      ...(dispatcherId ? { carrier: { assignedDispatcherId: dispatcherId } } : {}),
    },
    select: {
      id: true,
      loadNumber: true,
      rate: true,
      dispatchFeePct: true,
      carrierId: true,
      carrier: { select: { id: true, companyName: true } },
      originCity: true,
      originState: true,
      destCity: true,
      destState: true,
    },
    orderBy: { deliveryAt: 'desc' },
  })
}

// Carrier picker for standalone invoices (not tied to a load).
export async function getActiveCarriers() {
  return db.carrier.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, companyName: true },
    orderBy: { companyName: 'asc' },
  })
}
