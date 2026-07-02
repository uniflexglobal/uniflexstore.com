import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/auth'

const PROTECTED = ['/account', '/orders']
const ADMIN_ROUTES = ['/admin']
const AUTH_ONLY = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password']
const CRM_ROUTES = ['/crm']
const CRM_LOGIN = '/crm/login'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const session = await auth()
  const isLoggedIn = !!session?.user

  // Enforce "remember me" session end stored in JWT
  const sessionEnd = session?.user?.sessionEnd
  const sessionExpired = sessionEnd && sessionEnd < Date.now()

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p))
  const isAdminRoute = ADMIN_ROUTES.some((p) => pathname.startsWith(p))
  const isAuthRoute = AUTH_ONLY.some((p) => pathname.startsWith(p))
  const isCrmRoute = CRM_ROUTES.some((p) => pathname.startsWith(p))
  const isCrmLogin = pathname === CRM_LOGIN
  const isCrmSession = session?.user?.userType === 'crm'

  if ((isProtected || isAdminRoute) && (!isLoggedIn || sessionExpired)) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  if (isAdminRoute && isLoggedIn && !sessionExpired) {
    const role = session?.user?.role
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  if (isAuthRoute && isLoggedIn && !sessionExpired) {
    return NextResponse.redirect(new URL('/account', request.url))
  }

  // CRM (uniflexstore.com/crm) — coarse "must be a logged-in CRM staffer" gate.
  // Fine-grained per-role checks (e.g. /crm/staff being Admin-only) live in
  // each route segment's own layout via requireCrmRole(), not here.
  if (isCrmRoute && !isCrmLogin && (!isCrmSession || sessionExpired)) {
    const url = request.nextUrl.clone()
    url.pathname = CRM_LOGIN
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  if (isCrmLogin && isCrmSession && !sessionExpired) {
    return NextResponse.redirect(new URL('/crm', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}
