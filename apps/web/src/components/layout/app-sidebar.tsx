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
import { useWorkspace } from '@/hooks/use-workspace'

interface NavItem {
  label: string
  icon: typeof DashboardSquare01Icon
  path: string
}

const platformItems: NavItem[] = [
  { label: 'Dashboard', icon: DashboardSquare01Icon, path: '/dashboard' },
  { label: 'Chat', icon: Message01Icon, path: '/chat' },
  { label: 'Frameworks', icon: Layers01Icon, path: '/frameworks' },
  { label: 'Trust Score', icon: SecurityCheckIcon, path: '/trust' },
]

const complianceItems: NavItem[] = [
  { label: 'Access Register', icon: ClipboardIcon, path: '/access' },
  { label: 'Evidence', icon: FileValidationIcon, path: '/evidence' },
  { label: 'Baselines', icon: Shield01Icon, path: '/baselines' },
  { label: 'Risk Register', icon: Alert02Icon, path: '/risks' },
  { label: 'Policies', icon: File01Icon, path: '/policies' },
  { label: 'Gap Analysis', icon: Search01Icon, path: '/gap-analysis' },
  { label: 'Events', icon: Clock01Icon, path: '/events' },
  { label: 'Integrations', icon: Link01Icon, path: '/integrations' },
]

function NavItemButton({ item, workspaceId }: { item: NavItem; workspaceId: string }) {
  const navigate = useNavigate()
  const { state } = useSidebar()
  const location = useLocation()
  const fullPath = `/w/${workspaceId}${item.path}`
  const isActive = location.pathname === fullPath || location.pathname.startsWith(fullPath + '/')

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        onClick={() => navigate({ to: `/w/${workspaceId}${item.path}` })}
      >
        <HugeiconsIcon icon={item.icon} size={16} className="shrink-0" />
        {state === 'expanded' && <span>{item.label}</span>}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppSidebar() {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const workspaceId = params.workspaceId ?? ''
  const { workspace } = useWorkspace(workspaceId)
  const { user, logout } = useAuth()
  const { state } = useSidebar()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <Sidebar>
      {/* Logo header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex h-10 items-center px-2">
              {state === 'expanded' ? (
                <img src="/logo-color.svg" alt="Complirer" className="h-5" />
              ) : (
                <img src="/icon-color.svg" alt="Complirer" className="h-6 w-6" />
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* Platform group */}
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {platformItems.map((item) => (
              <NavItemButton key={item.label} item={item} workspaceId={workspaceId} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Compliance group */}
        <SidebarGroup>
          <SidebarGroupLabel>Compliance</SidebarGroupLabel>
          <SidebarMenu>
            {complianceItems.map((item) => (
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
                {state === 'expanded' && (
                  <>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-none">
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
                      className={`ml-auto text-zinc-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`}
                    />
                  </>
                )}
              </button>

              {/* Dropdown */}
              {profileOpen && state === 'expanded' && (
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
                      navigate({ to: `/w/${workspaceId}/settings` })
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                  >
                    <HugeiconsIcon icon={Settings01Icon} size={14} />
                    Workspace settings
                  </button>

                  {user?.isSuperAdmin && (
                    <button
                      onClick={() => {
                        setProfileOpen(false)
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
