import { requireCrmAuth } from '@/lib/dal'
import { CrmSidebar } from '@/components/crm/sidebar'
import { Toaster } from '@/components/ui/sonner'

export default async function CrmGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await requireCrmAuth()

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--bg-subtle)]">
      <div className="hidden lg:flex lg:shrink-0">
        <CrmSidebar role={session.user.crmRole ?? ''} name={session.user.name ?? session.user.email ?? ''} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
      <Toaster />
    </div>
  )
}
