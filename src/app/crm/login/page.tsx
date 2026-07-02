import type { Metadata } from 'next'
import { CrmLoginForm } from './_components/crm-login-form'

export const metadata: Metadata = { title: 'CRM Sign In — Uniflex Global Logistics' }

export default async function CrmLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl } = await searchParams

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#0a1520] px-4 py-12">
      <div className="mb-8 flex items-baseline gap-1.5">
        <span className="font-sans text-xl font-800 tracking-tight text-white">Uniflex</span>
        <span className="font-sans text-xl font-300 tracking-tight text-[#29c4d9]">Logistics CRM</span>
      </div>

      <div className="w-full max-w-[400px] rounded-2xl border border-white/10 bg-[#0d1f2d] p-7 shadow-2xl">
        <h1 className="text-xl font-700 text-white">Staff sign in</h1>
        <p className="mt-1.5 text-sm text-white/50">
          For Uniflex Global Logistics dispatch staff only.
        </p>

        <div className="mt-6 [&_label]:text-white/70 [&_input]:bg-[#0a1520] [&_input]:border-white/15 [&_input]:text-white [&_input::placeholder]:text-white/30">
          <CrmLoginForm callbackUrl={callbackUrl} />
        </div>
      </div>

      <p className="mt-6 text-xs text-white/30">
        Don&apos;t have an account? Ask your admin to create one for you.
      </p>
    </div>
  )
}
