import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from '@tanstack/react-router';
import Papa from 'papaparse';
import { useSystemsList, useCreateSystem, useUpdateSystem, useSystemLibrary, useAddFromLibrary, useDirectoryUsers, useCreateDirectoryUser, useUpdateDirectoryUser, useDeleteDirectoryUser, useBulkImportDirectory, useEmployeeLibrary, useAccessRecords, useCreateAccess, useUpdateAccessRecord, useTransitionAccess, useCustomFieldDefinitions, useSaveCustomFieldValues, useWorkspaceSetting, } from '@/hooks/use-compliance';
import { CustomFieldsForm } from '@/components/ui/custom-fields-form';
import { HugeiconsIcon } from '@hugeicons/react';
import { DashboardBrowsingIcon, UserGroupIcon, Key01Icon, PlusSignIcon, Cancel01Icon, CheckmarkCircle01Icon, Search01Icon, ArrowLeft01Icon, ArrowRight01Icon, ArrowDown01Icon, ArrowUp01Icon, LoaderPinwheelIcon, ClipboardIcon, Upload04Icon, Edit01Icon, } from '@hugeicons/core-free-icons';
export function AccessRegisterPage() {
    const params = useParams({ strict: false });
    const workspaceId = params.workspaceId;
    const [activeTab, setActiveTab] = useState('access');
    const tabs = [
        { id: 'access', label: 'Access Records', icon: Key01Icon },
        { id: 'systems', label: 'Systems', icon: DashboardBrowsingIcon },
        { id: 'people', label: 'People', icon: UserGroupIcon },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-zinc-100", children: "Access Register" }), _jsx("p", { className: "mt-1 text-sm text-zinc-400", children: "Manage systems, people, and access grants across your organization." })] }), _jsx("div", { className: "flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1", children: tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${isActive
                            ? 'bg-zinc-800 text-zinc-100'
                            : 'text-zinc-400 hover:text-zinc-300'}`, children: [_jsx(HugeiconsIcon, { icon: tab.icon, size: 16 }), tab.label] }, tab.id));
                }) }), activeTab === 'systems' && _jsx(SystemsSection, { workspaceId: workspaceId }), activeTab === 'people' && _jsx(PeopleSection, { workspaceId: workspaceId }), activeTab === 'access' && _jsx(AccessSection, { workspaceId: workspaceId })] }));
}
// ── Systems Section ─────────────────────────────────────────────────────────
const LIBRARY_CATEGORIES = {
    identity: { label: 'Identity & Access', color: 'bg-blue-500/10 text-blue-400' },
    cloud: { label: 'Cloud', color: 'bg-purple-500/10 text-purple-400' },
    devops: { label: 'DevOps', color: 'bg-amber-500/10 text-amber-400' },
    communication: { label: 'Communication', color: 'bg-primary-400/10 text-primary-400' },
    project: { label: 'Project Mgmt', color: 'bg-cyan-500/10 text-cyan-400' },
    security: { label: 'Security', color: 'bg-red-500/10 text-red-400' },
    data: { label: 'Data & Analytics', color: 'bg-indigo-500/10 text-indigo-400' },
    crm: { label: 'CRM & Sales', color: 'bg-orange-500/10 text-orange-400' },
    hr: { label: 'HR & Finance', color: 'bg-pink-500/10 text-pink-400' },
};
function SystemsSection({ workspaceId }) {
    const { systems, isLoading } = useSystemsList(workspaceId);
    const createMutation = useCreateSystem(workspaceId);
    const saveCfMutation = useSaveCustomFieldValues(workspaceId);
    const { fields: customFields } = useCustomFieldDefinitions(workspaceId, 'system');
    // Library
    const { library, isLoading: libLoading } = useSystemLibrary(workspaceId);
    const addFromLibrary = useAddFromLibrary(workspaceId);
    const [mode, setMode] = useState('none');
    const [form, setForm] = useState({
        name: '',
        classification: 'standard',
        sensitivity: '',
        environment: '',
        mfaRequired: false,
        owner: '',
    });
    const [cfValues, setCfValues] = useState({});
    // Library picker state
    const [selectedLibIds, setSelectedLibIds] = useState(new Set());
    const [libCategoryFilter, setLibCategoryFilter] = useState('');
    const [libSearch, setLibSearch] = useState('');
    const [libResult, setLibResult] = useState(null);
    // Systems search/filter
    const [systemSearch, setSystemSearch] = useState('');
    const [systemClassFilter, setSystemClassFilter] = useState('');
    // Edit system modal
    const [editingSystem, setEditingSystem] = useState(null);
    const updateSystem = useUpdateSystem(workspaceId);
    // Environment options from workspace settings
    const { value: envSettingRaw } = useWorkspaceSetting(workspaceId, 'system_environments');
    const envOptions = envSettingRaw
        ? (() => { try {
            return JSON.parse(envSettingRaw);
        }
        catch {
            return [];
        } })()
        : ['Production', 'Staging', 'Development', 'Testing'];
    const existingNames = new Set(systems.map((s) => s.name.toLowerCase()));
    const libCategories = Array.from(new Set(library.map((s) => s.category)));
    const filteredLib = library.filter((s) => {
        if (libCategoryFilter && s.category !== libCategoryFilter)
            return false;
        if (libSearch) {
            const q = libSearch.toLowerCase();
            return s.name.toLowerCase().includes(q) || (s.vendor ?? '').toLowerCase().includes(q);
        }
        return true;
    });
    const handleSubmit = () => {
        if (!form.name.trim())
            return;
        createMutation.mutate({
            name: form.name,
            classification: form.classification,
            sensitivity: form.sensitivity || undefined,
            environment: form.environment || undefined,
            mfaRequired: form.mfaRequired,
            owner: form.owner || undefined,
        }, {
            onSuccess: (data) => {
                const systemId = data?.system?.id;
                if (systemId && Object.keys(cfValues).length > 0) {
                    saveCfMutation.mutate({ entityType: 'system', entityId: systemId, values: cfValues });
                }
                setForm({ name: '', classification: 'standard', sensitivity: '', environment: '', mfaRequired: false, owner: '' });
                setCfValues({});
                setMode('none');
            },
        });
    };
    const handleAddFromLibrary = () => {
        if (selectedLibIds.size === 0)
            return;
        addFromLibrary.mutate({ libraryIds: Array.from(selectedLibIds) }, {
            onSuccess: (data) => {
                setLibResult({ created: data.created, skipped: data.skipped });
                setSelectedLibIds(new Set());
                setLibSearch('');
                setLibCategoryFilter('');
                setTimeout(() => setMode('none'), 2000);
            },
        });
    };
    const toggleLibSelect = (id) => {
        const next = new Set(selectedLibIds);
        if (next.has(id))
            next.delete(id);
        else
            next.add(id);
        setSelectedLibIds(next);
    };
    const classificationBadge = (c) => {
        switch (c) {
            case 'critical':
                return 'bg-red-500/10 text-red-400';
            case 'standard':
                return 'bg-amber-500/10 text-amber-400';
            case 'low':
                return 'bg-primary-400/10 text-primary-400';
            default:
                return 'bg-zinc-500/10 text-zinc-400';
        }
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 20, className: "animate-spin text-zinc-500" }) }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold text-zinc-100", children: "Systems" }), mode === 'none' ? (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: () => setMode('library'), className: "flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100", children: [_jsx(HugeiconsIcon, { icon: ClipboardIcon, size: 16 }), "Add from Library"] }), _jsxs("button", { onClick: () => setMode('manual'), className: "flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300", children: [_jsx(HugeiconsIcon, { icon: PlusSignIcon, size: 16 }), "Add Custom"] })] })) : (_jsxs("button", { onClick: () => { setMode('none'); setSelectedLibIds(new Set()); setLibResult(null); }, className: "flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200", children: [_jsx(HugeiconsIcon, { icon: Cancel01Icon, size: 16 }), "Cancel"] }))] }), mode === 'manual' && (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsx("h3", { className: "mb-4 text-sm font-semibold text-zinc-100", children: "New Custom System" }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Name *" }), _jsx("input", { value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "e.g. Production Database" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Classification" }), _jsxs("select", { value: form.classification, onChange: (e) => setForm({ ...form, classification: e.target.value }), className: "w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "critical", children: "Critical" }), _jsx("option", { value: "standard", children: "Standard" }), _jsx("option", { value: "low", children: "Low" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Sensitivity" }), _jsx("input", { value: form.sensitivity, onChange: (e) => setForm({ ...form, sensitivity: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "e.g. PII, Financial" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Environment" }), _jsxs("select", { value: form.environment, onChange: (e) => setForm({ ...form, environment: e.target.value }), className: "w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "", children: "Select environment..." }), envOptions.map((env) => (_jsx("option", { value: env, children: env }, env)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Owner" }), _jsx("input", { value: form.owner, onChange: (e) => setForm({ ...form, owner: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "e.g. Security Team" })] }), _jsx("div", { className: "flex items-end gap-3", children: _jsxs("label", { className: "flex items-center gap-2 text-sm text-zinc-300", children: [_jsx("input", { type: "checkbox", checked: form.mfaRequired, onChange: (e) => setForm({ ...form, mfaRequired: e.target.checked }), className: "rounded border-zinc-600 bg-zinc-800 text-primary-400 focus:ring-primary-400" }), "MFA Required"] }) }), _jsx(CustomFieldsForm, { workspaceId: workspaceId, entityType: "system", values: cfValues, onChange: setCfValues })] }), _jsx("div", { className: "mt-4 flex justify-end", children: _jsx("button", { onClick: handleSubmit, disabled: !form.name.trim() || createMutation.isPending, className: "rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50", children: createMutation.isPending ? 'Creating...' : 'Create System' }) })] })), mode === 'library' && (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-zinc-100", children: "Add from Library" }), _jsx("p", { className: "mt-0.5 text-xs text-zinc-500", children: "Select tools your organization uses" })] }), selectedLibIds.size > 0 && (_jsx("button", { onClick: handleAddFromLibrary, disabled: addFromLibrary.isPending, className: "rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50", children: addFromLibrary.isPending ? 'Adding...' : `Add ${selectedLibIds.size} system${selectedLibIds.size !== 1 ? 's' : ''}` }))] }), libResult && (_jsx("div", { className: "mb-4 rounded-lg border border-primary-400/20 bg-primary-400/5 p-3", children: _jsxs("p", { className: "text-xs text-primary-400", children: ["Added ", libResult.created, " system", libResult.created !== 1 ? 's' : '', libResult.skipped > 0 && ` (${libResult.skipped} already existed)`] }) })), _jsxs("div", { className: "mb-4 flex items-center gap-2", children: [_jsx("input", { value: libSearch, onChange: (e) => setLibSearch(e.target.value), className: "flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "Search tools..." }), _jsxs("div", { className: "flex flex-wrap gap-1", children: [_jsx("button", { onClick: () => setLibCategoryFilter(''), className: `rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${!libCategoryFilter ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`, children: "All" }), libCategories.map((cat) => {
                                        const info = LIBRARY_CATEGORIES[cat] ?? { label: cat, color: 'bg-zinc-800 text-zinc-400' };
                                        return (_jsx("button", { onClick: () => setLibCategoryFilter(libCategoryFilter === cat ? '' : cat), className: `rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${libCategoryFilter === cat ? info.color : 'text-zinc-500 hover:text-zinc-300'}`, children: info.label }, cat));
                                    })] })] }), _jsx("div", { className: "grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-h-[400px] overflow-y-auto pr-1", children: filteredLib.map((sys) => {
                            const added = existingNames.has(sys.name.toLowerCase());
                            const selected = selectedLibIds.has(sys.id);
                            return (_jsxs("button", { onClick: () => !added && toggleLibSelect(sys.id), disabled: added, className: `rounded-lg border p-3 text-left transition-all ${added
                                    ? 'border-zinc-800 bg-zinc-800/30 opacity-40 cursor-not-allowed'
                                    : selected
                                        ? 'border-primary-400/50 bg-primary-400/5'
                                        : 'border-zinc-800 bg-zinc-800/40 hover:border-zinc-700'}`, children: [_jsxs("div", { className: "flex items-center justify-between gap-1", children: [_jsx("p", { className: "text-sm font-medium text-zinc-100 truncate", children: sys.name }), added && _jsx("span", { className: "shrink-0 text-[10px] text-zinc-500", children: "Added" }), selected && _jsx("span", { className: "shrink-0 text-[10px] text-primary-400", children: "\u2713" })] }), _jsxs("p", { className: "text-[11px] text-zinc-500 truncate", children: [sys.vendor, sys.description ? ` · ${sys.description}` : ''] })] }, sys.id));
                        }) }), filteredLib.length === 0 && (_jsx("p", { className: "py-8 text-center text-xs text-zinc-500", children: "No tools match your search." }))] })), systems.length > 0 && (_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(HugeiconsIcon, { icon: Search01Icon, size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" }), _jsx("input", { value: systemSearch, onChange: (e) => setSystemSearch(e.target.value), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "Search systems..." })] }), _jsxs("select", { value: systemClassFilter, onChange: (e) => setSystemClassFilter(e.target.value), className: "appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-300 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "", children: "All classifications" }), _jsx("option", { value: "critical", children: "Critical" }), _jsx("option", { value: "standard", children: "Standard" }), _jsx("option", { value: "low", children: "Low" })] })] })), _jsx("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900", children: systems.length === 0 ? (_jsxs("div", { className: "py-16 text-center", children: [_jsx(HugeiconsIcon, { icon: DashboardBrowsingIcon, size: 40, className: "mx-auto text-zinc-600" }), _jsx("p", { className: "mt-4 text-base font-medium text-zinc-300", children: "No systems registered yet" }), _jsx("p", { className: "mt-1 text-sm text-zinc-500", children: "Start by adding the tools your organization uses." }), _jsxs("div", { className: "mt-6 flex items-center justify-center gap-3", children: [_jsxs("button", { onClick: () => setMode('library'), className: "flex items-center gap-2 rounded-lg bg-primary-400 px-5 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300", children: [_jsx(HugeiconsIcon, { icon: ClipboardIcon, size: 16 }), "Browse Library"] }), _jsxs("button", { onClick: () => setMode('manual'), className: "flex items-center gap-2 rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100", children: [_jsx(HugeiconsIcon, { icon: PlusSignIcon, size: 16 }), "Add Custom System"] })] })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-zinc-800 text-xs text-zinc-500", children: [_jsx("th", { className: "px-5 py-3 font-medium", children: "Name" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Classification" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Sensitivity" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Environment" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "MFA" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Owner" }), _jsx("th", { className: "w-16 px-3 py-3" })] }) }), _jsx("tbody", { className: "divide-y divide-zinc-800/50", children: systems
                                    .filter((s) => {
                                    if (systemSearch && !s.name.toLowerCase().includes(systemSearch.toLowerCase()))
                                        return false;
                                    if (systemClassFilter && s.classification !== systemClassFilter)
                                        return false;
                                    return true;
                                })
                                    .map((system) => (_jsxs("tr", { className: "transition-colors hover:bg-zinc-800/30", children: [_jsxs("td", { className: "px-5 py-3", children: [_jsx("span", { className: "font-medium text-zinc-100", children: system.name }), system.templateId && (_jsx("span", { className: "ml-2 rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400", children: "Library" }))] }), _jsx("td", { className: "px-5 py-3", children: _jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${classificationBadge(system.classification)}`, children: system.classification }) }), _jsx("td", { className: "px-5 py-3 text-zinc-400", children: system.sensitivity ?? '—' }), _jsx("td", { className: "px-5 py-3 text-zinc-400", children: system.environment ?? '—' }), _jsx("td", { className: "px-5 py-3", children: system.mfaRequired ? (_jsx(HugeiconsIcon, { icon: CheckmarkCircle01Icon, size: 16, className: "text-primary-400" })) : (_jsx(HugeiconsIcon, { icon: Cancel01Icon, size: 16, className: "text-zinc-600" })) }), _jsx("td", { className: "px-5 py-3 text-zinc-400", children: system.owner ?? '—' }), _jsx("td", { className: "px-3 py-3", children: _jsx("button", { onClick: () => setEditingSystem(system), className: "rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300", children: _jsx(HugeiconsIcon, { icon: Edit01Icon, size: 14 }) }) })] }, system.id))) })] }) })) }), editingSystem && (_jsx(EditSystemModal, { system: editingSystem, envOptions: envOptions, onClose: () => setEditingSystem(null), onSave: (data) => {
                    updateSystem.mutate({ systemId: editingSystem.id, ...data }, { onSuccess: () => setEditingSystem(null) });
                }, isPending: updateSystem.isPending }))] }));
}
function EditSystemModal({ system, envOptions, onClose, onSave, isPending }) {
    const [form, setForm] = useState({
        name: system.name ?? '',
        classification: system.classification ?? 'standard',
        sensitivity: system.sensitivity ?? '',
        environment: system.environment ?? '',
        mfaRequired: system.mfaRequired ?? false,
        owner: system.owner ?? '',
    });
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm", onClick: onClose, children: _jsxs("div", { className: "w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "mb-5 flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold text-zinc-100", children: "Edit System" }), _jsx("button", { onClick: onClose, className: "text-zinc-500 hover:text-zinc-300", children: _jsx(HugeiconsIcon, { icon: Cancel01Icon, size: 18 }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Name" }), _jsx("input", { value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Classification" }), _jsxs("select", { value: form.classification, onChange: (e) => setForm({ ...form, classification: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "critical", children: "Critical" }), _jsx("option", { value: "standard", children: "Standard" }), _jsx("option", { value: "low", children: "Low" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Sensitivity" }), _jsxs("select", { value: form.sensitivity, onChange: (e) => setForm({ ...form, sensitivity: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "", children: "None" }), _jsx("option", { value: "high", children: "High" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "low", children: "Low" })] })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Environment" }), _jsxs("select", { value: form.environment, onChange: (e) => setForm({ ...form, environment: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "", children: "Select..." }), envOptions.map((e) => _jsx("option", { value: e, children: e }, e))] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Owner" }), _jsx("input", { value: form.owner, onChange: (e) => setForm({ ...form, owner: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "Owner email" })] })] }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-zinc-300", children: [_jsx("input", { type: "checkbox", checked: form.mfaRequired, onChange: (e) => setForm({ ...form, mfaRequired: e.target.checked }), className: "rounded border-zinc-600" }), "MFA Required"] })] }), _jsxs("div", { className: "mt-6 flex justify-end gap-2", children: [_jsx("button", { onClick: onClose, className: "rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600", children: "Cancel" }), _jsx("button", { onClick: () => onSave(form), disabled: isPending, className: "rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50", children: isPending ? 'Saving...' : 'Save' })] })] }) }));
}
function SearchableInput({ value, onChange, options, placeholder }) {
    const [open, setOpen] = useState(false);
    const filtered = options.filter(o => o.toLowerCase().includes(value.toLowerCase()));
    return (_jsxs("div", { className: "relative", children: [_jsx("input", { value: value, onChange: (e) => { onChange(e.target.value); setOpen(true); }, onFocus: () => setOpen(true), onBlur: () => setTimeout(() => setOpen(false), 150), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: placeholder }), open && filtered.length > 0 && (_jsx("div", { className: "absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-xl", children: filtered.map((opt) => (_jsx("button", { type: "button", onMouseDown: (e) => e.preventDefault(), onClick: () => { onChange(opt); setOpen(false); }, className: "w-full px-3 py-1.5 text-left text-sm text-zinc-300 hover:bg-zinc-700", children: opt }, opt))) }))] }));
}
function PeopleSection({ workspaceId }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const { users, isLoading } = useDirectoryUsers(workspaceId, {
        search,
        status: statusFilter === 'all' ? '' : statusFilter,
    });
    const createMutation = useCreateDirectoryUser(workspaceId);
    const updateMutation = useUpdateDirectoryUser(workspaceId);
    const deleteMutation = useDeleteDirectoryUser(workspaceId);
    const bulkMutation = useBulkImportDirectory(workspaceId);
    const saveCfMutation = useSaveCustomFieldValues(workspaceId);
    const { fields: customFields } = useCustomFieldDefinitions(workspaceId, 'person');
    const fileInputRef = useRef(null);
    const { library: empLibrary } = useEmployeeLibrary(workspaceId);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', department: '', title: '' });
    const [cfValues, setCfValues] = useState({});
    // Edit state
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', department: '', title: '' });
    // Portal menu state
    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const peopleMenuRef = useRef(null);
    const closeMenu = useCallback(() => setOpenMenuId(null), []);
    const openMenu = useCallback((userId, btnEl) => {
        if (openMenuId === userId) {
            closeMenu();
            return;
        }
        const rect = btnEl.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 4, left: rect.right - 170 });
        setOpenMenuId(userId);
    }, [openMenuId, closeMenu]);
    useEffect(() => {
        if (!openMenuId)
            return;
        const handleClickOutside = (e) => {
            if (peopleMenuRef.current && !peopleMenuRef.current.contains(e.target)) {
                closeMenu();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId, closeMenu]);
    // CSV import state
    const [csvPreview, setCsvPreview] = useState(null);
    const [importResult, setImportResult] = useState(null);
    // Derive department/title suggestions from employee library
    const departments = Array.from(new Set(empLibrary.map((e) => e.department).filter(Boolean)));
    const titlesForDept = form.department
        ? Array.from(new Set(empLibrary.filter((e) => e.department === form.department).map((e) => e.title).filter(Boolean)))
        : Array.from(new Set(empLibrary.map((e) => e.title).filter(Boolean)));
    const editTitlesForDept = editForm.department
        ? Array.from(new Set(empLibrary.filter((e) => e.department === editForm.department).map((e) => e.title).filter(Boolean)))
        : Array.from(new Set(empLibrary.map((e) => e.title).filter(Boolean)));
    const startEdit = (user) => {
        setEditingId(user.id);
        setEditForm({ name: user.name, email: user.email, department: user.department ?? '', title: user.title ?? '' });
        setOpenMenuId(null);
    };
    const handleSaveEdit = () => {
        if (!editingId || !editForm.name.trim() || !editForm.email.trim())
            return;
        updateMutation.mutate({ userId: editingId, name: editForm.name, email: editForm.email, department: editForm.department || undefined, title: editForm.title || undefined }, { onSuccess: () => setEditingId(null) });
    };
    const handleStatusChange = (userId, newStatus) => {
        updateMutation.mutate({ userId, employmentStatus: newStatus });
        setOpenMenuId(null);
    };
    const handleDelete = (userId) => {
        if (!confirm('Delete this person? This cannot be undone.'))
            return;
        deleteMutation.mutate(userId);
        setOpenMenuId(null);
    };
    // Status config
    const STATUS_CONFIG = {
        active: { label: 'Active', badge: 'bg-green-500/10 text-green-400' },
        inactive: { label: 'Inactive', badge: 'bg-zinc-500/10 text-zinc-400' },
        on_leave: { label: 'On Leave', badge: 'bg-amber-500/10 text-amber-400' },
        terminated: { label: 'Terminated', badge: 'bg-red-500/10 text-red-400' },
    };
    const STATUS_TABS = [
        { key: 'all', label: 'All' },
        { key: 'active', label: 'Active' },
        { key: 'inactive', label: 'Inactive' },
        { key: 'on_leave', label: 'On Leave' },
        { key: 'terminated', label: 'Terminated' },
    ];
    const handleSubmit = () => {
        if (!form.name.trim() || !form.email.trim())
            return;
        createMutation.mutate({
            name: form.name,
            email: form.email,
            department: form.department || undefined,
            title: form.title || undefined,
        }, {
            onSuccess: (data) => {
                const userId = data?.user?.id;
                if (userId && Object.keys(cfValues).length > 0) {
                    saveCfMutation.mutate({ entityType: 'person', entityId: userId, values: cfValues });
                }
                setForm({ name: '', email: '', department: '', title: '' });
                setCfValues({});
                setShowForm(false);
            },
        });
    };
    const knownColumns = new Set(['name', 'email', 'department', 'title', 'status']);
    const customFieldNameToId = new Map(customFields.map((f) => [f.fieldName, f.id]));
    const handleCsvFile = (file) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
                const rows = [];
                const errors = [];
                const customFieldColumns = [];
                // Detect custom field columns from headers
                const headers = result.meta.fields ?? [];
                for (const h of headers) {
                    if (!knownColumns.has(h.toLowerCase()) && customFieldNameToId.has(h)) {
                        customFieldColumns.push(h);
                    }
                }
                for (let i = 0; i < result.data.length; i++) {
                    const raw = result.data[i];
                    const name = raw.name?.trim() || raw.Name?.trim() || '';
                    const email = raw.email?.trim() || raw.Email?.trim() || '';
                    if (!name || !email) {
                        errors.push({ row: i + 1, reason: `Missing ${!name ? 'name' : 'email'}` });
                        continue;
                    }
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                        errors.push({ row: i + 1, reason: 'Invalid email format' });
                        continue;
                    }
                    const cfMap = {};
                    for (const col of customFieldColumns) {
                        if (raw[col]?.trim()) {
                            cfMap[col] = raw[col].trim();
                        }
                    }
                    rows.push({
                        name,
                        email,
                        department: raw.department?.trim() || raw.Department?.trim() || undefined,
                        title: raw.title?.trim() || raw.Title?.trim() || undefined,
                        status: raw.status?.trim() || raw.Status?.trim() || undefined,
                        customFields: Object.keys(cfMap).length > 0 ? cfMap : undefined,
                    });
                }
                setCsvPreview({ rows, errors, customFieldColumns, totalRows: result.data.length });
                setImportResult(null);
            },
        });
    };
    const handleImport = () => {
        if (!csvPreview)
            return;
        // Map custom field names to IDs for the API
        const usersPayload = csvPreview.rows.map((row) => {
            const cf = {};
            if (row.customFields) {
                for (const [fieldName, value] of Object.entries(row.customFields)) {
                    const fieldId = customFieldNameToId.get(fieldName);
                    if (fieldId)
                        cf[fieldId] = value;
                }
            }
            return {
                name: row.name,
                email: row.email,
                department: row.department,
                title: row.title,
                employmentStatus: row.status,
                customFields: Object.keys(cf).length > 0 ? cf : undefined,
            };
        });
        bulkMutation.mutate({ users: usersPayload }, {
            onSuccess: (data) => {
                setImportResult({ created: data.created, skipped: data.skipped, errors: data.errors ?? [] });
                setCsvPreview(null);
            },
        });
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 20, className: "animate-spin text-zinc-500" }) }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold text-zinc-100", children: "People" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { ref: fileInputRef, type: "file", accept: ".csv", className: "hidden", onChange: (e) => {
                                    const file = e.target.files?.[0];
                                    if (file)
                                        handleCsvFile(file);
                                    e.target.value = '';
                                } }), _jsxs("button", { onClick: () => fileInputRef.current?.click(), className: "flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100", children: [_jsx(HugeiconsIcon, { icon: Upload04Icon, size: 16 }), "Import CSV"] }), _jsxs("button", { onClick: () => setShowForm(!showForm), className: "flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300", children: [showForm ? _jsx(HugeiconsIcon, { icon: Cancel01Icon, size: 16 }) : _jsx(HugeiconsIcon, { icon: PlusSignIcon, size: 16 }), showForm ? 'Cancel' : 'Add Person'] })] })] }), showForm && (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsx("h3", { className: "mb-4 text-sm font-semibold text-zinc-100", children: "New Person" }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Name *" }), _jsx("input", { value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "John Smith" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Email *" }), _jsx("input", { value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "john@company.com" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Department" }), _jsx(SearchableInput, { value: form.department, onChange: (v) => setForm({ ...form, department: v }), options: departments, placeholder: "e.g. Engineering" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Title / Role" }), _jsx(SearchableInput, { value: form.title, onChange: (v) => setForm({ ...form, title: v }), options: titlesForDept, placeholder: "e.g. Software Engineer" })] }), _jsx(CustomFieldsForm, { workspaceId: workspaceId, entityType: "person", values: cfValues, onChange: setCfValues })] }), _jsx("div", { className: "mt-4 flex justify-end", children: _jsx("button", { onClick: handleSubmit, disabled: !form.name.trim() || !form.email.trim() || createMutation.isPending, className: "rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50", children: createMutation.isPending ? 'Creating...' : 'Add Person' }) })] })), csvPreview && (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-semibold text-zinc-100", children: "CSV Import Preview" }), _jsx("button", { onClick: () => setCsvPreview(null), className: "text-xs text-zinc-500 hover:text-zinc-300", children: _jsx(HugeiconsIcon, { icon: Cancel01Icon, size: 16 }) })] }), _jsxs("div", { className: "mb-4 flex gap-4 text-xs", children: [_jsxs("span", { className: "text-primary-400", children: [csvPreview.rows.length, " valid rows"] }), csvPreview.errors.length > 0 && (_jsxs("span", { className: "text-red-400", children: [csvPreview.errors.length, " errors"] })), csvPreview.customFieldColumns.length > 0 && (_jsxs("span", { className: "text-amber-400", children: ["Custom fields: ", csvPreview.customFieldColumns.join(', ')] }))] }), _jsx("div", { className: "mb-4 max-h-60 overflow-auto rounded-lg border border-zinc-800", children: _jsxs("table", { className: "w-full text-left text-xs", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-zinc-800 text-zinc-500", children: [_jsx("th", { className: "px-3 py-2", children: "Name" }), _jsx("th", { className: "px-3 py-2", children: "Email" }), _jsx("th", { className: "px-3 py-2", children: "Department" }), _jsx("th", { className: "px-3 py-2", children: "Title" })] }) }), _jsx("tbody", { className: "divide-y divide-zinc-800/50", children: csvPreview.rows.slice(0, 10).map((row, i) => (_jsxs("tr", { className: "text-zinc-300", children: [_jsx("td", { className: "px-3 py-2", children: row.name }), _jsx("td", { className: "px-3 py-2", children: row.email }), _jsx("td", { className: "px-3 py-2 text-zinc-500", children: row.department ?? '—' }), _jsx("td", { className: "px-3 py-2 text-zinc-500", children: row.title ?? '—' })] }, i))) })] }) }), csvPreview.errors.length > 0 && (_jsxs("div", { className: "mb-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3", children: [_jsx("p", { className: "mb-1 text-xs font-medium text-red-400", children: "Errors (will be skipped):" }), csvPreview.errors.slice(0, 5).map((err, i) => (_jsxs("p", { className: "text-xs text-red-300/70", children: ["Row ", err.row, ": ", err.reason] }, i))), csvPreview.errors.length > 5 && (_jsxs("p", { className: "text-xs text-red-300/50", children: ["...and ", csvPreview.errors.length - 5, " more"] }))] })), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { onClick: () => setCsvPreview(null), className: "rounded-lg border border-zinc-700 px-4 py-2 text-xs text-zinc-400 hover:border-zinc-600", children: "Cancel" }), _jsx("button", { onClick: handleImport, disabled: csvPreview.rows.length === 0 || bulkMutation.isPending, className: "rounded-lg bg-primary-400 px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50", children: bulkMutation.isPending ? 'Importing...' : `Import ${csvPreview.rows.length} people` })] })] })), importResult && (_jsxs("div", { className: "rounded-xl border border-primary-400/20 bg-primary-400/5 p-4", children: [_jsxs("p", { className: "text-sm text-primary-400", children: ["Import complete: ", importResult.created, " created, ", importResult.skipped, " skipped", importResult.errors.length > 0 && `, ${importResult.errors.length} errors`] }), _jsx("button", { onClick: () => setImportResult(null), className: "mt-1 text-xs text-zinc-500 hover:text-zinc-300", children: "Dismiss" })] })), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1", children: STATUS_TABS.map((tab) => (_jsx("button", { onClick: () => setStatusFilter(tab.key), className: `rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === tab.key
                                ? 'bg-zinc-800 text-zinc-100'
                                : 'text-zinc-500 hover:text-zinc-300'}`, children: tab.label }, tab.key))) }), _jsxs("div", { className: "relative flex-1 max-w-sm", children: [_jsx(HugeiconsIcon, { icon: Search01Icon, size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" }), _jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "Search by name or email..." })] })] }), _jsx("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900", children: users.length === 0 ? (_jsxs("div", { className: "py-12 text-center", children: [_jsx(HugeiconsIcon, { icon: UserGroupIcon, size: 32, className: "mx-auto text-zinc-600" }), _jsx("p", { className: "mt-3 text-sm font-medium text-zinc-300", children: statusFilter !== 'all' ? `No ${STATUS_CONFIG[statusFilter]?.label?.toLowerCase() ?? ''} people found` : 'No people in your directory yet' }), _jsx("p", { className: "mt-1 text-xs text-zinc-500", children: statusFilter !== 'all' ? 'Try a different filter or add new people' : 'Add people manually or import from a CSV file' }), statusFilter === 'all' && (_jsxs("div", { className: "mt-5 flex items-center justify-center gap-2", children: [_jsxs("button", { onClick: () => fileInputRef.current?.click(), className: "flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100", children: [_jsx(HugeiconsIcon, { icon: Upload04Icon, size: 14 }), "Import CSV"] }), _jsxs("button", { onClick: () => setShowForm(true), className: "flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-xs font-medium text-zinc-950 transition-colors hover:bg-primary-300", children: [_jsx(HugeiconsIcon, { icon: PlusSignIcon, size: 14 }), "Add Person"] })] }))] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-zinc-800 text-xs text-zinc-500", children: [_jsx("th", { className: "px-5 py-3 font-medium", children: "Name" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Email" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Department" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Title" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Status" }), _jsx("th", { className: "w-10 px-2 py-3" })] }) }), _jsx("tbody", { className: "divide-y divide-zinc-800/50", children: users.map((user) => {
                                    const isEditing = editingId === user.id;
                                    const userStatus = user.employmentStatus ?? user.status ?? 'active';
                                    const sc = STATUS_CONFIG[userStatus] ?? STATUS_CONFIG.active;
                                    return (_jsx("tr", { className: "transition-colors hover:bg-zinc-800/30", children: isEditing ? (_jsxs(_Fragment, { children: [_jsx("td", { className: "px-3 py-2", children: _jsx("input", { value: editForm.name, onChange: (e) => setEditForm({ ...editForm, name: e.target.value }), className: "w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" }) }), _jsx("td", { className: "px-3 py-2", children: _jsx("input", { value: editForm.email, onChange: (e) => setEditForm({ ...editForm, email: e.target.value }), className: "w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" }) }), _jsx("td", { className: "px-3 py-2", children: _jsx(SearchableInput, { value: editForm.department, onChange: (v) => setEditForm({ ...editForm, department: v }), options: departments, placeholder: "Department" }) }), _jsx("td", { className: "px-3 py-2", children: _jsx(SearchableInput, { value: editForm.title, onChange: (v) => setEditForm({ ...editForm, title: v }), options: editTitlesForDept, placeholder: "Title" }) }), _jsx("td", { className: "px-3 py-2 text-xs text-zinc-500", children: sc.label }), _jsx("td", { className: "px-2 py-2", children: _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: handleSaveEdit, disabled: updateMutation.isPending, className: "rounded bg-primary-400 px-2 py-1 text-xs font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50", children: "Save" }), _jsx("button", { onClick: () => setEditingId(null), className: "rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:border-zinc-600", children: "Cancel" })] }) })] })) : (_jsxs(_Fragment, { children: [_jsx("td", { className: "px-5 py-3 font-medium text-zinc-100", children: user.name }), _jsx("td", { className: "px-5 py-3 text-zinc-400", children: user.email }), _jsx("td", { className: "px-5 py-3 text-zinc-400", children: user.department ?? '—' }), _jsx("td", { className: "px-5 py-3 text-zinc-400", children: user.title ?? '—' }), _jsx("td", { className: "px-5 py-3", children: _jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.badge}`, children: sc.label }) }), _jsx("td", { className: "relative px-2 py-3", children: _jsx("button", { onClick: (e) => openMenu(user.id, e.currentTarget), className: "inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200", title: "Actions", children: _jsx("span", { className: "text-base leading-none", children: "\u22EE" }) }) })] })) }, user.id));
                                }) })] }) })) }), openMenuId && createPortal(_jsx("div", { ref: peopleMenuRef, style: { position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999 }, className: "min-w-[170px] overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-2xl", children: (() => {
                    const user = users.find(u => u.id === openMenuId);
                    if (!user)
                        return null;
                    const status = user.employmentStatus ?? user.status ?? 'active';
                    return (_jsxs(_Fragment, { children: [_jsxs("button", { onClick: () => startEdit(user), className: "flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-300 transition-colors hover:bg-zinc-700/60", children: [_jsx(HugeiconsIcon, { icon: Edit01Icon, size: 14 }), " Edit"] }), _jsx("div", { className: "my-1 border-t border-zinc-700/50" }), status !== 'active' && (_jsx("button", { onClick: () => handleStatusChange(user.id, 'active'), className: "flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-green-400 transition-colors hover:bg-zinc-700/60", children: "Set Active" })), status === 'active' && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => handleStatusChange(user.id, 'inactive'), className: "flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-300 transition-colors hover:bg-zinc-700/60", children: "Set Inactive" }), _jsx("button", { onClick: () => handleStatusChange(user.id, 'on_leave'), className: "flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-amber-400 transition-colors hover:bg-zinc-700/60", children: "Set On Leave" })] })), status !== 'terminated' && (_jsx("button", { onClick: () => handleStatusChange(user.id, 'terminated'), className: "flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 transition-colors hover:bg-zinc-700/60", children: "Terminate" })), _jsx("div", { className: "my-1 border-t border-zinc-700/50" }), _jsxs("button", { onClick: () => handleDelete(user.id), className: "flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 transition-colors hover:bg-zinc-700/60", children: [_jsx(HugeiconsIcon, { icon: Cancel01Icon, size: 14 }), " Delete"] })] }));
                })() }), document.body)] }));
}
// ── Access Records Section ──────────────────────────────────────────────────
const STATUS_LABELS = {
    requested: 'Requested',
    approved: 'Approved',
    active: 'Active',
    pending_review: 'Pending Review',
    suspended: 'Suspended',
    expired: 'Expired',
    revoked: 'Revoked',
};
const STATUS_COLORS = {
    requested: 'bg-blue-500/10 text-blue-400',
    approved: 'bg-amber-500/10 text-amber-400',
    active: 'bg-green-500/10 text-green-400',
    pending_review: 'bg-blue-500/10 text-blue-400',
    suspended: 'bg-orange-500/10 text-orange-400',
    expired: 'bg-yellow-500/10 text-yellow-400',
    revoked: 'bg-red-500/10 text-red-400',
};
function getActionsForStatus(status) {
    switch (status) {
        case 'requested':
            return [
                { label: 'Approve', action: 'approve', variant: 'primary' },
                { label: 'Revoke', action: 'revoke', variant: 'danger' },
            ];
        case 'approved':
            return [
                { label: 'Activate', action: 'activate', variant: 'primary' },
                { label: 'Revoke', action: 'revoke', variant: 'danger' },
            ];
        case 'active':
            return [
                { label: 'Review', action: 'request_review', variant: 'default' },
                { label: 'Suspend', action: 'suspend', variant: 'default' },
                { label: 'Revoke', action: 'revoke', variant: 'danger' },
            ];
        case 'pending_review':
            return [
                { label: 'Activate', action: 'activate', variant: 'primary' },
                { label: 'Revoke', action: 'revoke', variant: 'danger' },
            ];
        case 'suspended':
            return [
                { label: 'Activate', action: 'activate', variant: 'primary' },
                { label: 'Revoke', action: 'revoke', variant: 'danger' },
            ];
        case 'expired':
            return [{ label: 'Revoke', action: 'revoke', variant: 'danger' }];
        case 'revoked':
            return [];
        default:
            return [];
    }
}
function formatCost(record) {
    if (!record.costPerPeriod)
        return '—';
    const currency = record.costCurrency ?? 'USD';
    const freq = record.costFrequency === 'monthly' ? '/mo' : record.costFrequency === 'annual' ? '/yr' : '';
    // EUR uses comma for decimals, period for thousands
    if (currency === 'EUR') {
        const formatted = record.costPerPeriod.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `€${formatted}${freq}`;
    }
    if (currency === 'GBP') {
        const formatted = record.costPerPeriod.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `£${formatted}${freq}`;
    }
    const formatted = record.costPerPeriod.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `$${formatted}${freq}`;
}
function SearchableSelect({ value, onChange, options, placeholder }) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const selected = options.find(o => o.id === value);
    const filtered = query
        ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()) || (o.sublabel ?? '').toLowerCase().includes(query.toLowerCase()))
        : options;
    return (_jsxs("div", { className: "relative", children: [_jsx("input", { value: selected && !open ? selected.label : query, onChange: (e) => { setQuery(e.target.value); setOpen(true); if (!e.target.value)
                    onChange(''); }, onFocus: () => { setOpen(true); setQuery(''); }, onBlur: () => setTimeout(() => setOpen(false), 150), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: placeholder }), open && (_jsx("div", { className: "absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-xl", children: filtered.length === 0 ? (_jsx("p", { className: "px-3 py-2 text-xs text-zinc-500", children: "No matches" })) : filtered.map((opt) => (_jsxs("button", { type: "button", onMouseDown: (e) => e.preventDefault(), onClick: () => { onChange(opt.id); setQuery(''); setOpen(false); }, className: `w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-zinc-700 ${value === opt.id ? 'text-primary-400' : 'text-zinc-300'}`, children: [opt.label, opt.sublabel && _jsx("span", { className: "ml-1 text-xs text-zinc-500", children: opt.sublabel })] }, opt.id))) }))] }));
}
function GroupedAccessView({ records, formatCost }) {
    const [expandedUser, setExpandedUser] = useState(null);
    // Group records by userId
    const grouped = new Map();
    for (const r of records) {
        if (!grouped.has(r.userId)) {
            grouped.set(r.userId, { userName: r.userName, userEmail: r.userEmail, records: [] });
        }
        grouped.get(r.userId).records.push(r);
    }
    const groups = Array.from(grouped.entries()).sort((a, b) => b[1].records.length - a[1].records.length);
    // Compute totals per user
    const computeTotal = (recs) => {
        let monthly = 0;
        for (const r of recs) {
            if (!r.costPerPeriod)
                continue;
            if (r.costFrequency === 'annual')
                monthly += r.costPerPeriod / 12;
            else if (r.costFrequency === 'monthly')
                monthly += r.costPerPeriod;
            else
                monthly += r.costPerPeriod; // one-time treated as monthly for simplicity
        }
        return monthly;
    };
    return (_jsxs("div", { className: "space-y-2", children: [groups.map(([userId, group]) => {
                const isExpanded = expandedUser === userId;
                const totalMonthly = computeTotal(group.records);
                const activeCount = group.records.filter(r => r.status === 'active').length;
                const adminCount = group.records.filter(r => r.role === 'admin').length;
                const uniqueSystems = new Set(group.records.map(r => r.systemName)).size;
                return (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden", children: [_jsxs("button", { onClick: () => setExpandedUser(isExpanded ? null : userId), className: "flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-zinc-800/30", children: [_jsx("div", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-400/10 text-sm font-bold text-primary-400", children: group.userName.charAt(0).toUpperCase() }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-semibold text-zinc-100", children: group.userName }), _jsx("p", { className: "text-xs text-zinc-500 truncate", children: group.userEmail })] }), _jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [_jsxs("span", { className: "rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400", children: [uniqueSystems, " system", uniqueSystems !== 1 ? 's' : ''] }), adminCount > 0 && (_jsxs("span", { className: "rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400", children: [adminCount, " admin"] })), _jsxs("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${activeCount === group.records.length ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`, children: [activeCount, "/", group.records.length, " active"] }), totalMonthly > 0 && (_jsxs("span", { className: "rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300", children: ["$", totalMonthly.toFixed(0), "/mo"] }))] }), _jsx("svg", { className: `h-4 w-4 shrink-0 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) })] }), isExpanded && (_jsxs("div", { className: "border-t border-zinc-800", children: [_jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-zinc-800/50 text-[11px] text-zinc-500", children: [_jsx("th", { className: "px-5 py-2 font-medium", children: "System" }), _jsx("th", { className: "px-5 py-2 font-medium", children: "Role" }), _jsx("th", { className: "px-5 py-2 font-medium", children: "License" }), _jsx("th", { className: "px-5 py-2 font-medium", children: "Cost" }), _jsx("th", { className: "px-5 py-2 font-medium", children: "Status" }), _jsx("th", { className: "px-5 py-2 font-medium", children: "Granted" })] }) }), _jsx("tbody", { className: "divide-y divide-zinc-800/30", children: group.records.map(record => (_jsxs("tr", { className: "transition-colors hover:bg-zinc-800/20", children: [_jsx("td", { className: "px-5 py-2.5 text-sm text-zinc-200", children: record.systemName }), _jsx("td", { className: "px-5 py-2.5", children: _jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${record.role === 'admin' ? 'bg-red-500/10 text-red-400' : record.role === 'write' ? 'bg-amber-500/10 text-amber-400' : 'bg-primary-400/10 text-primary-400'}`, children: record.role }) }), _jsx("td", { className: "px-5 py-2.5 text-xs text-zinc-400", children: record.licenseType ?? '\u2014' }), _jsx("td", { className: "px-5 py-2.5 text-xs text-zinc-400", children: formatCost(record) }), _jsx("td", { className: "px-5 py-2.5", children: _jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${record.status === 'active' ? 'bg-green-500/10 text-green-400' : record.status === 'revoked' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-500/10 text-zinc-400'}`, children: record.status }) }), _jsx("td", { className: "px-5 py-2.5 text-xs text-zinc-500", children: record.grantedAt ? new Date(record.grantedAt).toLocaleDateString() : '\u2014' })] }, record.id))) })] }), totalMonthly > 0 && (_jsx("div", { className: "flex justify-end border-t border-zinc-800/50 px-5 py-2", children: _jsxs("span", { className: "text-xs text-zinc-400", children: ["Total: ", _jsxs("span", { className: "font-medium text-zinc-200", children: ["$", totalMonthly.toFixed(2), "/mo"] })] }) }))] }))] }, userId));
            }), groups.length === 0 && (_jsx("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 py-12 text-center", children: _jsx("p", { className: "text-sm text-zinc-400", children: "No access records found." }) }))] }));
}
function DepartmentAccessView({ records, users, formatCost }) {
    const [expandedDept, setExpandedDept] = useState(null);
    // Build department map from users
    const userDeptMap = new Map(users.map((u) => [u.id, u.department ?? 'Unassigned']));
    // Group records by department
    const grouped = new Map();
    for (const r of records) {
        const dept = userDeptMap.get(r.userId) ?? 'Unassigned';
        if (!grouped.has(dept))
            grouped.set(dept, []);
        grouped.get(dept).push(r);
    }
    const departments = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return (_jsx("div", { className: "space-y-2", children: departments.map(([dept, recs]) => {
            const isExpanded = expandedDept === dept;
            return (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden", children: [_jsxs("button", { onClick: () => setExpandedDept(isExpanded ? null : dept), className: "flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-zinc-800/30", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-sm font-medium text-zinc-100", children: dept }), _jsxs("span", { className: "rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500", children: [recs.length, " record", recs.length !== 1 ? 's' : ''] })] }), _jsx(HugeiconsIcon, { icon: isExpanded ? ArrowUp01Icon : ArrowDown01Icon, size: 14, className: "text-zinc-500" })] }), isExpanded && (_jsx("div", { className: "border-t border-zinc-800", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-zinc-800/50 text-[11px] text-zinc-500", children: [_jsx("th", { className: "px-5 py-2 font-medium", children: "Person" }), _jsx("th", { className: "px-5 py-2 font-medium", children: "System" }), _jsx("th", { className: "px-5 py-2 font-medium", children: "Role" }), _jsx("th", { className: "px-5 py-2 font-medium", children: "License" }), _jsx("th", { className: "px-5 py-2 font-medium", children: "Cost" }), _jsx("th", { className: "px-5 py-2 font-medium", children: "Status" })] }) }), _jsx("tbody", { className: "divide-y divide-zinc-800/30", children: recs.map((r) => (_jsxs("tr", { className: "transition-colors hover:bg-zinc-800/20", children: [_jsxs("td", { className: "px-5 py-2.5", children: [_jsx("p", { className: "text-sm text-zinc-200", children: r.userName }), _jsx("p", { className: "text-[11px] text-zinc-500", children: r.userEmail })] }), _jsx("td", { className: "px-5 py-2.5 text-sm text-zinc-300", children: r.systemName }), _jsx("td", { className: "px-5 py-2.5", children: _jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${r.role === 'admin' ? 'bg-red-500/10 text-red-400' : r.role === 'write' ? 'bg-amber-500/10 text-amber-400' : 'bg-primary-400/10 text-primary-400'}`, children: r.role }) }), _jsx("td", { className: "px-5 py-2.5 text-xs text-zinc-400", children: r.licenseType ?? '—' }), _jsx("td", { className: "px-5 py-2.5 text-xs text-zinc-400", children: formatCost(r) }), _jsx("td", { className: "px-5 py-2.5", children: _jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${r.status === 'active' ? 'bg-green-500/10 text-green-400' : r.status === 'revoked' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-500/10 text-zinc-400'}`, children: r.status }) })] }, r.id))) })] }) }))] }, dept));
        }) }));
}
function EditAccessModal({ record, users, systems, onClose, onSave, isPending }) {
    const [form, setForm] = useState({
        role: record.role,
        approvedBy: record.approvedBy ?? '',
        ticketRef: record.ticketRef ?? '',
        status: (record.status ?? 'active'),
        licenseType: record.licenseType ?? '',
        costPerPeriod: record.costPerPeriod?.toString() ?? '',
        costCurrency: record.costCurrency ?? 'USD',
        costFrequency: record.costFrequency ?? '',
    });
    const handleSubmit = () => {
        onSave({
            role: form.role || undefined,
            approvedBy: form.approvedBy || null,
            ticketRef: form.ticketRef || undefined,
            status: form.status || undefined,
            licenseType: form.licenseType || null,
            costPerPeriod: form.costPerPeriod ? parseFloat(form.costPerPeriod) : null,
            costCurrency: form.costCurrency || undefined,
            costFrequency: form.costFrequency || null,
        });
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm", onClick: onClose, children: _jsxs("div", { className: "w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "mb-5 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-zinc-100", children: "Edit Access Record" }), _jsxs("p", { className: "text-xs text-zinc-500", children: ["Granted ", new Date(record.grantedAt).toLocaleDateString()] })] }), _jsx("button", { onClick: onClose, className: "text-zinc-500 hover:text-zinc-300", children: _jsx(HugeiconsIcon, { icon: Cancel01Icon, size: 18 }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Person" }), _jsxs("div", { className: "rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-2", children: [_jsx("p", { className: "text-sm text-zinc-200", children: record.userName }), _jsx("p", { className: "text-[11px] text-zinc-500", children: record.userEmail })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "System" }), _jsx("div", { className: "rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-2", children: _jsx("p", { className: "text-sm text-zinc-200", children: record.systemName }) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Role *" }), _jsxs("select", { value: form.role, onChange: (e) => setForm({ ...form, role: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "admin", children: "Admin" }), _jsx("option", { value: "write", children: "Write" }), _jsx("option", { value: "read", children: "Read" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Status *" }), _jsx("select", { value: form.status, onChange: (e) => setForm({ ...form, status: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: Object.entries(STATUS_LABELS).map(([v, l]) => _jsx("option", { value: v, children: l }, v)) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Approved By" }), _jsx(SearchableSelect, { value: form.approvedBy, onChange: (v) => setForm({ ...form, approvedBy: v }), options: users.map((u) => ({ id: u.name, label: u.name, sublabel: u.title ? `${u.title} · ${u.email}` : u.email })), placeholder: "Search approver..." })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Ticket Reference" }), _jsx("input", { value: form.ticketRef, onChange: (e) => setForm({ ...form, ticketRef: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "e.g. JIRA-1234" })] })] }), _jsxs("div", { className: "border-t border-zinc-800 pt-4", children: [_jsx("p", { className: "mb-3 text-xs font-medium text-zinc-500", children: "Cost & License" }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "License Type" }), _jsx("input", { value: form.licenseType, onChange: (e) => setForm({ ...form, licenseType: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "e.g. Enterprise, Pro, Basic" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Billing Frequency" }), _jsxs("select", { value: form.costFrequency, onChange: (e) => setForm({ ...form, costFrequency: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "", children: "None" }), _jsx("option", { value: "monthly", children: "Monthly" }), _jsx("option", { value: "annual", children: "Annual" }), _jsx("option", { value: "one-time", children: "One-time" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Cost per Period" }), _jsx("input", { type: "number", value: form.costPerPeriod, onChange: (e) => setForm({ ...form, costPerPeriod: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "0.00", step: "0.01" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Currency" }), _jsxs("select", { value: form.costCurrency, onChange: (e) => setForm({ ...form, costCurrency: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "USD", children: "USD" }), _jsx("option", { value: "EUR", children: "EUR" }), _jsx("option", { value: "GBP", children: "GBP" }), _jsx("option", { value: "BRL", children: "BRL" })] })] })] })] })] }), _jsxs("div", { className: "mt-6 flex justify-end gap-2", children: [_jsx("button", { onClick: onClose, className: "rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600", children: "Cancel" }), _jsx("button", { onClick: handleSubmit, disabled: isPending, className: "rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50", children: isPending ? 'Saving...' : 'Save Changes' })] })] }) }));
}
function AccessSection({ workspaceId }) {
    const { systems } = useSystemsList(workspaceId);
    const { users } = useDirectoryUsers(workspaceId);
    const [statusFilter, setStatusFilter] = useState('active');
    const [systemFilter, setSystemFilter] = useState('');
    const [page, setPage] = useState(1);
    const [viewMode, setViewMode] = useState('list');
    const limit = 25;
    const { records, total, isLoading } = useAccessRecords(workspaceId, {
        status: statusFilter,
        systemId: systemFilter,
        page,
        limit,
    });
    const createMutation = useCreateAccess(workspaceId);
    const transitionMutation = useTransitionAccess(workspaceId);
    const updateMutation = useUpdateAccessRecord(workspaceId);
    const saveCfMutation = useSaveCustomFieldValues(workspaceId);
    const [showForm, setShowForm] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);
    const [form, setForm] = useState({
        userId: '',
        systemId: '',
        role: 'read',
        approvedBy: '',
        ticketRef: '',
        status: 'active',
        licenseType: '',
        costPerPeriod: '',
        costCurrency: 'USD',
        costFrequency: '',
    });
    const [cfValues, setCfValues] = useState({});
    // Edit form is now in EditAccessModal
    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const menuRef = useRef(null);
    const closeMenu = useCallback(() => setOpenMenuId(null), []);
    const openMenu = useCallback((recordId, btnEl) => {
        if (openMenuId === recordId) {
            closeMenu();
            return;
        }
        const rect = btnEl.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 4, left: rect.right - 160 });
        setOpenMenuId(recordId);
    }, [openMenuId, closeMenu]);
    useEffect(() => {
        if (!openMenuId)
            return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                closeMenu();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId, closeMenu]);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const handleSubmit = () => {
        if (!form.userId || !form.systemId)
            return;
        createMutation.mutate({
            userId: form.userId,
            systemId: form.systemId,
            role: form.role,
            approvedBy: form.approvedBy || undefined,
            ticketRef: form.ticketRef || undefined,
            status: form.status,
            licenseType: form.licenseType || undefined,
            costPerPeriod: form.costPerPeriod ? parseFloat(form.costPerPeriod) : undefined,
            costCurrency: form.costCurrency || undefined,
            costFrequency: form.costFrequency || undefined,
            customFields: Object.keys(cfValues).length > 0 ? cfValues : undefined,
        }, {
            onSuccess: () => {
                setForm({
                    userId: '', systemId: '', role: 'read', approvedBy: '', ticketRef: '',
                    status: 'active', licenseType: '', costPerPeriod: '', costCurrency: 'USD', costFrequency: '',
                });
                setCfValues({});
                setShowForm(false);
            },
        });
    };
    const handleTransition = (recordId, action) => {
        transitionMutation.mutate({ recordId, action: action }, { onSuccess: () => setConfirmAction(null) });
    };
    const startEdit = (record) => {
        setEditingRecord(record);
    };
    const riskScoreColor = (score) => {
        if (score > 0.7)
            return 'text-red-400';
        if (score > 0.4)
            return 'text-amber-400';
        return 'text-primary-400';
    };
    const riskScoreBg = (score) => {
        if (score > 0.7)
            return 'bg-red-500/10';
        if (score > 0.4)
            return 'bg-amber-500/10';
        return 'bg-primary-400/10';
    };
    const roleBadge = (role) => {
        switch (role) {
            case 'admin':
                return 'bg-red-500/10 text-red-400';
            case 'write':
                return 'bg-amber-500/10 text-amber-400';
            case 'read':
                return 'bg-primary-400/10 text-primary-400';
            default:
                return 'bg-zinc-500/10 text-zinc-400';
        }
    };
    const actionBtnClass = (variant) => {
        switch (variant) {
            case 'primary':
                return 'border-primary-400/20 text-primary-400 hover:border-primary-400/40 hover:bg-primary-400/5';
            case 'danger':
                return 'border-red-500/20 text-red-400 hover:border-red-500/40 hover:bg-red-500/5';
            default:
                return 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300';
        }
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold text-zinc-100", children: "Access Records" }), _jsxs("button", { onClick: () => setShowForm(!showForm), className: "flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300", children: [showForm ? _jsx(HugeiconsIcon, { icon: Cancel01Icon, size: 16 }) : _jsx(HugeiconsIcon, { icon: PlusSignIcon, size: 16 }), showForm ? 'Cancel' : 'Grant Access'] })] }), showForm && (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsx("h3", { className: "mb-4 text-sm font-semibold text-zinc-100", children: "Grant Access" }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Person *" }), _jsx(SearchableSelect, { value: form.userId, onChange: (id) => setForm({ ...form, userId: id }), options: users.map((u) => ({ id: u.id, label: u.name, sublabel: u.email })), placeholder: "Search person..." })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "System *" }), _jsx(SearchableSelect, { value: form.systemId, onChange: (id) => setForm({ ...form, systemId: id }), options: systems.map((s) => ({ id: s.id, label: s.name })), placeholder: "Search system..." })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Role" }), _jsxs("select", { value: form.role, onChange: (e) => setForm({ ...form, role: e.target.value }), className: "w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "admin", children: "Admin" }), _jsx("option", { value: "write", children: "Write" }), _jsx("option", { value: "read", children: "Read" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Status" }), _jsx("select", { value: form.status, onChange: (e) => setForm({ ...form, status: e.target.value }), className: "w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: Object.entries(STATUS_LABELS).map(([value, label]) => (_jsx("option", { value: value, children: label }, value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Approved By" }), _jsx(SearchableSelect, { value: form.approvedBy, onChange: (id) => setForm({ ...form, approvedBy: id }), options: users.map((u) => ({
                                            id: u.name,
                                            label: u.name,
                                            sublabel: u.title ? `${u.title} · ${u.email}` : u.email,
                                        })), placeholder: "Search approver..." })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Ticket Reference" }), _jsx("input", { value: form.ticketRef, onChange: (e) => setForm({ ...form, ticketRef: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "e.g. JIRA-1234" })] })] }), _jsx("div", { className: "mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: _jsx(CustomFieldsForm, { workspaceId: workspaceId, entityType: "access_record", values: cfValues, onChange: setCfValues }) }), _jsxs("div", { className: "mt-4 border-t border-zinc-800 pt-4", children: [_jsx("p", { className: "mb-3 text-xs font-medium text-zinc-500", children: "Cost Details" }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "License Type" }), _jsx("input", { value: form.licenseType, onChange: (e) => setForm({ ...form, licenseType: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "e.g. Enterprise, Basic" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Cost per Period" }), _jsx("input", { type: "number", value: form.costPerPeriod, onChange: (e) => setForm({ ...form, costPerPeriod: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "0.00", step: "0.01" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Currency" }), _jsxs("select", { value: form.costCurrency, onChange: (e) => setForm({ ...form, costCurrency: e.target.value }), className: "w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "USD", children: "USD" }), _jsx("option", { value: "EUR", children: "EUR" }), _jsx("option", { value: "GBP", children: "GBP" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Frequency" }), _jsxs("select", { value: form.costFrequency, onChange: (e) => setForm({ ...form, costFrequency: e.target.value }), className: "w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "", children: "Select..." }), _jsx("option", { value: "monthly", children: "Monthly" }), _jsx("option", { value: "annual", children: "Annual" }), _jsx("option", { value: "one-time", children: "One-time" })] })] })] })] }), _jsx("div", { className: "mt-4 flex justify-end", children: _jsx("button", { onClick: handleSubmit, disabled: !form.userId || !form.systemId || createMutation.isPending, className: "rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50", children: createMutation.isPending ? 'Granting...' : 'Grant Access' }) })] })), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-0.5", children: [_jsx("button", { onClick: () => setViewMode('list'), className: `rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`, children: "List" }), _jsx("button", { onClick: () => setViewMode('grouped'), className: `rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${viewMode === 'grouped' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`, children: "By Person" }), _jsx("button", { onClick: () => setViewMode('department'), className: `rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${viewMode === 'department' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`, children: "By Department" })] }), _jsxs("select", { value: systemFilter, onChange: (e) => {
                            setSystemFilter(e.target.value);
                            setPage(1);
                        }, className: "appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-300 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "", children: "All systems" }), systems.map((s) => (_jsx("option", { value: s.id, children: s.name }, s.id)))] }), _jsxs("select", { value: statusFilter, onChange: (e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }, className: "appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-300 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "all", children: "All statuses" }), Object.entries(STATUS_LABELS).map(([value, label]) => (_jsx("option", { value: value, children: label }, value)))] })] }), viewMode === 'grouped' && (_jsx(GroupedAccessView, { records: records, formatCost: formatCost })), viewMode === 'department' && (_jsx(DepartmentAccessView, { records: records, users: users, formatCost: formatCost })), viewMode === 'list' && _jsx("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900", children: isLoading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 20, className: "animate-spin text-zinc-500" }) })) : records.length === 0 ? (_jsxs("div", { className: "py-12 text-center", children: [_jsx(HugeiconsIcon, { icon: Key01Icon, size: 32, className: "mx-auto text-zinc-600" }), _jsx("p", { className: "mt-3 text-sm text-zinc-400", children: "No access records found." })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-zinc-800 text-xs text-zinc-500", children: [_jsx("th", { className: "px-5 py-3 font-medium", children: "Person" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "System" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Role" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Approved By" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Ticket" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "License" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Cost" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Granted" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Risk" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Status" }), _jsx("th", { className: "w-10 px-2 py-3 font-medium" })] }) }), _jsx("tbody", { className: "divide-y divide-zinc-800/50", children: records.map((record) => (_jsxs("tr", { className: "transition-colors hover:bg-zinc-800/30", children: [_jsx("td", { className: "px-5 py-3", children: _jsxs("div", { children: [_jsx("p", { className: "font-medium text-zinc-100", children: record.userName }), _jsx("p", { className: "text-xs text-zinc-500", children: record.userEmail })] }) }), _jsx("td", { className: "px-5 py-3 text-zinc-300", children: record.systemName }), _jsx("td", { className: "px-5 py-3", children: _jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge(record.role)}`, children: record.role }) }), _jsx("td", { className: "px-5 py-3 text-zinc-400", children: record.approvedBy ?? '—' }), _jsx("td", { className: "px-5 py-3 text-zinc-400", children: record.ticketRef ?? '—' }), _jsx("td", { className: "px-5 py-3 text-zinc-400", children: record.licenseType ?? '—' }), _jsx("td", { className: "px-5 py-3 text-zinc-400", children: formatCost(record) }), _jsx("td", { className: "px-5 py-3 text-zinc-400", children: new Date(record.grantedAt).toLocaleDateString() }), _jsx("td", { className: "px-5 py-3", children: _jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${riskScoreBg(record.riskScore)} ${riskScoreColor(record.riskScore)}`, children: record.riskScore.toFixed(2) }) }), _jsx("td", { className: "px-5 py-3", children: _jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[record.status ?? 'active'] ?? 'bg-zinc-500/10 text-zinc-400'}`, children: STATUS_LABELS[record.status ?? 'active'] ?? record.status ?? 'active' }) }), _jsx("td", { className: "relative px-2 py-3 text-center", children: _jsx("button", { onClick: (e) => openMenu(record.id, e.currentTarget), className: "inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200", title: "Actions", children: _jsx("span", { className: "text-base leading-none", children: "\u22EE" }) }) })] }, record.id))) })] }) }), totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-between border-t border-zinc-800 px-5 py-3", children: [_jsxs("p", { className: "text-xs text-zinc-500", children: ["Page ", page, " of ", totalPages, " (", total, " total)"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1, className: "rounded-lg border border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-40", children: _jsx(HugeiconsIcon, { icon: ArrowLeft01Icon, size: 16 }) }), _jsx("button", { onClick: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page === totalPages, className: "rounded-lg border border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-40", children: _jsx(HugeiconsIcon, { icon: ArrowRight01Icon, size: 16 }) })] })] }))] })) }), openMenuId && createPortal(_jsx("div", { ref: menuRef, style: { position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999 }, className: "min-w-[170px] overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-2xl", children: (() => {
                    const record = records.find((r) => r.id === openMenuId);
                    if (!record)
                        return null;
                    const actions = getActionsForStatus((record.status ?? 'active'));
                    const variantStyles = {
                        primary: 'text-primary-400',
                        danger: 'text-red-400',
                        default: 'text-zinc-300',
                    };
                    return (_jsxs(_Fragment, { children: [_jsxs("button", { onClick: () => { startEdit(record); setOpenMenuId(null); }, className: "flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-300 transition-colors hover:bg-zinc-700/60", children: [_jsx(HugeiconsIcon, { icon: Edit01Icon, size: 14 }), "Edit"] }), actions.length > 0 && _jsx("div", { className: "my-1 border-t border-zinc-700/50" }), actions.map((act) => (_jsx("button", { onClick: () => { handleTransition(record.id, act.action); setOpenMenuId(null); }, disabled: transitionMutation.isPending, className: `flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-zinc-700/60 ${variantStyles[act.variant] ?? 'text-zinc-300'}`, children: act.label }, act.action))), _jsx("div", { className: "my-1 border-t border-zinc-700/50" }), _jsxs("button", { onClick: () => { handleTransition(record.id, 'delete'); setOpenMenuId(null); }, disabled: transitionMutation.isPending, className: "flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 transition-colors hover:bg-zinc-700/60", children: [_jsx(HugeiconsIcon, { icon: Cancel01Icon, size: 14 }), "Delete"] })] }));
                })() }), document.body), editingRecord && (_jsx(EditAccessModal, { record: editingRecord, users: users, systems: systems, onClose: () => setEditingRecord(null), onSave: (data) => {
                    updateMutation.mutate({ recordId: editingRecord.id, data }, { onSuccess: () => setEditingRecord(null) });
                }, isPending: updateMutation.isPending }))] }));
}
//# sourceMappingURL=access-register.js.map