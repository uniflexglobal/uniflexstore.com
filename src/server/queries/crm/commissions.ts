import 'server-only'
import { db } from '@/server/db'
import type { Prisma } from '@prisma/client'

export type CommissionsFilter = {
  staffId?: string
}

// Manual ledger — no pagination UI in Phase C, just a generous safety cap.
export async function getCommissions(filter: CommissionsFilter = {}) {
  const { staffId } = filter

  const where: Prisma.CommissionWhereInput = {}
  if (staffId) where.staffId = staffId

  const [commissions, total] = await Promise.all([
    db.commission.findMany({
      where,
      take: 500,
      orderBy: [{ earnedAt: 'desc' }],
      include: {
        staff: { select: { id: true, name: true } },
        load: { select: { id: true, loadNumber: true } },
        lead: { select: { id: true, name: true } },
      },
    }),
    db.commission.count({ where }),
  ])

  return { commissions, total }
}

// Staff picker for the commission-entry dialog.
export async function getActiveStaff() {
  return db.crmStaff.findMany({
    where: { isActive: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: 'asc' },
  })
}

// Lightweight Load/Lead pickers so a commission entry can optionally
// reference where it was earned. Kept local to this file (not shared with
// the dispatch/leads verticals) since only id + label are needed here.
export async function getLoadOptions() {
  return db.load.findMany({
    select: { id: true, loadNumber: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

export async function getLeadOptions() {
  return db.lead.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}
