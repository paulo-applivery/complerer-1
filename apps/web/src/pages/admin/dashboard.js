import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react';
import { Building06Icon, UserGroupIcon, FileValidationIcon, Shield01Icon, Settings01Icon, Mail01Icon, Flag01Icon, Layers01Icon, Key01Icon, DashboardBrowsingIcon, ArrowRight01Icon, } from '@hugeicons/core-free-icons';
import { api } from '@/lib/api';
function useAdminDashboard() {
    return useQuery({
        queryKey: ['admin', 'stats'],
        queryFn: () => api.get('/admin/stats'),
    });
}
// ── Components ──────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, onClick }) {
    const Comp = onClick ? 'button' : 'div';
    return (_jsxs(Comp, { onClick: onClick, className: `rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left transition-colors ${onClick ? 'hover:border-zinc-700 hover:bg-zinc-800/50 cursor-pointer' : ''}`, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-xs text-zinc-500", children: label }), _jsx("div", { className: `flex h-8 w-8 items-center justify-center rounded-lg ${color}`, children: _jsx(HugeiconsIcon, { icon: icon, size: 14 }) })] }), _jsx("p", { className: "mt-2 text-2xl font-bold text-zinc-100", children: value })] }));
}
const PLAN_COLORS = {
    enterprise: 'bg-primary-400',
    pro: 'bg-blue-400',
    starter: 'bg-amber-400',
    free: 'bg-zinc-600',
};
// ── Main Page ───────────────────────────────────────────────────────────
export function AdminDashboardPage() {
    const navigate = useNavigate();
    const { data, isLoading } = useAdminDashboard();
    const s = data?.stats;
    const loading = isLoading ? '...' : undefined;
    return (_jsxs("div", { className: "mx-auto w-full max-w-6xl space-y-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-zinc-100", children: "Platform Overview" }), _jsx("p", { className: "mt-1 text-sm text-zinc-500", children: "Super admin dashboard for the Complerer platform." })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3 lg:grid-cols-4", children: [_jsx(StatCard, { label: "Workspaces", value: loading ?? s?.totalWorkspaces ?? 0, icon: Building06Icon, color: "bg-primary-400/10 text-primary-400", onClick: () => navigate({ to: '/admin/workspaces' }) }), _jsx(StatCard, { label: "Users", value: loading ?? s?.totalUsers ?? 0, icon: UserGroupIcon, color: "bg-blue-400/10 text-blue-400", onClick: () => navigate({ to: '/admin/members' }) }), _jsx(StatCard, { label: "Frameworks", value: loading ?? s?.totalFrameworks ?? 0, icon: Layers01Icon, color: "bg-purple-400/10 text-purple-400", onClick: () => navigate({ to: '/admin/libraries' }) }), _jsx(StatCard, { label: "New Users (7d)", value: loading ?? s?.recentUsersWeek ?? 0, icon: UserGroupIcon, color: "bg-green-400/10 text-green-400" })] }), _jsx("div", { className: "grid grid-cols-3 gap-3 lg:grid-cols-6", children: [
                    { label: 'Controls', value: s?.totalControls ?? 0, icon: Shield01Icon, color: 'bg-blue-400/10 text-blue-400' },
                    { label: 'Evidence', value: s?.totalEvidence ?? 0, icon: FileValidationIcon, color: 'bg-amber-400/10 text-amber-400' },
                    { label: 'Systems', value: s?.totalSystems ?? 0, icon: DashboardBrowsingIcon, color: 'bg-cyan-400/10 text-cyan-400' },
                    { label: 'Baselines', value: s?.totalBaselines ?? 0, icon: Settings01Icon, color: 'bg-purple-400/10 text-purple-400' },
                    { label: 'Access Records', value: s?.totalAccessRecords ?? 0, icon: Key01Icon, color: 'bg-green-400/10 text-green-400' },
                    { label: 'People', value: s?.totalPeople ?? 0, icon: UserGroupIcon, color: 'bg-pink-400/10 text-pink-400' },
                ].map((item) => (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `flex h-6 w-6 items-center justify-center rounded-md ${item.color}`, children: _jsx(HugeiconsIcon, { icon: item.icon, size: 12 }) }), _jsx("p", { className: "text-[10px] text-zinc-500", children: item.label })] }), _jsx("p", { className: "mt-1 text-lg font-bold text-zinc-100", children: loading ?? item.value })] }, item.label))) }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-sm font-semibold text-zinc-200", children: "Recent Workspaces" }), _jsxs("button", { onClick: () => navigate({ to: '/admin/workspaces' }), className: "flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300", children: ["View all ", _jsx(HugeiconsIcon, { icon: ArrowRight01Icon, size: 12 })] })] }), isLoading ? (_jsx("div", { className: "py-8 text-center text-xs text-zinc-500", children: "Loading..." })) : (data?.recentWorkspaces ?? []).length === 0 ? (_jsx("div", { className: "py-8 text-center text-xs text-zinc-500", children: "No workspaces yet." })) : (_jsx("div", { className: "space-y-2", children: (data?.recentWorkspaces ?? []).map((ws) => (_jsxs("div", { className: "flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-800/30 px-3 py-2.5 transition-colors hover:border-zinc-700", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-zinc-200", children: ws.name }), _jsxs("p", { className: "text-[10px] text-zinc-500", children: [_jsx("code", { children: ws.slug }), " \u00B7 ", ws.member_count, " members \u00B7 ", new Date(ws.created_at).toLocaleDateString()] })] }), _jsx("span", { className: `rounded-md px-2 py-0.5 text-[10px] font-medium ${ws.plan === 'enterprise' ? 'bg-primary-400/10 text-primary-400' :
                                                ws.plan === 'pro' ? 'bg-blue-500/10 text-blue-400' :
                                                    ws.plan === 'starter' ? 'bg-amber-500/10 text-amber-400' :
                                                        'bg-zinc-800 text-zinc-400'}`, children: ws.plan })] }, ws.id))) }))] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsx("h2", { className: "text-sm font-semibold text-zinc-200 mb-4", children: "Plan Distribution" }), isLoading ? (_jsx("div", { className: "py-4 text-center text-xs text-zinc-500", children: "Loading..." })) : (data?.planDistribution ?? []).length === 0 ? (_jsx("div", { className: "py-4 text-center text-xs text-zinc-500", children: "No data." })) : (_jsx("div", { className: "space-y-2", children: (data?.planDistribution ?? []).map((p) => {
                                            const total = s?.totalWorkspaces ?? 1;
                                            const pct = Math.round((p.count / total) * 100);
                                            return (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsx("span", { className: "font-medium text-zinc-300 capitalize", children: p.plan }), _jsxs("span", { className: "text-zinc-500", children: [p.count, " (", pct, "%)"] })] }), _jsx("div", { className: "h-2 w-full overflow-hidden rounded-full bg-zinc-800", children: _jsx("div", { className: `h-2 rounded-full transition-all ${PLAN_COLORS[p.plan] ?? 'bg-zinc-600'}`, style: { width: `${Math.max(pct, 2)}%` } }) })] }, p.plan));
                                        }) }))] }), _jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsx("h2", { className: "text-sm font-semibold text-zinc-200 mb-3", children: "Quick Links" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: [
                                            { label: 'Providers', path: '/admin/providers', icon: Settings01Icon, color: 'bg-amber-400/10 text-amber-400' },
                                            { label: 'Email Templates', path: '/admin/email-templates', icon: Mail01Icon, color: 'bg-pink-400/10 text-pink-400' },
                                            { label: 'Feature Flags', path: '/admin/feature-flags', icon: Flag01Icon, color: 'bg-orange-400/10 text-orange-400' },
                                            { label: 'Libraries', path: '/admin/libraries', icon: Layers01Icon, color: 'bg-purple-400/10 text-purple-400' },
                                            { label: 'Workspaces', path: '/admin/workspaces', icon: Building06Icon, color: 'bg-primary-400/10 text-primary-400' },
                                            { label: 'Members', path: '/admin/members', icon: UserGroupIcon, color: 'bg-blue-400/10 text-blue-400' },
                                        ].map((link) => (_jsxs("button", { onClick: () => navigate({ to: link.path }), className: "flex items-center gap-2.5 rounded-lg border border-zinc-800/50 bg-zinc-800/30 px-3 py-2.5 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-800/50", children: [_jsx("div", { className: `flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${link.color}`, children: _jsx(HugeiconsIcon, { icon: link.icon, size: 13 }) }), _jsx("span", { className: "text-xs font-medium text-zinc-300", children: link.label })] }, link.label))) })] })] })] })] }));
}
//# sourceMappingURL=dashboard.js.map