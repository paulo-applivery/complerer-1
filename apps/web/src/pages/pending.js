import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { HugeiconsIcon } from '@hugeicons/react';
import { Clock01Icon, Logout01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
export function PendingPage() {
    const [workspaceName] = useState(() => localStorage.getItem('pendingWorkspace') || 'a workspace');
    const { logout } = useAuth();
    const navigate = useNavigate();
    // Poll auth/me every 15s to detect approval
    const { data } = useQuery({
        queryKey: ['auth', 'me', 'pending-poll'],
        queryFn: () => api.get('/auth/me'),
        refetchInterval: 15000,
        retry: false,
        enabled: !!localStorage.getItem('userId'),
    });
    // If workspaces appear, redirect to dashboard
    useEffect(() => {
        if (data?.memberships && data.memberships.length > 0) {
            const ws = data.memberships[0];
            localStorage.setItem('workspaceId', ws.workspaceId);
            navigate({ to: '/w/$workspaceId/dashboard', params: { workspaceId: ws.workspaceId } });
        }
    }, [data, navigate]);
    const handleLogout = async () => {
        try {
            await logout();
        }
        catch {
            // ignore
        }
        navigate({ to: '/login' });
    };
    return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-zinc-950 px-6", children: _jsxs("div", { className: "w-full max-w-md text-center", children: [_jsx("div", { className: "mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-400/10", children: _jsx(HugeiconsIcon, { icon: Clock01Icon, size: 36, className: "text-primary-400" }) }), _jsx("h1", { className: "text-2xl font-bold text-zinc-100", children: "Your request is pending" }), _jsxs("p", { className: "mt-3 text-sm leading-relaxed text-zinc-400", children: ["You've requested to join", ' ', _jsx("span", { className: "font-medium text-zinc-200", children: workspaceName }), ". An admin needs to approve your request."] }), _jsx("p", { className: "mt-2 text-sm text-zinc-500", children: "We'll redirect you automatically once approved." }), _jsxs("div", { className: "mx-auto mt-8 flex items-center justify-center gap-2", children: [_jsx("div", { className: "h-2 w-2 animate-pulse rounded-full bg-primary-400" }), _jsx("span", { className: "text-xs text-zinc-500", children: "Checking for approval..." })] }), _jsxs("div", { className: "mt-10 space-y-3", children: [_jsxs("button", { onClick: handleLogout, className: "flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700", children: [_jsx(HugeiconsIcon, { icon: Logout01Icon, size: 14 }), "Sign out"] }), _jsxs("button", { onClick: () => navigate({ to: '/signup' }), className: "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300", children: ["Try a different email", _jsx(HugeiconsIcon, { icon: ArrowRight01Icon, size: 14 })] })] })] }) }));
}
//# sourceMappingURL=pending.js.map