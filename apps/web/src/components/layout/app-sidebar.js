import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, useParams, useLocation } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { DashboardSquare01Icon, Message01Icon, Layers01Icon, ClipboardIcon, FileValidationIcon, Settings01Icon, Shield01Icon, Alert02Icon, File01Icon, Logout01Icon, Search01Icon, Clock01Icon, SecurityCheckIcon, ArrowDown01Icon, Building06Icon, CrownIcon, Book02Icon, Folder01Icon, } from '@hugeicons/core-free-icons';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator, useSidebar, } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useWorkspace, useFeatureFlags } from '@/hooks/use-workspace';
const overviewItems = [
    { label: 'Dashboard', icon: DashboardSquare01Icon, path: '/dashboard' },
    { label: 'How it Works', icon: SecurityCheckIcon, path: '/welcome' },
];
const complianceItems = [
    { label: 'Projects', icon: Folder01Icon, path: '/projects' },
    { label: 'Frameworks', icon: Layers01Icon, path: '/frameworks' },
    { label: 'Policies', icon: File01Icon, path: '/policies' },
    { label: 'Baselines', icon: Shield01Icon, path: '/baselines' },
    { label: 'Evidence', icon: FileValidationIcon, path: '/evidence' },
    { label: 'Gap Analysis', icon: Search01Icon, path: '/gap-analysis' },
    { label: 'Risk Register', icon: Alert02Icon, path: '/risks' },
];
const accessItems = [
    { label: 'Access Register', icon: ClipboardIcon, path: '/access' },
];
const toolsItems = [
    { label: 'Chat', icon: Message01Icon, path: '/chat', featureFlag: 'ai-chat' },
    { label: 'Trust Score', icon: SecurityCheckIcon, path: '/trust', featureFlag: 'trust-score' },
    { label: 'Playbooks', icon: Book02Icon, path: '/playbooks', featureFlag: 'playbooks' },
    { label: 'Events', icon: Clock01Icon, path: '/events' },
];
function NavItemButton({ item, workspaceId }) {
    const navigate = useNavigate();
    const { setOpenMobile } = useSidebar();
    const location = useLocation();
    const fullPath = `/w/${workspaceId}${item.path}`;
    const isActive = location.pathname === fullPath || location.pathname.startsWith(fullPath + '/');
    return (_jsx(SidebarMenuItem, { children: _jsxs(SidebarMenuButton, { isActive: isActive, onClick: () => {
                navigate({ to: `/w/${workspaceId}${item.path}` });
                if (window.innerWidth < 768)
                    setOpenMobile(false);
            }, children: [_jsx(HugeiconsIcon, { icon: item.icon, size: 16, className: "shrink-0" }), _jsx("span", { children: item.label })] }) }));
}
export function AppSidebar() {
    const params = useParams({ strict: false });
    const workspaceId = params.workspaceId ?? '';
    const { workspace } = useWorkspace(workspaceId);
    const { isEnabled } = useFeatureFlags(workspaceId);
    const { user, logout } = useAuth();
    const { state, setOpenMobile } = useSidebar();
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);
    const isMobileWidth = () => window.innerWidth < 768;
    return (_jsxs(Sidebar, { children: [_jsx(SidebarHeader, { children: _jsx(SidebarMenu, { children: _jsx(SidebarMenuItem, { children: _jsx("div", { className: "flex h-10 items-center px-2", children: state === 'expanded' ? (_jsx("img", { src: "/logo-color.svg", alt: "Complerer", className: "h-5" })) : (_jsxs(_Fragment, { children: [_jsx("img", { src: "/logo-color.svg", alt: "Complerer", className: "h-5 md:hidden" }), _jsx("img", { src: "/icon-color.svg", alt: "Complerer", className: "hidden md:block h-6 w-6" })] })) }) }) }) }), _jsx(SidebarSeparator, {}), _jsxs(SidebarContent, { children: [_jsxs(SidebarGroup, { children: [_jsx(SidebarGroupLabel, { children: "Overview" }), _jsx(SidebarMenu, { children: overviewItems.filter(item => !item.featureFlag || isEnabled(item.featureFlag)).map(item => (_jsx(NavItemButton, { item: item, workspaceId: workspaceId }, item.label))) })] }), _jsxs(SidebarGroup, { children: [_jsx(SidebarGroupLabel, { children: "Compliance Program" }), _jsx(SidebarMenu, { children: complianceItems.filter(item => !item.featureFlag || isEnabled(item.featureFlag)).map(item => (_jsx(NavItemButton, { item: item, workspaceId: workspaceId }, item.label))) })] }), _jsxs(SidebarGroup, { children: [_jsx(SidebarGroupLabel, { children: "Access & Assets" }), _jsx(SidebarMenu, { children: accessItems.filter(item => !item.featureFlag || isEnabled(item.featureFlag)).map(item => (_jsx(NavItemButton, { item: item, workspaceId: workspaceId }, item.label))) })] })] }), _jsx(SidebarSeparator, {}), _jsx(SidebarFooter, { children: _jsx(SidebarMenu, { children: _jsx(SidebarMenuItem, { children: _jsxs("div", { className: "relative", children: [_jsxs("button", { type: "button", onClick: () => setProfileOpen((p) => !p), className: "flex h-12 w-full items-center gap-2 rounded-lg px-2 text-left transition-colors hover:bg-zinc-800/50", children: [_jsx("div", { className: "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400/20 to-primary-400/5", children: _jsx("span", { className: "text-xs font-semibold text-primary-400", children: user?.name?.[0]?.toUpperCase() ?? 'U' }) }), _jsxs("div", { className: "flex min-w-0 flex-1 flex-col gap-0.5 leading-none overflow-hidden", children: [_jsx("span", { className: "truncate text-sm font-medium text-zinc-100", children: user?.name ?? 'User' }), _jsx("span", { className: "truncate text-xs text-zinc-500", children: user?.email ?? 'user@example.com' })] }), _jsx(HugeiconsIcon, { icon: ArrowDown01Icon, size: 14, className: `ml-auto shrink-0 text-zinc-500 transition-transform ${profileOpen ? 'rotate-180' : ''}` })] }), profileOpen && (_jsxs("div", { className: "absolute bottom-full left-0 mb-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-xl shadow-black/40", children: [_jsx("div", { className: "mb-1 rounded-lg bg-zinc-800/50 px-3 py-2.5", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(HugeiconsIcon, { icon: Building06Icon, size: 14, className: "shrink-0 text-zinc-500" }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "truncate text-xs font-medium text-zinc-300", children: workspace?.name ?? 'Workspace' }), _jsx("p", { className: "text-[10px] text-zinc-600", children: "Enterprise" })] })] }) }), _jsxs("button", { onClick: () => {
                                                setProfileOpen(false);
                                                if (isMobileWidth())
                                                    setOpenMobile(false);
                                                navigate({ to: `/w/${workspaceId}/settings` });
                                            }, className: "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200", children: [_jsx(HugeiconsIcon, { icon: Settings01Icon, size: 14 }), "Workspace settings"] }), _jsx("div", { className: "my-1 border-t border-zinc-800" }), toolsItems.filter(item => !item.featureFlag || isEnabled(item.featureFlag)).map(item => (_jsxs("button", { onClick: () => {
                                                setProfileOpen(false);
                                                if (isMobileWidth())
                                                    setOpenMobile(false);
                                                navigate({ to: `/w/${workspaceId}${item.path}` });
                                            }, className: "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200", children: [_jsx(HugeiconsIcon, { icon: item.icon, size: 14 }), item.label] }, item.label))), user?.isSuperAdmin && (_jsxs("button", { onClick: () => {
                                                setProfileOpen(false);
                                                if (isMobileWidth())
                                                    setOpenMobile(false);
                                                navigate({ to: '/admin' });
                                            }, className: "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-amber-400/80 transition-colors hover:bg-amber-500/10 hover:text-amber-400", children: [_jsx(HugeiconsIcon, { icon: CrownIcon, size: 14 }), "Super Admin"] })), _jsx("div", { className: "my-1 border-t border-zinc-800" }), _jsxs("button", { onClick: () => {
                                                setProfileOpen(false);
                                                if (isMobileWidth())
                                                    setOpenMobile(false);
                                                logout();
                                                navigate({ to: '/login' });
                                            }, className: "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400", children: [_jsx(HugeiconsIcon, { icon: Logout01Icon, size: 14 }), "Sign out"] })] }))] }) }) }) })] }));
}
//# sourceMappingURL=app-sidebar.js.map