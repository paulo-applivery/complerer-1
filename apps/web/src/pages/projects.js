import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlusSignIcon, Cancel01Icon, ArrowRight01Icon, ArrowLeft01Icon, Shield01Icon, FileValidationIcon, CheckmarkCircle01Icon, Folder01Icon, } from '@hugeicons/core-free-icons';
import { useProjects, useCreateProject } from '@/hooks/use-projects';
import { useFrameworks, useFrameworkVersions } from '@/hooks/use-frameworks';
// ── Status Config ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
    planning: { label: 'Planning', color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
    in_progress: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    audit_ready: { label: 'Audit Ready', color: 'text-green-400', bg: 'bg-green-500/10' },
    in_audit: { label: 'In Audit', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    archived: { label: 'Archived', color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
};
function formatDate(d) {
    if (!d)
        return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
function daysUntil(d) {
    if (!d)
        return null;
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0)
        return `${Math.abs(diff)}d overdue`;
    if (diff === 0)
        return 'Today';
    return `${diff}d left`;
}
// ── Project Card ───────────────────────────────────────────────────────
function ProjectCard({ project, onClick }) {
    const sc = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.planning;
    const coverage = project.controlsTotal > 0
        ? Math.round((project.controlsCovered / project.controlsTotal) * 100)
        : 0;
    const deadline = daysUntil(project.targetCompletionDate);
    return (_jsxs("button", { onClick: onClick, className: "group w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-left transition-all hover:border-zinc-700 hover:bg-zinc-800/50 hover:shadow-lg hover:shadow-zinc-950/50", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "rounded-md bg-primary-400/10 px-2 py-0.5 text-[10px] font-semibold text-primary-400", children: project.frameworkName }), _jsxs("span", { className: "text-[10px] text-zinc-500", children: ["v", project.frameworkVersion] })] }), _jsx("h3", { className: "text-base font-semibold text-zinc-100 group-hover:text-white truncate", children: project.name }), project.description && (_jsx("p", { className: "mt-1 text-xs text-zinc-500 line-clamp-2", children: project.description }))] }), _jsx("span", { className: `shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${sc.bg} ${sc.color}`, children: sc.label })] }), _jsxs("div", { className: "mt-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [_jsx("span", { className: "text-xs text-zinc-400", children: "Coverage" }), _jsxs("span", { className: "text-xs font-semibold text-zinc-200", children: [coverage, "%"] })] }), _jsx("div", { className: "h-2 w-full overflow-hidden rounded-full bg-zinc-800", children: _jsx("div", { className: `h-2 rounded-full transition-all duration-500 ${coverage >= 80 ? 'bg-green-400' : coverage >= 50 ? 'bg-amber-400' : coverage > 0 ? 'bg-blue-400' : 'bg-zinc-700'}`, style: { width: `${Math.max(coverage, 1)}%` } }) })] }), _jsxs("div", { className: "mt-4 flex items-center gap-4 text-xs", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(HugeiconsIcon, { icon: Shield01Icon, size: 12, className: "text-zinc-500" }), _jsxs("span", { className: "text-zinc-400", children: [_jsx("span", { className: "font-medium text-zinc-200", children: project.controlsCovered }), "/", project.controlsTotal, " controls"] })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(HugeiconsIcon, { icon: FileValidationIcon, size: 12, className: "text-zinc-500" }), _jsxs("span", { className: "text-zinc-400", children: [project.evidenceCount, " evidence"] })] })] }), _jsxs("div", { className: "mt-4 flex items-center justify-between border-t border-zinc-800 pt-3", children: [_jsxs("div", { className: "flex items-center gap-3 text-[10px] text-zinc-500", children: [project.auditPeriodStart && (_jsxs("span", { children: [formatDate(project.auditPeriodStart), " \u2192 ", formatDate(project.auditPeriodEnd)] })), project.auditorFirm && (_jsxs("span", { children: ["Auditor: ", project.auditorFirm] }))] }), deadline && (_jsx("span", { className: `text-[10px] font-medium ${deadline.includes('overdue') ? 'text-red-400' : 'text-zinc-400'}`, children: deadline }))] })] }));
}
// ── Main Page ──────────────────────────────────────────────────────────
export function ProjectsPage() {
    const params = useParams({ strict: false });
    const workspaceId = params.workspaceId;
    const navigate = useNavigate();
    const { projects, isLoading } = useProjects(workspaceId);
    const [showWizard, setShowWizard] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const filtered = statusFilter
        ? projects.filter(p => p.status === statusFilter)
        : projects;
    const activeCount = projects.filter(p => !['completed', 'archived'].includes(p.status)).length;
    const totalControls = projects.reduce((s, p) => s + p.controlsTotal, 0);
    const totalCovered = projects.reduce((s, p) => s + p.controlsCovered, 0);
    const avgCoverage = totalControls > 0 ? Math.round((totalCovered / totalControls) * 100) : 0;
    if (isLoading) {
        return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "h-10 animate-pulse rounded-xl bg-zinc-800" }), _jsx("div", { className: "grid gap-4 md:grid-cols-3", children: [1, 2, 3].map(i => _jsx("div", { className: "h-24 animate-pulse rounded-xl bg-zinc-800" }, i)) }), _jsx("div", { className: "grid gap-4 md:grid-cols-2", children: [1, 2].map(i => _jsx("div", { className: "h-64 animate-pulse rounded-xl bg-zinc-800" }, i)) })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-zinc-100", children: "Compliance Projects" }), _jsx("p", { className: "mt-1 text-sm text-zinc-400", children: "Track certification efforts across frameworks with dedicated progress tracking." })] }), _jsxs("button", { onClick: () => setShowWizard(true), className: "flex shrink-0 items-center gap-2 rounded-xl bg-primary-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-primary-300 hover:shadow-lg hover:shadow-primary-400/20", children: [_jsx(HugeiconsIcon, { icon: PlusSignIcon, size: 16 }), "New Project"] })] }), projects.length > 0 && (_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-4", children: [_jsx("p", { className: "text-xs text-zinc-500", children: "Active Projects" }), _jsx("p", { className: "mt-1 text-2xl font-bold text-zinc-100", children: activeCount })] }), _jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-4", children: [_jsx("p", { className: "text-xs text-zinc-500", children: "Total Controls" }), _jsx("p", { className: "mt-1 text-2xl font-bold text-zinc-100", children: totalControls })] }), _jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-4", children: [_jsx("p", { className: "text-xs text-zinc-500", children: "Average Coverage" }), _jsxs("p", { className: "mt-1 text-2xl font-bold text-zinc-100", children: [avgCoverage, "%"] })] })] })), projects.length > 0 && (_jsxs("div", { className: "flex flex-wrap items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1", children: [_jsxs("button", { onClick: () => setStatusFilter(''), className: `rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${!statusFilter ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`, children: ["All (", projects.length, ")"] }), Object.entries(STATUS_CONFIG).map(([key, val]) => {
                        const count = projects.filter(p => p.status === key).length;
                        if (count === 0)
                            return null;
                        return (_jsxs("button", { onClick: () => setStatusFilter(statusFilter === key ? '' : key), className: `rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === key ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`, children: [val.label, " (", count, ")"] }, key));
                    })] })), filtered.length === 0 && projects.length === 0 ? (_jsxs("div", { className: "rounded-2xl border border-zinc-800 bg-zinc-900 py-20 text-center", children: [_jsx("div", { className: "mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-400/10", children: _jsx(HugeiconsIcon, { icon: Folder01Icon, size: 28, className: "text-primary-400" }) }), _jsx("h2", { className: "mt-6 text-lg font-semibold text-zinc-100", children: "No compliance projects yet" }), _jsx("p", { className: "mx-auto mt-2 max-w-md text-sm text-zinc-500", children: "Create your first compliance project to start tracking a certification effort. Each project is scoped to a specific framework and audit period." }), _jsxs("button", { onClick: () => setShowWizard(true), className: "mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-400 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-primary-300 hover:shadow-lg hover:shadow-primary-400/20", children: [_jsx(HugeiconsIcon, { icon: PlusSignIcon, size: 16 }), "Create First Project"] })] })) : filtered.length === 0 ? (_jsx("div", { className: "py-12 text-center text-sm text-zinc-500", children: "No projects match this filter." })) : (_jsx("div", { className: "grid gap-4 md:grid-cols-2", children: filtered.map((project) => (_jsx(ProjectCard, { project: project, onClick: () => navigate({ to: '/w/$workspaceId/projects/$projectId', params: { workspaceId: workspaceId, projectId: project.id } }) }, project.id))) })), showWizard && (_jsx(NewProjectWizard, { workspaceId: workspaceId, onClose: () => setShowWizard(false) }))] }));
}
// ── New Project Wizard ─────────────────────────────────────────────────
function NewProjectWizard({ workspaceId, onClose }) {
    const navigate = useNavigate();
    const createMutation = useCreateProject(workspaceId);
    const { frameworks, isLoading: fwLoading } = useFrameworks(workspaceId);
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        name: '',
        description: '',
        auditorName: '',
        auditorFirm: '',
        frameworkId: '',
        frameworkVersionId: '',
        auditPeriodStart: '',
        auditPeriodEnd: '',
        targetCompletionDate: '',
    });
    // Fetch versions when framework selected
    const { versions } = useFrameworkVersions(workspaceId, frameworks.find(f => f.id === form.frameworkId)?.slug ?? '');
    // Auto-select latest version
    useEffect(() => {
        if (versions.length > 0 && !form.frameworkVersionId) {
            setForm(prev => ({ ...prev, frameworkVersionId: versions[0].id }));
        }
    }, [versions, form.frameworkVersionId]);
    const handleCreate = () => {
        createMutation.mutate({
            name: form.name,
            description: form.description || undefined,
            frameworkId: form.frameworkId,
            frameworkVersionId: form.frameworkVersionId,
            auditorName: form.auditorName || undefined,
            auditorFirm: form.auditorFirm || undefined,
            auditPeriodStart: form.auditPeriodStart || undefined,
            auditPeriodEnd: form.auditPeriodEnd || undefined,
            targetCompletionDate: form.targetCompletionDate || undefined,
        }, {
            onSuccess: (data) => {
                onClose();
                if (data?.project?.id) {
                    navigate({ to: '/w/$workspaceId/projects/$projectId', params: { workspaceId: workspaceId, projectId: data.project.id } });
                }
            },
        });
    };
    const canProceed = step === 1 ? form.name.trim() : step === 2 ? form.frameworkId && form.frameworkVersionId : true;
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm", onClick: onClose, children: _jsxs("div", { className: "w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl max-h-[90vh] overflow-y-auto", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between border-b border-zinc-800 px-6 py-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-zinc-100", children: "New Compliance Project" }), _jsxs("p", { className: "mt-0.5 text-xs text-zinc-500", children: ["Step ", step, " of 3"] })] }), _jsx("button", { onClick: onClose, className: "text-zinc-500 hover:text-zinc-300", children: _jsx(HugeiconsIcon, { icon: Cancel01Icon, size: 18 }) })] }), _jsx("div", { className: "flex gap-1 px-6 pt-4", children: [1, 2, 3].map(s => (_jsx("div", { className: `h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary-400' : 'bg-zinc-800'}` }, s))) }), _jsxs("div", { className: "px-6 py-5", children: [step === 1 && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-zinc-200", children: "Project Name *" }), _jsx("input", { value: form.name, onChange: e => setForm({ ...form, name: e.target.value }), placeholder: "e.g. SOC 2 Type II \u2014 2025", autoFocus: true, className: "w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-zinc-200", children: "Description" }), _jsx("textarea", { value: form.description, onChange: e => setForm({ ...form, description: e.target.value }), placeholder: "What is this certification effort about?", rows: 2, className: "w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-zinc-200", children: "Auditor Name" }), _jsx("input", { value: form.auditorName, onChange: e => setForm({ ...form, auditorName: e.target.value }), placeholder: "John Smith", className: "w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-zinc-200", children: "Audit Firm" }), _jsx("input", { value: form.auditorFirm, onChange: e => setForm({ ...form, auditorFirm: e.target.value }), placeholder: "Deloitte", className: "w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none" })] })] })] })), step === 2 && (_jsxs("div", { className: "space-y-3", children: [_jsx("p", { className: "text-sm text-zinc-400", children: "Select the framework for this certification project." }), fwLoading ? (_jsx("div", { className: "py-8 text-center text-xs text-zinc-500", children: "Loading frameworks..." })) : (_jsx("div", { className: "max-h-[300px] space-y-2 overflow-y-auto pr-1", children: frameworks.map(fw => {
                                        const selected = form.frameworkId === fw.id;
                                        return (_jsx("button", { onClick: () => setForm({ ...form, frameworkId: fw.id, frameworkVersionId: '' }), className: `w-full rounded-xl border p-4 text-left transition-all ${selected ? 'border-primary-400 bg-primary-400/5' : 'border-zinc-800 bg-zinc-800/50 hover:border-zinc-700'}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-zinc-100", children: fw.name }), fw.description && _jsx("p", { className: "mt-0.5 text-xs text-zinc-500 line-clamp-1", children: fw.description })] }), selected && _jsx(HugeiconsIcon, { icon: CheckmarkCircle01Icon, size: 18, className: "text-primary-400" })] }) }, fw.id));
                                    }) })), form.frameworkId && versions.length > 0 && (_jsxs("div", { className: "mt-3", children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Version" }), _jsx("select", { value: form.frameworkVersionId, onChange: e => setForm({ ...form, frameworkVersionId: e.target.value }), className: "w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: versions.map(v => _jsxs("option", { value: v.id, children: ["v", v.version, " (", v.status, ")"] }, v.id)) })] }))] })), step === 3 && (_jsxs("div", { className: "space-y-4", children: [_jsx("p", { className: "text-sm text-zinc-400", children: "Set the audit period and target completion date." }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-zinc-200", children: "Audit Period Start" }), _jsx("input", { type: "date", value: form.auditPeriodStart, onChange: e => setForm({ ...form, auditPeriodStart: e.target.value }), className: "w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-zinc-200", children: "Audit Period End" }), _jsx("input", { type: "date", value: form.auditPeriodEnd, onChange: e => setForm({ ...form, auditPeriodEnd: e.target.value }), className: "w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-zinc-200", children: "Target Completion" }), _jsx("input", { type: "date", value: form.targetCompletionDate, onChange: e => setForm({ ...form, targetCompletionDate: e.target.value }), className: "w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" })] }), _jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-800/30 p-4", children: [_jsx("p", { className: "text-xs font-semibold text-zinc-300 mb-2", children: "Summary" }), _jsxs("div", { className: "space-y-1 text-xs text-zinc-400", children: [_jsxs("p", { children: [_jsx("span", { className: "text-zinc-500", children: "Project:" }), " ", form.name] }), _jsxs("p", { children: [_jsx("span", { className: "text-zinc-500", children: "Framework:" }), " ", frameworks.find(f => f.id === form.frameworkId)?.name ?? '—'] }), form.auditorFirm && _jsxs("p", { children: [_jsx("span", { className: "text-zinc-500", children: "Auditor:" }), " ", form.auditorFirm] }), form.auditPeriodStart && _jsxs("p", { children: [_jsx("span", { className: "text-zinc-500", children: "Period:" }), " ", form.auditPeriodStart, " \u2192 ", form.auditPeriodEnd || '—'] })] })] })] }))] }), _jsxs("div", { className: "flex items-center justify-between border-t border-zinc-800 px-6 py-4", children: [_jsxs("button", { onClick: () => step > 1 ? setStep(step - 1) : onClose(), className: "flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200", children: [_jsx(HugeiconsIcon, { icon: ArrowLeft01Icon, size: 14 }), step > 1 ? 'Back' : 'Cancel'] }), step < 3 ? (_jsxs("button", { onClick: () => setStep(step + 1), disabled: !canProceed, className: "flex items-center gap-1.5 rounded-xl bg-primary-400 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-primary-300 disabled:opacity-50", children: ["Continue ", _jsx(HugeiconsIcon, { icon: ArrowRight01Icon, size: 14 })] })) : (_jsx("button", { onClick: handleCreate, disabled: createMutation.isPending, className: "flex items-center gap-1.5 rounded-xl bg-primary-400 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-primary-300 disabled:opacity-50", children: createMutation.isPending ? 'Creating...' : 'Create Project' }))] })] }) }));
}
//# sourceMappingURL=projects.js.map