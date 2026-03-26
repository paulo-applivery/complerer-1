import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  Outlet,
  Navigate,
} from '@tanstack/react-router'
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
  component: () => (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <h1 className="mb-2 text-2xl font-bold text-zinc-100">Select a Workspace</h1>
        <p className="text-zinc-400">Choose a workspace to get started.</p>
      </div>
    </div>
  ),
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

// ── Tree + Router ───────────────────────────────────────────────────────────

export const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  workspacesRoute,
  workspaceLayoutRoute.addChildren([dashboardRoute, frameworksRoute, accessRoute, evidenceRoute, baselinesRoute, risksRoute, policiesRoute, chatRoute, settingsRoute, gapAnalysisRoute, eventsRoute, integrationsRoute, trustScoreRoute]),
  adminLayoutRoute.addChildren([adminDashboardRoute, adminProvidersRoute, adminEmailTemplatesRoute, adminFeatureFlagsRoute, adminWorkspacesRoute]),
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
