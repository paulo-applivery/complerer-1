import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ReportEditor, EditorToolbar, SectionOutline, BlockConfigPanel } from '@complerer/reports';
export function AdminReportTemplateEditorPage() {
    const params = useParams({ strict: false });
    const templateId = params.templateId;
    const qc = useQueryClient();
    const { data: template, isLoading } = useQuery({
        queryKey: ['admin-library-report', templateId],
        queryFn: () => api.get(`/admin/libraries/reports`).then((r) => r.items?.find((i) => i.id === templateId)),
        enabled: !!templateId,
    });
    const updateMut = useMutation({
        mutationFn: (data) => api.put(`/admin/libraries/reports/${templateId}`, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-library-report', templateId] }),
    });
    const [editor, setEditor] = useState(null);
    const [lastSaved, setLastSaved] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [nameInit, setNameInit] = useState(false);
    // Initialize form from template data
    if (template && !nameInit) {
        setName(template.name || '');
        setDescription(template.description || '');
        setNameInit(true);
    }
    const handleContentUpdate = useCallback((json) => {
        if (!templateId)
            return;
        updateMut.mutate({ content: JSON.stringify(json) }, {
            onSuccess: () => setLastSaved(new Date().toLocaleTimeString()),
        });
    }, [templateId, updateMut]);
    const handleSaveMeta = () => {
        if (!templateId)
            return;
        updateMut.mutate({ name, description }, {
            onSuccess: () => setLastSaved(new Date().toLocaleTimeString()),
        });
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx("div", { className: "h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-primary-400" }) }));
    }
    if (!template) {
        return _jsx("p", { className: "text-zinc-500 py-10 text-center", children: "Template not found" });
    }
    const content = template.content ? tryParseJSON(template.content) : undefined;
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Link, { to: "/admin/libraries", className: "text-xs text-zinc-500 hover:text-zinc-300 transition-colors", children: "Libraries" }), _jsx("span", { className: "text-zinc-700", children: "/" }), _jsx("span", { className: "text-xs text-zinc-500", children: "Report Templates" }), _jsx("span", { className: "text-zinc-700", children: "/" }), _jsx("h1", { className: "text-sm font-medium text-zinc-100", children: template.name }), _jsx("span", { className: "rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-400", children: "Template Mode" })] }), _jsxs("div", { className: "flex items-center gap-2 text-xs", children: [updateMut.isPending && _jsx("span", { className: "text-zinc-500", children: "Saving..." }), lastSaved && !updateMut.isPending && _jsxs("span", { className: "text-zinc-600", children: ["Saved ", lastSaved] })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500", children: "Name" }), _jsx("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), onBlur: handleSaveMeta, className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" })] }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500", children: "Description" }), _jsx("input", { type: "text", value: description, onChange: (e) => setDescription(e.target.value), onBlur: handleSaveMeta, className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" })] }), _jsx("div", { className: "shrink-0 pt-5", children: _jsx("span", { className: "rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400", children: template.framework_slug || 'No framework' }) })] }), _jsx(EditorToolbar, { editor: editor }), _jsxs("div", { className: "flex gap-4", children: [_jsx(SectionOutline, { editor: editor }), _jsx(ReportEditor, { content: content, mode: "template", placeholder: "Edit template content... Variables appear as chips. Type / for commands.", onUpdate: handleContentUpdate, onSelectionUpdate: (ed) => setEditor(ed), editable: true }), _jsx(BlockConfigPanel, { editor: editor })] })] }));
}
function tryParseJSON(str) {
    try {
        return JSON.parse(str);
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=report-template-editor.js.map