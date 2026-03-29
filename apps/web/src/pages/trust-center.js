import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react';
import { Shield01Icon, CheckmarkCircle01Icon, LoaderPinwheelIcon, Alert02Icon, } from '@hugeicons/core-free-icons';
function gradeColor(grade) {
    switch (grade) {
        case 'A+':
        case 'A':
            return 'text-primary-400';
        case 'B':
            return 'text-blue-400';
        case 'C':
            return 'text-amber-400';
        case 'D':
            return 'text-orange-400';
        default:
            return 'text-red-400';
    }
}
function gradeBg(grade) {
    switch (grade) {
        case 'A+':
        case 'A':
            return 'bg-primary-400/10 border-primary-400/20';
        case 'B':
            return 'bg-blue-400/10 border-blue-400/20';
        case 'C':
            return 'bg-amber-400/10 border-amber-400/20';
        case 'D':
            return 'bg-orange-400/10 border-orange-400/20';
        default:
            return 'bg-red-400/10 border-red-400/20';
    }
}
function ScoreBar({ label, value }) {
    const color = value >= 80 ? 'bg-primary-400' : value >= 50 ? 'bg-amber-400' : 'bg-red-400';
    return (_jsxs("div", { children: [_jsxs("div", { className: "mb-1 flex items-center justify-between text-xs", children: [_jsx("span", { className: "text-zinc-400", children: label }), _jsxs("span", { className: "font-medium text-zinc-200", children: [value.toFixed(0), "%"] })] }), _jsx("div", { className: "h-2 rounded-full bg-zinc-800", children: _jsx("div", { className: `h-2 rounded-full transition-all ${color}`, style: { width: `${Math.min(100, value)}%` } }) })] }));
}
export function TrustCenterPage() {
    const params = useParams({ strict: false });
    const slug = params.slug;
    const { data, isLoading, error } = useQuery({
        queryKey: ['public-trust', slug],
        queryFn: async () => {
            const res = await fetch(`/api/trust/${slug}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Not found');
            }
            return res.json();
        },
        enabled: !!slug,
    });
    if (isLoading) {
        return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-zinc-950", children: _jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 24, className: "animate-spin text-zinc-500" }) }));
    }
    if (error || !data?.profile) {
        return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-zinc-950", children: _jsxs("div", { className: "text-center", children: [_jsx(HugeiconsIcon, { icon: Alert02Icon, size: 40, className: "mx-auto text-zinc-600" }), _jsx("h1", { className: "mt-4 text-xl font-bold text-zinc-200", children: "Trust Profile Not Found" }), _jsxs("p", { className: "mt-2 text-sm text-zinc-500", children: ["The trust center for \"", slug, "\" does not exist or has been disabled."] })] }) }));
    }
    const { profile, score, grade, breakdown, stats } = data;
    return (_jsxs("div", { className: "min-h-screen bg-zinc-950", children: [_jsx("div", { className: "border-b border-zinc-800 bg-zinc-900/50", children: _jsxs("div", { className: "mx-auto flex max-w-4xl items-center justify-between px-6 py-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(HugeiconsIcon, { icon: Shield01Icon, size: 24, className: "text-primary-400" }), _jsxs("div", { children: [_jsx("h1", { className: "text-lg font-bold text-zinc-100", children: profile.company_name }), _jsx("p", { className: "text-xs text-zinc-500", children: "Trust Center" })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(HugeiconsIcon, { icon: CheckmarkCircle01Icon, size: 16, className: "text-primary-400" }), _jsx("span", { className: "text-xs text-zinc-400", children: "Verified by Complerer" })] })] }) }), _jsxs("div", { className: "mx-auto max-w-4xl px-6 py-10", children: [_jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [profile.show_posture_score === 1 && (_jsxs("div", { className: `rounded-2xl border p-6 text-center ${gradeBg(grade)}`, children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-wider text-zinc-400", children: "Compliance Score" }), _jsx("p", { className: `mt-2 text-5xl font-bold ${gradeColor(grade)}`, children: grade }), _jsx("p", { className: "mt-1 text-2xl font-semibold text-zinc-200", children: score.toFixed(1) }), _jsx("p", { className: "mt-1 text-xs text-zinc-500", children: "out of 100" })] })), _jsxs("div", { className: "space-y-4 lg:col-span-2", children: [profile.show_control_count === 1 && (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsx("h2", { className: "mb-3 text-sm font-semibold text-zinc-200", children: "Frameworks" }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-zinc-100", children: stats.frameworksActive }), _jsx("p", { className: "text-xs text-zinc-500", children: "Active Frameworks" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-zinc-100", children: stats.controlsSatisfied }), _jsx("p", { className: "text-xs text-zinc-500", children: "Controls Satisfied" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-zinc-100", children: stats.controlsTotal }), _jsx("p", { className: "text-xs text-zinc-500", children: "Total Controls" })] })] })] })), _jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsx("h2", { className: "mb-3 text-sm font-semibold text-zinc-200", children: "Compliance Breakdown" }), _jsxs("div", { className: "space-y-3", children: [_jsx(ScoreBar, { label: "Framework Coverage", value: breakdown.frameworkCoverage }), profile.show_evidence_freshness === 1 && (_jsx(ScoreBar, { label: "Evidence Freshness", value: breakdown.evidenceFreshness })), _jsx(ScoreBar, { label: "Violation Resolution", value: breakdown.violationRatio }), _jsx(ScoreBar, { label: "Policy Review", value: breakdown.reviewCompleteness }), _jsx(ScoreBar, { label: "Snapshot Recency", value: breakdown.snapshotRecency })] })] }), stats.openViolations === 0 && (_jsxs("div", { className: "flex items-center gap-3 rounded-xl border border-primary-400/20 bg-primary-400/5 p-4", children: [_jsx(HugeiconsIcon, { icon: CheckmarkCircle01Icon, size: 20, className: "text-primary-400" }), _jsx("p", { className: "text-sm text-primary-300", children: "No open compliance violations detected." })] }))] })] }), _jsx("div", { className: "mt-10 text-center", children: _jsxs("p", { className: "text-xs text-zinc-600", children: ["Powered by", ' ', _jsx("a", { href: "https://dash.complerer.com", className: "text-zinc-400 hover:text-zinc-300", children: "Complerer" })] }) })] })] }));
}
//# sourceMappingURL=trust-center.js.map