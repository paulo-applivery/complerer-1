import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from '@tanstack/react-router';
import { createPortal } from 'react-dom';
import { useBaselines, useCreateBaseline, useUpdateBaseline, useDeleteBaseline, useBaselineViolations, useResolveViolation, useExemptViolation, useBaselineLibrary, useAddFromBaselineLibrary, } from '@/hooks/use-settings';
import { useBaselineControls, useLinkBaselineControl, useUnlinkBaselineControl, } from '@/hooks/use-compliance';
import { useAdoptions } from '@/hooks/use-frameworks';
import { api } from '@/lib/api';
import { HugeiconsIcon } from '@hugeicons/react';
import { Shield01Icon, PlusSignIcon, Cancel01Icon, LoaderPinwheelIcon, CheckmarkCircle01Icon, Alert02Icon, ToggleOnIcon, ToggleOffIcon, Search01Icon, ClipboardIcon, Edit01Icon, Delete02Icon, } from '@hugeicons/core-free-icons';
export function BaselinesPage() {
    const params = useParams({ strict: false });
    const workspaceId = params.workspaceId;
    const [activeTab, setActiveTab] = useState('rules');
    const tabs = [
        { id: 'rules', label: 'Baseline Rules', icon: Shield01Icon },
        { id: 'violations', label: 'Violations', icon: Alert02Icon },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-zinc-100", children: "Baselines" }), _jsx("p", { className: "mt-1 text-sm text-zinc-400", children: "Define configuration baselines and track violations across your environment." })] }), _jsx("div", { className: "flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1", children: tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${isActive
                            ? 'bg-zinc-800 text-zinc-100'
                            : 'text-zinc-400 hover:text-zinc-300'}`, children: [_jsx(HugeiconsIcon, { icon: tab.icon, size: 16 }), tab.label] }, tab.id));
                }) }), activeTab === 'rules' && _jsx(BaselineRulesSection, { workspaceId: workspaceId }), activeTab === 'violations' && _jsx(ViolationsSection, { workspaceId: workspaceId })] }));
}
// ── Baseline Rules Section ──────────────────────────────────────────────────
function BaselineRulesSection({ workspaceId }) {
    const { baselines, isLoading } = useBaselines(workspaceId);
    const createMutation = useCreateBaseline(workspaceId);
    const updateMutation = useUpdateBaseline(workspaceId);
    const deleteMutation = useDeleteBaseline(workspaceId);
    const { library, isLoading: libLoading } = useBaselineLibrary(workspaceId);
    const addFromLibrary = useAddFromBaselineLibrary(workspaceId);
    const [mode, setMode] = useState('none');
    const [selectedLibIds, setSelectedLibIds] = useState(new Set());
    const [libSearch, setLibSearch] = useState('');
    const [libCategoryFilter, setLibCategoryFilter] = useState('');
    const [libResult, setLibResult] = useState(null);
    const [form, setForm] = useState({
        name: '',
        description: '',
        category: 'access',
        severity: 'medium',
        ruleConfig: '',
    });
    // Edit state
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', description: '', category: '', severity: '' });
    // Portal menu state
    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const menuRef = useRef(null);
    const closeMenu = useCallback(() => setOpenMenuId(null), []);
    const openMenu = useCallback((id, btn) => {
        if (openMenuId === id) {
            closeMenu();
            return;
        }
        const rect = btn.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 4, left: rect.right - 170 });
        setOpenMenuId(id);
    }, [openMenuId, closeMenu]);
    useEffect(() => {
        if (!openMenuId)
            return;
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target))
                closeMenu();
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [openMenuId, closeMenu]);
    const startEdit = (b) => {
        setEditingId(b.id);
        setEditForm({ name: b.name, description: b.description ?? '', category: b.category, severity: b.severity });
        setOpenMenuId(null);
    };
    const handleSaveEdit = () => {
        if (!editingId || !editForm.name.trim())
            return;
        updateMutation.mutate({ id: editingId, name: editForm.name, description: editForm.description || undefined, category: editForm.category, severity: editForm.severity }, { onSuccess: () => setEditingId(null) });
    };
    const handleDelete = (id) => {
        if (!confirm('Delete this baseline? This cannot be undone.'))
            return;
        deleteMutation.mutate(id);
        setOpenMenuId(null);
    };
    const existingNames = new Set(baselines.map((b) => b.name?.toLowerCase()));
    const BASELINE_CATEGORIES = {
        identity: { label: 'Identity & Access', color: 'bg-blue-500/10 text-blue-400' },
        data_protection: { label: 'Data Protection', color: 'bg-green-500/10 text-green-400' },
        network: { label: 'Network', color: 'bg-cyan-500/10 text-cyan-400' },
        endpoint: { label: 'Endpoint', color: 'bg-purple-500/10 text-purple-400' },
        logging: { label: 'Logging', color: 'bg-amber-500/10 text-amber-400' },
        application: { label: 'Application', color: 'bg-orange-500/10 text-orange-400' },
        continuity: { label: 'Continuity', color: 'bg-red-500/10 text-red-400' },
        governance: { label: 'Governance', color: 'bg-indigo-500/10 text-indigo-400' },
    };
    const libCategories = Array.from(new Set(library.map((b) => b.category)));
    const filteredLib = library.filter((b) => {
        const matchSearch = !libSearch || b.name.toLowerCase().includes(libSearch.toLowerCase()) || b.description?.toLowerCase().includes(libSearch.toLowerCase());
        const matchCat = !libCategoryFilter || b.category === libCategoryFilter;
        return matchSearch && matchCat;
    });
    const toggleLibSelect = (id) => {
        setSelectedLibIds(prev => {
            const next = new Set(prev);
            if (next.has(id))
                next.delete(id);
            else
                next.add(id);
            return next;
        });
    };
    const handleAddFromLibrary = () => {
        addFromLibrary.mutate({ libraryIds: Array.from(selectedLibIds) }, {
            onSuccess: (data) => {
                setLibResult({ created: data.created, skipped: data.skipped });
                setSelectedLibIds(new Set());
            }
        });
    };
    const handleSubmit = () => {
        if (!form.name.trim())
            return;
        createMutation.mutate({
            name: form.name,
            description: form.description || undefined,
            category: form.category,
            severity: form.severity,
            ruleConfig: form.ruleConfig || undefined,
        }, {
            onSuccess: () => {
                setForm({ name: '', description: '', category: 'access', severity: 'medium', ruleConfig: '' });
                setMode('none');
            },
        });
    };
    const handleToggle = (id, currentEnabled) => {
        updateMutation.mutate({ id, enabled: !currentEnabled });
    };
    const severityBadge = (severity) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-500/10 text-red-400';
            case 'high':
                return 'bg-amber-500/10 text-amber-400';
            case 'medium':
                return 'bg-yellow-500/10 text-yellow-400';
            case 'low':
                return 'bg-primary-400/10 text-primary-400';
            default:
                return 'bg-zinc-500/10 text-zinc-400';
        }
    };
    const categoryBadge = (category) => {
        switch (category) {
            case 'access':
                return 'bg-blue-500/10 text-blue-400';
            case 'review':
                return 'bg-purple-500/10 text-purple-400';
            case 'authentication':
                return 'bg-cyan-500/10 text-cyan-400';
            case 'change_management':
                return 'bg-orange-500/10 text-orange-400';
            default:
                return 'bg-zinc-500/10 text-zinc-400';
        }
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 20, className: "animate-spin text-zinc-500" }) }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold text-zinc-100", children: "Baseline Rules" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: () => setMode(mode === 'library' ? 'none' : 'library'), className: `flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${mode === 'library' ? 'border-primary-400/30 bg-primary-400/10 text-primary-400' : 'border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100'}`, children: [_jsx(HugeiconsIcon, { icon: ClipboardIcon, size: 16 }), "Browse Library"] }), _jsxs("button", { onClick: () => setMode(mode === 'manual' ? 'none' : 'manual'), className: "flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300", children: [mode === 'manual' ? _jsx(HugeiconsIcon, { icon: Cancel01Icon, size: 16 }) : _jsx(HugeiconsIcon, { icon: PlusSignIcon, size: 16 }), mode === 'manual' ? 'Cancel' : 'Add Custom'] })] })] }), mode === 'manual' && (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsx("h3", { className: "mb-4 text-sm font-semibold text-zinc-100", children: "New Baseline Rule" }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Name *" }), _jsx("input", { value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "e.g. MFA Required for Admin" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Category" }), _jsxs("select", { value: form.category, onChange: (e) => setForm({ ...form, category: e.target.value }), className: "w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "access", children: "Access" }), _jsx("option", { value: "review", children: "Review" }), _jsx("option", { value: "authentication", children: "Authentication" }), _jsx("option", { value: "change_management", children: "Change Management" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Severity" }), _jsxs("select", { value: form.severity, onChange: (e) => setForm({ ...form, severity: e.target.value }), className: "w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "critical", children: "Critical" }), _jsx("option", { value: "high", children: "High" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "low", children: "Low" })] })] }), _jsxs("div", { className: "sm:col-span-2 lg:col-span-3", children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Description" }), _jsx("input", { value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "Describe what this baseline rule checks..." })] }), _jsxs("div", { className: "sm:col-span-2 lg:col-span-3", children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Rule Configuration (JSON)" }), _jsx("textarea", { value: form.ruleConfig, onChange: (e) => setForm({ ...form, ruleConfig: e.target.value }), rows: 3, className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: '{"check": "mfa_enabled", "scope": "admin_roles"}' })] })] }), _jsx("div", { className: "mt-4 flex justify-end", children: _jsx("button", { onClick: handleSubmit, disabled: !form.name.trim() || createMutation.isPending, className: "rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50", children: createMutation.isPending ? 'Creating...' : 'Create Baseline' }) })] })), mode === 'library' && (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-zinc-100", children: "Baseline Library" }), _jsx("p", { className: "mt-0.5 text-xs text-zinc-500", children: "Select baselines to activate in your workspace" })] }), selectedLibIds.size > 0 && (_jsx("button", { onClick: handleAddFromLibrary, disabled: addFromLibrary.isPending, className: "rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50", children: addFromLibrary.isPending ? 'Activating...' : `Activate ${selectedLibIds.size} baseline${selectedLibIds.size !== 1 ? 's' : ''}` }))] }), libResult && (_jsx("div", { className: "mb-4 rounded-lg border border-primary-400/20 bg-primary-400/5 p-3", children: _jsxs("p", { className: "text-xs text-primary-400", children: ["Activated ", libResult.created, " baseline", libResult.created !== 1 ? 's' : '', libResult.skipped > 0 && ` (${libResult.skipped} already existed)`] }) })), _jsxs("div", { className: "mb-4 flex items-center gap-2", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(HugeiconsIcon, { icon: Search01Icon, size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" }), _jsx("input", { value: libSearch, onChange: (e) => setLibSearch(e.target.value), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "Search baselines..." })] }), _jsxs("div", { className: "flex flex-wrap gap-1", children: [_jsx("button", { onClick: () => setLibCategoryFilter(''), className: `rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${!libCategoryFilter ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`, children: "All" }), libCategories.map((cat) => {
                                        const info = BASELINE_CATEGORIES[cat] ?? { label: cat, color: 'bg-zinc-800 text-zinc-400' };
                                        return (_jsx("button", { onClick: () => setLibCategoryFilter(libCategoryFilter === cat ? '' : cat), className: `rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${libCategoryFilter === cat ? info.color : 'text-zinc-500 hover:text-zinc-300'}`, children: info.label }, cat));
                                    })] })] }), _jsx("div", { className: "grid gap-2 sm:grid-cols-2 max-h-[400px] overflow-y-auto pr-1", children: filteredLib.map((bl) => {
                            const added = existingNames.has(bl.name?.toLowerCase());
                            const selected = selectedLibIds.has(bl.id);
                            const sevColor = bl.severity === 'critical' ? 'text-red-400' : bl.severity === 'high' ? 'text-orange-400' : bl.severity === 'medium' ? 'text-amber-400' : 'text-zinc-400';
                            return (_jsxs("button", { onClick: () => !added && toggleLibSelect(bl.id), disabled: added, className: `rounded-lg border p-3 text-left transition-all ${added ? 'border-zinc-800 bg-zinc-800/30 opacity-40 cursor-not-allowed'
                                    : selected ? 'border-primary-400/50 bg-primary-400/5'
                                        : 'border-zinc-800 bg-zinc-800/40 hover:border-zinc-700'}`, children: [_jsxs("div", { className: "flex items-center justify-between gap-1", children: [_jsx("p", { className: "text-sm font-medium text-zinc-100 truncate", children: bl.name }), added && _jsx("span", { className: "shrink-0 text-[10px] text-zinc-500", children: "Active" }), selected && _jsx("span", { className: "shrink-0 text-[10px] text-primary-400", children: "\u2713" })] }), _jsx("p", { className: "mt-1 text-[11px] text-zinc-500 line-clamp-2", children: bl.description }), _jsxs("div", { className: "mt-2 flex items-center gap-2", children: [_jsx("span", { className: `text-[10px] font-medium ${sevColor}`, children: bl.severity }), _jsx("span", { className: "text-[10px] text-zinc-600", children: "\u00B7" }), _jsx("span", { className: "text-[10px] text-zinc-500", children: bl.check_type })] })] }, bl.id));
                        }) }), filteredLib.length === 0 && (_jsx("p", { className: "py-8 text-center text-xs text-zinc-500", children: "No baselines match your search." }))] })), _jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900", children: [baselines.length === 0 ? (_jsxs("div", { className: "py-16 text-center", children: [_jsx(HugeiconsIcon, { icon: Shield01Icon, size: 40, className: "mx-auto text-zinc-600" }), _jsx("p", { className: "mt-4 text-base font-medium text-zinc-300", children: "No baseline rules yet" }), _jsx("p", { className: "mt-1 text-sm text-zinc-500", children: "Start by browsing the library or creating custom baselines." }), _jsxs("div", { className: "mt-6 flex items-center justify-center gap-3", children: [_jsxs("button", { onClick: () => setMode('library'), className: "flex items-center gap-2 rounded-lg bg-primary-400 px-5 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300", children: [_jsx(HugeiconsIcon, { icon: ClipboardIcon, size: 16 }), "Browse Library"] }), _jsxs("button", { onClick: () => setMode('manual'), className: "flex items-center gap-2 rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100", children: [_jsx(HugeiconsIcon, { icon: PlusSignIcon, size: 16 }), "Add Custom Baseline"] })] })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-zinc-800 text-xs text-zinc-500", children: [_jsx("th", { className: "w-8 px-2 py-3" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Name" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Category" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Severity" }), _jsx("th", { className: "px-5 py-3 font-medium text-center", children: "Links" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Status" }), _jsx("th", { className: "w-10 px-2 py-3" })] }) }), _jsx("tbody", { className: "divide-y divide-zinc-800/50", children: baselines.map((baseline) => {
                                        const isEditing = editingId === baseline.id;
                                        return (_jsx(BaselineRow, { baseline: baseline, isEditing: isEditing, editForm: editForm, setEditForm: setEditForm, handleSaveEdit: handleSaveEdit, setEditingId: setEditingId, updateMutation: updateMutation, categoryBadge: categoryBadge, severityBadge: severityBadge, openMenu: openMenu, workspaceId: workspaceId }, baseline.id));
                                    }) })] }) })), openMenuId && createPortal(_jsx("div", { ref: menuRef, style: { position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999 }, className: "min-w-[170px] overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-2xl", children: (() => {
                            const bl = baselines.find(b => b.id === openMenuId);
                            if (!bl)
                                return null;
                            return (_jsxs(_Fragment, { children: [_jsxs("button", { onClick: () => startEdit(bl), className: "flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-300 transition-colors hover:bg-zinc-700/60", children: [_jsx(HugeiconsIcon, { icon: Edit01Icon, size: 14 }), " Edit"] }), _jsxs("button", { onClick: () => {
                                            updateMutation.mutate({ id: bl.id, enabled: !bl.enabled });
                                            setOpenMenuId(null);
                                        }, className: "flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-300 transition-colors hover:bg-zinc-700/60", children: [_jsx(HugeiconsIcon, { icon: bl.enabled ? ToggleOffIcon : ToggleOnIcon, size: 14 }), bl.enabled ? 'Disable' : 'Enable'] }), _jsx("div", { className: "my-1 border-t border-zinc-700/50" }), _jsxs("button", { onClick: () => handleDelete(bl.id), className: "flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 transition-colors hover:bg-zinc-700/60", children: [_jsx(HugeiconsIcon, { icon: Delete02Icon, size: 14 }), " Delete"] })] }));
                        })() }), document.body)] })] }));
}
// ── Baseline Row with expand/collapse for linked controls ─────────────────────
function BaselineRow({ baseline, isEditing, editForm, setEditForm, handleSaveEdit, setEditingId, updateMutation, categoryBadge, severityBadge, openMenu, workspaceId }) {
    const [expanded, setExpanded] = useState(false);
    const { controls: linkedControls, isLoading: linkedLoading } = useBaselineControls(expanded ? workspaceId : undefined, expanded ? baseline.id : undefined);
    const unlinkMut = useUnlinkBaselineControl(workspaceId);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const BASELINE_CATEGORIES = {
        identity: { label: 'Identity & Access', color: 'bg-blue-500/10 text-blue-400' },
        data_protection: { label: 'Data Protection', color: 'bg-green-500/10 text-green-400' },
        network: { label: 'Network', color: 'bg-cyan-500/10 text-cyan-400' },
        endpoint: { label: 'Endpoint', color: 'bg-purple-500/10 text-purple-400' },
        logging: { label: 'Logging', color: 'bg-amber-500/10 text-amber-400' },
        application: { label: 'Application', color: 'bg-orange-500/10 text-orange-400' },
        continuity: { label: 'Continuity', color: 'bg-red-500/10 text-red-400' },
        governance: { label: 'Governance', color: 'bg-indigo-500/10 text-indigo-400' },
    };
    if (isEditing) {
        return (_jsxs("tr", { className: "transition-colors hover:bg-zinc-800/30", children: [_jsx("td", { className: "px-2 py-2" }), _jsx("td", { className: "px-3 py-2", children: _jsxs("div", { className: "space-y-1", children: [_jsx("input", { value: editForm.name, onChange: (e) => setEditForm({ ...editForm, name: e.target.value }), className: "w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" }), _jsx("input", { value: editForm.description, onChange: (e) => setEditForm({ ...editForm, description: e.target.value }), placeholder: "Description...", className: "w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 focus:border-primary-400 focus:outline-none" })] }) }), _jsx("td", { className: "px-3 py-2", children: _jsx("select", { value: editForm.category, onChange: (e) => setEditForm({ ...editForm, category: e.target.value }), className: "rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100 focus:border-primary-400 focus:outline-none", children: Object.entries(BASELINE_CATEGORIES).map(([key, val]) => (_jsx("option", { value: key, children: val.label }, key))) }) }), _jsx("td", { className: "px-3 py-2", children: _jsxs("select", { value: editForm.severity, onChange: (e) => setEditForm({ ...editForm, severity: e.target.value }), className: "rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "critical", children: "Critical" }), _jsx("option", { value: "high", children: "High" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "low", children: "Low" })] }) }), _jsx("td", { className: "px-3 py-2" }), _jsx("td", { className: "px-3 py-2 text-xs text-zinc-500", children: baseline.enabled ? 'Enabled' : 'Disabled' }), _jsx("td", { className: "px-2 py-2", children: _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: handleSaveEdit, disabled: updateMutation.isPending, className: "rounded bg-primary-400 px-2 py-1 text-xs font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50", children: "Save" }), _jsx("button", { onClick: () => setEditingId(null), className: "rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:border-zinc-600", children: "Cancel" })] }) })] }));
    }
    return (_jsxs(_Fragment, { children: [_jsxs("tr", { className: "transition-colors hover:bg-zinc-800/30", children: [_jsx("td", { className: "px-2 py-3", children: _jsx("button", { onClick: () => setExpanded(!expanded), className: "inline-flex h-6 w-6 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300", children: _jsx("span", { className: `text-xs transition-transform ${expanded ? 'inline-block rotate-90' : ''}`, children: "\u25B6" }) }) }), _jsx("td", { className: "px-5 py-3", children: _jsxs("div", { children: [_jsxs("p", { className: "font-medium text-zinc-100", children: [baseline.name, baseline.templateId && (_jsx("span", { className: "ml-2 rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400", children: "Template" }))] }), baseline.description && (_jsx("p", { className: "mt-0.5 text-xs text-zinc-500", children: baseline.description }))] }) }), _jsx("td", { className: "px-5 py-3", children: _jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryBadge(baseline.category)}`, children: baseline.category.replace('_', ' ') }) }), _jsx("td", { className: "px-5 py-3", children: _jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${severityBadge(baseline.severity)}`, children: baseline.severity }) }), _jsx("td", { className: "px-5 py-3 text-center", children: expanded && linkedControls.length > 0 ? (_jsx("span", { className: "rounded-full bg-primary-400/10 px-2.5 py-0.5 text-xs font-medium text-primary-400", children: linkedControls.length })) : (_jsx("span", { className: "text-xs text-zinc-600", children: "\u2014" })) }), _jsx("td", { className: "px-5 py-3", children: _jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${baseline.enabled
                                ? 'bg-primary-400/10 text-primary-400'
                                : 'bg-zinc-500/10 text-zinc-400'}`, children: baseline.enabled ? 'Enabled' : 'Disabled' }) }), _jsx("td", { className: "relative px-2 py-3", children: _jsx("button", { onClick: (e) => openMenu(baseline.id, e.currentTarget), className: "inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200", title: "Actions", children: _jsx("span", { className: "text-base leading-none", children: "\u22EE" }) }) })] }), expanded && (_jsx("tr", { children: _jsxs("td", { colSpan: 7, className: "bg-zinc-800/20 px-5 py-4", children: [_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h4", { className: "text-xs font-semibold text-zinc-300", children: "Linked Controls" }), _jsxs("button", { onClick: () => setShowLinkDialog(true), className: "flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600", children: [_jsx(HugeiconsIcon, { icon: PlusSignIcon, size: 12 }), " Link Control"] })] }), linkedLoading ? (_jsx("div", { className: "py-4 text-center", children: _jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 16, className: "mx-auto animate-spin text-zinc-500" }) })) : linkedControls.length === 0 ? (_jsx("p", { className: "py-4 text-center text-xs text-zinc-500", children: "No controls linked yet. Link controls to map this baseline to framework requirements." })) : (_jsx("div", { className: "space-y-1", children: linkedControls.map((ctrl) => (_jsxs("div", { className: "flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("code", { className: "rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-primary-400", children: ctrl.controlCode }), _jsx("span", { className: "text-sm text-zinc-300", children: ctrl.title }), _jsxs("span", { className: "text-xs text-zinc-600", children: [ctrl.frameworkName, " v", ctrl.frameworkVersion] })] }), _jsx("button", { onClick: () => unlinkMut.mutate({ baselineId: baseline.id, linkId: ctrl.linkId }), disabled: unlinkMut.isPending, className: "rounded px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10", children: "Unlink" })] }, ctrl.linkId))) }))] }), showLinkDialog && (_jsx(LinkControlDialog, { workspaceId: workspaceId, baselineId: baseline.id, linkedControlIds: new Set(linkedControls.map((c) => c.controlId)), onClose: () => setShowLinkDialog(false) }))] }) }))] }));
}
// ── Link Control Dialog ──────────────────────────────────────────────────────
function LinkControlDialog({ workspaceId, baselineId, linkedControlIds, onClose }) {
    const { adoptions } = useAdoptions(workspaceId);
    const linkMut = useLinkBaselineControl(workspaceId);
    const [selectedFvId, setSelectedFvId] = useState('');
    const [controls, setControls] = useState([]);
    const [loadingControls, setLoadingControls] = useState(false);
    const [search, setSearch] = useState('');
    // Load controls when a framework version is selected
    useEffect(() => {
        if (!selectedFvId || !workspaceId) {
            setControls([]);
            return;
        }
        setLoadingControls(true);
        // Find adoption to get slug and version
        const adoption = adoptions.find((a) => a.frameworkVersionId === selectedFvId);
        if (!adoption) {
            setLoadingControls(false);
            return;
        }
        api.get(`/workspaces/${workspaceId}/frameworks/${adoption.frameworkSlug}/versions/${adoption.frameworkVersion}/controls?limit=500`)
            .then((data) => { setControls(data.controls ?? []); setLoadingControls(false); })
            .catch(() => { setControls([]); setLoadingControls(false); });
    }, [selectedFvId, workspaceId, adoptions]);
    const filtered = controls.filter((c) => {
        if (!search)
            return true;
        const q = search.toLowerCase();
        return c.controlId.toLowerCase().includes(q) || c.title.toLowerCase().includes(q);
    });
    return createPortal(_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm", onClick: onClose, children: _jsxs("div", { className: "w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold text-zinc-100", children: "Link Controls to Baseline" }), _jsx("button", { onClick: onClose, className: "rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300", children: _jsx(HugeiconsIcon, { icon: Cancel01Icon, size: 16 }) })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Framework" }), _jsxs("select", { value: selectedFvId, onChange: e => setSelectedFvId(e.target.value), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "", children: "Select a framework..." }), adoptions.map((a) => (_jsxs("option", { value: a.frameworkVersionId, children: [a.frameworkName, " v", a.frameworkVersion] }, a.frameworkVersionId)))] })] }), selectedFvId && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "relative mb-3", children: [_jsx(HugeiconsIcon, { icon: Search01Icon, size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" }), _jsx("input", { value: search, onChange: e => setSearch(e.target.value), placeholder: "Search controls...", className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none" })] }), _jsx("div", { className: "max-h-[360px] overflow-y-auto rounded-lg border border-zinc-800", children: loadingControls ? (_jsx("div", { className: "py-8 text-center", children: _jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 16, className: "mx-auto animate-spin text-zinc-500" }) })) : filtered.length === 0 ? (_jsx("p", { className: "py-8 text-center text-xs text-zinc-500", children: "No controls found." })) : (_jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-zinc-800 text-xs text-zinc-500", children: [_jsx("th", { className: "px-3 py-2 font-medium", children: "Control" }), _jsx("th", { className: "px-3 py-2 font-medium", children: "Title" }), _jsx("th", { className: "px-3 py-2 font-medium", children: "Domain" }), _jsx("th", { className: "w-20 px-3 py-2" })] }) }), _jsx("tbody", { className: "divide-y divide-zinc-800/50", children: filtered.map((ctrl) => {
                                            const isLinked = linkedControlIds.has(ctrl.id);
                                            return (_jsxs("tr", { className: "transition-colors hover:bg-zinc-800/30", children: [_jsx("td", { className: "px-3 py-2", children: _jsx("code", { className: "rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-primary-400", children: ctrl.controlId }) }), _jsx("td", { className: "px-3 py-2 text-xs text-zinc-300 max-w-[200px] truncate", children: ctrl.title }), _jsx("td", { className: "px-3 py-2 text-xs text-zinc-500", children: ctrl.domain ?? '\u2014' }), _jsx("td", { className: "px-3 py-2 text-right", children: isLinked ? (_jsx("span", { className: "rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400", children: "Linked" })) : (_jsx("button", { onClick: () => linkMut.mutate({ baselineId, controlId: ctrl.id }), disabled: linkMut.isPending, className: "rounded-lg bg-primary-400 px-3 py-1 text-xs font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50", children: "Link" })) })] }, ctrl.id));
                                        }) })] })) })] }))] }) }), document.body);
}
// ── Violations Section ──────────────────────────────────────────────────────
function ViolationsSection({ workspaceId }) {
    const [statusFilter, setStatusFilter] = useState('open');
    const { violations, isLoading } = useBaselineViolations(workspaceId, { status: statusFilter });
    const resolveMutation = useResolveViolation(workspaceId);
    const exemptMutation = useExemptViolation(workspaceId);
    const [actionId, setActionId] = useState(null);
    const [actionType, setActionType] = useState(null);
    const [reason, setReason] = useState('');
    const handleResolve = (violationId) => {
        resolveMutation.mutate({ violationId, reason: reason || undefined }, {
            onSuccess: () => {
                setActionId(null);
                setActionType(null);
                setReason('');
            },
        });
    };
    const handleExempt = (violationId) => {
        if (!reason.trim())
            return;
        exemptMutation.mutate({ violationId, reason }, {
            onSuccess: () => {
                setActionId(null);
                setActionType(null);
                setReason('');
            },
        });
    };
    const statusBadge = (status) => {
        switch (status) {
            case 'open':
                return 'bg-red-500/10 text-red-400';
            case 'resolved':
                return 'bg-primary-400/10 text-primary-400';
            case 'exempted':
                return 'bg-amber-500/10 text-amber-400';
            default:
                return 'bg-zinc-500/10 text-zinc-400';
        }
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 20, className: "animate-spin text-zinc-500" }) }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsx("h2", { className: "text-lg font-semibold text-zinc-100", children: "Violations" }) }), _jsx("div", { className: "flex items-center gap-3", children: _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-300 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "open", children: "Open" }), _jsx("option", { value: "resolved", children: "Resolved" }), _jsx("option", { value: "exempted", children: "Exempted" }), _jsx("option", { value: "", children: "All" })] }) }), _jsx("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900", children: violations.length === 0 ? (_jsxs("div", { className: "py-12 text-center", children: [_jsx(HugeiconsIcon, { icon: CheckmarkCircle01Icon, size: 32, className: "mx-auto text-zinc-600" }), _jsx("p", { className: "mt-3 text-sm text-zinc-400", children: "No violations found." })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-zinc-800 text-xs text-zinc-500", children: [_jsx("th", { className: "px-5 py-3 font-medium", children: "Baseline Name" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Entity Type" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Status" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Detected At" }), _jsx("th", { className: "px-5 py-3 font-medium text-right", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-zinc-800/50", children: violations.map((violation) => (_jsxs("tr", { children: [_jsx("td", { className: "px-5 py-3 font-medium text-zinc-100", children: violation.baselineName }), _jsx("td", { className: "px-5 py-3 text-zinc-400", children: violation.entityType }), _jsx("td", { className: "px-5 py-3", children: _jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(violation.status)}`, children: violation.status }) }), _jsx("td", { className: "px-5 py-3 text-zinc-400", children: new Date(violation.detectedAt).toLocaleDateString() }), _jsx("td", { className: "px-5 py-3 text-right", children: violation.status === 'open' && (_jsx(_Fragment, { children: actionId === violation.id ? (_jsxs("div", { className: "flex flex-col items-end gap-2", children: [_jsx("input", { value: reason, onChange: (e) => setReason(e.target.value), className: "w-64 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: actionType === 'exempt'
                                                                ? 'Reason (required)...'
                                                                : 'Reason (optional)...' }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => {
                                                                        if (actionType === 'resolve')
                                                                            handleResolve(violation.id);
                                                                        else
                                                                            handleExempt(violation.id);
                                                                    }, disabled: (actionType === 'exempt' && !reason.trim()) ||
                                                                        resolveMutation.isPending ||
                                                                        exemptMutation.isPending, className: "rounded-lg bg-primary-400 px-2.5 py-1 text-xs font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50", children: "Confirm" }), _jsx("button", { onClick: () => {
                                                                        setActionId(null);
                                                                        setActionType(null);
                                                                        setReason('');
                                                                    }, className: "rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-600", children: "Cancel" })] })] })) : (_jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsxs("button", { onClick: () => {
                                                                setActionId(violation.id);
                                                                setActionType('resolve');
                                                                setReason('');
                                                            }, className: "flex items-center gap-1 rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300", children: [_jsx(HugeiconsIcon, { icon: CheckmarkCircle01Icon, size: 14 }), "Resolve"] }), _jsxs("button", { onClick: () => {
                                                                setActionId(violation.id);
                                                                setActionType('exempt');
                                                                setReason('');
                                                            }, className: "flex items-center gap-1 rounded-lg border border-amber-500/20 px-2.5 py-1 text-xs text-amber-400 transition-colors hover:border-amber-500/40 hover:bg-amber-500/5", children: [_jsx(HugeiconsIcon, { icon: Shield01Icon, size: 14 }), "Exempt"] })] })) })) })] }, violation.id))) })] }) })) })] }));
}
//# sourceMappingURL=baselines.js.map