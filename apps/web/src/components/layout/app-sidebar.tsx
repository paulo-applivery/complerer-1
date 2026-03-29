import { useState } from 'react'
import { useNavigate, useParams, useLocation } from '@tanstack/react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  DashboardSquare01Icon,
  Message01Icon,
  Layers01Icon,
  ClipboardIcon,
  FileValidationIcon,
  Settings01Icon,
  Shield01Icon,
  Alert02Icon,
  File01Icon,
  Link01Icon,
  Logout01Icon,
  Search01Icon,
  Clock01Icon,
  SecurityCheckIcon,
  ArrowDown01Icon,
  Building06Icon,
  CrownIcon,
  Book02Icon,
  Folder01Icon,
} from '@hugeicons/core-free-icons'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/use-auth'
import { useWorkspace, useFeatureFlags } from '@/hooks/use-workspace'

interface NavItem {
  label: string
  icon: typeof DashboardSquare01Icon
  path: string
  featureFlag?: string
}

const overviewItems: NavItem[] = [
  { label: 'Dashboard', icon: DashboardSquare01Icon, path: '/dashboard' },
  { label: 'How it Works', icon: SecurityCheckIcon, path: '/welcome' },
]

const complianceItems: NavItem[] = [
  { label: 'Projects', icon: Folder01Icon, path: '/projects' },
  { label: 'Frameworks', icon: Layers01Icon, path: '/frameworks' },
  { label: 'Policies', icon: File01Icon, path: '/policies' },
  { label: 'Baselines', icon: Shield01Icon, path: '/baselines' },
  { label: 'Evidence', icon: FileValidationIcon, path: '/evidence' },
  { label: 'Gap Analysis', icon: Search01Icon, path: '/gap-analysis' },
  { label: 'Risk Register', icon: Alert02Icon, path: '/risks' },
]

const accessItems: NavItem[] = [
  { label: 'Access Register', icon: ClipboardIcon, path: '/access' },
]

const toolsItems: NavItem[] = [
  { label: 'Chat', icon: Message01Icon, path: '/chat', featureFlag: 'ai-chat' },
  { label: 'Trust Score', icon: SecurityCheckIcon, path: '/trust', featureFlag: 'trust-score' },
  { label: 'Playbooks', icon: Book02Icon, path: '/playbooks', featureFlag: 'playbooks' },
  { label: 'Events', icon: Clock01Icon, path: '/events' },
]

function NavItemButton({ item, workspaceId }: { item: NavItem; workspaceId: string }) {
  const navigate = useNavigate()
  const { setOpenMobile } = useSidebar()
  const location = useLocation()
  const fullPath = `/w/${workspaceId}${item.path}`
  const isActive = location.pathname === fullPath || location.pathname.startsWith(fullPath + '/')

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        onClick={() => {
          navigate({ to: `/w/${workspaceId}${item.path}` })
          if (window.innerWidth < 768) setOpenMobile(false)
        }}
      >
        <HugeiconsIcon icon={item.icon} size={16} className="shrink-0" />
        <span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppSidebar() {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const workspaceId = params.workspaceId ?? ''
  const { workspace } = useWorkspace(workspaceId)
  const { isEnabled } = useFeatureFlags(workspaceId)
  const { user, logout } = useAuth()
  const { state, setOpenMobile } = useSidebar()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const isMobileWidth = () => window.innerWidth < 768

  return (
    <Sidebar>
      {/* Logo header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex h-10 items-center px-2">
              {state === 'expanded' ? (
                <img src="/logo-color.svg" alt="Complerer" className="h-5" />
              ) : (
                <>
                  <img src="/logo-color.svg" alt="Complerer" className="h-5 md:hidden" />
                  <img src="/icon-color.svg" alt="Complerer" className="hidden md:block h-6 w-6" />
                </>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarMenu>
            {overviewItems.filter(item => !item.featureFlag || isEnabled(item.featureFlag)).map(item => (
              <NavItemButton key={item.label} item={item} workspaceId={workspaceId} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Compliance Program</SidebarGroupLabel>
          <SidebarMenu>
            {complianceItems.filter(item => !item.featureFlag || isEnabled(item.featureFlag)).map(item => (
              <NavItemButton key={item.label} item={item} workspaceId={workspaceId} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Access & Assets</SidebarGroupLabel>
          <SidebarMenu>
            {accessItems.filter(item => !item.featureFlag || isEnabled(item.featureFlag)).map(item => (
              <NavItemButton key={item.label} item={item} workspaceId={workspaceId} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

      </SidebarContent>

      <SidebarSeparator />

      {/* Profile + Workspace footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((p) => !p)}
                className="flex h-12 w-full items-center gap-2 rounded-lg px-2 text-left transition-colors hover:bg-zinc-800/50"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400/20 to-primary-400/5">
                  <span className="text-xs font-semibold text-primary-400">
                    {user?.name?.[0]?.toUpperCase() ?? 'U'}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-none overflow-hidden">
                  <span className="truncate text-sm font-medium text-zinc-100">
                    {user?.name ?? 'User'}
                  </span>
                  <span className="truncate text-xs text-zinc-500">
                    {user?.email ?? 'user@example.com'}
                  </span>
                </div>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={14}
                  className={`ml-auto shrink-0 text-zinc-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <div className="absolute bottom-full left-0 mb-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-xl shadow-black/40">
                  {/* Workspace */}
                  <div className="mb-1 rounded-lg bg-zinc-800/50 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={Building06Icon} size={14} className="shrink-0 text-zinc-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-zinc-300">
                          {workspace?.name ?? 'Workspace'}
                        </p>
                        <p className="text-[10px] text-zinc-600">Enterprise</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      if (isMobileWidth()) setOpenMobile(false)
                      navigate({ to: `/w/${workspaceId}/settings` })
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                  >
                    <HugeiconsIcon icon={Settings01Icon} size={14} />
                    Workspace settings
                  </button>

                  {/* Tools */}
                  <div className="my-1 border-t border-zinc-800" />
                  {toolsItems.filter(item => !item.featureFlag || isEnabled(item.featureFlag)).map(item => (
                    <button
                      key={item.label}
                      onClick={() => {
                        setProfileOpen(false)
                        if (isMobileWidth()) setOpenMobile(false)
                        navigate({ to: `/w/${workspaceId}${item.path}` })
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                    >
                      <HugeiconsIcon icon={item.icon} size={14} />
                      {item.label}
                    </button>
                  ))}

                  {user?.isSuperAdmin && (
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        if (isMobileWidth()) setOpenMobile(false)
                        navigate({ to: '/admin' })
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-amber-400/80 transition-colors hover:bg-amber-500/10 hover:text-amber-400"
                    >
                      <HugeiconsIcon icon={CrownIcon} size={14} />
                      Super Admin
                    </button>
                  )}

                  <div className="my-1 border-t border-zinc-800" />

                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      if (isMobileWidth()) setOpenMobile(false)
                      logout()
                      navigate({ to: '/login' })
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <HugeiconsIcon icon={Logout01Icon} size={14} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
