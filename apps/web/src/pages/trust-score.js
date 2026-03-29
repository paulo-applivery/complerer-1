import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { Shield01Icon, CheckmarkCircle01Icon, Link01Icon, Settings01Icon, EyeIcon, SecurityCheckIcon, } from '@hugeicons/core-free-icons';
import { useTrustScore, useUpdateTrustProfile } from '@/hooks/use-trust';
// ── Score Breakdown Bar ──────────────────────────────────────────────────────
function BreakdownBar({ label, value, weight, }) {
    return (_jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-zinc-400", children: label }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs text-zinc-500", children: weight }), _jsxs("span", { className: "font-medium text-zinc-100", children: [value, "%"] })] })] }), _jsx("div", { className: "h-2 rounded-full bg-zinc-800", children: _jsx("div", { className: "h-2 rounded-full bg-primary-400 transition-all duration-500", style: { width: `${Math.min(value, 100)}%` } }) })] }));
}
// ── Grade Display ────────────────────────────────────────────────────────────
function GradeDisplay({ grade, score }) {
    const gradeColors = {
        'A+': 'text-primary-400',
        A: 'text-primary-400',
        'B+': 'text-yellow-400',
        B: 'text-yellow-400',
        C: 'text-orange-400',
        D: 'text-red-400',
    };
    return (_jsxs("div", { className: "flex flex-col items-center gap-2", children: [_jsx("div", { className: `text-6xl font-bold ${gradeColors[grade] ?? 'text-zinc-400'}`, children: grade }), _jsxs("div", { className: "text-sm text-zinc-400", children: ["Trust Score: ", _jsx("span", { className: "font-medium text-zinc-200", children: score }), "/100"] })] }));
}
// ── Trust Score Page ─────────────────────────────────────────────────────────
export function TrustScorePage() {
    const params = useParams({ strict: false });
    const workspaceId = params.workspaceId;
    const { profile, score, grade, breakdown, stats, isLoading } = useTrustScore(workspaceId);
    const updateProfile = useUpdateTrustProfile(workspaceId);
    // Form state
    const [slug, setSlug] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [enabled, setEnabled] = useState(false);
    const [showFrameworks, setShowFrameworks] = useState(true);
    const [showPostureScore, setShowPostureScore] = useState(true);
    const [showEvidenceFreshness, setShowEvidenceFreshness] = useState(true);
    const [showLastSnapshot, setShowLastSnapshot] = useState(true);
    const [showControlCount, setShowControlCount] = useState(true);
    const [badgeStyle, setBadgeStyle] = useState('standard');
    // Sync form state from loaded profile
    useEffect(() => {
        if (profile) {
            setSlug(profile.slug);
            setCompanyName(profile.company_name);
            setEnabled(!!profile.enabled);
            setShowFrameworks(!!profile.show_frameworks);
            setShowPostureScore(!!profile.show_posture_score);
            setShowEvidenceFreshness(!!profile.show_evidence_freshness);
            setShowLastSnapshot(!!profile.show_last_snapshot);
            setShowControlCount(!!profile.show_control_count);
            setBadgeStyle(profile.badge_style ?? 'standard');
        }
    }, [profile]);
    const handleSave = () => {
        updateProfile.mutate({
            slug,
            companyName,
            enabled,
            showFrameworks,
            showPostureScore,
            showEvidenceFreshness,
            showLastSnapshot,
            showControlCount,
            badgeStyle,
        });
    };
    const embedCode = slug
        ? `<a href="https://complerer.com/trust/${slug}">\n  <img src="https://complerer.com/trust/${slug}/badge.svg" alt="Complerer Trust Score" />\n</a>`
        : '';
    if (isLoading) {
        return (_jsx("div", { className: "flex h-64 items-center justify-center", children: _jsx("div", { className: "h-6 w-6 animate-spin rounded-full border-2 border-primary-400 border-t-transparent" }) }));
    }
    return (_jsxs("div", { className: "mx-auto max-w-5xl space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-zinc-100", children: "Trust Score" }), _jsx("p", { className: "mt-1 text-sm text-zinc-400", children: "Your public compliance posture badge. Share your trust score with customers and partners." })] }), _jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-6", children: [_jsxs("div", { className: "flex items-start gap-8", children: [_jsxs("div", { className: "flex flex-col items-center gap-4 border-r border-zinc-800 pr-8", children: [_jsx(GradeDisplay, { grade: grade, score: score }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-zinc-500", children: [_jsx(HugeiconsIcon, { icon: SecurityCheckIcon, size: 14 }), _jsx("span", { children: "Computed in real-time" })] })] }), _jsxs("div", { className: "flex-1 space-y-4", children: [_jsx("h3", { className: "text-sm font-medium text-zinc-300", children: "Score Breakdown" }), _jsx(BreakdownBar, { label: "Framework Coverage", value: breakdown.frameworkCoverage, weight: "35%" }), _jsx(BreakdownBar, { label: "Evidence Freshness", value: breakdown.evidenceFreshness, weight: "25%" }), _jsx(BreakdownBar, { label: "Violation Resolution", value: breakdown.violationRatio, weight: "20%" }), _jsx(BreakdownBar, { label: "Review Completeness", value: breakdown.reviewCompleteness, weight: "10%" }), _jsx(BreakdownBar, { label: "Snapshot Recency", value: breakdown.snapshotRecency, weight: "10%" })] })] }), _jsxs("div", { className: "mt-6 grid grid-cols-5 gap-4 border-t border-zinc-800 pt-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-lg font-semibold text-zinc-100", children: stats.frameworksActive }), _jsx("div", { className: "text-xs text-zinc-500", children: "Active Frameworks" })] }), _jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "text-lg font-semibold text-zinc-100", children: [stats.controlsSatisfied, "/", stats.controlsTotal] }), _jsx("div", { className: "text-xs text-zinc-500", children: "Controls Met" })] }), _jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "text-lg font-semibold text-zinc-100", children: [stats.evidenceFreshness, "%"] }), _jsx("div", { className: "text-xs text-zinc-500", children: "Evidence Fresh" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-lg font-semibold text-zinc-100", children: stats.openViolations }), _jsx("div", { className: "text-xs text-zinc-500", children: "Open Violations" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-lg font-semibold text-primary-400", children: grade }), _jsx("div", { className: "text-xs text-zinc-500", children: "Overall Grade" })] })] })] }), _jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-6", children: [_jsxs("div", { className: "mb-6 flex items-center gap-2", children: [_jsx(HugeiconsIcon, { icon: Settings01Icon, size: 18, className: "text-zinc-400" }), _jsx("h3", { className: "text-lg font-semibold text-zinc-100", children: "Trust Profile Configuration" })] }), _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-zinc-200", children: "Enable Trust Profile" }), _jsx("div", { className: "text-xs text-zinc-500", children: "Make your trust score publicly accessible" })] }), _jsx("button", { onClick: () => setEnabled(!enabled), className: `relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${enabled ? 'bg-primary-400' : 'bg-zinc-700'}`, children: _jsx("span", { className: `pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}` }) })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1.5 block text-sm font-medium text-zinc-300", children: "Company Name" }), _jsx("input", { type: "text", value: companyName, onChange: (e) => setCompanyName(e.target.value), placeholder: "Acme Corp", className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1.5 block text-sm font-medium text-zinc-300", children: "URL Slug" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm text-zinc-500", children: "complerer.com/trust/" }), _jsx("input", { type: "text", value: slug, onChange: (e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')), placeholder: "acme-corp", className: "flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400" })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "text-sm font-medium text-zinc-300", children: "Visible Sections" }), [
                                        { key: 'showFrameworks', label: 'Frameworks', state: showFrameworks, setter: setShowFrameworks },
                                        { key: 'showPostureScore', label: 'Posture Score', state: showPostureScore, setter: setShowPostureScore },
                                        { key: 'showEvidenceFreshness', label: 'Evidence Freshness', state: showEvidenceFreshness, setter: setShowEvidenceFreshness },
                                        { key: 'showLastSnapshot', label: 'Last Snapshot', state: showLastSnapshot, setter: setShowLastSnapshot },
                                        { key: 'showControlCount', label: 'Control Count', state: showControlCount, setter: setShowControlCount },
                                    ].map((toggle) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-zinc-400", children: [_jsx(HugeiconsIcon, { icon: EyeIcon, size: 14 }), _jsx("span", { children: toggle.label })] }), _jsx("button", { onClick: () => toggle.setter(!toggle.state), className: `relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${toggle.state ? 'bg-primary-400' : 'bg-zinc-700'}`, children: _jsx("span", { className: `pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${toggle.state ? 'translate-x-4' : 'translate-x-0'}` }) })] }, toggle.key)))] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1.5 block text-sm font-medium text-zinc-300", children: "Badge Style" }), _jsx("div", { className: "flex gap-3", children: ['minimal', 'standard', 'detailed'].map((style) => (_jsx("button", { onClick: () => setBadgeStyle(style), className: `rounded-lg border px-4 py-2 text-sm capitalize transition-colors ${badgeStyle === style
                                                ? 'border-primary-400 bg-primary-400/10 text-primary-400'
                                                : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'}`, children: style }, style))) })] }), _jsxs("div", { className: "flex items-center gap-3 pt-2", children: [_jsx("button", { onClick: handleSave, disabled: !slug || !companyName || updateProfile.isPending, className: "rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:cursor-not-allowed disabled:opacity-50", children: updateProfile.isPending ? 'Saving...' : 'Save Profile' }), updateProfile.isSuccess && (_jsxs("span", { className: "flex items-center gap-1 text-sm text-primary-400", children: [_jsx(HugeiconsIcon, { icon: CheckmarkCircle01Icon, size: 14 }), "Saved"] }))] })] })] }), slug && (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-6", children: [_jsxs("div", { className: "mb-4 flex items-center gap-2", children: [_jsx(HugeiconsIcon, { icon: Link01Icon, size: 18, className: "text-zinc-400" }), _jsx("h3", { className: "text-lg font-semibold text-zinc-100", children: "Embed Code" })] }), _jsx("p", { className: "mb-3 text-sm text-zinc-400", children: "Add this snippet to your website to display your trust badge." }), _jsxs("div", { className: "relative", children: [_jsx("pre", { className: "overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300", children: _jsx("code", { children: embedCode }) }), _jsx("button", { onClick: () => navigator.clipboard.writeText(embedCode), className: "absolute right-3 top-3 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200", children: "Copy" })] }), _jsxs("div", { className: "mt-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4", children: [_jsx("div", { className: "mb-2 text-xs text-zinc-500", children: "Badge Preview" }), _jsxs("div", { className: "inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5", children: [_jsx(HugeiconsIcon, { icon: Shield01Icon, size: 16, className: "text-primary-400" }), _jsx("span", { className: "text-sm font-medium text-zinc-200", children: companyName || 'Your Company' }), _jsx("span", { className: "rounded bg-primary-400/10 px-1.5 py-0.5 text-xs font-bold text-primary-400", children: grade })] })] })] }))] }));
}
//# sourceMappingURL=trust-score.js.map