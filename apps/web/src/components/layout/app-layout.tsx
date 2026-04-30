import type { ReactNode } from 'react'
import { useLocation } from '@tanstack/react-router'
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

const ROUTE_LABELS: Array<[RegExp, { section: string; page: string }]> = [
  [/^\/w\/[^/]+\/dashboard/, { section: 'Overview', page: 'Dashboard' }],
  [/^\/w\/[^/]+\/welcome/, { section: 'Overview', page: 'How it Works' }],
  [/^\/w\/[^/]+\/projects(\/.*)?$/, { section: 'Compliance', page: 'Projects' }],
  [/^\/w\/[^/]+\/ens-audits/, { section: 'Compliance', page: 'ENS Audits' }],
  [/^\/w\/[^/]+\/reports(\/.*)?$/, { section: 'Compliance', page: 'Reports' }],
  [/^\/w\/[^/]+\/frameworks/, { section: 'Compliance', page: 'Frameworks' }],
  [/^\/w\/[^/]+\/policies/, { section: 'Compliance', page: 'Policies' }],
  [/^\/w\/[^/]+\/baselines/, { section: 'Compliance', page: 'Baselines' }],
  [/^\/w\/[^/]+\/evidence/, { section: 'Compliance', page: 'Evidence' }],
  [/^\/w\/[^/]+\/gap-analysis/, { section: 'Compliance', page: 'Gap Analysis' }],
  [/^\/w\/[^/]+\/risks/, { section: 'Compliance', page: 'Risk Register' }],
  [/^\/w\/[^/]+\/access/, { section: 'Access & Assets', page: 'Access Register' }],
  [/^\/w\/[^/]+\/chat/, { section: 'Tools', page: 'Chat' }],
  [/^\/w\/[^/]+\/trust/, { section: 'Tools', page: 'Trust Score' }],
  [/^\/w\/[^/]+\/playbooks/, { section: 'Tools', page: 'Playbooks' }],
  [/^\/w\/[^/]+\/events/, { section: 'Tools', page: 'Events' }],
  [/^\/w\/[^/]+\/integrations/, { section: 'Tools', page: 'Integrations' }],
  [/^\/w\/[^/]+\/settings/, { section: 'Workspace', page: 'Settings' }],
]

function resolveBreadcrumb(pathname: string): { section: string; page: string } {
  for (const [pattern, label] of ROUTE_LABELS) {
    if (pattern.test(pathname)) return label
  }
  return { section: 'Workspace', page: 'Home' }
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()
  const { section, page } = resolveBreadcrumb(location.pathname)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header with sidebar trigger + breadcrumb */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-800 px-4">
          <SidebarTrigger />
          <div className="mx-1 h-4 w-px bg-zinc-800" />
          <nav className="flex items-center gap-1.5 text-sm">
            <span className="text-zinc-400">{section}</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="text-zinc-600" />
            <span className="font-medium text-zinc-100">{page}</span>
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
