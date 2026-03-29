import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Mail01Icon, ViewIcon, } from '@hugeicons/core-free-icons';
import { useAdminEmailTemplates, useAdminEmailTemplate, useUpdateEmailTemplate, usePreviewEmailTemplate, useSendTestEmail, } from '@/hooks/use-admin';
import { useAuth } from '@/hooks/use-auth';
const categories = [
    { label: 'All', value: undefined },
    { label: 'Auth', value: 'auth' },
    { label: 'Notification', value: 'notification' },
    { label: 'Compliance', value: 'compliance' },
];
export function AdminEmailTemplatesPage() {
    const [categoryFilter, setCategoryFilter] = useState(undefined);
    const [selectedId, setSelectedId] = useState(null);
    const { data: listData, isLoading } = useAdminEmailTemplates(categoryFilter);
    const { data: detailData } = useAdminEmailTemplate(selectedId);
    const updateTemplate = useUpdateEmailTemplate();
    const previewTemplate = usePreviewEmailTemplate();
    const sendTest = useSendTestEmail();
    const { user } = useAuth();
    const [previewHtml, setPreviewHtml] = useState(null);
    const [testResult, setTestResult] = useState(null);
    const [editSubject, setEditSubject] = useState('');
    const [editBodyHtml, setEditBodyHtml] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const templates = listData?.emailTemplates ?? [];
    const template = detailData?.template;
    // Sync editor state when template changes
    const lastLoadedId = useRef(null);
    if (template && template.id !== lastLoadedId.current) {
        lastLoadedId.current = template.id;
        setEditSubject(template.subject);
        setEditBodyHtml(template.bodyHtml ?? '');
        setHasChanges(false);
        setPreviewHtml(null);
    }
    const handleSave = () => {
        if (!selectedId)
            return;
        updateTemplate.mutate({
            id: selectedId,
            subject: editSubject,
            bodyHtml: editBodyHtml,
        });
        setHasChanges(false);
    };
    const handlePreview = () => {
        if (!selectedId)
            return;
        previewTemplate.mutate(selectedId, {
            onSuccess: (data) => setPreviewHtml(data.html),
        });
    };
    const handleToggleEnabled = () => {
        if (!selectedId || !template)
            return;
        updateTemplate.mutate({ id: selectedId, enabled: !template.enabled });
    };
    // Group templates by category
    const grouped = {};
    for (const t of templates) {
        const cat = t.category;
        if (!grouped[cat])
            grouped[cat] = [];
        grouped[cat].push(t);
    }
    return (_jsxs("div", { className: "mx-auto flex w-full max-w-6xl gap-6", children: [_jsxs("div", { className: "w-72 shrink-0 space-y-4", children: [_jsx("h1", { className: "text-2xl font-bold text-zinc-100", children: "Email Templates" }), _jsx("div", { className: "flex flex-wrap gap-1", children: categories.map((cat) => (_jsx("button", { onClick: () => setCategoryFilter(cat.value), className: `rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${categoryFilter === cat.value
                                ? 'bg-zinc-800 text-zinc-100'
                                : 'text-zinc-500 hover:text-zinc-300'}`, children: cat.label }, cat.label))) }), isLoading ? (_jsx("p", { className: "text-sm text-zinc-500", children: "Loading..." })) : (_jsx("div", { className: "space-y-4", children: Object.entries(grouped).map(([category, items]) => (_jsxs("div", { children: [_jsx("p", { className: "mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600", children: category }), _jsx("div", { className: "space-y-0.5", children: items.map((t) => (_jsxs("button", { onClick: () => setSelectedId(t.id), className: `flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${selectedId === t.id
                                            ? 'bg-zinc-800 text-zinc-100'
                                            : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`, children: [_jsx(HugeiconsIcon, { icon: Mail01Icon, size: 14, className: "shrink-0" }), _jsx("span", { className: "truncate", children: t.name }), !t.enabled && (_jsx("span", { className: "ml-auto text-[10px] text-zinc-600", children: "OFF" }))] }, t.id))) })] }, category))) }))] }), _jsx("div", { className: "flex-1 space-y-4", children: template ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-zinc-100", children: template.name }), _jsx("p", { className: "text-xs font-mono text-zinc-500", children: template.slug })] }), _jsx("div", { className: "flex items-center gap-2", children: _jsx("button", { onClick: handleToggleEnabled, className: `relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${template.enabled ? 'bg-primary-400' : 'bg-zinc-700'}`, children: _jsx("span", { className: `pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${template.enabled ? 'translate-x-5' : 'translate-x-0'}` }) }) })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1.5 block text-xs font-medium text-zinc-400", children: "Subject" }), _jsx("input", { type: "text", value: editSubject, onChange: (e) => { setEditSubject(e.target.value); setHasChanges(true); }, className: "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-700" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1.5 block text-xs font-medium text-zinc-400", children: "Body HTML" }), _jsx("textarea", { value: editBodyHtml, onChange: (e) => { setEditBodyHtml(e.target.value); setHasChanges(true); }, rows: 14, className: "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-xs text-zinc-300 outline-none focus:border-zinc-700" })] }), template.variables.length > 0 && (_jsxs("div", { children: [_jsx("label", { className: "mb-1.5 block text-xs font-medium text-zinc-400", children: "Variables" }), _jsx("div", { className: "flex flex-wrap gap-1.5", children: template.variables.map((v) => (_jsx("span", { className: "rounded-lg bg-zinc-800 px-2 py-1 text-xs font-mono text-primary-400", children: `{{${v}}}` }, v))) })] })), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: handleSave, disabled: !hasChanges, className: "rounded-xl bg-primary-400 px-5 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-primary-400/90 disabled:opacity-40", children: "Save changes" }), _jsxs("button", { onClick: handlePreview, className: "flex items-center gap-1.5 rounded-xl border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800", children: [_jsx(HugeiconsIcon, { icon: ViewIcon, size: 14 }), "Preview"] }), _jsxs("button", { onClick: () => {
                                        if (!selectedId || !user?.email)
                                            return;
                                        setTestResult(null);
                                        sendTest.mutate({ id: selectedId, to: user.email }, {
                                            onSuccess: (data) => setTestResult({ type: 'success', message: data.message }),
                                            onError: (err) => setTestResult({ type: 'error', message: err.message }),
                                        });
                                    }, disabled: sendTest.isPending, className: "flex items-center gap-1.5 rounded-xl border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50", children: [_jsx(HugeiconsIcon, { icon: Mail01Icon, size: 14 }), sendTest.isPending ? 'Sending...' : `Send Test to ${user?.email ?? 'me'}`] })] }), testResult && (_jsx("div", { className: `rounded-xl px-4 py-2.5 text-sm ${testResult.type === 'success'
                                ? 'bg-primary-400/10 text-primary-400'
                                : 'bg-red-500/10 text-red-400'}`, children: testResult.message })), previewHtml && (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-xs font-medium text-zinc-400", children: "Preview (with sample data)" }), _jsx("button", { onClick: () => setPreviewHtml(null), className: "text-xs text-zinc-600 hover:text-zinc-400", children: "Close" })] }), _jsx("div", { className: "overflow-hidden rounded-xl border border-zinc-800", children: _jsx("iframe", { srcDoc: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="background:#09090b;margin:0;padding:20px;">${previewHtml}</body></html>`, className: "h-[400px] w-full", title: "Email preview", sandbox: "" }) })] }))] })) : (_jsx("div", { className: "flex h-64 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900", children: _jsx("p", { className: "text-sm text-zinc-500", children: "Select a template to edit" }) })) })] }));
}
//# sourceMappingURL=email-templates.js.map