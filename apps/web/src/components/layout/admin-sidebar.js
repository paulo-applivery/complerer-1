import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { DashboardSquare01Icon, Settings01Icon, Mail01Icon, Flag01Icon, Building06Icon, UserGroupIcon, Logout01Icon, ArrowDown01Icon, ArrowLeft01Icon, Layers01Icon, } from '@hugeicons/core-free-icons';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator, useSidebar, } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
const adminItems = [
    { label: 'Dashboard', icon: DashboardSquare01Icon, path: '/admin' },
    { label: 'Providers', icon: Settings01Icon, path: '/admin/providers' },
    { label: 'Email Templates', icon: Mail01Icon, path: '/admin/email-templates' },
    { label: 'Feature Flags', icon: Flag01Icon, path: '/admin/feature-flags' },
    { label: 'Workspaces', icon: Building06Icon, path: '/admin/workspaces' },
    { label: 'Members', icon: UserGroupIcon, path: '/admin/members' },
    { label: 'Libraries', icon: Layers01Icon, path: '/admin/libraries' },
];
function AdminNavItem({ item }) {
    const navigate = useNavigate();
    const { setOpenMobile } = useSidebar();
    const location = useLocation();
    const isActive = item.path === '/admin'
        ? location.pathname === '/admin'
        : location.pathname.startsWith(item.path);
    return (_jsx(SidebarMenuItem, { children: _jsxs(SidebarMenuButton, { isActive: isActive, onClick: () => {
                navigate({ to: item.path });
                if (window.innerWidth < 768)
                    setOpenMobile(false);
            }, children: [_jsx(HugeiconsIcon, { icon: item.icon, size: 16, className: "shrink-0" }), _jsx("span", { children: item.label })] }) }));
}
export function AdminSidebar() {
    const { user, logout } = useAuth();
    const { state, setOpenMobile } = useSidebar();
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);
    const isMobileWidth = () => window.innerWidth < 768;
    return (_jsxs(Sidebar, { children: [_jsx(SidebarHeader, { children: _jsx(SidebarMenu, { children: _jsx(SidebarMenuItem, { children: _jsx("div", { className: "flex h-10 items-center gap-2 px-2", children: state === 'expanded' ? (_jsxs(_Fragment, { children: [_jsx("img", { src: "/logo-color.svg", alt: "Complerer", className: "h-5" }), _jsx("span", { className: "rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400", children: "Super Admin" })] })) : (_jsxs(_Fragment, { children: [_jsx("img", { src: "/logo-color.svg", alt: "Complerer", className: "h-5 md:hidden" }), _jsx("span", { className: "rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 md:hidden", children: "Super Admin" }), _jsx("img", { src: "/icon-color.svg", alt: "Complerer", className: "hidden md:block h-6 w-6" })] })) }) }) }) }), _jsx(SidebarSeparator, {}), _jsxs(SidebarContent, { children: [_jsxs(SidebarGroup, { children: [_jsx(SidebarGroupLabel, { children: "Administration" }), _jsx(SidebarMenu, { children: adminItems.map((item) => (_jsx(AdminNavItem, { item: item }, item.label))) })] }), _jsx(SidebarGroup, { children: _jsx(SidebarMenu, { children: _jsx(SidebarMenuItem, { children: _jsxs(SidebarMenuButton, { onClick: () => {
                                        if (isMobileWidth())
                                            setOpenMobile(false);
                                        const workspaceId = localStorage.getItem('workspaceId');
                                        if (workspaceId) {
                                            navigate({ to: `/w/${workspaceId}/dashboard` });
                                        }
                                        else {
                                            navigate({ to: '/workspaces' });
                                        }
                                    }, children: [_jsx(HugeiconsIcon, { icon: ArrowLeft01Icon, size: 16, className: "shrink-0" }), _jsx("span", { children: "Back to App" })] }) }) }) })] }), _jsx(SidebarSeparator, {}), _jsx(SidebarFooter, { children: _jsx(SidebarMenu, { children: _jsx(SidebarMenuItem, { children: _jsxs("div", { className: "relative", children: [_jsxs("button", { type: "button", onClick: () => setProfileOpen((p) => !p), className: "flex h-12 w-full items-center gap-2 rounded-lg px-2 text-left transition-colors hover:bg-zinc-800/50", children: [_jsx("div", { className: "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/20 to-amber-400/5", children: _jsx("span", { className: "text-xs font-semibold text-amber-400", children: user?.name?.[0]?.toUpperCase() ?? 'A' }) }), _jsxs("div", { className: "flex min-w-0 flex-1 flex-col gap-0.5 leading-none overflow-hidden", children: [_jsx("span", { className: "truncate text-sm font-medium text-zinc-100", children: user?.name ?? 'Admin' }), _jsx("span", { className: "truncate text-xs text-zinc-500", children: user?.email ?? 'admin@example.com' })] }), _jsx(HugeiconsIcon, { icon: ArrowDown01Icon, size: 14, className: `ml-auto shrink-0 text-zinc-500 transition-transform ${profileOpen ? 'rotate-180' : ''}` })] }), profileOpen && (_jsx("div", { className: "absolute bottom-full left-0 mb-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-xl shadow-black/40", children: _jsxs("button", { onClick: () => {
                                            setProfileOpen(false);
                                            if (isMobileWidth())
                                                setOpenMobile(false);
                                            logout();
                                            navigate({ to: '/login' });
                                        }, className: "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400", children: [_jsx(HugeiconsIcon, { icon: Logout01Icon, size: 14 }), "Sign out"] }) }))] }) }) }) })] }));
}
//# sourceMappingURL=admin-sidebar.js.map