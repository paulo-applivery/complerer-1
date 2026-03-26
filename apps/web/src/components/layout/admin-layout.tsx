import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AdminSidebar } from './admin-sidebar'

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-800 px-4">
          <SidebarTrigger />
          <div className="mx-1 h-4 w-px bg-zinc-800" />
          <nav className="flex items-center gap-1.5 text-sm">
            <span className="text-amber-400/80">Admin</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="text-zinc-600" />
            <span className="font-medium text-zinc-100">Super Admin Panel</span>
          </nav>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
