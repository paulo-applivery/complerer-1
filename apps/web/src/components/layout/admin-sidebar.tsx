import { useState } from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  DashboardSquare01Icon,
  Settings01Icon,
  Mail01Icon,
  Flag01Icon,
  Building06Icon,
  Logout01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  Link01Icon,
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

interface NavItem {
  label: string
  icon: typeof DashboardSquare01Icon
  path: string
}

const adminItems: NavItem[] = [
  { label: 'Dashboard', icon: DashboardSquare01Icon, path: '/admin' },
  { label: 'Providers', icon: Settings01Icon, path: '/admin/providers' },
  { label: 'Email Templates', icon: Mail01Icon, path: '/admin/email-templates' },
  { label: 'Feature Flags', icon: Flag01Icon, path: '/admin/feature-flags' },
  { label: 'Workspaces', icon: Building06Icon, path: '/admin/workspaces' },
]

function AdminNavItem({ item }: { item: NavItem }) {
  const navigate = useNavigate()
  const { state } = useSidebar()
  const location = useLocation()
  const isActive = item.path === '/admin'
    ? location.pathname === '/admin'
    : location.pathname.startsWith(item.path)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        onClick={() => navigate({ to: item.path })}
      >
        <HugeiconsIcon icon={item.icon} size={16} className="shrink-0" />
        {state === 'expanded' && <span>{item.label}</span>}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AdminSidebar() {
  const { user, logout } = useAuth()
  const { state } = useSidebar()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <Sidebar>
      {/* Logo header with admin badge */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex h-10 items-center gap-2 px-2">
              {state === 'expanded' ? (
                <>
                  <img src="/logo-color.svg" alt="Complerer" className="h-5" />
                  <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                    Super Admin
                  </span>
                </>
              ) : (
                <img src="/icon-color.svg" alt="Complerer" className="h-6 w-6" />
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarMenu>
            {adminItems.map((item) => (
              <AdminNavItem key={item.label} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => {
                  const workspaceId = localStorage.getItem('workspaceId')
                  if (workspaceId) {
                    navigate({ to: `/w/${workspaceId}/dashboard` })
                  } else {
                    navigate({ to: '/workspaces' })
                  }
                }}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={16} className="shrink-0" />
                {state === 'expanded' && <span>Back to App</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      {/* Profile footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((p) => !p)}
                className="flex h-12 w-full items-center gap-2 rounded-lg px-2 text-left transition-colors hover:bg-zinc-800/50"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/20 to-amber-400/5">
                  <span className="text-xs font-semibold text-amber-400">
                    {user?.name?.[0]?.toUpperCase() ?? 'A'}
                  </span>
                </div>
                {state === 'expanded' && (
                  <>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-none">
                      <span className="truncate text-sm font-medium text-zinc-100">
                        {user?.name ?? 'Admin'}
                      </span>
                      <span className="truncate text-xs text-zinc-500">
                        {user?.email ?? 'admin@example.com'}
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
