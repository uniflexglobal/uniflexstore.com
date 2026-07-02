import 'server-only'
import { db } from '@/server/db'
import type { Prisma } from '@prisma/client'

const EXPIRY_WARNING_DAYS = 30

export type DocumentExpiryStatus = 'expired' | 'expiring' | 'valid' | 'none'

/**
 * Pure helper — expiry status is always derived at query/render time from
 * `expiresAt` vs now(), never stored, so it can never drift stale.
 */
export function getDocumentExpiryStatus(expiresAt: Date | null): DocumentExpiryStatus {
  if (!expiresAt) return 'none'
  const now = new Date()
  const warningThreshold = new Date(now.getTime() + EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000)
  if (expiresAt.getTime() < now.getTime()) return 'expired'
  if (expiresAt.getTime() <= warningThreshold.getTime()) return 'expiring'
  return 'valid'
}

export type DocumentsFilter = {
  dispatcherId?: string // Dispatcher sees only their own carriers' docs; omit for admin (all)
}

const EXPIRY_RANK: Record<DocumentExpiryStatus, number> = { expired: 0, expiring: 1, valid: 2, none: 3 }

export async function getAllDocuments(filter: DocumentsFilter = {}) {
  const { dispatcherId } = filter

  const where: Prisma.DocumentWhereInput = {}
  if (dispatcherId) where.carrier = { assignedDispatcherId: dispatcherId }

  const documents = await db.document.findMany({
    where,
    include: {
      carrier: { select: { id: true, companyName: true, assignedDispatcherId: true } },
      uploadedBy: { select: { id: true, name: true } },
    },
  })

  const withStatus = documents.map((doc) => ({
    ...doc,
    expiryStatus: getDocumentExpiryStatus(doc.expiresAt),
  }))

  // Expired first, then soonest-expiring, then valid, then no-expiry — soonest expiresAt first within each bucket
  withStatus.sort((a, b) => {
    const rankDiff = EXPIRY_RANK[a.expiryStatus] - EXPIRY_RANK[b.expiryStatus]
    if (rankDiff !== 0) return rankDiff
    if (a.expiresAt && b.expiresAt) return a.expiresAt.getTime() - b.expiresAt.getTime()
    return 0
  })

  return withStatus
}
