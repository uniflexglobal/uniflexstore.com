'use client'

import { useActionState } from 'react'
import { crmLoginAction } from '@/server/actions/crm/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CrmLoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action, isPending] = useActionState(crmLoginAction, undefined)

  return (
    <form action={action} className="space-y-4">
      {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}

      {state?.error && (
        <div
          role="alert"
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: 'color-mix(in srgb, var(--error) 10%, var(--bg-base))',
            color: 'var(--error)',
          }}
        >
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@uniflexlogistics.com"
          autoComplete="email"
          autoFocus
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      <Button type="submit" variant="accent" size="lg" className="w-full" loading={isPending}>
        Sign in
      </Button>
    </form>
  )
}
