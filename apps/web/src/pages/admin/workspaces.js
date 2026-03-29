import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react';
import { Building06Icon, UserGroupIcon, FileValidationIcon, Shield01Icon, Search01Icon, PlusSignIcon, Edit01Icon, Delete02Icon, Cancel01Icon, DashboardBrowsingIcon, } from '@hugeicons/core-free-icons';
import { api } from '@/lib/api';
import { useAdminWorkspaces, useAdminStats } from '@/hooks/use-admin';
export function AdminWorkspacesPage() {
    const qc = useQueryClient();
    const { data: wsData, isLoading: wsLoading } = useAdminWorkspaces();
    const { data: statsData, isLoading: statsLoading } = useAdminStats();
    const [search, setSearch] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', slug: '', plan: 'free' });
    const workspaces = wsData?.workspaces ?? [];
    const stats = statsData?.stats;
    const filtered = search
        ? workspaces.filter((w) => w.name.toLowerCase().includes(search.toLowerCase()) ||
            w.slug.toLowerCase().includes(search.toLowerCase()))
        : workspaces;
    const avgControls = stats && stats.totalWorkspaces > 0
        ? Math.round(stats.totalControls / stats.totalWorkspaces)
        : 0;
    const createMut = useMutation({
        mutationFn: (data) => api.post('/admin/workspaces', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
            qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
            setShowCreate(false);
            setCreateForm({ name: '', slug: '', plan: 'free' });
        },
    });
    const deleteMut = useMutation({
        mutationFn: (id) => api.delete(`/admin/workspaces/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
            qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
            setExpandedId(null);
        },
    });
    const autoSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return (_jsxs("div", { className: "mx-auto w-full max-w-6xl space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-zinc-100", children: "Workspaces" }), _jsx("p", { className: "mt-1 text-sm text-zinc-500", children: "Manage all workspaces on the platform." })] }), _jsxs("button", { onClick: () => setShowCreate(!showCreate), className: "flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300", children: [_jsx(HugeiconsIcon, { icon: PlusSignIcon, size: 16 }), "Create Workspace"] })] }), _jsx("div", { className: "grid grid-cols-2 gap-4 lg:grid-cols-4", children: [
                    { label: 'Total Workspaces', value: stats?.totalWorkspaces ?? 0, icon: Building06Icon },
                    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: UserGroupIcon },
                    { label: 'Total Evidence', value: stats?.totalEvidence ?? 0, icon: FileValidationIcon },
                    { label: 'Avg Controls / Workspace', value: avgControls, icon: Shield01Icon },
                ].map((s) => (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-xs text-zinc-500", children: s.label }), _jsx(HugeiconsIcon, { icon: s.icon, size: 14, className: "text-zinc-600" })] }), _jsx("p", { className: "mt-1 text-xl font-bold text-zinc-100", children: statsLoading ? '...' : s.value })] }, s.label))) }), showCreate && (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsx("h3", { className: "mb-4 text-sm font-semibold text-zinc-100", children: "New Workspace" }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Name *" }), _jsx("input", { value: createForm.name, onChange: (e) => setCreateForm({ ...createForm, name: e.target.value, slug: autoSlug(e.target.value) }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "Acme Corp" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Slug *" }), _jsx("input", { value: createForm.slug, onChange: (e) => setCreateForm({ ...createForm, slug: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "acme-corp" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Plan" }), _jsxs("select", { value: createForm.plan, onChange: (e) => setCreateForm({ ...createForm, plan: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "free", children: "Free" }), _jsx("option", { value: "starter", children: "Starter" }), _jsx("option", { value: "pro", children: "Pro" }), _jsx("option", { value: "enterprise", children: "Enterprise" })] })] })] }), _jsxs("div", { className: "mt-4 flex justify-end gap-2", children: [_jsx("button", { onClick: () => setShowCreate(false), className: "rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600", children: "Cancel" }), _jsx("button", { onClick: () => createMut.mutate(createForm), disabled: !createForm.name.trim() || !createForm.slug.trim() || createMut.isPending, className: "rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50", children: createMut.isPending ? 'Creating...' : 'Create' })] })] })), _jsxs("div", { className: "relative", children: [_jsx(HugeiconsIcon, { icon: Search01Icon, size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" }), _jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search workspaces...", className: "w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-9 pr-4 text-sm text-zinc-200 outline-none focus:border-zinc-700" })] }), wsLoading ? (_jsx("div", { className: "flex h-40 items-center justify-center", children: _jsx("div", { className: "h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-primary-400" }) })) : (_jsx("div", { className: "overflow-hidden rounded-xl border border-zinc-800", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-zinc-800 bg-zinc-900/50", children: [_jsx("th", { className: "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500", children: "Name" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500", children: "Slug" }), _jsx("th", { className: "px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500", children: "Plan" }), _jsx("th", { className: "px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500", children: "Members" }), _jsx("th", { className: "px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500", children: "Frameworks" }), _jsx("th", { className: "px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500", children: "Evidence" }), _jsx("th", { className: "px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500", children: "Systems" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500", children: "Created" }), _jsx("th", { className: "w-16 px-2 py-3" })] }) }), _jsxs("tbody", { className: "divide-y divide-zinc-800/50", children: [filtered.map((w) => (_jsxs(_Fragment, { children: [_jsxs("tr", { className: `cursor-pointer bg-zinc-900 transition-colors hover:bg-zinc-800/30 ${expandedId === w.id ? 'bg-zinc-800/20' : ''}`, onClick: () => setExpandedId(expandedId === w.id ? null : w.id), children: [_jsx("td", { className: "px-4 py-3 text-sm font-medium text-zinc-200", children: w.name }), _jsx("td", { className: "px-4 py-3", children: _jsx("code", { className: "rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400", children: w.slug }) }), _jsx("td", { className: "px-4 py-3 text-center", children: _jsx("span", { className: `rounded-md px-2 py-0.5 text-xs font-medium ${w.plan === 'enterprise' ? 'bg-primary-400/10 text-primary-400' :
                                                            w.plan === 'pro' ? 'bg-blue-500/10 text-blue-400' :
                                                                w.plan === 'starter' ? 'bg-amber-500/10 text-amber-400' :
                                                                    'bg-zinc-800 text-zinc-400'}`, children: w.plan }) }), _jsx("td", { className: "px-4 py-3 text-center text-sm text-zinc-400", children: w.memberCount }), _jsx("td", { className: "px-4 py-3 text-center text-sm text-zinc-400", children: w.frameworkCount }), _jsx("td", { className: "px-4 py-3 text-center text-sm text-zinc-400", children: w.evidenceCount }), _jsx("td", { className: "px-4 py-3 text-center text-sm text-zinc-400", children: w.systemCount }), _jsx("td", { className: "px-4 py-3 text-xs text-zinc-500", children: new Date(w.createdAt).toLocaleDateString() }), _jsx("td", { className: "px-2 py-3", onClick: (e) => e.stopPropagation(), children: _jsx("button", { onClick: () => {
                                                            if (confirm(`Delete workspace "${w.name}"? This will delete ALL data including members, evidence, systems, and policies. This cannot be undone.`))
                                                                deleteMut.mutate(w.id);
                                                        }, className: "rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-red-400", title: "Delete workspace", children: _jsx(HugeiconsIcon, { icon: Delete02Icon, size: 14 }) }) })] }, w.id), expandedId === w.id && (_jsx("tr", { children: _jsx("td", { colSpan: 9, className: "bg-zinc-800/20 px-4 py-4", children: _jsx(WorkspaceDetailPanel, { workspaceId: w.id, workspaceName: w.name }) }) }, `${w.id}-detail`))] }))), filtered.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 9, className: "px-4 py-8 text-center text-sm text-zinc-500", children: search ? 'No workspaces match your search.' : 'No workspaces found.' }) }))] })] }) }))] }));
}
// ── Workspace Detail Panel ──────────────────────────────────────────────────
function WorkspaceDetailPanel({ workspaceId, workspaceName }) {
    const qc = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'workspace-detail', workspaceId],
        queryFn: () => api.get(`/admin/workspaces/${workspaceId}/detail`),
    });
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', slug: '', plan: '' });
    const [addMemberForm, setAddMemberForm] = useState({ email: '', role: 'member' });
    const [showAddMember, setShowAddMember] = useState(false);
    const updateMut = useMutation({
        mutationFn: (payload) => api.put(`/admin/workspaces/${workspaceId}`, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
            qc.invalidateQueries({ queryKey: ['admin', 'workspace-detail', workspaceId] });
            setEditing(false);
        },
    });
    const addMemberMut = useMutation({
        mutationFn: (payload) => api.post(`/admin/workspaces/${workspaceId}/members`, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin', 'workspace-detail', workspaceId] });
            qc.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
            setAddMemberForm({ email: '', role: 'member' });
            setShowAddMember(false);
        },
    });
    const changeRoleMut = useMutation({
        mutationFn: ({ userId, role }) => api.put(`/admin/workspaces/${workspaceId}/members/${userId}/role`, { role }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'workspace-detail', workspaceId] }),
    });
    const removeMemberMut = useMutation({
        mutationFn: (userId) => api.delete(`/admin/workspaces/${workspaceId}/members/${userId}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin', 'workspace-detail', workspaceId] });
            qc.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
        },
    });
    if (isLoading)
        return _jsx("div", { className: "py-4 text-center text-xs text-zinc-500", children: "Loading details..." });
    if (!data)
        return _jsx("div", { className: "py-4 text-center text-xs text-zinc-500", children: "Failed to load." });
    const { workspace: ws, members } = data;
    const startEdit = () => {
        setEditForm({ name: ws.name, slug: ws.slug, plan: ws.plan });
        setEditing(true);
    };
    const ROLE_COLORS = {
        owner: 'bg-primary-400/10 text-primary-400',
        admin: 'bg-blue-500/10 text-blue-400',
        auditor: 'bg-purple-500/10 text-purple-400',
        member: 'bg-zinc-500/10 text-zinc-300',
        viewer: 'bg-zinc-500/10 text-zinc-500',
    };
    return (_jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [_jsxs("div", { className: "rounded-lg border border-zinc-700/50 bg-zinc-900/50 p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("p", { className: "text-xs font-semibold text-zinc-300", children: "Workspace Details" }), !editing && (_jsxs("button", { onClick: startEdit, className: "flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200", children: [_jsx(HugeiconsIcon, { icon: Edit01Icon, size: 12 }), "Edit"] }))] }), editing ? (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-[10px] text-zinc-500", children: "Name" }), _jsx("input", { value: editForm.name, onChange: (e) => setEditForm({ ...editForm, name: e.target.value }), className: "w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-100 focus:border-primary-400 focus:outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-[10px] text-zinc-500", children: "Slug" }), _jsx("input", { value: editForm.slug, onChange: (e) => setEditForm({ ...editForm, slug: e.target.value }), className: "w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 font-mono text-xs text-zinc-100 focus:border-primary-400 focus:outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-[10px] text-zinc-500", children: "Plan" }), _jsxs("select", { value: editForm.plan, onChange: (e) => setEditForm({ ...editForm, plan: e.target.value }), className: "w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "free", children: "Free" }), _jsx("option", { value: "starter", children: "Starter" }), _jsx("option", { value: "pro", children: "Pro" }), _jsx("option", { value: "enterprise", children: "Enterprise" })] })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { onClick: () => setEditing(false), className: "rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:border-zinc-600", children: "Cancel" }), _jsx("button", { onClick: () => updateMut.mutate(editForm), disabled: updateMut.isPending, className: "rounded bg-primary-400 px-2.5 py-1 text-xs font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50", children: updateMut.isPending ? 'Saving...' : 'Save' })] })] })) : (_jsxs("div", { className: "space-y-2", children: [[
                                { label: 'ID', value: ws.id },
                                { label: 'Name', value: ws.name },
                                { label: 'Slug', value: ws.slug },
                                { label: 'Plan', value: ws.plan },
                                { label: 'Created', value: new Date(ws.createdAt).toLocaleString() },
                                { label: 'Updated', value: new Date(ws.updatedAt).toLocaleString() },
                            ].map((row) => (_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsx("span", { className: "text-zinc-500", children: row.label }), _jsx("span", { className: "text-zinc-300 font-mono", children: row.value })] }, row.label))), _jsx("div", { className: "pt-2 border-t border-zinc-800 grid grid-cols-4 gap-2", children: [
                                    { label: 'Members', value: ws.memberCount, icon: UserGroupIcon },
                                    { label: 'Frameworks', value: ws.frameworkCount, icon: Shield01Icon },
                                    { label: 'Evidence', value: ws.evidenceCount, icon: FileValidationIcon },
                                    { label: 'Systems', value: ws.systemCount, icon: DashboardBrowsingIcon },
                                ].map((s) => (_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-lg font-bold text-zinc-200", children: s.value }), _jsx("p", { className: "text-[10px] text-zinc-500", children: s.label })] }, s.label))) })] }))] }), _jsxs("div", { className: "rounded-lg border border-zinc-700/50 bg-zinc-900/50 p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("p", { className: "text-xs font-semibold text-zinc-300", children: ["Members (", members.length, ")"] }), _jsxs("button", { onClick: () => setShowAddMember(!showAddMember), className: "flex items-center gap-1 rounded bg-primary-400 px-2 py-1 text-[10px] font-medium text-zinc-950 hover:bg-primary-300", children: [_jsx(HugeiconsIcon, { icon: PlusSignIcon, size: 10 }), "Add Member"] })] }), showAddMember && (_jsxs("div", { className: "mb-3 flex items-end gap-2 rounded-lg border border-zinc-700 bg-zinc-800 p-2.5", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "mb-0.5 block text-[10px] text-zinc-500", children: "Email" }), _jsx("input", { value: addMemberForm.email, onChange: (e) => setAddMemberForm({ ...addMemberForm, email: e.target.value }), placeholder: "user@company.com", className: "w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 focus:border-primary-400 focus:outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-0.5 block text-[10px] text-zinc-500", children: "Role" }), _jsxs("select", { value: addMemberForm.role, onChange: (e) => setAddMemberForm({ ...addMemberForm, role: e.target.value }), className: "rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "owner", children: "Owner" }), _jsx("option", { value: "admin", children: "Admin" }), _jsx("option", { value: "auditor", children: "Auditor" }), _jsx("option", { value: "member", children: "Member" }), _jsx("option", { value: "viewer", children: "Viewer" })] })] }), _jsx("button", { onClick: () => addMemberMut.mutate(addMemberForm), disabled: !addMemberForm.email.trim() || addMemberMut.isPending, className: "rounded bg-primary-400 px-2.5 py-1 text-xs font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50", children: addMemberMut.isPending ? '...' : 'Add' }), _jsx("button", { onClick: () => setShowAddMember(false), className: "rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:border-zinc-600", children: _jsx(HugeiconsIcon, { icon: Cancel01Icon, size: 12 }) })] })), _jsx("div", { className: "max-h-[300px] overflow-y-auto space-y-1", children: members.length === 0 ? (_jsx("p", { className: "py-4 text-center text-xs text-zinc-500", children: "No members yet." })) : members.map((m) => (_jsxs("div", { className: "flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-800/30 px-3 py-2", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-xs font-medium text-zinc-200 truncate", children: m.name }), _jsx("p", { className: "text-[10px] text-zinc-500 truncate", children: m.email })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("select", { value: m.role, onChange: (e) => changeRoleMut.mutate({ userId: m.userId, role: e.target.value }), className: `rounded-full border-0 px-2 py-0.5 text-[10px] font-medium ${ROLE_COLORS[m.role] ?? 'bg-zinc-800 text-zinc-400'} cursor-pointer focus:outline-none`, children: [_jsx("option", { value: "owner", children: "Owner" }), _jsx("option", { value: "admin", children: "Admin" }), _jsx("option", { value: "auditor", children: "Auditor" }), _jsx("option", { value: "member", children: "Member" }), _jsx("option", { value: "viewer", children: "Viewer" })] }), _jsx("button", { onClick: () => { if (confirm(`Remove ${m.name} from this workspace?`))
                                                removeMemberMut.mutate(m.userId); }, className: "rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-red-400", title: "Remove member", children: _jsx(HugeiconsIcon, { icon: Delete02Icon, size: 12 }) })] })] }, m.userId))) })] })] }));
}
//# sourceMappingURL=workspaces.js.map