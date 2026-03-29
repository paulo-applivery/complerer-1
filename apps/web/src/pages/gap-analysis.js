import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { useParams } from '@tanstack/react-router';
import { useAdoptions, useFrameworks } from '@/hooks/use-frameworks';
import { useGapAnalysis } from '@/hooks/use-gap-analysis';
import { HugeiconsIcon } from '@hugeicons/react';
import { Shield01Icon, CheckmarkCircle01Icon, Alert02Icon, ArrowRight01Icon, ArrowLeft01Icon, LoaderPinwheelIcon, Layers01Icon, Link01Icon, Search01Icon, FilterIcon, ArrowDown01Icon, } from '@hugeicons/core-free-icons';
// ── Status helpers ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
    compliant: {
        label: 'Compliant',
        bg: 'bg-green-500/10',
        text: 'text-green-400',
    },
    auto_satisfied: {
        label: 'Auto-satisfied',
        bg: 'bg-primary-400/10',
        text: 'text-primary-400',
    },
    partial: {
        label: 'Partial',
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
    },
    gap: {
        label: 'Gap',
        bg: 'bg-red-500/10',
        text: 'text-red-400',
    },
};
// ── Component ───────────────────────────────────────────────────────────
export function GapAnalysisPage() {
    const params = useParams({ strict: false });
    const workspaceId = params.workspaceId;
    // Framework selection state
    const [sourceFramework, setSourceFramework] = useState('');
    const [targetFramework, setTargetFramework] = useState('');
    const [analysisTriggered, setAnalysisTriggered] = useState(false);
    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [domainFilter, setDomainFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 50;
    // Data hooks
    const { adoptions, isLoading: adoptionsLoading } = useAdoptions(workspaceId);
    const { frameworks, isLoading: frameworksLoading } = useFrameworks(workspaceId);
    const activeSource = analysisTriggered ? sourceFramework : '';
    const activeTarget = analysisTriggered ? targetFramework : '';
    const { gapAnalysis, isLoading: analysisLoading } = useGapAnalysis(workspaceId, activeSource, activeTarget);
    const handleAnalyze = () => {
        if (sourceFramework && targetFramework) {
            setAnalysisTriggered(true);
            setPage(1);
            setStatusFilter('');
            setDomainFilter('');
            setSearchQuery('');
        }
    };
    // Derived data
    const domains = useMemo(() => {
        if (!gapAnalysis)
            return [];
        return Array.from(new Set(gapAnalysis.controls.map((c) => c.domain).filter(Boolean)));
    }, [gapAnalysis]);
    const filteredControls = useMemo(() => {
        if (!gapAnalysis)
            return [];
        let result = gapAnalysis.controls;
        if (statusFilter) {
            result = result.filter((c) => c.status === statusFilter);
        }
        if (domainFilter) {
            result = result.filter((c) => c.domain === domainFilter);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter((c) => c.controlId.toLowerCase().includes(q) ||
                c.title.toLowerCase().includes(q));
        }
        return result;
    }, [gapAnalysis, statusFilter, domainFilter, searchQuery]);
    const totalPages = Math.max(1, Math.ceil(filteredControls.length / pageSize));
    const paginatedControls = filteredControls.slice((page - 1) * pageSize, page * pageSize);
    const isInitialLoading = adoptionsLoading || frameworksLoading;
    if (isInitialLoading) {
        return (_jsx("div", { className: "flex min-h-[60vh] items-center justify-center", children: _jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 24, className: "animate-spin text-zinc-500" }) }));
    }
    const summary = gapAnalysis?.summary;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-zinc-100", children: "Gap Analysis" }), _jsx("p", { className: "mt-1 text-sm text-zinc-400", children: "Compare frameworks to identify compliance gaps and crosswalk coverage." })] }), _jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-6", children: [_jsx("h2", { className: "mb-4 text-lg font-semibold text-zinc-100", children: "Select Frameworks" }), _jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-end", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("label", { className: "mb-1.5 block text-xs font-medium text-zinc-400", children: ["Source Framework", _jsx("span", { className: "ml-1 text-zinc-600", children: "(what you're compliant with)" })] }), _jsxs("div", { className: "relative", children: [_jsx(HugeiconsIcon, { icon: Shield01Icon, size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" }), _jsxs("select", { value: sourceFramework, onChange: (e) => {
                                                    setSourceFramework(e.target.value);
                                                    setAnalysisTriggered(false);
                                                }, className: "w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-8 text-sm text-zinc-300 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "", children: "Select source framework..." }), adoptions.map((a) => (_jsxs("option", { value: a.frameworkSlug, children: [a.frameworkName, " (v", a.frameworkVersion, ")"] }, a.id)))] }), _jsx(HugeiconsIcon, { icon: ArrowDown01Icon, size: 14, className: "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" })] })] }), _jsx("div", { className: "hidden items-center pb-1 sm:flex", children: _jsx(HugeiconsIcon, { icon: ArrowRight01Icon, size: 20, className: "text-zinc-600" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("label", { className: "mb-1.5 block text-xs font-medium text-zinc-400", children: ["Target Framework", _jsx("span", { className: "ml-1 text-zinc-600", children: "(what you want to check against)" })] }), _jsxs("div", { className: "relative", children: [_jsx(HugeiconsIcon, { icon: Layers01Icon, size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" }), _jsxs("select", { value: targetFramework, onChange: (e) => {
                                                    setTargetFramework(e.target.value);
                                                    setAnalysisTriggered(false);
                                                }, className: "w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-8 text-sm text-zinc-300 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "", children: "Select target framework..." }), frameworks.map((fw) => (_jsx("option", { value: fw.slug, children: fw.name }, fw.id)))] }), _jsx(HugeiconsIcon, { icon: ArrowDown01Icon, size: 14, className: "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" })] })] }), _jsx("button", { onClick: handleAnalyze, disabled: !sourceFramework || !targetFramework || analysisLoading, className: "rounded-lg bg-primary-400 px-6 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50 disabled:cursor-not-allowed", children: analysisLoading ? (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 14, className: "animate-spin" }), "Analyzing..."] })) : ('Analyze Gaps') })] })] }), analysisTriggered && analysisLoading && (_jsx("div", { className: "flex items-center justify-center py-16", children: _jsxs("div", { className: "flex flex-col items-center gap-3", children: [_jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 32, className: "animate-spin text-primary-400" }), _jsx("p", { className: "text-sm text-zinc-400", children: "Running gap analysis..." })] }) })), analysisTriggered && gapAnalysis && summary && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-6", children: [_jsx(SummaryCard, { label: "Total Controls", value: summary.totalControls, icon: Layers01Icon, iconColor: "text-zinc-400" }), _jsx(SummaryCard, { label: "Compliant", value: summary.compliant, icon: CheckmarkCircle01Icon, iconColor: "text-green-400", badgeClass: "bg-green-500/10 text-green-400" }), _jsx(SummaryCard, { label: "Auto-satisfied", value: summary.autoSatisfied, icon: Link01Icon, iconColor: "text-primary-400", badgeClass: "bg-primary-400/10 text-primary-400" }), _jsx(SummaryCard, { label: "Partial", value: summary.partial, icon: Alert02Icon, iconColor: "text-amber-400", badgeClass: "bg-amber-500/10 text-amber-400" }), _jsx(SummaryCard, { label: "Gap", value: summary.gap, icon: Shield01Icon, iconColor: "text-red-400", badgeClass: "bg-red-500/10 text-red-400" }), _jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsx("p", { className: "text-xs font-medium text-zinc-400", children: "Coverage" }), _jsxs("p", { className: "mt-2 text-3xl font-bold text-zinc-100", children: [summary.coveragePercent, _jsx("span", { className: "text-lg text-zinc-500", children: "%" })] })] })] }), _jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsxs("div", { className: "mb-2 flex items-center justify-between", children: [_jsx("p", { className: "text-sm font-medium text-zinc-300", children: "Coverage Breakdown" }), _jsxs("p", { className: "text-xs text-zinc-500", children: [summary.compliant + summary.autoSatisfied + summary.partial, " /", ' ', summary.totalControls, " addressed"] })] }), _jsxs("div", { className: "flex h-3 w-full overflow-hidden rounded-full bg-zinc-800", children: [summary.compliant > 0 && (_jsx("div", { className: "h-full bg-green-500 transition-all duration-500", style: {
                                            width: `${(summary.compliant / summary.totalControls) * 100}%`,
                                        }, title: `Compliant: ${summary.compliant}` })), summary.autoSatisfied > 0 && (_jsx("div", { className: "h-full bg-primary-400 transition-all duration-500", style: {
                                            width: `${(summary.autoSatisfied / summary.totalControls) * 100}%`,
                                        }, title: `Auto-satisfied: ${summary.autoSatisfied}` })), summary.partial > 0 && (_jsx("div", { className: "h-full bg-amber-500 transition-all duration-500", style: {
                                            width: `${(summary.partial / summary.totalControls) * 100}%`,
                                        }, title: `Partial: ${summary.partial}` })), summary.gap > 0 && (_jsx("div", { className: "h-full bg-red-500 transition-all duration-500", style: {
                                            width: `${(summary.gap / summary.totalControls) * 100}%`,
                                        }, title: `Gap: ${summary.gap}` }))] }), _jsxs("div", { className: "mt-2 flex items-center gap-4 text-xs text-zinc-500", children: [_jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "inline-block h-2 w-2 rounded-full bg-green-500" }), "Compliant"] }), _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "inline-block h-2 w-2 rounded-full bg-primary-400" }), "Auto-satisfied"] }), _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "inline-block h-2 w-2 rounded-full bg-amber-500" }), "Partial"] }), _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "inline-block h-2 w-2 rounded-full bg-red-500" }), "Gap"] })] })] }), _jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900", children: [_jsxs("div", { className: "flex flex-col gap-3 border-b border-zinc-800 p-5 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-base font-semibold text-zinc-100", children: "Target Controls" }), _jsxs("p", { className: "mt-0.5 text-xs text-zinc-500", children: [filteredControls.length, " controls", filteredControls.length !== gapAnalysis.controls.length &&
                                                        ` (filtered from ${gapAnalysis.controls.length})`] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsxs("div", { className: "relative", children: [_jsx(HugeiconsIcon, { icon: Search01Icon, size: 14, className: "absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" }), _jsx("input", { type: "text", value: searchQuery, onChange: (e) => {
                                                            setSearchQuery(e.target.value);
                                                            setPage(1);
                                                        }, placeholder: "Search controls...", className: "rounded-lg border border-zinc-700 bg-zinc-800 py-1.5 pl-8 pr-3 text-xs text-zinc-300 placeholder-zinc-600 focus:border-primary-400 focus:outline-none" })] }), _jsxs("div", { className: "relative", children: [_jsx(HugeiconsIcon, { icon: FilterIcon, size: 14, className: "absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" }), _jsxs("select", { value: statusFilter, onChange: (e) => {
                                                            setStatusFilter(e.target.value);
                                                            setPage(1);
                                                        }, className: "appearance-none rounded-lg border border-zinc-700 bg-zinc-800 py-1.5 pl-8 pr-8 text-xs text-zinc-300 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "", children: "All statuses" }), _jsx("option", { value: "compliant", children: "Compliant" }), _jsx("option", { value: "auto_satisfied", children: "Auto-satisfied" }), _jsx("option", { value: "partial", children: "Partial" }), _jsx("option", { value: "gap", children: "Gap" })] })] }), _jsxs("div", { className: "relative", children: [_jsx(HugeiconsIcon, { icon: FilterIcon, size: 14, className: "absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" }), _jsxs("select", { value: domainFilter, onChange: (e) => {
                                                            setDomainFilter(e.target.value);
                                                            setPage(1);
                                                        }, className: "appearance-none rounded-lg border border-zinc-700 bg-zinc-800 py-1.5 pl-8 pr-8 text-xs text-zinc-300 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "", children: "All domains" }), domains.map((d) => (_jsx("option", { value: d, children: d }, d)))] })] })] })] }), paginatedControls.length === 0 ? (_jsx("div", { className: "py-12 text-center text-sm text-zinc-500", children: "No controls found matching filters." })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-zinc-800 text-xs text-zinc-500", children: [_jsx("th", { className: "px-5 py-3 font-medium", children: "Control ID" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Domain" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Title" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Status" }), _jsx("th", { className: "px-5 py-3 font-medium", children: "Satisfied By" }), _jsx("th", { className: "px-5 py-3 font-medium text-right", children: "Evidence" })] }) }), _jsx("tbody", { className: "divide-y divide-zinc-800/50", children: paginatedControls.map((control) => (_jsx(ControlRow, { control: control }, control.controlId))) })] }) }), totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-between border-t border-zinc-800 px-5 py-3", children: [_jsxs("p", { className: "text-xs text-zinc-500", children: ["Page ", page, " of ", totalPages] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1, className: "rounded-lg border border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-40", children: _jsx(HugeiconsIcon, { icon: ArrowLeft01Icon, size: 16 }) }), _jsx("button", { onClick: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page === totalPages, className: "rounded-lg border border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-40", children: _jsx(HugeiconsIcon, { icon: ArrowRight01Icon, size: 16 }) })] })] }))] }))] })] }))] }));
}
// ── Sub-components ──────────────────────────────────────────────────────
function SummaryCard({ label, value, icon, iconColor, badgeClass, }) {
    return (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-xs font-medium text-zinc-400", children: label }), _jsx(HugeiconsIcon, { icon: icon, size: 16, className: iconColor })] }), _jsx("p", { className: "mt-2 text-3xl font-bold text-zinc-100", children: value }), badgeClass && (_jsx("span", { className: `mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`, children: label }))] }));
}
function ControlRow({ control }) {
    const config = STATUS_CONFIG[control.status];
    return (_jsxs("tr", { className: "transition-colors hover:bg-zinc-800/30", children: [_jsx("td", { className: "px-5 py-3 font-mono text-xs text-primary-400", children: control.controlId }), _jsx("td", { className: "max-w-[200px] truncate px-5 py-3 text-zinc-400", children: control.domain }), _jsx("td", { className: "px-5 py-3 text-zinc-100", children: control.title }), _jsx("td", { className: "px-5 py-3", children: _jsx("span", { className: `inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text}`, children: config.label }) }), _jsx("td", { className: "px-5 py-3", children: control.satisfiedBy.length > 0 ? (_jsx("div", { className: "flex flex-wrap gap-1", children: control.satisfiedBy.map((s) => (_jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300", children: [s.controlId, _jsxs("span", { className: "text-zinc-500", children: ["(", s.relationship === 'equivalent'
                                        ? 'equiv'
                                        : s.confidence !== undefined
                                            ? `${s.confidence}%`
                                            : s.relationship, ")"] })] }, s.controlId))) })) : (_jsx("span", { className: "text-xs text-zinc-600", children: "\u2014" })) }), _jsx("td", { className: "px-5 py-3 text-right text-zinc-400", children: control.evidenceCount })] }));
}
//# sourceMappingURL=gap-analysis.js.map