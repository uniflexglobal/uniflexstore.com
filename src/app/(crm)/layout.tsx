import { requireCrmAuth } from '@/lib/dal'
import { CrmSidebar } from '@/components/crm/sidebar'
import { Toaster } from '@/components/ui/sonner'

export default async function CrmGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await requireCrmAuth()

  return (
    // The storefront uses Lenis (src/components/shared/motion-provider.tsx) for
    // global smooth-scroll on the body. The CRM is a fixed-height app shell where
    // only inner containers (e.g. each page's <main>) should scroll — without
    // data-lenis-prevent here, Lenis intercepts every wheel event for the whole
    // subtree and calls preventDefault(), so native overflow-y-auto scrolling on
    // any element inside never fires. See https://github.com/darkroomengineering/lenis
    <div
      data-lenis-prevent
      className="flex h-dvh overflow-hidden bg-[var(--bg-subtle)] [overscroll-behavior:contain]"
    >
      <div className="hidden lg:flex lg:shrink-0">
        <CrmSidebar role={session.user.crmRole ?? ''} name={session.user.name ?? session.user.email ?? ''} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      <Toaster />
    </div>
  )
}
