import { getSession } from '@/lib/dal'
import { CrmMobileSidebarTrigger } from './mobile-sidebar-trigger'

interface CrmTopbarProps {
  title: string
  action?: React.ReactNode
}

export async function CrmTopbar({ title, action }: CrmTopbarProps) {
  const session = await getSession()
  const role = session?.user?.crmRole ?? ''
  const name = session?.user?.name ?? session?.user?.email ?? ''

  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-base)] px-6">
      <div className="flex items-center gap-3">
        <CrmMobileSidebarTrigger role={role} name={name} />
        <h1 className="font-semibold text-[var(--text-primary)]">{title}</h1>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </header>
  )
}
