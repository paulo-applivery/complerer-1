import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { lazy, Suspense } from 'react';
import { createRootRoute, createRoute, createRouter, redirect, Outlet, Navigate, useNavigate, } from '@tanstack/react-router';
import { useAuth } from '@/hooks/use-auth';
import { AppLayout } from '@/components/layout/app-layout';
// ── Lazy page imports (code-splitting) ──────────────────────────────────────
const LoginPage = lazy(() => import('@/pages/login').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('@/pages/signup').then(m => ({ default: m.SignupPage })));
const OnboardingPage = lazy(() => import('@/pages/onboarding').then(m => ({ default: m.OnboardingPage })));
const PendingPage = lazy(() => import('@/pages/pending').then(m => ({ default: m.PendingPage })));
const DashboardPage = lazy(() => import('@/pages/dashboard').then(m => ({ default: m.DashboardPage })));
const FrameworksPage = lazy(() => import('@/pages/frameworks').then(m => ({ default: m.FrameworksPage })));
const AccessRegisterPage = lazy(() => import('@/pages/access-register').then(m => ({ default: m.AccessRegisterPage })));
const EvidencePage = lazy(() => import('@/pages/evidence').then(m => ({ default: m.EvidencePage })));
const BaselinesPage = lazy(() => import('@/pages/baselines').then(m => ({ default: m.BaselinesPage })));
const RiskRegisterPage = lazy(() => import('@/pages/risk-register').then(m => ({ default: m.RiskRegisterPage })));
const PoliciesPage = lazy(() => import('@/pages/policies').then(m => ({ default: m.PoliciesPage })));
const ChatPage = lazy(() => import('@/pages/chat').then(m => ({ default: m.ChatPage })));
const SettingsPage = lazy(() => import('@/pages/settings').then(m => ({ default: m.SettingsPage })));
const GapAnalysisPage = lazy(() => import('@/pages/gap-analysis').then(m => ({ default: m.GapAnalysisPage })));
const EventsPage = lazy(() => import('@/pages/events').then(m => ({ default: m.EventsPage })));
const IntegrationsPage = lazy(() => import('@/pages/integrations').then(m => ({ default: m.IntegrationsPage })));
const TrustScorePage = lazy(() => import('@/pages/trust-score').then(m => ({ default: m.TrustScorePage })));
const TrustCenterPage = lazy(() => import('@/pages/trust-center').then(m => ({ default: m.TrustCenterPage })));
const PlaybooksPage = lazy(() => import('@/pages/playbooks').then(m => ({ default: m.PlaybooksPage })));
const WelcomePage = lazy(() => import('@/pages/welcome').then(m => ({ default: m.WelcomePage })));
const ProjectsPage = lazy(() => import('@/pages/projects').then(m => ({ default: m.ProjectsPage })));
const ProjectDetailPage = lazy(() => import('@/pages/project-detail').then(m => ({ default: m.ProjectDetailPage })));
const ReportsPage = lazy(() => import('@/pages/reports').then(m => ({ default: m.ReportsPage })));
const ReportEditorPage = lazy(() => import('@/pages/report-editor').then(m => ({ default: m.ReportEditorPage })));
const AdminLayout = lazy(() => import('@/components/layout/admin-layout').then(m => ({ default: m.AdminLayout })));
const AdminDashboardPage = lazy(() => import('@/pages/admin/dashboard').then(m => ({ default: m.AdminDashboardPage })));
const AdminProvidersPage = lazy(() => import('@/pages/admin/providers').then(m => ({ default: m.AdminProvidersPage })));
const AdminEmailTemplatesPage = lazy(() => import('@/pages/admin/email-templates').then(m => ({ default: m.AdminEmailTemplatesPage })));
const AdminFeatureFlagsPage = lazy(() => import('@/pages/admin/feature-flags').then(m => ({ default: m.AdminFeatureFlagsPage })));
const AdminWorkspacesPage = lazy(() => import('@/pages/admin/workspaces').then(m => ({ default: m.AdminWorkspacesPage })));
const AdminMembersPage = lazy(() => import('@/pages/admin/members').then(m => ({ default: m.AdminMembersPage })));
const AdminLibrariesPage = lazy(() => import('@/pages/admin/libraries').then(m => ({ default: m.AdminLibrariesPage })));
const AdminReportTemplateEditorPage = lazy(() => import('@/pages/admin/report-template-editor').then(m => ({ default: m.AdminReportTemplateEditorPage })));
// ── Loading fallback ────────────────────────────────────────────────────────
function PageLoader() {
    return (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx("div", { className: "h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-primary-400" }) }));
}
function LazyPage({ children }) {
    return _jsx(Suspense, { fallback: _jsx(PageLoader, {}), children: children });
}
// ── Root ────────────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({
    component: () => _jsx(Outlet, {}),
});
// ── Public routes ───────────────────────────────────────────────────────────
const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: () => _jsx(LazyPage, { children: _jsx(LoginPage, {}) }),
});
const signupRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/signup',
    component: () => _jsx(LazyPage, { children: _jsx(SignupPage, {}) }),
});
const onboardingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/onboarding',
    component: () => _jsx(LazyPage, { children: _jsx(OnboardingPage, {}) }),
    beforeLoad: () => {
        const userId = localStorage.getItem('userId');
        if (!userId)
            throw redirect({ to: '/signup' });
    },
});
const pendingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/pending',
    component: () => _jsx(LazyPage, { children: _jsx(PendingPage, {}) }),
});
const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => {
        const userId = localStorage.getItem('userId');
        if (!userId)
            return _jsx(Navigate, { to: "/login" });
        const workspaceId = localStorage.getItem('workspaceId');
        if (workspaceId)
            return _jsx(Navigate, { to: "/w/$workspaceId/dashboard", params: { workspaceId } });
        return _jsx(Navigate, { to: "/workspaces" });
    },
});
const workspacesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/workspaces',
    component: function WorkspaceSelector() {
        const { workspaces, isLoading } = useAuth();
        const nav = useNavigate();
        // Auto-redirect if user has exactly one workspace
        if (!isLoading && workspaces.length === 1) {
            const ws = workspaces[0];
            localStorage.setItem('workspaceId', ws.id);
            return _jsx(Navigate, { to: "/w/$workspaceId/dashboard", params: { workspaceId: ws.id } });
        }
        // Auto-redirect if user already has a saved workspace
        const savedWsId = localStorage.getItem('workspaceId');
        if (!isLoading && savedWsId && workspaces.some((w) => w.id === savedWsId)) {
            return _jsx(Navigate, { to: "/w/$workspaceId/dashboard", params: { workspaceId: savedWsId } });
        }
        return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-zinc-950", children: _jsxs("div", { className: "w-full max-w-md space-y-6 px-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("img", { src: "/logo-white.svg", alt: "Complerer", className: "mx-auto mb-6 h-7" }), _jsx("h1", { className: "text-xl font-bold text-zinc-100", children: "Select a Workspace" }), _jsx("p", { className: "mt-1 text-sm text-zinc-500", children: "Choose a workspace to continue." })] }), isLoading ? (_jsx("div", { className: "flex justify-center py-8", children: _jsx("div", { className: "h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-primary-400" }) })) : workspaces.length === 0 ? (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center", children: [_jsx("p", { className: "text-sm text-zinc-400", children: "You don't belong to any workspace yet." }), _jsx("p", { className: "mt-2 text-xs text-zinc-600", children: "Ask an admin to invite you, or sign in with a different email." })] })) : (_jsx("div", { className: "space-y-2", children: workspaces.map((ws) => (_jsxs("button", { onClick: () => {
                                localStorage.setItem('workspaceId', ws.id);
                                nav({ to: '/w/$workspaceId/dashboard', params: { workspaceId: ws.id } });
                            }, className: "flex w-full items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left transition-all hover:border-zinc-700 hover:bg-zinc-800/50", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-primary-400/10", children: _jsx("span", { className: "text-sm font-bold text-primary-400", children: ws.name[0]?.toUpperCase() }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-zinc-100", children: ws.name }), _jsx("p", { className: "text-xs text-zinc-500", children: ws.role })] })] }, ws.id))) }))] }) }));
    },
});
// ── Workspace layout ────────────────────────────────────────────────────────
const workspaceLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/w/$workspaceId',
    component: () => (_jsx(AppLayout, { children: _jsx(Outlet, {}) })),
    beforeLoad: ({ params }) => {
        const userId = localStorage.getItem('userId');
        if (!userId)
            throw redirect({ to: '/login' });
        localStorage.setItem('workspaceId', params.workspaceId);
    },
});
const dashboardRoute = createRoute({
    getParentRoute: () => workspaceLayoutRoute,
    path: '/dashboard',
    component: () => _jsx(LazyPage, { children: _jsx(DashboardPage, {}) }),
});
const frameworksRoute = createRoute({
    getParentRoute: () => workspaceLayoutRoute,
    path: '/frameworks',
    component: () => _jsx(LazyPage, { children: _jsx(FrameworksPage, {}) }),
});
const accessRoute = createRoute({
    getParentRoute: () => workspaceLayoutRoute,
    path: '/access',
    component: () => _jsx(LazyPage, { children: _jsx(AccessRegisterPage, {}) }),
});
const evidenceRoute = createRoute({
    getParentRoute: () => workspaceLayoutRoute,
    path: '/evidence',
    component: () => _jsx(LazyPage, { children: _jsx(EvidencePage, {}) }),
});
const baselinesRoute = createRoute({
    getParentRoute: () => workspaceLayoutRoute,
    path: '/baselines',
    component: () => _jsx(LazyPage, { children: _jsx(BaselinesPage, {}) }),
});
const risksRoute = createRoute({
    getParentRoute: () => workspaceLayoutRoute,
    path: '/risks',
    component: () => _jsx(LazyPage, { children: _jsx(RiskRegisterPage, {}) }),
});
const policiesRoute = createRoute({
    getParentRoute: () => workspaceLayoutRoute,
    path: '/policies',
    component: () => _jsx(LazyPage, { children: _jsx(PoliciesPage, {}) }),
});
const chatRoute = createRoute({
    getParentRoute: () => workspaceLayoutRoute,
    path: '/chat',
    component: () => _jsx(LazyPage, { children: _jsx(ChatPage, {}) }),
});
const settingsRoute = createRoute({
    getParentRoute: () => workspaceLayoutRoute,
    path: '/settings',
    component: () => _jsx(LazyPage, { children: _jsx(SettingsPage, {}) }),
});
const gapAnalysisRoute = createRoute({
    getParentRoute: () => workspaceLayoutRoute,
    path: '/gap-analysis',
    component: () => _jsx(LazyPage, { children: _jsx(GapAnalysisPage, {}) }),
});
const eventsRoute = createRoute({
    getParentRoute: () => workspaceLayoutRoute,
    path: '/events',
    component: () => _jsx(LazyPage, { children: _jsx(EventsPage, {}) }),
});
const integrationsRoute = createRoute({
    getParentRoute: () => workspaceLayoutRoute,
    path: '/integrations',
    component: () => _jsx(LazyPage, { children: _jsx(IntegrationsPage, {}) }),
});
const trustScoreRoute = createRoute({
    getParentRoute: () => workspaceLayoutRoute,
    path: '/trust',
    component: () => _jsx(LazyPage, { children: _jsx(TrustScorePage, {}) }),
});
const playbooksRoute = createRoute({
    getParentRoute: () => workspaceLayoutRoute,
    path: '/playbooks',
    component: () => _jsx(LazyPage, { children: _jsx(PlaybooksPage, {}) }),
});
const welcomeRoute = createRoute({
    getParentRoute: () => workspaceLayoutRoute,
    path: '/welcome',
    component: () => _jsx(LazyPage, { children: _jsx(WelcomePage, {}) }),
});
const projectsRoute = createRoute({
    getParentRoute: () => workspaceLayoutRoute,
    path: '/projects',
    component: () => _jsx(LazyPage, { children: _jsx(ProjectsPage, {}) }),
});
const projectDetailRoute = createRoute({
    getParentRoute: () => workspaceLayoutRoute,
    path: '/projects/$projectId',
    component: () => _jsx(LazyPage, { children: _jsx(ProjectDetailPage, {}) }),
});
const reportsRoute = createRoute({
    getParentRoute: () => workspaceLayoutRoute,
    path: '/reports',
    component: () => _jsx(LazyPage, { children: _jsx(ReportsPage, {}) }),
});
const reportEditorRoute = createRoute({
    getParentRoute: () => workspaceLayoutRoute,
    path: '/reports/$reportId/edit',
    component: () => _jsx(LazyPage, { children: _jsx(ReportEditorPage, {}) }),
});
// ── Admin layout ───────────────────────────────────────────────────────────
const adminLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/admin',
    component: () => (_jsx(LazyPage, { children: _jsx(AdminLayout, { children: _jsx(Outlet, {}) }) })),
    beforeLoad: () => {
        const userId = localStorage.getItem('userId');
        if (!userId)
            throw redirect({ to: '/login' });
    },
});
const adminDashboardRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: '/',
    component: () => _jsx(LazyPage, { children: _jsx(AdminDashboardPage, {}) }),
});
const adminProvidersRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: '/providers',
    component: () => _jsx(LazyPage, { children: _jsx(AdminProvidersPage, {}) }),
});
const adminEmailTemplatesRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: '/email-templates',
    component: () => _jsx(LazyPage, { children: _jsx(AdminEmailTemplatesPage, {}) }),
});
const adminFeatureFlagsRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: '/feature-flags',
    component: () => _jsx(LazyPage, { children: _jsx(AdminFeatureFlagsPage, {}) }),
});
const adminWorkspacesRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: '/workspaces',
    component: () => _jsx(LazyPage, { children: _jsx(AdminWorkspacesPage, {}) }),
});
const adminMembersRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: '/members',
    component: () => _jsx(LazyPage, { children: _jsx(AdminMembersPage, {}) }),
});
const adminLibrariesRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: '/libraries',
    component: () => _jsx(LazyPage, { children: _jsx(AdminLibrariesPage, {}) }),
});
const adminReportTemplateEditorRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: '/report-templates/$templateId',
    component: () => _jsx(LazyPage, { children: _jsx(AdminReportTemplateEditorPage, {}) }),
});
// ── Public Trust Center ─────────────────────────────────────────────────────
const trustCenterRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/trust/$slug',
    component: () => _jsx(LazyPage, { children: _jsx(TrustCenterPage, {}) }),
});
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
    adminLayoutRoute.addChildren([adminDashboardRoute, adminProvidersRoute, adminEmailTemplatesRoute, adminFeatureFlagsRoute, adminWorkspacesRoute, adminMembersRoute, adminLibrariesRoute, adminReportTemplateEditorRoute]),
]);
export const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
});
//# sourceMappingURL=index.js.map