import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useCallback } from 'react';
import { useParams } from '@tanstack/react-router';
import { useFrameworks, useFrameworkVersions, useAdoptions, useControls, useAdoptFramework, useUnadoptFramework, useCreateControl, useUpdateControl, useDeleteControl, useImportFramework, } from '@/hooks/use-frameworks';
import { HugeiconsIcon } from '@hugeicons/react';
import { Layers01Icon, Shield01Icon, CheckmarkCircle01Icon, ArrowLeft01Icon, ArrowRight01Icon, FilterIcon, BookOpen01Icon, LoaderPinwheelIcon, Add01Icon, Delete01Icon, PencilEdit01Icon, Cancel01Icon, CheckmarkSquare01Icon, Upload01Icon, Download01Icon, File01Icon, Search01Icon, } from '@hugeicons/core-free-icons';
export function FrameworksPage() {
    const params = useParams({ strict: false });
    const workspaceId = params.workspaceId;
    const [activeTab, setActiveTab] = useState('catalog');
    const tabs = [
        { id: 'catalog', label: 'Catalog' },
        { id: 'controls', label: 'Controls' },
        { id: 'import', label: 'Import CSV' },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-zinc-100", children: "Frameworks" }), _jsx("p", { className: "mt-1 text-sm text-zinc-400", children: "Manage compliance frameworks, browse controls, and import custom frameworks." })] }), _jsx("div", { className: "flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-1", children: tabs.map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab.id), className: `rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id
                        ? 'bg-zinc-800 text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-300'}`, children: tab.label }, tab.id))) }), activeTab === 'catalog' && _jsx(CatalogTab, { workspaceId: workspaceId }), activeTab === 'controls' && _jsx(ControlsTab, { workspaceId: workspaceId }), activeTab === 'import' && _jsx(ImportTab, { workspaceId: workspaceId, onComplete: () => setActiveTab('catalog') })] }));
}
// ─── Catalog Tab ──────────────────────────────────────────────────────────────
function CatalogTab({ workspaceId }) {
    const { frameworks, isLoading: frameworksLoading } = useFrameworks(workspaceId);
    const { adoptions, isLoading: adoptionsLoading } = useAdoptions(workspaceId);
    const adoptMutation = useAdoptFramework(workspaceId);
    const unadoptMutation = useUnadoptFramework(workspaceId);
    const [confirmUnenroll, setConfirmUnenroll] = useState(null);
    const adoptedSlugs = new Set(adoptions.map((a) => a.frameworkSlug));
    const isLoading = frameworksLoading || adoptionsLoading;
    if (isLoading) {
        return (_jsx("div", { className: "flex min-h-[40vh] items-center justify-center", children: _jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 24, className: "animate-spin text-zinc-500" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "mb-3 text-lg font-semibold text-zinc-100", children: "Active Adoptions" }), adoptions.length === 0 ? (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center", children: [_jsx(HugeiconsIcon, { icon: BookOpen01Icon, size: 32, className: "mx-auto text-zinc-600" }), _jsx("p", { className: "mt-3 text-sm text-zinc-400", children: "No frameworks adopted yet. Browse below and adopt one to get started." })] })) : (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: adoptions.map((adoption) => (_jsxs("div", { className: "rounded-xl border border-l-4 border-zinc-800 border-l-primary-400 bg-zinc-900 p-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-sm font-semibold text-zinc-100", children: adoption.frameworkName }), _jsxs("span", { className: "rounded-full bg-primary-400/10 px-3 py-1 text-xs text-primary-400", children: ["v", adoption.frameworkVersion] })] }), _jsxs("div", { className: "mt-3 flex items-center justify-between", children: [_jsxs("span", { className: "text-xs text-zinc-500", children: ["Adopted ", new Date(adoption.adoptedAt).toLocaleDateString()] }), confirmUnenroll === adoption.id ? (_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("button", { onClick: () => {
                                                        unadoptMutation.mutate(adoption.id, {
                                                            onSuccess: () => setConfirmUnenroll(null),
                                                        });
                                                    }, disabled: unadoptMutation.isPending, className: "rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20", children: unadoptMutation.isPending ? 'Removing...' : 'Confirm' }), _jsx("button", { onClick: () => setConfirmUnenroll(null), className: "rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:border-zinc-600", children: "Cancel" })] })) : (_jsx("button", { onClick: () => setConfirmUnenroll(adoption.id), className: "rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-500 transition-colors hover:border-red-500/30 hover:text-red-400", children: "Unenroll" }))] })] }, adoption.id))) }))] }), _jsxs("div", { children: [_jsx("h2", { className: "mb-3 text-lg font-semibold text-zinc-100", children: "Available Frameworks" }), _jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: frameworks.map((fw) => (_jsx(FrameworkCard, { framework: fw, isAdopted: adoptedSlugs.has(fw.slug), workspaceId: workspaceId, adoptMutation: adoptMutation }, fw.id))) })] })] }));
}
function FrameworkCard({ framework, isAdopted, workspaceId, adoptMutation, }) {
    const { versions } = useFrameworkVersions(workspaceId, framework.slug);
    const currentVersion = versions.find((v) => v.status === 'current') ?? versions[0];
    return (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(HugeiconsIcon, { icon: Layers01Icon, size: 16, className: "text-primary-400" }), _jsx("p", { className: "text-sm font-semibold text-zinc-100", children: framework.name })] }), isAdopted && (_jsxs("span", { className: "flex items-center gap-1 rounded-full bg-primary-400/10 px-3 py-1 text-xs text-primary-400", children: [_jsx(HugeiconsIcon, { icon: CheckmarkCircle01Icon, size: 12 }), "Adopted"] }))] }), _jsx("p", { className: "mt-1 text-xs text-zinc-500", children: framework.sourceOrg }), _jsx("p", { className: "mt-2 line-clamp-2 text-sm text-zinc-400", children: framework.description }), _jsxs("div", { className: "mt-4 flex items-center justify-between", children: [_jsx("div", { className: "flex items-center gap-3 text-xs text-zinc-500", children: currentVersion && (_jsxs(_Fragment, { children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(HugeiconsIcon, { icon: Shield01Icon, size: 12 }), currentVersion.totalControls, " controls"] }), _jsxs("span", { children: ["v", currentVersion.version] })] })) }), !isAdopted && currentVersion && (_jsx("button", { onClick: () => adoptMutation.mutate({
                            frameworkVersionId: currentVersion.id,
                            reason: 'Adopted from frameworks page',
                        }), disabled: adoptMutation.isPending, className: "rounded-lg bg-primary-400 px-4 py-1.5 text-xs font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50", children: adoptMutation.isPending ? 'Adopting...' : 'Adopt' }))] })] }));
}
// ─── Controls Tab ─────────────────────────────────────────────────────────────
function ControlsTab({ workspaceId }) {
    const { adoptions, isLoading: adoptionsLoading } = useAdoptions(workspaceId);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [controlsPage, setControlsPage] = useState(1);
    const [domainFilter, setDomainFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const selected = adoptions[selectedIdx];
    const { controls, total, isLoading: controlsLoading } = useControls(workspaceId, selected?.frameworkSlug ?? '', selected?.frameworkVersion ?? '', { page: controlsPage, limit: 50, domain: domainFilter });
    const createMutation = useCreateControl(workspaceId);
    const updateMutation = useUpdateControl(workspaceId);
    const deleteMutation = useDeleteControl(workspaceId);
    // We need the framework version ID for CRUD. Get it from versions.
    const { versions } = useFrameworkVersions(workspaceId, selected?.frameworkSlug ?? '');
    const fvId = versions.find((v) => v.version === selected?.frameworkVersion)?.id ?? '';
    const totalPages = Math.max(1, Math.ceil(total / 50));
    const domains = Array.from(new Set(controls.map((c) => c.domain).filter(Boolean)));
    const filteredControls = searchQuery
        ? controls.filter((c) => c.controlId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.requirementText.toLowerCase().includes(searchQuery.toLowerCase()))
        : controls;
    if (adoptionsLoading) {
        return (_jsx("div", { className: "flex min-h-[40vh] items-center justify-center", children: _jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 24, className: "animate-spin text-zinc-500" }) }));
    }
    if (adoptions.length === 0) {
        return (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center", children: [_jsx(HugeiconsIcon, { icon: BookOpen01Icon, size: 32, className: "mx-auto text-zinc-600" }), _jsx("p", { className: "mt-3 text-sm text-zinc-400", children: "Adopt a framework first to browse and manage its controls." })] }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "flex flex-wrap items-center gap-2", children: adoptions.map((a, idx) => (_jsxs("button", { onClick: () => { setSelectedIdx(idx); setControlsPage(1); setDomainFilter(''); setSearchQuery(''); }, className: `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${idx === selectedIdx
                        ? 'bg-primary-400/10 text-primary-400 ring-1 ring-primary-400/30'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-300'}`, children: [a.frameworkName, " v", a.frameworkVersion] }, a.id))) }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(HugeiconsIcon, { icon: Search01Icon, size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" }), _jsx("input", { value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Search controls...", className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-9 pr-3 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-primary-400 focus:outline-none" })] }), _jsxs("div", { className: "relative", children: [_jsx(HugeiconsIcon, { icon: FilterIcon, size: 14, className: "absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" }), _jsxs("select", { value: domainFilter, onChange: (e) => { setDomainFilter(e.target.value); setControlsPage(1); }, className: "appearance-none rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-8 pr-8 text-sm text-zinc-300 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "", children: "All domains" }), domains.map((d) => _jsx("option", { value: d, children: d }, d))] })] }), _jsxs("button", { onClick: () => setShowAddForm(!showAddForm), className: "flex items-center gap-1.5 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300", children: [_jsx(HugeiconsIcon, { icon: Add01Icon, size: 14 }), "Add Control"] })] }), showAddForm && (_jsx(AddControlForm, { fvId: fvId, createMutation: createMutation, onClose: () => setShowAddForm(false) })), _jsx("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900", children: controlsLoading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 20, className: "animate-spin text-zinc-500" }) })) : filteredControls.length === 0 ? (_jsx("div", { className: "py-12 text-center text-sm text-zinc-500", children: "No controls found." })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-zinc-800 text-xs text-zinc-500", children: [_jsx("th", { className: "px-4 py-3 font-medium", children: "Control ID" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Domain" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Title" }), _jsx("th", { className: "px-4 py-3 font-medium text-right", children: "Risk" }), _jsx("th", { className: "px-4 py-3 font-medium text-right", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-zinc-800/50", children: filteredControls.map((control) => (editingId === control.id ? (_jsx(EditControlRow, { control: control, fvId: fvId, updateMutation: updateMutation, onCancel: () => setEditingId(null), onSave: () => setEditingId(null) }, control.id)) : (_jsxs("tr", { className: "group transition-colors hover:bg-zinc-800/30", children: [_jsx("td", { className: "px-4 py-3 font-mono text-xs text-primary-400", children: control.controlId }), _jsx("td", { className: "max-w-[180px] truncate px-4 py-3 text-zinc-400", children: control.domain }), _jsx("td", { className: "px-4 py-3 text-zinc-100", children: control.title }), _jsx("td", { className: "px-4 py-3 text-right text-zinc-400", children: control.riskWeight }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsxs("div", { className: "flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100", children: [_jsx("button", { onClick: () => setEditingId(control.id), className: "rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300", title: "Edit", children: _jsx(HugeiconsIcon, { icon: PencilEdit01Icon, size: 14 }) }), deleteConfirm === control.id ? (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: () => {
                                                                            deleteMutation.mutate({ fvId, ctrlId: control.id });
                                                                            setDeleteConfirm(null);
                                                                        }, className: "rounded bg-red-500/10 p-1 text-red-400 hover:bg-red-500/20", title: "Confirm delete", children: _jsx(HugeiconsIcon, { icon: CheckmarkSquare01Icon, size: 14 }) }), _jsx("button", { onClick: () => setDeleteConfirm(null), className: "rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300", title: "Cancel", children: _jsx(HugeiconsIcon, { icon: Cancel01Icon, size: 14 }) })] })) : (_jsx("button", { onClick: () => setDeleteConfirm(control.id), className: "rounded p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-400", title: "Delete", children: _jsx(HugeiconsIcon, { icon: Delete01Icon, size: 14 }) }))] }) })] }, control.id)))) })] }) }), totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-between border-t border-zinc-800 px-4 py-3", children: [_jsxs("p", { className: "text-xs text-zinc-500", children: ["Page ", controlsPage, " of ", totalPages, " \u00B7 ", total, " controls"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => setControlsPage((p) => Math.max(1, p - 1)), disabled: controlsPage === 1, className: "rounded-lg border border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-40", children: _jsx(HugeiconsIcon, { icon: ArrowLeft01Icon, size: 16 }) }), _jsx("button", { onClick: () => setControlsPage((p) => Math.min(totalPages, p + 1)), disabled: controlsPage === totalPages, className: "rounded-lg border border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-40", children: _jsx(HugeiconsIcon, { icon: ArrowRight01Icon, size: 16 }) })] })] }))] })) })] }));
}
function AddControlForm({ fvId, createMutation, onClose, }) {
    const [form, setForm] = useState({
        controlId: '',
        domain: '',
        subdomain: '',
        title: '',
        requirementText: '',
        guidance: '',
        evidenceRequirements: '',
        riskWeight: '0.5',
        implementationGroup: '',
    });
    const handleSubmit = () => {
        if (!form.controlId || !form.title || !form.requirementText)
            return;
        createMutation.mutate({
            fvId,
            data: {
                controlId: form.controlId,
                domain: form.domain || undefined,
                subdomain: form.subdomain || undefined,
                title: form.title,
                requirementText: form.requirementText,
                guidance: form.guidance || undefined,
                evidenceRequirements: form.evidenceRequirements
                    ? form.evidenceRequirements.split(';').map((s) => s.trim()).filter(Boolean)
                    : undefined,
                riskWeight: parseFloat(form.riskWeight) || 0.5,
                implementationGroup: form.implementationGroup || undefined,
            },
        }, { onSuccess: () => onClose() });
    };
    return (_jsxs("div", { className: "rounded-xl border border-primary-400/30 bg-zinc-900 p-5", children: [_jsx("h3", { className: "mb-4 text-sm font-semibold text-zinc-100", children: "New Control" }), _jsxs("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: [_jsx(InputField, { label: "Control ID *", value: form.controlId, onChange: (v) => setForm({ ...form, controlId: v }), placeholder: "e.g. CC6.1" }), _jsx(InputField, { label: "Title *", value: form.title, onChange: (v) => setForm({ ...form, title: v }), placeholder: "Control title" }), _jsx(InputField, { label: "Domain", value: form.domain, onChange: (v) => setForm({ ...form, domain: v }), placeholder: "e.g. Access Control" }), _jsx(InputField, { label: "Subdomain", value: form.subdomain, onChange: (v) => setForm({ ...form, subdomain: v }), placeholder: "e.g. Authentication" }), _jsx(InputField, { label: "Risk Weight", value: form.riskWeight, onChange: (v) => setForm({ ...form, riskWeight: v }), placeholder: "0.0 - 1.0" }), _jsx(InputField, { label: "Implementation Group", value: form.implementationGroup, onChange: (v) => setForm({ ...form, implementationGroup: v }), placeholder: "e.g. IG1" })] }), _jsxs("div", { className: "mt-3 grid gap-3 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Requirement Text *" }), _jsx("textarea", { value: form.requirementText, onChange: (e) => setForm({ ...form, requirementText: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-primary-400 focus:outline-none", rows: 3, placeholder: "Full requirement text..." })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Evidence Requirements (semicolon-separated)" }), _jsx("textarea", { value: form.evidenceRequirements, onChange: (e) => setForm({ ...form, evidenceRequirements: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-primary-400 focus:outline-none", rows: 3, placeholder: "MFA report; Access review; Policy doc" })] })] }), _jsxs("div", { className: "mt-4 flex justify-end gap-2", children: [_jsx("button", { onClick: onClose, className: "rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-300", children: "Cancel" }), _jsx("button", { onClick: handleSubmit, disabled: !form.controlId || !form.title || !form.requirementText || createMutation.isPending, className: "rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50", children: createMutation.isPending ? 'Creating...' : 'Create Control' })] })] }));
}
function EditControlRow({ control, fvId, updateMutation, onCancel, onSave, }) {
    const [form, setForm] = useState({
        controlId: control.controlId,
        domain: control.domain ?? '',
        title: control.title,
        requirementText: control.requirementText,
        riskWeight: String(control.riskWeight),
    });
    const handleSave = () => {
        updateMutation.mutate({
            fvId,
            ctrlId: control.id,
            data: {
                controlId: form.controlId,
                domain: form.domain || undefined,
                title: form.title,
                requirementText: form.requirementText,
                riskWeight: parseFloat(form.riskWeight) || 0.5,
            },
        }, { onSuccess: () => onSave() });
    };
    return (_jsxs("tr", { className: "bg-zinc-800/50", children: [_jsx("td", { className: "px-4 py-2", children: _jsx("input", { value: form.controlId, onChange: (e) => setForm({ ...form, controlId: e.target.value }), className: "w-full rounded border border-zinc-600 bg-zinc-700 px-2 py-1 font-mono text-xs text-primary-400 focus:border-primary-400 focus:outline-none" }) }), _jsx("td", { className: "px-4 py-2", children: _jsx("input", { value: form.domain, onChange: (e) => setForm({ ...form, domain: e.target.value }), className: "w-full rounded border border-zinc-600 bg-zinc-700 px-2 py-1 text-sm text-zinc-300 focus:border-primary-400 focus:outline-none" }) }), _jsx("td", { className: "px-4 py-2", children: _jsx("input", { value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }), className: "w-full rounded border border-zinc-600 bg-zinc-700 px-2 py-1 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" }) }), _jsx("td", { className: "px-4 py-2", children: _jsx("input", { value: form.riskWeight, onChange: (e) => setForm({ ...form, riskWeight: e.target.value }), className: "w-20 rounded border border-zinc-600 bg-zinc-700 px-2 py-1 text-right text-sm text-zinc-300 focus:border-primary-400 focus:outline-none" }) }), _jsx("td", { className: "px-4 py-2 text-right", children: _jsxs("div", { className: "flex items-center justify-end gap-1", children: [_jsx("button", { onClick: handleSave, disabled: updateMutation.isPending, className: "rounded bg-primary-400/10 p-1 text-primary-400 hover:bg-primary-400/20", title: "Save", children: _jsx(HugeiconsIcon, { icon: CheckmarkSquare01Icon, size: 14 }) }), _jsx("button", { onClick: onCancel, className: "rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300", title: "Cancel", children: _jsx(HugeiconsIcon, { icon: Cancel01Icon, size: 14 }) })] }) })] }));
}
function ImportTab({ workspaceId, onComplete }) {
    const [step, setStep] = useState(1);
    const [meta, setMeta] = useState({ name: '', slug: '', version: '', description: '', sourceOrg: '' });
    const [file, setFile] = useState(null);
    const [parsedRows, setParsedRows] = useState([]);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);
    const importMutation = useImportFramework(workspaceId);
    const handleFileSelect = useCallback(async (f) => {
        setFile(f);
        setError('');
        try {
            const text = await f.text();
            const rows = parseCSVClient(text);
            if (rows.length === 0) {
                setError('CSV file is empty or has no data rows.');
                return;
            }
            const requiredCols = ['control_id', 'title', 'requirement_text'];
            for (const col of requiredCols) {
                if (!(col in rows[0])) {
                    setError(`Missing required column: ${col}`);
                    return;
                }
            }
            setParsedRows(rows);
            setStep(3);
        }
        catch {
            setError('Failed to parse CSV file.');
        }
    }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f && (f.name.endsWith('.csv') || f.type === 'text/csv'))
            handleFileSelect(f);
        else
            setError('Please drop a .csv file.');
    }, [handleFileSelect]);
    const handleImport = () => {
        if (!file)
            return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', meta.name);
        formData.append('slug', meta.slug);
        formData.append('version', meta.version);
        if (meta.description)
            formData.append('description', meta.description);
        if (meta.sourceOrg)
            formData.append('sourceOrg', meta.sourceOrg);
        importMutation.mutate(formData, {
            onSuccess: () => {
                setStep(1);
                setFile(null);
                setParsedRows([]);
                setMeta({ name: '', slug: '', version: '', description: '', sourceOrg: '' });
                onComplete();
            },
            onError: (err) => setError(err.message),
        });
    };
    const downloadTemplate = () => {
        window.open(`/api/workspaces/${workspaceId}/frameworks/csv-template`, '_blank');
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-2", children: [[1, 2, 3, 4].map((s) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${s <= step ? 'bg-primary-400 text-zinc-950' : 'bg-zinc-800 text-zinc-500'}`, children: s }), s < 4 && _jsx("div", { className: `h-0.5 w-8 ${s < step ? 'bg-primary-400' : 'bg-zinc-800'}` })] }, s))), _jsxs("span", { className: "ml-3 text-sm text-zinc-400", children: [step === 1 && 'Framework details', step === 2 && 'Upload CSV', step === 3 && 'Preview data', step === 4 && 'Confirm import'] })] }), error && (_jsx("div", { className: "rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400", children: error })), step === 1 && (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-6", children: [_jsx("h3", { className: "mb-4 text-base font-semibold text-zinc-100", children: "Framework Details" }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsx(InputField, { label: "Framework Name *", value: meta.name, onChange: (v) => setMeta({ ...meta, name: v }), placeholder: "e.g. HIPAA Security Rule" }), _jsx(InputField, { label: "Slug *", value: meta.slug, onChange: (v) => setMeta({ ...meta, slug: v.toLowerCase().replace(/[^a-z0-9_-]/g, '_') }), placeholder: "e.g. hipaa_security" }), _jsx(InputField, { label: "Version *", value: meta.version, onChange: (v) => setMeta({ ...meta, version: v }), placeholder: "e.g. 2024" }), _jsx(InputField, { label: "Source Organization", value: meta.sourceOrg, onChange: (v) => setMeta({ ...meta, sourceOrg: v }), placeholder: "e.g. HHS" })] }), _jsx("div", { className: "mt-4", children: _jsx(InputField, { label: "Description", value: meta.description, onChange: (v) => setMeta({ ...meta, description: v }), placeholder: "Brief description..." }) }), _jsx("div", { className: "mt-6 flex justify-end", children: _jsx("button", { onClick: () => setStep(2), disabled: !meta.name || !meta.slug || !meta.version, className: "rounded-lg bg-primary-400 px-6 py-2 text-sm font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50", children: "Next" }) })] })), step === 2 && (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-6", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx("h3", { className: "text-base font-semibold text-zinc-100", children: "Upload CSV File" }), _jsxs("button", { onClick: downloadTemplate, className: "flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300", children: [_jsx(HugeiconsIcon, { icon: Download01Icon, size: 14 }), "Download Template"] })] }), _jsxs("div", { onDragOver: (e) => e.preventDefault(), onDrop: handleDrop, className: "flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-800/50 transition-colors hover:border-primary-400/50", onClick: () => fileInputRef.current?.click(), children: [_jsx(HugeiconsIcon, { icon: Upload01Icon, size: 32, className: "text-zinc-500" }), _jsxs("p", { className: "mt-3 text-sm text-zinc-400", children: ["Drag & drop your CSV file here, or ", _jsx("span", { className: "text-primary-400", children: "browse" })] }), _jsx("p", { className: "mt-1 text-xs text-zinc-600", children: "Required columns: control_id, title, requirement_text" }), _jsx("input", { ref: fileInputRef, type: "file", accept: ".csv", className: "hidden", onChange: (e) => {
                                    const f = e.target.files?.[0];
                                    if (f)
                                        handleFileSelect(f);
                                } })] }), _jsx("div", { className: "mt-4 flex justify-between", children: _jsx("button", { onClick: () => setStep(1), className: "rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-300", children: "Back" }) })] })), step === 3 && (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-6", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsxs("h3", { className: "text-base font-semibold text-zinc-100", children: ["Preview \u2014 ", parsedRows.length, " controls"] }), file && (_jsxs("div", { className: "flex items-center gap-2 text-xs text-zinc-500", children: [_jsx(HugeiconsIcon, { icon: File01Icon, size: 14 }), file.name, " (", (file.size / 1024).toFixed(1), " KB)"] }))] }), _jsx("div", { className: "max-h-[400px] overflow-auto rounded-lg border border-zinc-800", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { className: "sticky top-0 bg-zinc-800", children: _jsxs("tr", { className: "text-xs text-zinc-500", children: [_jsx("th", { className: "px-3 py-2 font-medium", children: "#" }), _jsx("th", { className: "px-3 py-2 font-medium", children: "Control ID" }), _jsx("th", { className: "px-3 py-2 font-medium", children: "Domain" }), _jsx("th", { className: "px-3 py-2 font-medium", children: "Title" }), _jsx("th", { className: "px-3 py-2 font-medium", children: "Risk" })] }) }), _jsx("tbody", { className: "divide-y divide-zinc-800/50", children: parsedRows.slice(0, 50).map((row, idx) => (_jsxs("tr", { className: "hover:bg-zinc-800/30", children: [_jsx("td", { className: "px-3 py-2 text-xs text-zinc-600", children: idx + 1 }), _jsx("td", { className: "px-3 py-2 font-mono text-xs text-primary-400", children: row.control_id }), _jsx("td", { className: "max-w-[150px] truncate px-3 py-2 text-zinc-400", children: row.domain }), _jsx("td", { className: "px-3 py-2 text-zinc-100", children: row.title }), _jsx("td", { className: "px-3 py-2 text-zinc-400", children: row.risk_weight || '0.5' })] }, idx))) })] }) }), parsedRows.length > 50 && (_jsxs("p", { className: "mt-2 text-xs text-zinc-500", children: ["Showing first 50 of ", parsedRows.length, " rows."] })), _jsxs("div", { className: "mt-4 flex justify-between", children: [_jsx("button", { onClick: () => { setStep(2); setParsedRows([]); setFile(null); }, className: "rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-300", children: "Back" }), _jsx("button", { onClick: () => setStep(4), className: "rounded-lg bg-primary-400 px-6 py-2 text-sm font-medium text-zinc-950 hover:bg-primary-300", children: "Looks Good \u2014 Next" })] })] })), step === 4 && (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-6", children: [_jsx("h3", { className: "mb-4 text-base font-semibold text-zinc-100", children: "Confirm Import" }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { className: "rounded-lg border border-zinc-800 bg-zinc-800/50 p-4", children: [_jsx("p", { className: "text-xs text-zinc-500", children: "Framework" }), _jsx("p", { className: "mt-1 text-sm font-medium text-zinc-100", children: meta.name })] }), _jsxs("div", { className: "rounded-lg border border-zinc-800 bg-zinc-800/50 p-4", children: [_jsx("p", { className: "text-xs text-zinc-500", children: "Version" }), _jsx("p", { className: "mt-1 text-sm font-medium text-zinc-100", children: meta.version })] }), _jsxs("div", { className: "rounded-lg border border-zinc-800 bg-zinc-800/50 p-4", children: [_jsx("p", { className: "text-xs text-zinc-500", children: "Slug" }), _jsx("p", { className: "mt-1 font-mono text-sm text-zinc-100", children: meta.slug })] }), _jsxs("div", { className: "rounded-lg border border-zinc-800 bg-zinc-800/50 p-4", children: [_jsx("p", { className: "text-xs text-zinc-500", children: "Controls" }), _jsxs("p", { className: "mt-1 text-sm font-medium text-primary-400", children: [parsedRows.length, " controls"] })] })] }), _jsxs("div", { className: "mt-6 flex justify-between", children: [_jsx("button", { onClick: () => setStep(3), className: "rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-300", children: "Back" }), _jsx("button", { onClick: handleImport, disabled: importMutation.isPending, className: "rounded-lg bg-primary-400 px-8 py-2 text-sm font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50", children: importMutation.isPending ? 'Importing...' : 'Import Framework' })] })] }))] }));
}
// ─── Shared Components ────────────────────────────────────────────────────────
function InputField({ label, value, onChange, placeholder, }) {
    return (_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: label }), _jsx("input", { value: value, onChange: (e) => onChange(e.target.value), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-primary-400 focus:outline-none", placeholder: placeholder })] }));
}
// ─── Client-side CSV parser ───────────────────────────────────────────────────
function parseCSVClient(text) {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2)
        return [];
    const headers = parseCsvLineClient(lines[0]);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLineClient(lines[i]);
        const row = {};
        headers.forEach((h, idx) => {
            row[h.trim().toLowerCase()] = (values[idx] ?? '').trim();
        });
        rows.push(row);
    }
    return rows;
}
function parseCsvLineClient(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            }
            else {
                inQuotes = !inQuotes;
            }
        }
        else if (ch === ',' && !inQuotes) {
            result.push(current);
            current = '';
        }
        else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}
//# sourceMappingURL=frameworks.js.map