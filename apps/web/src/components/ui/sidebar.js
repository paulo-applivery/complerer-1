import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { PanelLeftIcon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
// ── Hooks ─────────────────────────────────────────────────────────────────────
const MOBILE_BREAKPOINT = 768;
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false);
    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        const onChange = (e) => setIsMobile(e.matches);
        mql.addEventListener('change', onChange);
        setIsMobile(mql.matches);
        return () => mql.removeEventListener('change', onChange);
    }, []);
    return isMobile;
}
const SidebarContext = createContext(null);
export function useSidebar() {
    const context = useContext(SidebarContext);
    if (!context)
        throw new Error('useSidebar must be used within SidebarProvider');
    return context;
}
// ── Provider ─────────────────────────────────────────────────────────────────
const SIDEBAR_WIDTH = '16rem';
const SIDEBAR_WIDTH_COLLAPSED = '3rem';
const SIDEBAR_COOKIE_KEY = 'sidebar:state';
export function SidebarProvider({ defaultOpen = true, children }) {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = useState(false);
    const [open, setOpenState] = useState(() => {
        const stored = localStorage.getItem(SIDEBAR_COOKIE_KEY);
        return stored ? stored === 'true' : defaultOpen;
    });
    const setOpen = useCallback((value) => {
        setOpenState(value);
        localStorage.setItem(SIDEBAR_COOKIE_KEY, String(value));
    }, []);
    const toggleSidebar = useCallback(() => {
        if (window.innerWidth < MOBILE_BREAKPOINT) {
            setOpenMobile(prev => !prev);
        }
        else {
            setOpen(!open);
        }
    }, [open, setOpen]);
    // Keyboard shortcut: Cmd+B / Ctrl+B
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                toggleSidebar();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [toggleSidebar]);
    // Close mobile sidebar on resize to desktop
    useEffect(() => {
        if (!isMobile)
            setOpenMobile(false);
    }, [isMobile]);
    const value = useMemo(() => ({
        state: open ? 'expanded' : 'collapsed',
        open,
        setOpen,
        toggleSidebar,
        isMobile,
        openMobile,
        setOpenMobile,
    }), [open, setOpen, toggleSidebar, isMobile, openMobile]);
    return (_jsx(SidebarContext.Provider, { value: value, children: _jsx("div", { className: "group/sidebar-wrapper flex min-h-svh w-full", style: {
                '--sidebar-width': SIDEBAR_WIDTH,
                '--sidebar-width-collapsed': SIDEBAR_WIDTH_COLLAPSED,
            }, "data-sidebar-state": value.state, children: children }) }));
}
export function Sidebar({ className, children, ...props }) {
    const { state, isMobile, openMobile, setOpenMobile } = useSidebar();
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "md:hidden", children: [openMobile && (_jsx("div", { className: "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm", onClick: () => setOpenMobile(false) })), _jsxs("div", { className: cn('fixed inset-y-0 left-0 z-50 flex h-svh w-[280px] flex-col border-r border-zinc-800 bg-zinc-900 transition-transform duration-300 ease-in-out', openMobile ? 'translate-x-0' : '-translate-x-full', className), ...props, children: [_jsx("button", { onClick: () => setOpenMobile(false), className: "absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100", children: _jsx(HugeiconsIcon, { icon: Cancel01Icon, size: 16 }) }), children] })] }), _jsxs("div", { className: "group peer hidden md:block", "data-state": state, "data-collapsible": state === 'collapsed' ? 'icon' : '', children: [_jsx("div", { className: cn('relative h-svh w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear', 'group-data-[collapsible=icon]:w-(--sidebar-width-collapsed)') }), _jsx("div", { className: cn('fixed inset-y-0 left-0 z-10 flex h-svh w-(--sidebar-width) flex-col border-r border-zinc-800 bg-zinc-900 transition-[width] duration-200 ease-linear', 'group-data-[collapsible=icon]:w-(--sidebar-width-collapsed)', className), ...props, children: children })] })] }));
}
// ── SidebarInset (main content wrapper) ──────────────────────────────────────
export function SidebarInset({ className, children, ...props }) {
    return (_jsx("main", { className: cn('relative flex min-h-svh min-w-0 flex-1 flex-col bg-zinc-950 overflow-x-hidden', 'peer-data-[state=collapsed]:ml-0', className), ...props, children: children }));
}
// ── SidebarHeader ────────────────────────────────────────────────────────────
export function SidebarHeader({ className, children, ...props }) {
    return (_jsx("div", { className: cn('flex flex-col gap-2 p-2', className), ...props, children: children }));
}
// ── SidebarFooter ────────────────────────────────────────────────────────────
export function SidebarFooter({ className, children, ...props }) {
    return (_jsx("div", { className: cn('flex flex-col gap-2 p-2', className), ...props, children: children }));
}
// ── SidebarContent (scrollable area) ─────────────────────────────────────────
export function SidebarContent({ className, children, ...props }) {
    return (_jsx("div", { className: cn('flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-2', className), ...props, children: children }));
}
// ── SidebarGroup ─────────────────────────────────────────────────────────────
export function SidebarGroup({ className, children, ...props }) {
    return (_jsx("div", { className: cn('relative flex w-full min-w-0 flex-col p-2', className), ...props, children: children }));
}
// ── SidebarGroupLabel ────────────────────────────────────────────────────────
export function SidebarGroupLabel({ className, children, ...props }) {
    const { state } = useSidebar();
    return (_jsx("div", { className: cn('flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-zinc-500 transition-[margin,opacity] duration-200 ease-linear', state === 'collapsed' && 'md:opacity-0', className), ...props, children: children }));
}
// ── SidebarMenu ──────────────────────────────────────────────────────────────
export function SidebarMenu({ className, children, ...props }) {
    return (_jsx("ul", { className: cn('flex w-full min-w-0 flex-col gap-1', className), ...props, children: children }));
}
// ── SidebarMenuItem ──────────────────────────────────────────────────────────
export function SidebarMenuItem({ className, children, ...props }) {
    return (_jsx("li", { className: cn('group/menu-item relative', className), ...props, children: children }));
}
export function SidebarMenuButton({ className, children, isActive = false, ...props }) {
    const { state } = useSidebar();
    return (_jsx("button", { "data-active": isActive, className: cn('peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors', 'hover:bg-zinc-800 hover:text-zinc-100', 'data-[active=true]:bg-primary-400/10 data-[active=true]:text-primary-400 data-[active=true]:font-medium', !isActive && 'text-zinc-400', state === 'collapsed' && 'md:justify-center md:px-0', className), ...props, children: children }));
}
// ── SidebarMenuSub (collapsible submenu) ─────────────────────────────────────
export function SidebarMenuSub({ className, children, ...props }) {
    return (_jsx("ul", { className: cn('ml-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-zinc-800 px-2.5 py-0.5', className), ...props, children: children }));
}
export function SidebarMenuSubButton({ className, children, isActive = false, ...props }) {
    return (_jsx("a", { "data-active": isActive, className: cn('flex min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 py-1 text-sm text-zinc-400 outline-none transition-colors', 'hover:bg-zinc-800 hover:text-zinc-100', 'data-[active=true]:text-zinc-100', className), ...props, children: children }));
}
// ── SidebarTrigger ───────────────────────────────────────────────────────────
export function SidebarTrigger({ className, ...props }) {
    const { toggleSidebar } = useSidebar();
    return (_jsxs("button", { onClick: toggleSidebar, className: cn('inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100', className), ...props, children: [_jsx(HugeiconsIcon, { icon: PanelLeftIcon, size: 16 }), _jsx("span", { className: "sr-only", children: "Toggle Sidebar" })] }));
}
// ── SidebarSeparator ─────────────────────────────────────────────────────────
export function SidebarSeparator({ className, ...props }) {
    return _jsx("hr", { className: cn('mx-2 border-zinc-800', className), ...props });
}
//# sourceMappingURL=sidebar.js.map