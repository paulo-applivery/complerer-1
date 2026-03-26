import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  Outlet,
  Navigate,
  useNavigate,
} from '@tanstack/react-router'
import { useAuth } from '@/hooks/use-auth'
import { AppLayout } from '@/components/layout/app-layout'
import { LoginPage } from '@/pages/login'
import { DashboardPage } from '@/pages/dashboard'
import { FrameworksPage } from '@/pages/frameworks'
import { AccessRegisterPage } from '@/pages/access-register'
import { EvidencePage } from '@/pages/evidence'
import { BaselinesPage } from '@/pages/baselines'
import { RiskRegisterPage } from '@/pages/risk-register'
import { PoliciesPage } from '@/pages/policies'
import { ChatPage } from '@/pages/chat'
import { SettingsPage } from '@/pages/settings'
import { GapAnalysisPage } from '@/pages/gap-analysis'
import { EventsPage } from '@/pages/events'
import { IntegrationsPage } from '@/pages/integrations'
import { TrustScorePage } from '@/pages/trust-score'
import { AdminLayout } from '@/components/layout/admin-layout'
import { AdminDashboardPage } from '@/pages/admin/dashboard'
import { AdminProvidersPage } from '@/pages/admin/providers'
import { AdminEmailTemplatesPage } from '@/pages/admin/email-templates'
import { AdminFeatureFlagsPage } from '@/pages/admin/feature-flags'
import { AdminWorkspacesPage } from '@/pages/admin/workspaces'
import { AdminMembersPage } from '@/pages/admin/members'

// ── Root ────────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

// ── Public routes ───────────────────────────────────────────────────────────

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => {
    const userId = localStorage.getItem('userId')
    if (!userId) return <Navigate to="/login" />
    const workspaceId = localStorage.getItem('workspaceId')
    if (workspaceId) return <Navigate to="/w/$workspaceId/dashboard" params={{ workspaceId }} />
    return <Navigate to="/workspaces" />
  },
})

const workspacesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workspaces',
  component: function WorkspaceSelector() {
    const { workspaces, isLoading } = useAuth()
    const nav = useNavigate()

    // Auto-redirect if user has exactly one workspace
    if (!isLoading && workspaces.length === 1) {
      const ws = workspaces[0]
      localStorage.setItem('workspaceId', ws.id)
      return <Navigate to="/w/$workspaceId/dashboard" params={{ workspaceId: ws.id }} />
    }

    // Auto-redirect if user already has a saved workspace
    const savedWsId = localStorage.getItem('workspaceId')
    if (!isLoading && savedWsId && workspaces.some((w) => w.id === savedWsId)) {
      return <Navigate to="/w/$workspaceId/dashboard" params={{ workspaceId: savedWsId }} />
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="w-full max-w-md space-y-6 px-4">
          <div className="text-center">
            <img src="/logo-white.svg" alt="Complerer" className="mx-auto mb-6 h-7" />
            <h1 className="text-xl font-bold text-zinc-100">Select a Workspace</h1>
            <p className="mt-1 text-sm text-zinc-500">Choose a workspace to continue.</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-primary-400" />
            </div>
          ) : workspaces.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
              <p className="text-sm text-zinc-400">
                You don&apos;t belong to any workspace yet.
              </p>
              <p className="mt-2 text-xs text-zinc-600">
                Ask an admin to invite you, or sign in with a different email.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    localStorage.setItem('workspaceId', ws.id)
                    nav({ to: '/w/$workspaceId/dashboard', params: { workspaceId: ws.id } })
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left transition-all hover:border-zinc-700 hover:bg-zinc-800/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-400/10">
                    <span className="text-sm font-bold text-primary-400">
                      {ws.name[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-100">{ws.name}</p>
                    <p className="text-xs text-zinc-500">{ws.role}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  },
})

// ── Workspace layout ────────────────────────────────────────────────────────

const workspaceLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/w/$workspaceId',
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
  beforeLoad: ({ params }) => {
    const userId = localStorage.getItem('userId')
    if (!userId) throw redirect({ to: '/login' })
    localStorage.setItem('workspaceId', params.workspaceId)
  },
})

const dashboardRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/dashboard',
  component: DashboardPage,
})

const frameworksRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/frameworks',
  component: FrameworksPage,
})

const accessRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/access',
  component: AccessRegisterPage,
})

const evidenceRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/evidence',
  component: EvidencePage,
})

const baselinesRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/baselines',
  component: BaselinesPage,
})

const risksRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/risks',
  component: RiskRegisterPage,
})

const policiesRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/policies',
  component: PoliciesPage,
})

const chatRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/chat',
  component: ChatPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/settings',
  component: SettingsPage,
})

const gapAnalysisRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/gap-analysis',
  component: GapAnalysisPage,
})

const eventsRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/events',
  component: EventsPage,
})

const integrationsRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/integrations',
  component: IntegrationsPage,
})

const trustScoreRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/trust',
  component: TrustScorePage,
})

// ── Admin layout ───────────────────────────────────────────────────────────

const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: () => (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  ),
  beforeLoad: () => {
    const userId = localStorage.getItem('userId')
    if (!userId) throw redirect({ to: '/login' })
  },
})

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/',
  component: AdminDashboardPage,
})

const adminProvidersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/providers',
  component: AdminProvidersPage,
})

const adminEmailTemplatesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/email-templates',
  component: AdminEmailTemplatesPage,
})

const adminFeatureFlagsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/feature-flags',
  component: AdminFeatureFlagsPage,
})

const adminWorkspacesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/workspaces',
  component: AdminWorkspacesPage,
})

const adminMembersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/members',
  component: AdminMembersPage,
})

// ── Tree + Router ───────────────────────────────────────────────────────────

export const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  workspacesRoute,
  workspaceLayoutRoute.addChildren([dashboardRoute, frameworksRoute, accessRoute, evidenceRoute, baselinesRoute, risksRoute, policiesRoute, chatRoute, settingsRoute, gapAnalysisRoute, eventsRoute, integrationsRoute, trustScoreRoute]),
  adminLayoutRoute.addChildren([adminDashboardRoute, adminProvidersRoute, adminEmailTemplatesRoute, adminFeatureFlagsRoute, adminWorkspacesRoute, adminMembersRoute]),
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
