import { lazy, Suspense } from 'react'
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

// ── Lazy page imports (code-splitting) ──────────────────────────────────────

const LoginPage = lazy(() => import('@/pages/login').then(m => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('@/pages/signup').then(m => ({ default: m.SignupPage })))
const OnboardingPage = lazy(() => import('@/pages/onboarding').then(m => ({ default: m.OnboardingPage })))
const PendingPage = lazy(() => import('@/pages/pending').then(m => ({ default: m.PendingPage })))
const DashboardPage = lazy(() => import('@/pages/dashboard').then(m => ({ default: m.DashboardPage })))
const FrameworksPage = lazy(() => import('@/pages/frameworks').then(m => ({ default: m.FrameworksPage })))
const AccessRegisterPage = lazy(() => import('@/pages/access-register').then(m => ({ default: m.AccessRegisterPage })))
const EvidencePage = lazy(() => import('@/pages/evidence').then(m => ({ default: m.EvidencePage })))
const BaselinesPage = lazy(() => import('@/pages/baselines').then(m => ({ default: m.BaselinesPage })))
const RiskRegisterPage = lazy(() => import('@/pages/risk-register').then(m => ({ default: m.RiskRegisterPage })))
const PoliciesPage = lazy(() => import('@/pages/policies').then(m => ({ default: m.PoliciesPage })))
const ChatPage = lazy(() => import('@/pages/chat').then(m => ({ default: m.ChatPage })))
const SettingsPage = lazy(() => import('@/pages/settings').then(m => ({ default: m.SettingsPage })))
const GapAnalysisPage = lazy(() => import('@/pages/gap-analysis').then(m => ({ default: m.GapAnalysisPage })))
const EventsPage = lazy(() => import('@/pages/events').then(m => ({ default: m.EventsPage })))
const IntegrationsPage = lazy(() => import('@/pages/integrations').then(m => ({ default: m.IntegrationsPage })))
const TrustScorePage = lazy(() => import('@/pages/trust-score').then(m => ({ default: m.TrustScorePage })))
const TrustCenterPage = lazy(() => import('@/pages/trust-center').then(m => ({ default: m.TrustCenterPage })))
const PlaybooksPage = lazy(() => import('@/pages/playbooks').then(m => ({ default: m.PlaybooksPage })))
const WelcomePage = lazy(() => import('@/pages/welcome').then(m => ({ default: m.WelcomePage })))
const ProjectsPage = lazy(() => import('@/pages/projects').then(m => ({ default: m.ProjectsPage })))
const ProjectDetailPage = lazy(() => import('@/pages/project-detail').then(m => ({ default: m.ProjectDetailPage })))
const ReportsPage = lazy(() => import('@/pages/reports').then(m => ({ default: m.ReportsPage })))
const ReportEditorPage = lazy(() => import('@/pages/report-editor').then(m => ({ default: m.ReportEditorPage })))
const AdminLayout = lazy(() => import('@/components/layout/admin-layout').then(m => ({ default: m.AdminLayout })))
const AdminDashboardPage = lazy(() => import('@/pages/admin/dashboard').then(m => ({ default: m.AdminDashboardPage })))
const AdminProvidersPage = lazy(() => import('@/pages/admin/providers').then(m => ({ default: m.AdminProvidersPage })))
const AdminEmailTemplatesPage = lazy(() => import('@/pages/admin/email-templates').then(m => ({ default: m.AdminEmailTemplatesPage })))
const AdminFeatureFlagsPage = lazy(() => import('@/pages/admin/feature-flags').then(m => ({ default: m.AdminFeatureFlagsPage })))
const AdminWorkspacesPage = lazy(() => import('@/pages/admin/workspaces').then(m => ({ default: m.AdminWorkspacesPage })))
const AdminMembersPage = lazy(() => import('@/pages/admin/members').then(m => ({ default: m.AdminMembersPage })))
const AdminLibrariesPage = lazy(() => import('@/pages/admin/libraries').then(m => ({ default: m.AdminLibrariesPage })))

// ── Loading fallback ────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-primary-400" />
    </div>
  )
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

// ── Root ────────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

// ── Public routes ───────────────────────────────────────────────────────────

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: () => <LazyPage><LoginPage /></LazyPage>,
})

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: () => <LazyPage><SignupPage /></LazyPage>,
})

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  component: () => <LazyPage><OnboardingPage /></LazyPage>,
  beforeLoad: () => {
    const userId = localStorage.getItem('userId')
    if (!userId) throw redirect({ to: '/signup' })
  },
})

const pendingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pending',
  component: () => <LazyPage><PendingPage /></LazyPage>,
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
  component: () => <LazyPage><DashboardPage /></LazyPage>,
})

const frameworksRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/frameworks',
  component: () => <LazyPage><FrameworksPage /></LazyPage>,
})

const accessRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/access',
  component: () => <LazyPage><AccessRegisterPage /></LazyPage>,
})

const evidenceRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/evidence',
  component: () => <LazyPage><EvidencePage /></LazyPage>,
})

const baselinesRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/baselines',
  component: () => <LazyPage><BaselinesPage /></LazyPage>,
})

const risksRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/risks',
  component: () => <LazyPage><RiskRegisterPage /></LazyPage>,
})

const policiesRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/policies',
  component: () => <LazyPage><PoliciesPage /></LazyPage>,
})

const chatRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/chat',
  component: () => <LazyPage><ChatPage /></LazyPage>,
})

const settingsRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/settings',
  component: () => <LazyPage><SettingsPage /></LazyPage>,
})

const gapAnalysisRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/gap-analysis',
  component: () => <LazyPage><GapAnalysisPage /></LazyPage>,
})

const eventsRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/events',
  component: () => <LazyPage><EventsPage /></LazyPage>,
})

const integrationsRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/integrations',
  component: () => <LazyPage><IntegrationsPage /></LazyPage>,
})

const trustScoreRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/trust',
  component: () => <LazyPage><TrustScorePage /></LazyPage>,
})

const playbooksRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/playbooks',
  component: () => <LazyPage><PlaybooksPage /></LazyPage>,
})

const welcomeRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/welcome',
  component: () => <LazyPage><WelcomePage /></LazyPage>,
})

const projectsRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/projects',
  component: () => <LazyPage><ProjectsPage /></LazyPage>,
})

const projectDetailRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/projects/$projectId',
  component: () => <LazyPage><ProjectDetailPage /></LazyPage>,
})

const reportsRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/reports',
  component: () => <LazyPage><ReportsPage /></LazyPage>,
})

const reportEditorRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/reports/$reportId/edit',
  component: () => <LazyPage><ReportEditorPage /></LazyPage>,
})

// ── Admin layout ───────────────────────────────────────────────────────────

const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: () => (
    <LazyPage>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </LazyPage>
  ),
  beforeLoad: () => {
    const userId = localStorage.getItem('userId')
    if (!userId) throw redirect({ to: '/login' })
  },
})

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/',
  component: () => <LazyPage><AdminDashboardPage /></LazyPage>,
})

const adminProvidersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/providers',
  component: () => <LazyPage><AdminProvidersPage /></LazyPage>,
})

const adminEmailTemplatesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/email-templates',
  component: () => <LazyPage><AdminEmailTemplatesPage /></LazyPage>,
})

const adminFeatureFlagsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/feature-flags',
  component: () => <LazyPage><AdminFeatureFlagsPage /></LazyPage>,
})

const adminWorkspacesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/workspaces',
  component: () => <LazyPage><AdminWorkspacesPage /></LazyPage>,
})

const adminMembersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/members',
  component: () => <LazyPage><AdminMembersPage /></LazyPage>,
})

const adminLibrariesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/libraries',
  component: () => <LazyPage><AdminLibrariesPage /></LazyPage>,
})

// ── Public Trust Center ─────────────────────────────────────────────────────

const trustCenterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/trust/$slug',
  component: () => <LazyPage><TrustCenterPage /></LazyPage>,
})

// ── Tree + Router ───────────────────────────────────────────────────────────

export const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  onboardingRoute,
  pendingRoute,
  workspacesRoute,
  trustCenterRoute,
  workspaceLayoutRoute.addChildren([dashboardRoute, frameworksRoute, accessRoute, evidenceRoute, baselinesRoute, risksRoute, policiesRoute, chatRoute, settingsRoute, gapAnalysisRoute, eventsRoute, integrationsRoute, trustScoreRoute, playbooksRoute, welcomeRoute, projectsRoute, projectDetailRoute, reportsRoute, reportEditorRoute]),
  adminLayoutRoute.addChildren([adminDashboardRoute, adminProvidersRoute, adminEmailTemplatesRoute, adminFeatureFlagsRoute, adminWorkspacesRoute, adminMembersRoute, adminLibrariesRoute]),
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
