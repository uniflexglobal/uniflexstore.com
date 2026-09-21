import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import Facebook from 'next-auth/providers/facebook'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/server/db'
import { loginSchema } from '@/lib/validations/auth'

// Dummy hash used to keep bcrypt.compare timing constant when user is not found.
// Prevents email-enumeration via response timing.
const DUMMY_HASH = '$2a$12$LHoTmFGWNxULQZpRFTJzAOHPKQSM7O3YnHVBpKijM9VDhSRi4k7Ei'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
        rememberMe: { type: 'text' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await db.user.findUnique({
          where: { email: email.toLowerCase() },
        })

        // Always run bcrypt.compare to prevent email enumeration via timing.
        const hash = user?.passwordHash ?? DUMMY_HASH
        const valid = await bcrypt.compare(password, hash)

        if (!user || !valid) return null
        if (!user.emailVerified) throw new Error('EMAIL_NOT_VERIFIED')

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          rememberMe: credentials.rememberMe === 'true',
        }
      },
    }),
    // Staff login for the Uniflex Global Logistics CRM (uniflexstore.com/crm).
    // Fully separate identity from storefront customers/admins — queries
    // CrmStaff, not User. See src/app/crm/login for the form that calls this.
    Credentials({
      id: 'crm-login',
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const staff = await db.crmStaff.findUnique({
          where: { email: email.toLowerCase() },
        })

        // Always run bcrypt.compare to prevent email enumeration via timing.
        const hash = staff?.passwordHash ?? DUMMY_HASH
        const valid = await bcrypt.compare(password, hash)

        if (!staff || !valid || !staff.isActive) return null

        return {
          id: staff.id,
          email: staff.email,
          name: staff.name,
          userType: 'crm' as const,
          crmRole: staff.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        if (user.userType === 'crm') {
          token.userType = 'crm'
          token.crmRole = user.crmRole
          // CRM staff sessions: flat 30 days, no remember-me toggle.
          token.sessionEnd = Date.now() + 30 * 24 * 60 * 60 * 1000
        } else {
          token.role = user.role ?? 'CUSTOMER'
          // OAuth always gets 30 days; credentials respects the remember-me checkbox.
          const days = account || user.rememberMe !== false ? 30 : 1
          token.sessionEnd = Date.now() + days * 24 * 60 * 60 * 1000
        }
      }
      if (token.id && token.userType === 'crm') {
        // Re-check active status on every refresh so a deactivated staffer is cut off promptly,
        // and refresh name/role too so an admin edit (e.g. renaming staff) shows up without
        // requiring the staffer to log out and back in.
        const staff = await db.crmStaff.findUnique({
          where: { id: token.id as string },
          select: { isActive: true, name: true, role: true },
        })
        if (!staff?.isActive) return null
        token.name = staff.name
        token.crmRole = staff.role
      } else if (token.id) {
        // Re-check ban status on every token refresh so bans take effect within one refresh cycle
        const dbUser = await db.user.findUnique({ where: { id: token.id as string }, select: { isBanned: true } })
        if (dbUser?.isBanned) return null
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.sessionEnd = token.sessionEnd as number
        if (token.userType === 'crm') {
          session.user.userType = 'crm'
          session.user.crmRole = token.crmRole as string
        } else {
          session.user.role = token.role as string
        }
      }
      return session
    },
  },
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      })
    },
  },
})
