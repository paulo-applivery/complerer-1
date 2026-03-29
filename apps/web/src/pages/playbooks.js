import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { Book02Icon, Search01Icon, LoaderPinwheelIcon, ArrowLeft01Icon, ArrowRight01Icon, CheckmarkCircle01Icon, Clock01Icon, Alert02Icon, ThumbsUpIcon, Layers01Icon, StarIcon, FlashIcon, } from '@hugeicons/core-free-icons';
import { useAdoptedControls, usePlaybook } from '@/hooks/use-playbooks';
export function PlaybooksPage() {
    const params = useParams({ strict: false });
    const workspaceId = params.workspaceId;
    const [search, setSearch] = useState('');
    const [selectedControlId, setSelectedControlId] = useState(null);
    const [page, setPage] = useState(1);
    const { controls, isLoading } = useAdoptedControls(workspaceId);
    // Client-side filter by search
    const filtered = search
        ? controls.filter((c) => c.title?.toLowerCase().includes(search.toLowerCase()) ||
            c.control_id?.toLowerCase().includes(search.toLowerCase()) ||
            c.framework_name?.toLowerCase().includes(search.toLowerCase()))
        : controls;
    const limit = 20;
    const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
    const paged = filtered.slice((page - 1) * limit, page * limit);
    if (selectedControlId) {
        return (_jsx(PlaybookDetail, { workspaceId: workspaceId, controlId: selectedControlId, onBack: () => setSelectedControlId(null) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-zinc-100", children: "Community Playbooks" }), _jsx("p", { className: "mt-1 text-sm text-zinc-400", children: "Step-by-step guides for satisfying compliance controls, with evidence patterns and community tips." })] }), _jsxs("div", { className: "relative max-w-md", children: [_jsx(HugeiconsIcon, { icon: Search01Icon, size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" }), _jsx("input", { value: search, onChange: (e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }, className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none", placeholder: "Search controls by ID, title, or framework..." })] }), isLoading ? (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 20, className: "animate-spin text-zinc-500" }) })) : filtered.length === 0 ? (_jsxs("div", { className: "py-16 text-center", children: [_jsx(HugeiconsIcon, { icon: Book02Icon, size: 40, className: "mx-auto text-zinc-600" }), _jsx("p", { className: "mt-4 text-sm text-zinc-400", children: search ? 'No controls match your search.' : 'No adopted controls yet. Adopt a framework to browse playbooks.' })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "grid gap-3 md:grid-cols-2 xl:grid-cols-3", children: paged.map((ctrl) => (_jsxs("button", { onClick: () => setSelectedControlId(ctrl.id), className: "group rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-left transition-all hover:border-zinc-700 hover:bg-zinc-800/50", children: [_jsxs("div", { className: "mb-2 flex items-start justify-between gap-2", children: [_jsx("span", { className: "rounded-md bg-primary-400/10 px-2 py-0.5 text-xs font-mono font-medium text-primary-400", children: ctrl.control_id }), _jsx("span", { className: "shrink-0 rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-500", children: ctrl.framework_name })] }), _jsx("h3", { className: "text-sm font-semibold text-zinc-100 group-hover:text-primary-400 transition-colors line-clamp-2", children: ctrl.title }), ctrl.domain && (_jsxs("p", { className: "mt-1 text-xs text-zinc-500", children: [ctrl.domain, ctrl.subdomain ? ` / ${ctrl.subdomain}` : ''] })), _jsx("p", { className: "mt-2 text-xs text-zinc-500 line-clamp-2", children: ctrl.requirement_text }), _jsxs("div", { className: "mt-3 flex items-center gap-1 text-xs text-zinc-600 group-hover:text-zinc-500", children: [_jsx(HugeiconsIcon, { icon: Book02Icon, size: 12 }), "View Playbook"] })] }, ctrl.id))) }), totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("p", { className: "text-xs text-zinc-500", children: ["Showing ", (page - 1) * limit + 1, "\u2013", Math.min(page * limit, filtered.length), " of ", filtered.length, " controls"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1, className: "rounded-lg border border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-40", children: _jsx(HugeiconsIcon, { icon: ArrowLeft01Icon, size: 16 }) }), _jsxs("span", { className: "text-xs text-zinc-400", children: [page, " / ", totalPages] }), _jsx("button", { onClick: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page === totalPages, className: "rounded-lg border border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-40", children: _jsx(HugeiconsIcon, { icon: ArrowRight01Icon, size: 16 }) })] })] }))] }))] }));
}
// ── Playbook Detail ──────────────────────────────────────────────────────────
function PlaybookDetail({ workspaceId, controlId, onBack, }) {
    const { playbook, evidencePatterns, tips, isLoading } = usePlaybook(workspaceId, controlId);
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 20, className: "animate-spin text-zinc-500" }) }));
    }
    if (!playbook) {
        return (_jsxs("div", { className: "py-16 text-center", children: [_jsx(HugeiconsIcon, { icon: Alert02Icon, size: 40, className: "mx-auto text-zinc-600" }), _jsx("p", { className: "mt-4 text-sm text-zinc-400", children: "Playbook not found." }), _jsx("button", { onClick: onBack, className: "mt-2 text-xs text-primary-400 hover:underline", children: "Back to list" })] }));
    }
    const difficultyLabel = (d) => {
        if (d <= 1.5)
            return { text: 'Easy', color: 'text-primary-400 bg-primary-400/10' };
        if (d <= 2.5)
            return { text: 'Moderate', color: 'text-amber-400 bg-amber-400/10' };
        if (d <= 3.5)
            return { text: 'Complex', color: 'text-orange-400 bg-orange-400/10' };
        return { text: 'Advanced', color: 'text-red-400 bg-red-400/10' };
    };
    const diff = difficultyLabel(playbook.difficulty_rating);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("button", { onClick: onBack, className: "mb-4 flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300", children: [_jsx(HugeiconsIcon, { icon: ArrowLeft01Icon, size: 14 }), "Back to Playbooks"] }), _jsx("h1", { className: "text-2xl font-bold text-zinc-100", children: playbook.title }), _jsx("p", { className: "mt-2 text-sm text-zinc-400", children: playbook.summary }), _jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-3", children: [_jsxs("span", { className: `flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${diff.color}`, children: [_jsx(HugeiconsIcon, { icon: FlashIcon, size: 12 }), diff.text] }), _jsxs("span", { className: "flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300", children: [_jsx(HugeiconsIcon, { icon: Clock01Icon, size: 12 }), "~", playbook.estimated_effort_hours, "h effort"] }), playbook.avg_audit_pass_rate !== null && (_jsxs("span", { className: "flex items-center gap-1 rounded-full bg-primary-400/10 px-2.5 py-0.5 text-xs font-medium text-primary-400", children: [_jsx(HugeiconsIcon, { icon: CheckmarkCircle01Icon, size: 12 }), (playbook.avg_audit_pass_rate * 100).toFixed(0), "% audit pass"] })), _jsxs("span", { className: "flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400", children: [_jsx(HugeiconsIcon, { icon: Layers01Icon, size: 12 }), playbook.source === 'ai_generated' ? 'AI Generated' : `${playbook.contributor_count} contributors`] })] })] }), _jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsxs("h2", { className: "mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-100", children: [_jsx(HugeiconsIcon, { icon: CheckmarkCircle01Icon, size: 16, className: "text-primary-400" }), "Evidence Patterns"] }), evidencePatterns.length === 0 ? (_jsx("p", { className: "text-xs text-zinc-500", children: "No evidence patterns documented yet." })) : (_jsx("div", { className: "space-y-3", children: evidencePatterns.map((pattern) => (_jsx(EvidencePatternCard, { pattern: pattern }, pattern.id))) }))] }), _jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsxs("h2", { className: "mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-100", children: [_jsx(HugeiconsIcon, { icon: StarIcon, size: 16, className: "text-amber-400" }), "Community Tips"] }), tips.length === 0 ? (_jsx("p", { className: "text-xs text-zinc-500", children: "No community tips available yet." })) : (_jsx("div", { className: "space-y-3", children: tips.map((tip) => (_jsx(TipCard, { tip: tip }, tip.id))) }))] })] }));
}
// ── Evidence Pattern Card ────────────────────────────────────────────────────
function EvidencePatternCard({ pattern }) {
    const acceptanceColor = pattern.auditor_acceptance_rate >= 0.8
        ? 'text-primary-400'
        : pattern.auditor_acceptance_rate >= 0.6
            ? 'text-amber-400'
            : 'text-red-400';
    return (_jsx("div", { className: "rounded-lg border border-zinc-800 bg-zinc-800/30 p-4", children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-sm font-medium text-zinc-100", children: pattern.evidence_type }), _jsxs("div", { className: "mt-2 flex flex-wrap gap-3 text-xs text-zinc-400", children: [pattern.evidence_source_tool && (_jsxs("span", { className: "flex items-center gap-1", children: ["Tool: ", _jsx("span", { className: "text-zinc-300", children: pattern.evidence_source_tool })] })), _jsxs("span", { className: "flex items-center gap-1", children: ["Frequency: ", _jsx("span", { className: "text-zinc-300", children: pattern.collection_frequency })] }), _jsxs("span", { className: "flex items-center gap-1", children: ["Effort: ", _jsxs("span", { className: "text-zinc-300", children: [pattern.effort_minutes, " min"] })] }), pattern.automation_available === 1 && (_jsxs("span", { className: "flex items-center gap-1 text-primary-400", children: [_jsx(HugeiconsIcon, { icon: FlashIcon, size: 10 }), "Automatable"] }))] })] }), _jsxs("div", { className: "shrink-0 text-right", children: [_jsx("p", { className: "text-xs text-zinc-500", children: "Acceptance" }), _jsxs("p", { className: `text-lg font-bold ${acceptanceColor}`, children: [(pattern.auditor_acceptance_rate * 100).toFixed(0), "%"] }), _jsxs("p", { className: "text-[10px] text-zinc-600", children: [pattern.usage_percentage, "% usage"] })] })] }) }));
}
// ── Tip Card ────────────────────────────────────────────────────────────────
function TipCard({ tip }) {
    const tipTypeIcon = (type) => {
        switch (type) {
            case 'pro_tip':
                return { icon: StarIcon, color: 'text-amber-400', label: 'Pro Tip' };
            case 'gotcha':
                return { icon: Alert02Icon, color: 'text-red-400', label: 'Gotcha' };
            case 'shortcut':
                return { icon: FlashIcon, color: 'text-primary-400', label: 'Shortcut' };
            default:
                return { icon: Book02Icon, color: 'text-zinc-400', label: 'Tip' };
        }
    };
    const { icon, color, label } = tipTypeIcon(tip.tip_type);
    return (_jsx("div", { className: "rounded-lg border border-zinc-800 bg-zinc-800/30 p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(HugeiconsIcon, { icon: icon, size: 16, className: `mt-0.5 shrink-0 ${color}` }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "mb-1 flex items-center gap-2", children: [_jsx("span", { className: `text-xs font-medium ${color}`, children: label }), tip.source_segment !== 'all' && (_jsx("span", { className: "rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500", children: tip.source_segment }))] }), _jsx("p", { className: "text-sm text-zinc-300", children: tip.content }), _jsxs("div", { className: "mt-2 flex items-center gap-3 text-xs text-zinc-500", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(HugeiconsIcon, { icon: ThumbsUpIcon, size: 12 }), tip.upvotes] }), _jsx("span", { children: new Date(tip.created_at).toLocaleDateString() })] })] })] }) }));
}
//# sourceMappingURL=playbooks.js.map