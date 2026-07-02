import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export const getSession = cache(async () => {
  return auth()
})

export const requireAuth = cache(async () => {
  const session = await getSession()
  const expired = session?.user?.sessionEnd && session.user.sessionEnd < Date.now()

  if (!session?.user || expired) {
    redirect('/auth/login')
  }

  return session
})

export const requireAdmin = cache(async () => {
  const session = await requireAuth()

  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/')
  }

  return session
})

// ─── CRM (uniflexstore.com/crm) ────────────────────────────────────────
// Fully separate from the guards above — gates on session.user.userType
// === 'crm', never on the storefront role.

export const requireCrmAuth = cache(async () => {
  const session = await getSession()
  const expired = session?.user?.sessionEnd && session.user.sessionEnd < Date.now()

  if (!session?.user || session.user.userType !== 'crm' || expired) {
    redirect('/crm/login')
  }

  return session
})

export const requireCrmRole = cache(async (...roles: Array<'CALLER' | 'DISPATCHER' | 'CRM_ADMIN'>) => {
  const session = await requireCrmAuth()

  if (!roles.includes(session.user.crmRole as 'CALLER' | 'DISPATCHER' | 'CRM_ADMIN')) {
    redirect('/crm')
  }

  return session
})
