'use client'

import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { CrmSidebar } from './sidebar'

export function CrmMobileSidebarTrigger({ role, name }: { role: string; name: string }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] lg:hidden">
          <Menu className="h-4 w-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <CrmSidebar role={role} name={name} />
      </SheetContent>
    </Sheet>
  )
}
