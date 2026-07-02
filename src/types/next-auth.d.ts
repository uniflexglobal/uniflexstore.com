import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role?: string
      sessionEnd: number
      // CRM staff sessions (uniflexstore.com/crm) carry these instead of `role`.
      userType?: 'crm'
      crmRole?: string
    } & DefaultSession['user']
  }

  interface User {
    role?: string
    rememberMe?: boolean
    userType?: 'crm'
    crmRole?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
    sessionEnd?: number
    userType?: 'crm'
    crmRole?: string
  }
}
