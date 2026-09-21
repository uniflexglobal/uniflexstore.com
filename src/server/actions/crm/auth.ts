'use server'

import { redirect } from 'next/navigation'
import { signIn, signOut } from '@/auth'
import { loginSchema } from '@/lib/validations/auth'
import { AuthError } from 'next-auth'

export type CrmActionState = {
  error?: string
} | undefined

/** Ensures callbackUrl is a safe internal path under /crm. */
function sanitizeCrmCallbackUrl(raw: FormDataEntryValue | null): string {
  const url = typeof raw === 'string' ? raw : null
  if (url && url.startsWith('/crm') && !url.startsWith('//')) return url
  return '/crm'
}

export async function crmLoginAction(
  _prev: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const callbackUrl = sanitizeCrmCallbackUrl(formData.get('callbackUrl'))
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const parsed = loginSchema.safeParse({ email, password })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid email or password' }
  }

  try {
    await signIn('crm-login', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: 'Invalid email or password' }
    }
    throw err
  }

  redirect(callbackUrl)
}

export async function crmLogoutAction() {
  await signOut({ redirectTo: '/crm/login' })
}
