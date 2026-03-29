import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback, useRef } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { ReportEditor, EditorToolbar, SectionOutline, BlockConfigPanel, } from '@complerer/reports';
import { useReport, useUpdateReport, useSubmitForReview, useApproveReport, useRejectReport, usePublishReport, useExportPDF, useReportFindings, useCreateFinding, } from '@/hooks/use-reports';
const STATUS_STYLES = {
    draft: 'bg-zinc-700 text-zinc-300',
    review: 'bg-amber-400/10 text-amber-400',
    approved: 'bg-emerald-400/10 text-emerald-400',
    published: 'bg-blue-400/10 text-blue-400',
};
const SEVERITY_STYLES = {
    critical: 'bg-red-400/10 text-red-400',
    high: 'bg-orange-400/10 text-orange-400',
    medium: 'bg-amber-400/10 text-amber-400',
    low: 'bg-blue-400/10 text-blue-400',
    informational: 'bg-zinc-700 text-zinc-400',
};
export function ReportEditorPage() {
    const params = useParams({ strict: false });
    const { workspaceId, reportId } = params;
    const { report, isLoading } = useReport(workspaceId, reportId);
    const updateMut = useUpdateReport(workspaceId);
    const submitMut = useSubmitForReview(workspaceId);
    const approveMut = useApproveReport(workspaceId);
    const rejectMut = useRejectReport(workspaceId);
    const publishMut = usePublishReport(workspaceId);
    const exportMut = useExportPDF(workspaceId);
    const { findings } = useReportFindings(workspaceId, reportId);
    const createFindingMut = useCreateFinding(workspaceId);
    const [editor, setEditor] = useState(null);
    const [lastSaved, setLastSaved] = useState(null);
    const [showFindings, setShowFindings] = useState(false);
    const savingRef = useRef(false);
    const handleUpdate = useCallback((json) => {
        if (!reportId || savingRef.current)
            return;
        savingRef.current = true;
        updateMut.mutate({ reportId, content: JSON.stringify(json) }, { onSettled: () => { savingRef.current = false; setLastSaved(new Date().toLocaleTimeString()); } });
    }, [reportId, updateMut]);
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx("div", { className: "h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-primary-400" }) }));
    }
    const content = report?.content ? tryParseJSON(report.content) : undefined;
    const status = report?.status || 'draft';
    const isLocked = status === 'approved' || status === 'published';
    return (_jsxs("div", { className: "flex flex-col gap-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Link, { to: "/w/$workspaceId/reports", params: { workspaceId: workspaceId }, className: "text-xs text-zinc-500 hover:text-zinc-300 transition-colors", children: "Reports" }), _jsx("span", { className: "text-zinc-700", children: "/" }), _jsx("h1", { className: "text-sm font-medium text-zinc-100", children: report?.name || 'Untitled Report' }), _jsx("span", { className: `rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[status] || STATUS_STYLES.draft}`, children: status })] }), _jsxs("div", { className: "flex items-center gap-2 text-xs", children: [updateMut.isPending && _jsx("span", { className: "text-zinc-500", children: "Saving..." }), lastSaved && !updateMut.isPending && _jsxs("span", { className: "text-zinc-600", children: ["Saved ", lastSaved] })] })] }), _jsxs("div", { className: "flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2", children: [_jsxs("div", { className: "flex items-center gap-3", children: [isLocked && _jsx("span", { className: "rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400", children: "Read-only" }), _jsxs("span", { className: "text-xs text-zinc-500", children: [findings.length, " finding", findings.length !== 1 ? 's' : ''] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: () => setShowFindings(!showFindings), className: "rounded-lg border border-zinc-700 px-3 py-1.5 text-[11px] text-zinc-300 hover:border-zinc-600", children: [showFindings ? 'Hide' : 'Show', " Findings"] }), _jsx("button", { onClick: () => reportId && exportMut.mutate(reportId), disabled: exportMut.isPending, className: "rounded-lg border border-zinc-700 px-3 py-1.5 text-[11px] text-zinc-300 hover:border-zinc-600 disabled:opacity-40", children: exportMut.isPending ? 'Exporting...' : 'Export PDF' }), status === 'draft' && (_jsx("button", { onClick: () => reportId && submitMut.mutate({ reportId }), disabled: submitMut.isPending, className: "rounded-lg bg-primary-400 px-3 py-1.5 text-[11px] font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-40", children: submitMut.isPending ? 'Submitting...' : 'Submit for Review' })), status === 'review' && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => reportId && rejectMut.mutate({ reportId }), disabled: rejectMut.isPending, className: "rounded-lg border border-red-500/30 px-3 py-1.5 text-[11px] text-red-400 hover:border-red-500/50 disabled:opacity-40", children: "Return" }), _jsx("button", { onClick: () => reportId && approveMut.mutate({ reportId }), disabled: approveMut.isPending, className: "rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-400 disabled:opacity-40", children: approveMut.isPending ? 'Approving...' : 'Approve' })] })), status === 'approved' && (_jsx("button", { onClick: () => reportId && publishMut.mutate(reportId), disabled: publishMut.isPending, className: "rounded-lg bg-blue-500 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-blue-400 disabled:opacity-40", children: publishMut.isPending ? 'Publishing...' : 'Publish' }))] })] }), _jsx(EditorToolbar, { editor: editor }), _jsxs("div", { className: "flex gap-4", children: [_jsx(SectionOutline, { editor: editor }), _jsx(ReportEditor, { content: content, mode: "report", onUpdate: handleUpdate, onSelectionUpdate: (ed) => setEditor(ed), editable: !isLocked }), _jsxs("div", { className: "flex flex-col gap-4", children: [_jsx(BlockConfigPanel, { editor: editor }), showFindings && (_jsxs("div", { className: "w-64 shrink-0", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("p", { className: "text-[10px] font-semibold uppercase tracking-wider text-zinc-500", children: "Findings" }), _jsx("button", { onClick: () => reportId && createFindingMut.mutate({ reportId, severity: 'medium', findingType: 'deficiency', title: 'New Finding' }), className: "rounded px-2 py-0.5 text-[10px] text-primary-400 hover:bg-zinc-800", children: "+ Add" })] }), findings.length === 0 ? (_jsx("p", { className: "text-xs text-zinc-600", children: "No findings yet." })) : (_jsx("div", { className: "space-y-1.5 max-h-60 overflow-y-auto", children: findings.map((f) => (_jsxs("div", { className: "rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-2", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: `rounded px-1 py-px text-[9px] font-bold uppercase ${SEVERITY_STYLES[f.severity] || ''}`, children: f.severity }), _jsx("span", { className: "truncate text-[10px] text-zinc-300", children: f.title })] }), _jsx("span", { className: "text-[9px] text-zinc-600", children: f.status })] }, f.id))) }))] }))] })] })] }));
}
function tryParseJSON(str) {
    try {
        return JSON.parse(str);
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=report-editor.js.map