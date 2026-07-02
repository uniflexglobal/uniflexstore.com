'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Phone,
  Upload,
  ClipboardList,
  Users,
  Truck,
  Building2,
  FileWarning,
  Receipt,
  BarChart3,
  LogOut,
} from 'lucide-react'
import { crmLogoutAction } from '@/server/actions/crm/auth'
import { crmRoleLabels } from '@/config/crm'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: typeof LayoutDashboard
  exact?: boolean
  roles: Array<'CALLER' | 'DISPATCHER' | 'CRM_ADMIN'>
}

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/crm', icon: LayoutDashboard, exact: true, roles: ['CALLER', 'DISPATCHER', 'CRM_ADMIN'] },
  { label: 'Call List', href: '/crm/prospects', icon: Phone, roles: ['CALLER', 'CRM_ADMIN'] },
  { label: 'Import Prospects', href: '/crm/prospects/import', icon: Upload, roles: ['CALLER', 'CRM_ADMIN'] },
  { label: 'Leads', href: '/crm/leads', icon: ClipboardList, roles: ['CALLER', 'DISPATCHER', 'CRM_ADMIN'] },
  { label: 'Carriers', href: '/crm/carriers', icon: Building2, roles: ['DISPATCHER', 'CRM_ADMIN'] },
  { label: 'Documents', href: '/crm/documents', icon: FileWarning, roles: ['DISPATCHER', 'CRM_ADMIN'] },
  { label: 'Dispatch Board', href: '/crm/dispatch', icon: Truck, roles: ['DISPATCHER', 'CRM_ADMIN'] },
  { label: 'Invoices', href: '/crm/invoices', icon: Receipt, roles: ['CRM_ADMIN', 'DISPATCHER'] },
  { label: 'Commissions', href: '/crm/commissions', icon: Receipt, roles: ['CRM_ADMIN'] },
  { label: 'Reports', href: '/crm/reports', icon: BarChart3, roles: ['CRM_ADMIN'] },
  { label: 'Staff', href: '/crm/staff', icon: Users, roles: ['CRM_ADMIN'] },
]

export function CrmSidebar({ role, name }: { role: string; name: string }) {
  const pathname = usePathname()
  const items = NAV.filter((item) => item.roles.includes(role as never))

  return (
    <aside className="flex h-full w-60 flex-col border-r border-[var(--border-default)] bg-[var(--bg-base)]">
      <div className="flex h-14 items-center gap-2.5 border-b border-[var(--border-default)] px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0a1520]">
          <Truck className="h-4 w-4 text-[#29c4d9]" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">Logistics CRM</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {items.map(({ label, href, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]')} />
              <span className="flex-1">{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-[var(--border-default)] px-4 py-3">
        <div className="mb-2 px-2">
          <p className="truncate text-sm font-medium text-[var(--text-primary)]">{name}</p>
          <p className="text-xs text-[var(--text-muted)]">{crmRoleLabels[role] ?? role}</p>
        </div>
        <form action={crmLogoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
