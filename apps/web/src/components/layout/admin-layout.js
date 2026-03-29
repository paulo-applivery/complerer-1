import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { SidebarProvider, SidebarInset, SidebarTrigger, } from '@/components/ui/sidebar';
import { AdminSidebar } from './admin-sidebar';
export function AdminLayout({ children }) {
    return (_jsxs(SidebarProvider, { children: [_jsx(AdminSidebar, {}), _jsxs(SidebarInset, { children: [_jsxs("header", { className: "flex h-14 shrink-0 items-center gap-2 border-b border-zinc-800 px-4", children: [_jsx(SidebarTrigger, {}), _jsx("div", { className: "mx-1 h-4 w-px bg-zinc-800" }), _jsxs("nav", { className: "flex items-center gap-1.5 text-sm", children: [_jsx("span", { className: "text-amber-400/80", children: "Admin" }), _jsx(HugeiconsIcon, { icon: ArrowRight01Icon, size: 14, className: "text-zinc-600" }), _jsx("span", { className: "font-medium text-zinc-100", children: "Super Admin Panel" })] })] }), _jsx("div", { className: "flex flex-1 flex-col gap-4 p-4", children: children })] })] }));
}
//# sourceMappingURL=admin-layout.js.map