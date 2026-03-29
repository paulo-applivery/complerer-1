import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useRisks, useCreateRisk } from '@/hooks/use-settings';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, PlusSignIcon, Cancel01Icon, LoaderPinwheelIcon, ArrowDown01Icon, ArrowUp01Icon, } from '@hugeicons/core-free-icons';
export function RiskRegisterPage() {
    const params = useParams({ strict: false });
    const workspaceId = params.workspaceId;
    const { risks, isLoading } = useRisks(workspaceId);
    const createMutation = useCreateRisk(workspaceId);
    const [showForm, setShowForm] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [form, setForm] = useState({
        title: '',
        description: '',
        asset: '',
        threat: '',
        vulnerability: '',
        likelihood: '3',
        impact: '3',
        treatment: 'mitigate',
        owner: '',
        reviewDate: '',
    });
    const handleSubmit = () => {
        if (!form.title.trim())
            return;
        createMutation.mutate({
            title: form.title,
            description: form.description || undefined,
            asset: form.asset || undefined,
            threat: form.threat || undefined,
            vulnerability: form.vulnerability || undefined,
            likelihood: Number(form.likelihood),
            impact: Number(form.impact),
            treatment: form.treatment,
            owner: form.owner || undefined,
            reviewDate: form.reviewDate || undefined,
        }, {
            onSuccess: () => {
                setForm({
                    title: '', description: '', asset: '', threat: '', vulnerability: '',
                    likelihood: '3', impact: '3', treatment: 'mitigate', owner: '', reviewDate: '',
                });
                setShowForm(false);
            },
        });
    };
    const riskColor = (score) => {
        if (score >= 16)
            return 'bg-red-500/10 text-red-400';
        if (score >= 10)
            return 'bg-orange-500/10 text-orange-400';
        if (score >= 5)
            return 'bg-yellow-500/10 text-yellow-400';
        return 'bg-primary-400/10 text-primary-400';
    };
    const treatmentBadge = (treatment) => {
        switch (treatment) {
            case 'mitigate':
                return 'bg-blue-500/10 text-blue-400';
            case 'accept':
                return 'bg-primary-400/10 text-primary-400';
            case 'transfer':
                return 'bg-purple-500/10 text-purple-400';
            case 'avoid':
                return 'bg-red-500/10 text-red-400';
            default:
                return 'bg-zinc-500/10 text-zinc-400';
        }
    };
    const statusBadge = (status) => {
        switch (status) {
            case 'open':
                return 'bg-red-500/10 text-red-400';
            case 'mitigated':
                return 'bg-primary-400/10 text-primary-400';
            case 'accepted':
                return 'bg-amber-500/10 text-amber-400';
            case 'closed':
                return 'bg-zinc-500/10 text-zinc-400';
            default:
                return 'bg-zinc-500/10 text-zinc-400';
        }
    };
    // Build heatmap data
    const heatmapData = {};
    risks.forEach((r) => {
        const key = `${r.likelihood}-${r.impact}`;
        heatmapData[key] = (heatmapData[key] || 0) + 1;
    });
    const heatmapCellColor = (likelihood, impact) => {
        const score = likelihood * impact;
        if (score >= 16)
            return 'bg-red-500';
        if (score >= 10)
            return 'bg-orange-500';
        if (score >= 5)
            return 'bg-yellow-500';
        return 'bg-green-500';
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-zinc-100", children: "Risk Register" }), _jsx("p", { className: "mt-1 text-sm text-zinc-400", children: "Identify, assess, and track risks across your organization." })] }), _jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsx("h2", { className: "mb-4 text-lg font-semibold text-zinc-100", children: "Risk Heatmap" }), _jsxs("div", { className: "flex items-end gap-4", children: [_jsx("div", { className: "flex flex-col items-center justify-center", children: _jsx("span", { className: "mb-2 text-xs font-medium text-zinc-500 [writing-mode:vertical-lr] rotate-180", children: "Likelihood" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "grid grid-cols-5 gap-1.5", style: { direction: 'ltr' }, children: [5, 4, 3, 2, 1].map((likelihood) => [1, 2, 3, 4, 5].map((impact) => {
                                            const count = heatmapData[`${likelihood}-${impact}`] || 0;
                                            return (_jsx("div", { className: `flex h-12 items-center justify-center rounded-lg text-sm font-semibold text-white ${heatmapCellColor(likelihood, impact)} ${count > 0 ? 'opacity-100' : 'opacity-30'}`, children: count > 0 ? count : '' }, `${likelihood}-${impact}`));
                                        })) }), _jsx("div", { className: "mt-2 grid grid-cols-5 gap-1.5", children: [1, 2, 3, 4, 5].map((i) => (_jsx("div", { className: "text-center text-xs text-zinc-500", children: i }, i))) }), _jsx("p", { className: "mt-1 text-center text-xs font-medium text-zinc-500", children: "Impact" })] })] }), _jsxs("div", { className: "mt-4 flex items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("div", { className: "h-3 w-3 rounded bg-green-500" }), _jsx("span", { className: "text-xs text-zinc-400", children: "Low (1-4)" })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("div", { className: "h-3 w-3 rounded bg-yellow-500" }), _jsx("span", { className: "text-xs text-zinc-400", children: "Medium (5-9)" })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("div", { className: "h-3 w-3 rounded bg-orange-500" }), _jsx("span", { className: "text-xs text-zinc-400", children: "High (10-15)" })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("div", { className: "h-3 w-3 rounded bg-red-500" }), _jsx("span", { className: "text-xs text-zinc-400", children: "Critical (16-25)" })] })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold text-zinc-100", children: "Risk List" }), _jsxs("button", { onClick: () => setShowForm(!showForm), className: "flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300", children: [showForm ? _jsx(HugeiconsIcon, { icon: Cancel01Icon, size: 16 }) : _jsx(HugeiconsIcon, { icon: PlusSignIcon, size: 16 }), showForm ? 'Cancel' : 'Add Risk'] })] }), showForm && (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsx("h3", { className: "mb-4 text-sm font-semibold text-zinc-100", children: "New Risk" }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Title *" }), _jsx("input", { value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "e.g. Unauthorized data access" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Asset" }), _jsx("input", { value: form.asset, onChange: (e) => setForm({ ...form, asset: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "e.g. Customer Database" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Threat" }), _jsx("input", { value: form.threat, onChange: (e) => setForm({ ...form, threat: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "e.g. External attacker" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Vulnerability" }), _jsx("input", { value: form.vulnerability, onChange: (e) => setForm({ ...form, vulnerability: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "e.g. Weak authentication" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Likelihood (1-5)" }), _jsx("select", { value: form.likelihood, onChange: (e) => setForm({ ...form, likelihood: e.target.value }), className: "w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: [1, 2, 3, 4, 5].map((v) => (_jsxs("option", { value: v, children: [v, " - ", ['Very Low', 'Low', 'Medium', 'High', 'Very High'][v - 1]] }, v))) })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Impact (1-5)" }), _jsx("select", { value: form.impact, onChange: (e) => setForm({ ...form, impact: e.target.value }), className: "w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: [1, 2, 3, 4, 5].map((v) => (_jsxs("option", { value: v, children: [v, " - ", ['Negligible', 'Minor', 'Moderate', 'Major', 'Severe'][v - 1]] }, v))) })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Treatment" }), _jsxs("select", { value: form.treatment, onChange: (e) => setForm({ ...form, treatment: e.target.value }), className: "w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "mitigate", children: "Mitigate" }), _jsx("option", { value: "accept", children: "Accept" }), _jsx("option", { value: "transfer", children: "Transfer" }), _jsx("option", { value: "avoid", children: "Avoid" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Owner" }), _jsx("input", { value: form.owner, onChange: (e) => setForm({ ...form, owner: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "e.g. security-team@company.com" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Review Date" }), _jsx("input", { type: "date", value: form.reviewDate, onChange: (e) => setForm({ ...form, reviewDate: e.target.value }), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" })] }), _jsxs("div", { className: "sm:col-span-2 lg:col-span-3", children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-400", children: "Description" }), _jsx("textarea", { value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }), rows: 2, className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "Describe this risk..." })] })] }), _jsx("div", { className: "mt-4 flex justify-end", children: _jsx("button", { onClick: handleSubmit, disabled: !form.title.trim() || createMutation.isPending, className: "rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50", children: createMutation.isPending ? 'Creating...' : 'Create Risk' }) })] })), _jsx("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900", children: isLoading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 20, className: "animate-spin text-zinc-500" }) })) : risks.length === 0 ? (_jsxs("div", { className: "py-12 text-center", children: [_jsx(HugeiconsIcon, { icon: Alert02Icon, size: 32, className: "mx-auto text-zinc-600" }), _jsx("p", { className: "mt-3 text-sm text-zinc-400", children: "No risks registered yet." })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-zinc-800 text-xs text-zinc-500", children: [_jsx("th", { className: "w-8 px-3 py-3" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Title" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Asset" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Likelihood" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Impact" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Inherent Risk" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Treatment" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Status" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Owner" })] }) }), _jsx("tbody", { className: "divide-y divide-zinc-800/50", children: risks.map((risk) => (_jsx(RiskRow, { risk: risk, isExpanded: expandedId === risk.id, onToggleExpand: () => setExpandedId(expandedId === risk.id ? null : risk.id), riskColor: riskColor, treatmentBadge: treatmentBadge, statusBadge: statusBadge }, risk.id))) })] }) })) })] }));
}
// ── Risk Row ────────────────────────────────────────────────────────────────
function RiskRow({ risk, isExpanded, onToggleExpand, riskColor, treatmentBadge, statusBadge, }) {
    return (_jsxs(_Fragment, { children: [_jsxs("tr", { className: "transition-colors hover:bg-zinc-800/30", children: [_jsx("td", { className: "px-3 py-3", children: _jsx("button", { onClick: onToggleExpand, className: "text-zinc-500 hover:text-zinc-300", children: isExpanded ? (_jsx(HugeiconsIcon, { icon: ArrowUp01Icon, size: 16 })) : (_jsx(HugeiconsIcon, { icon: ArrowDown01Icon, size: 16 })) }) }), _jsx("td", { className: "px-5 py-3 font-medium text-zinc-100", children: risk.title }), _jsx("td", { className: "px-5 py-3 text-zinc-400", children: risk.asset ?? '—' }), _jsx("td", { className: "px-5 py-3 text-zinc-300", children: risk.likelihood }), _jsx("td", { className: "px-5 py-3 text-zinc-300", children: risk.impact }), _jsx("td", { className: "px-5 py-3", children: _jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${riskColor(risk.inherentRisk)}`, children: risk.inherentRisk }) }), _jsx("td", { className: "px-5 py-3", children: _jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${treatmentBadge(risk.treatment)}`, children: risk.treatment }) }), _jsx("td", { className: "px-5 py-3", children: _jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(risk.status)}`, children: risk.status }) }), _jsx("td", { className: "px-5 py-3 text-zinc-400", children: risk.owner ?? '—' })] }), isExpanded && (_jsx("tr", { children: _jsx("td", { colSpan: 9, className: "border-b border-zinc-800 bg-zinc-900/50 px-5 py-4", children: _jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [_jsxs("div", { children: [_jsx("h4", { className: "mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500", children: "Threat" }), _jsx("p", { className: "text-sm text-zinc-300", children: risk.threat || 'Not specified' })] }), _jsxs("div", { children: [_jsx("h4", { className: "mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500", children: "Vulnerability" }), _jsx("p", { className: "text-sm text-zinc-300", children: risk.vulnerability || 'Not specified' })] }), _jsxs("div", { children: [_jsx("h4", { className: "mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500", children: "Controls Applied" }), risk.controls.length === 0 ? (_jsx("p", { className: "text-sm text-zinc-500", children: "No controls linked" })) : (_jsx("div", { className: "flex flex-wrap gap-1.5", children: risk.controls.map((control, idx) => (_jsx("span", { className: "rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300", children: control }, idx))) }))] })] }) }) }))] }));
}
//# sourceMappingURL=risk-register.js.map