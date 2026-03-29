import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header with sidebar trigger + breadcrumb */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-800 px-4">
          <SidebarTrigger />
          <div className="mx-1 h-4 w-px bg-zinc-800" />
          <nav className="flex items-center gap-1.5 text-sm">
            <span className="text-zinc-400">Compliance</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="text-zinc-600" />
            <span className="font-medium text-zinc-100">Dashboard</span>
          </nav>
        </header>

        {/* Main content area */}
        <div className="flex flex-1 flex-col gap-4 p-4 min-w-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
