import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { Message01Icon, ArrowUp01Icon, PlusSignIcon, Shield01Icon, Link01Icon, Search01Icon, CheckmarkCircle01Icon, Alert02Icon, ArrowRight01Icon, Delete01Icon, } from '@hugeicons/core-free-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConversations, useChatMessages, useSendMessage, useDeleteConversation, } from '@/hooks/use-chat';
import { useSystemsList, useDirectoryUsers } from '@/hooks/use-compliance';
import { api } from '@/lib/api';
// ── Rich Markdown Renderer ──────────────────────────────────────────────────
function RichContent({ content }) {
    // Detect structured content patterns
    const blocks = parseContentBlocks(content);
    return (_jsx("div", { className: "space-y-3", children: blocks.map((block, i) => {
            switch (block.type) {
                case 'table':
                    return _jsx(TableWidget, { data: block.data ?? [] }, i);
                case 'code':
                    return _jsx(CodeBlock, { code: block.content, lang: block.lang }, i);
                case 'cards':
                    return _jsx(CardsWidget, { cards: block.items ?? [] }, i);
                case 'list':
                    return _jsx(ListWidget, { items: block.items ?? [], ordered: block.ordered }, i);
                case 'heading':
                    return _jsx("h3", { className: "text-base font-semibold text-zinc-100", children: block.content }, i);
                default:
                    return (_jsx("p", { className: "text-sm leading-relaxed text-zinc-300", dangerouslySetInnerHTML: { __html: inlineMarkdown(block.content) } }, i));
            }
        }) }));
}
function parseContentBlocks(text) {
    const blocks = [];
    const lines = text.split('\n');
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        // Heading: ## or ###
        if (/^#{1,3}\s/.test(line)) {
            blocks.push({ type: 'heading', content: line.replace(/^#+\s*/, '') });
            i++;
            continue;
        }
        // Code block: ```
        if (line.trim().startsWith('```')) {
            const lang = line.trim().replace('```', '').trim();
            const codeLines = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            blocks.push({ type: 'code', content: codeLines.join('\n'), lang });
            i++; // skip closing ```
            continue;
        }
        // Table: | header | header |
        if (line.includes('|') && line.trim().startsWith('|')) {
            const tableLines = [];
            while (i < lines.length && lines[i].includes('|')) {
                // Skip separator lines like |---|---|
                if (!/^\|[\s-:|]+\|$/.test(lines[i].trim())) {
                    tableLines.push(lines[i]);
                }
                i++;
            }
            const data = tableLines.map((l) => l.split('|').filter(Boolean).map((cell) => cell.trim()));
            if (data.length > 0) {
                blocks.push({ type: 'table', content: '', data });
            }
            continue;
        }
        // Ordered list: 1. item
        if (/^\d+\.\s/.test(line.trim())) {
            const items = [];
            while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
                items.push(lines[i].trim().replace(/^\d+\.\s*/, ''));
                i++;
            }
            // If items have bold labels like "**Label**: desc", render as cards
            if (items.length >= 3 && items.every((it) => it.includes('**'))) {
                blocks.push({ type: 'cards', content: '', items });
            }
            else {
                blocks.push({ type: 'list', content: '', items, ordered: true });
            }
            continue;
        }
        // Unordered list: - item
        if (/^[-*]\s/.test(line.trim())) {
            const items = [];
            while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
                items.push(lines[i].trim().replace(/^[-*]\s*/, ''));
                i++;
            }
            blocks.push({ type: 'list', content: '', items, ordered: false });
            continue;
        }
        // Regular text
        if (line.trim()) {
            blocks.push({ type: 'text', content: line });
        }
        i++;
    }
    return blocks;
}
function inlineMarkdown(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-zinc-100">$1</strong>')
        .replace(/`([^`]+)`/g, '<code class="rounded-md bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-primary-400">$1</code>');
}
// ── Widgets ─────────────────────────────────────────────────────────────────
function TableWidget({ data }) {
    if (data.length === 0)
        return null;
    const headers = data[0];
    const rows = data.slice(1);
    return (_jsx("div", { className: "overflow-hidden rounded-xl border border-zinc-800", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { children: _jsx("tr", { className: "bg-zinc-800/80", children: headers.map((h, i) => (_jsx("th", { className: "px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400", children: h }, i))) }) }), _jsx("tbody", { className: "divide-y divide-zinc-800/50", children: rows.map((row, ri) => (_jsx("tr", { className: "transition-colors hover:bg-zinc-800/30", children: row.map((cell, ci) => (_jsx("td", { className: "px-4 py-2.5 text-zinc-300", dangerouslySetInnerHTML: { __html: inlineMarkdown(cell) } }, ci))) }, ri))) })] }) }) }));
}
function CodeBlock({ code, lang }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (_jsxs("div", { className: "group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900", children: [lang && (_jsxs("div", { className: "flex items-center justify-between border-b border-zinc-800 px-4 py-2", children: [_jsx("span", { className: "text-xs text-zinc-500", children: lang }), _jsx("button", { onClick: handleCopy, className: "text-xs text-zinc-500 opacity-0 transition-opacity hover:text-zinc-300 group-hover:opacity-100", children: copied ? 'Copied!' : 'Copy' })] })), _jsx("pre", { className: "overflow-x-auto p-4 text-xs leading-relaxed text-zinc-300", children: _jsx("code", { children: code }) }), !lang && (_jsx("button", { onClick: handleCopy, className: "absolute right-2 top-2 rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-500 opacity-0 transition-opacity hover:text-zinc-300 group-hover:opacity-100", children: copied ? 'Copied!' : 'Copy' }))] }));
}
function CardsWidget({ cards }) {
    return (_jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: cards.map((card, i) => {
            const boldMatch = card.match(/\*\*(.*?)\*\*/);
            const title = boldMatch ? boldMatch[1] : `Item ${i + 1}`;
            const desc = boldMatch ? card.replace(/\*\*.*?\*\*:?\s*/, '') : card;
            return (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-800/30 p-4 transition-colors hover:border-zinc-700", children: [_jsx("p", { className: "text-sm font-semibold text-zinc-100", children: title }), _jsx("p", { className: "mt-1 text-xs leading-relaxed text-zinc-400", dangerouslySetInnerHTML: { __html: inlineMarkdown(desc) } })] }, i));
        }) }));
}
function ListWidget({ items, ordered }) {
    const Tag = ordered ? 'ol' : 'ul';
    return (_jsx(Tag, { className: `space-y-1.5 pl-5 ${ordered ? 'list-decimal' : 'list-disc'}`, children: items.map((item, i) => (_jsx("li", { className: "text-sm text-zinc-300 marker:text-zinc-600", dangerouslySetInnerHTML: { __html: inlineMarkdown(item) } }, i))) }));
}
// ── Thinking Animation ──────────────────────────────────────────────────────
function ThinkingIndicator() {
    return (_jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400/20 to-primary-400/5", children: _jsx("img", { src: "/icon-color.svg", alt: "", className: "h-4 w-4" }) }), _jsxs("div", { className: "flex items-center gap-3 pt-2", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400/60", style: { animationDelay: '0ms', animationDuration: '1.2s' } }), _jsx("span", { className: "inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400/60", style: { animationDelay: '200ms', animationDuration: '1.2s' } }), _jsx("span", { className: "inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400/60", style: { animationDelay: '400ms', animationDuration: '1.2s' } })] }), _jsx("span", { className: "text-xs text-zinc-500", children: "Analyzing your compliance data..." })] })] }));
}
// ── Tool Card ──────────────────────────────────────────────────────────────
const TOOL_ICONS = {
    search_controls: Search01Icon,
    search_evidence: Search01Icon,
    search_access: Search01Icon,
    list_access_records: Shield01Icon,
    link_evidence: Link01Icon,
    check_compliance: CheckmarkCircle01Icon,
    check_evidence_gaps: Alert02Icon,
    list_violations: Alert02Icon,
    assess_risk: Alert02Icon,
    register_access: CheckmarkCircle01Icon,
    show_access_form: PlusSignIcon,
    get_compliance_posture: Shield01Icon,
};
const TOOL_LABELS = {
    search_controls: 'Searching controls',
    search_evidence: 'Searching evidence',
    search_access: 'Searching access records',
    list_access_records: 'Listing access records',
    link_evidence: 'Linking evidence',
    check_compliance: 'Checking compliance',
    check_evidence_gaps: 'Checking evidence gaps',
    list_violations: 'Listing violations',
    assess_risk: 'Assessing risk',
    register_access: 'Registering access',
    show_access_form: 'Preparing access form',
    get_compliance_posture: 'Getting compliance posture',
};
function AccessFormCard({ prefill, workspaceId }) {
    const { systems } = useSystemsList(workspaceId);
    const { users } = useDirectoryUsers(workspaceId);
    const queryClient = useQueryClient();
    const [formState, setFormState] = useState({
        userId: '',
        systemId: '',
        role: prefill.role || '',
        approvedBy: prefill.approvedBy || '',
        ticketRef: prefill.ticketRef || '',
        status: 'active',
        licenseType: '',
        costPerPeriod: '',
        costCurrency: 'USD',
        costFrequency: '',
    });
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    // Pre-fill user/system IDs from name matching
    useEffect(() => {
        if (prefill.systemName && systems.length > 0 && !formState.systemId) {
            const match = systems.find((s) => s.name.toLowerCase().includes(prefill.systemName.toLowerCase()));
            if (match)
                setFormState((prev) => ({ ...prev, systemId: match.id }));
        }
        if (prefill.userName && users.length > 0 && !formState.userId) {
            const match = users.find((u) => u.name.toLowerCase().includes(prefill.userName.toLowerCase()) ||
                (prefill.userEmail && u.email.toLowerCase() === prefill.userEmail.toLowerCase()));
            if (match)
                setFormState((prev) => ({ ...prev, userId: match.id }));
        }
    }, [systems, users, prefill, formState.systemId, formState.userId]);
    const createAccess = useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/access`, payload),
        onSuccess: () => {
            setSubmitted(true);
            queryClient.invalidateQueries({ queryKey: ['access-records', workspaceId] });
        },
        onError: (err) => {
            setError(err.message || 'Failed to register access');
        },
    });
    const handleSubmit = () => {
        if (!formState.userId || !formState.systemId || !formState.role) {
            setError('Person, system, and role are required');
            return;
        }
        setError('');
        createAccess.mutate({
            userId: formState.userId,
            systemId: formState.systemId,
            role: formState.role,
            approvedBy: formState.approvedBy || undefined,
            ticketRef: formState.ticketRef || undefined,
            status: formState.status || undefined,
            licenseType: formState.licenseType || undefined,
            costPerPeriod: formState.costPerPeriod ? Number(formState.costPerPeriod) : undefined,
            costCurrency: formState.costCurrency || undefined,
            costFrequency: formState.costFrequency || undefined,
        });
    };
    if (submitted) {
        return (_jsx("div", { className: "rounded-xl border border-primary-400/30 bg-primary-400/5 p-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(HugeiconsIcon, { icon: CheckmarkCircle01Icon, size: 16, className: "text-primary-400" }), _jsx("span", { className: "text-sm font-medium text-primary-400", children: "Access registered successfully" })] }) }));
    }
    return (_jsxs("div", { className: "rounded-xl border border-zinc-700 bg-zinc-900 p-4", children: [_jsxs("div", { className: "mb-3 flex items-center gap-2", children: [_jsx(HugeiconsIcon, { icon: Shield01Icon, size: 16, className: "text-primary-400" }), _jsx("span", { className: "text-sm font-semibold text-zinc-100", children: "Register Access" })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs font-medium text-zinc-400", children: "Person *" }), _jsxs("select", { value: formState.userId, onChange: (e) => setFormState((prev) => ({ ...prev, userId: e.target.value })), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "", children: "Select a person..." }), users.map((u) => (_jsxs("option", { value: u.id, children: [u.name, " (", u.email, ")"] }, u.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs font-medium text-zinc-400", children: "System *" }), _jsxs("select", { value: formState.systemId, onChange: (e) => setFormState((prev) => ({ ...prev, systemId: e.target.value })), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "", children: "Select a system..." }), systems.map((s) => (_jsx("option", { value: s.id, children: s.name }, s.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs font-medium text-zinc-400", children: "Role *" }), _jsxs("select", { value: formState.role, onChange: (e) => setFormState((prev) => ({ ...prev, role: e.target.value })), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "", children: "Select a role..." }), _jsx("option", { value: "read", children: "Read" }), _jsx("option", { value: "write", children: "Write" }), _jsx("option", { value: "admin", children: "Admin" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs font-medium text-zinc-400", children: "Status" }), _jsxs("select", { value: formState.status, onChange: (e) => setFormState((prev) => ({ ...prev, status: e.target.value })), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "requested", children: "Requested" }), _jsx("option", { value: "approved", children: "Approved" }), _jsx("option", { value: "pending_review", children: "Pending Review" }), _jsx("option", { value: "suspended", children: "Suspended" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs font-medium text-zinc-400", children: "Approved by" }), _jsx("input", { type: "text", value: formState.approvedBy, onChange: (e) => setFormState((prev) => ({ ...prev, approvedBy: e.target.value })), placeholder: "Manager name", className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-primary-400 focus:outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs font-medium text-zinc-400", children: "Ticket ref" }), _jsx("input", { type: "text", value: formState.ticketRef, onChange: (e) => setFormState((prev) => ({ ...prev, ticketRef: e.target.value })), placeholder: "JIRA-123", className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-primary-400 focus:outline-none" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs font-medium text-zinc-400", children: "License type" }), _jsx("input", { type: "text", value: formState.licenseType, onChange: (e) => setFormState((prev) => ({ ...prev, licenseType: e.target.value })), placeholder: "e.g. Enterprise", className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-primary-400 focus:outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs font-medium text-zinc-400", children: "Cost frequency" }), _jsxs("select", { value: formState.costFrequency, onChange: (e) => setFormState((prev) => ({ ...prev, costFrequency: e.target.value })), className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none", children: [_jsx("option", { value: "", children: "None" }), _jsx("option", { value: "monthly", children: "Monthly" }), _jsx("option", { value: "annual", children: "Annual" }), _jsx("option", { value: "one-time", children: "One-time" })] })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs font-medium text-zinc-400", children: "Cost per period" }), _jsx("input", { type: "number", value: formState.costPerPeriod, onChange: (e) => setFormState((prev) => ({ ...prev, costPerPeriod: e.target.value })), placeholder: "0", className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-primary-400 focus:outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs font-medium text-zinc-400", children: "Currency" }), _jsx("input", { type: "text", value: formState.costCurrency, onChange: (e) => setFormState((prev) => ({ ...prev, costCurrency: e.target.value })), placeholder: "USD", className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-primary-400 focus:outline-none" })] })] }), error && (_jsx("p", { className: "text-xs text-red-400", children: error })), _jsx("button", { onClick: handleSubmit, disabled: createAccess.isPending, className: "w-full rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50", children: createAccess.isPending ? 'Registering...' : 'Register Access' })] })] }));
}
/** Check if a tool output is a form request */
function isFormToolOutput(output) {
    if (!output || typeof output !== 'object')
        return false;
    const obj = output;
    return obj.type === 'form' && obj.formType === 'access_register';
}
function ToolCard({ tool }) {
    const [expanded, setExpanded] = useState(false);
    const icon = TOOL_ICONS[tool.name] ?? Link01Icon;
    const label = TOOL_LABELS[tool.name] ?? tool.name;
    return (_jsxs("div", { className: "overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50", children: [_jsxs("button", { type: "button", className: "flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-zinc-800/50", onClick: () => setExpanded(!expanded), children: [_jsx("div", { className: "flex h-5 w-5 items-center justify-center rounded-md bg-primary-400/10", children: _jsx(HugeiconsIcon, { icon: icon, size: 10, className: "text-primary-400" }) }), _jsx("span", { className: "font-medium text-zinc-400", children: label }), _jsx(HugeiconsIcon, { icon: ArrowRight01Icon, size: 10, className: `ml-auto text-zinc-600 transition-transform ${expanded ? 'rotate-90' : ''}` })] }), expanded && (_jsxs("div", { className: "border-t border-zinc-800 px-3 py-2.5 text-xs", children: [tool.input && (_jsxs("div", { className: "mb-2", children: [_jsx("p", { className: "mb-1 font-medium text-zinc-500", children: "Input" }), _jsx("pre", { className: "overflow-x-auto rounded-md bg-zinc-950 p-2 text-zinc-500", children: JSON.stringify(tool.input, null, 2) })] })), tool.output != null && (_jsxs("div", { children: [_jsx("p", { className: "mb-1 font-medium text-zinc-500", children: "Output" }), _jsx("pre", { className: "max-h-32 overflow-auto rounded-md bg-zinc-950 p-2 text-zinc-500", children: typeof tool.output === 'string' ? tool.output : JSON.stringify(tool.output, null, 2) })] }))] }))] }));
}
// ── Helpers ──────────────────────────────────────────────────────────────────
function relativeTime(timestamp) {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMs = now - then;
    if (diffMs < 0)
        return 'just now';
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60)
        return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
        return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7)
        return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
}
const SUGGESTED_PROMPTS = [
    { text: 'What evidence do I need for SOC 2?', icon: Search01Icon },
    { text: 'Show me all access records', icon: Shield01Icon },
    { text: 'What are our compliance gaps?', icon: Alert02Icon },
    { text: 'Register a new access grant', icon: CheckmarkCircle01Icon },
];
// ── Chat Page ───────────────────────────────────────────────────────────────
export function ChatPage() {
    const params = useParams({ strict: false });
    const workspaceId = params.workspaceId;
    const [activeConversationId, setActiveConversationId] = useState();
    const [inputValue, setInputValue] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const { conversations, isLoading: convosLoading } = useConversations(workspaceId);
    const { messages, isLoading: messagesLoading } = useChatMessages(workspaceId, activeConversationId);
    const sendMessage = useSendMessage(workspaceId);
    const deleteConversation = useDeleteConversation(workspaceId);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, sendMessage.isPending]);
    const handleTextareaChange = useCallback((e) => {
        setInputValue(e.target.value);
        const ta = e.target;
        ta.style.height = 'auto';
        ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }, []);
    const handleSend = useCallback(() => {
        const trimmed = inputValue.trim();
        if (!trimmed || sendMessage.isPending)
            return;
        sendMessage.mutate({ conversationId: activeConversationId, message: trimmed }, {
            onSuccess: (data) => {
                if (!activeConversationId && data.conversationId) {
                    setActiveConversationId(data.conversationId);
                }
            },
        });
        setInputValue('');
        if (textareaRef.current)
            textareaRef.current.style.height = 'auto';
    }, [inputValue, activeConversationId, sendMessage]);
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);
    const handleNewChat = useCallback(() => {
        setActiveConversationId(undefined);
        setInputValue('');
    }, []);
    const handleDelete = useCallback((convId, e) => {
        e.stopPropagation();
        deleteConversation.mutate(convId, {
            onSuccess: () => {
                if (activeConversationId === convId)
                    setActiveConversationId(undefined);
            },
        });
    }, [activeConversationId, deleteConversation]);
    const hasMessages = messages.length > 0;
    const showWelcome = !activeConversationId && !hasMessages && !sendMessage.isPending;
    return (_jsxs("div", { className: "-m-4 flex h-[calc(100vh-3.5rem)] overflow-hidden", children: [sidebarOpen && (_jsxs("div", { className: "flex w-60 shrink-0 flex-col border-r border-zinc-800/50 bg-zinc-900/50", children: [_jsx("div", { className: "p-3", children: _jsxs("button", { type: "button", onClick: handleNewChat, className: "flex w-full items-center gap-2 rounded-xl border border-zinc-700/50 px-3 py-2.5 text-sm text-zinc-300 transition-all hover:border-zinc-600 hover:bg-zinc-800/50", children: [_jsx(HugeiconsIcon, { icon: PlusSignIcon, size: 14 }), "New conversation"] }) }), _jsx("div", { className: "flex-1 overflow-y-auto px-2 pb-2", children: convosLoading ? (_jsx("div", { className: "space-y-1 p-2", children: [1, 2, 3].map((i) => (_jsx("div", { className: "h-10 animate-pulse rounded-lg bg-zinc-800/50" }, i))) })) : conversations.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center gap-2 px-4 py-12 text-center", children: [_jsx(HugeiconsIcon, { icon: Message01Icon, size: 20, className: "text-zinc-700" }), _jsx("p", { className: "text-xs text-zinc-600", children: "No conversations" })] })) : (_jsx("div", { className: "space-y-0.5", children: conversations.map((conv) => (_jsxs("div", { className: "group relative", children: [_jsx("button", { type: "button", onClick: () => setActiveConversationId(conv.id), className: `flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${activeConversationId === conv.id
                                            ? 'bg-zinc-800 text-zinc-100'
                                            : 'text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-300'}`, children: _jsx("span", { className: "truncate flex-1", children: conv.title }) }), _jsx("button", { type: "button", onClick: (e) => handleDelete(conv.id, e), className: "absolute right-1.5 top-1.5 hidden rounded-md p-1 text-zinc-600 hover:bg-zinc-700 hover:text-zinc-400 group-hover:block", children: _jsx(HugeiconsIcon, { icon: Delete01Icon, size: 12 }) })] }, conv.id))) })) })] })), _jsxs("div", { className: "flex flex-1 flex-col bg-zinc-950", children: [_jsxs("div", { className: "flex items-center border-b border-zinc-800/30 px-4 py-2", children: [_jsx("button", { onClick: () => setSidebarOpen(!sidebarOpen), className: "rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300", children: _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", children: [_jsx("rect", { x: "1", y: "2", width: "14", height: "12", rx: "2", stroke: "currentColor", strokeWidth: "1.5" }), _jsx("line", { x1: "5.5", y1: "2", x2: "5.5", y2: "14", stroke: "currentColor", strokeWidth: "1.5" })] }) }), activeConversationId && (_jsx("p", { className: "ml-3 truncate text-sm text-zinc-500", children: conversations.find((c) => c.id === activeConversationId)?.title }))] }), _jsx("div", { className: "flex-1 overflow-y-auto", children: messagesLoading ? (_jsx("div", { className: "flex h-full items-center justify-center", children: _jsx("div", { className: "h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-primary-400" }) })) : showWelcome ? (_jsxs("div", { className: "flex h-full flex-col items-center justify-center px-4", children: [_jsxs("div", { className: "mb-8 flex flex-col items-center gap-4", children: [_jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400/20 to-primary-400/5 shadow-lg shadow-primary-400/5", children: _jsx("img", { src: "/icon-color.svg", alt: "Complerer", className: "h-8 w-8" }) }), _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-xl font-semibold text-zinc-100", children: "Compliance Assistant" }), _jsx("p", { className: "mt-1 text-sm text-zinc-500", children: "Ask anything about your compliance posture" })] })] }), _jsx("div", { className: "grid w-full max-w-2xl grid-cols-2 gap-3", children: SUGGESTED_PROMPTS.map((prompt) => (_jsxs("button", { type: "button", onClick: () => { setInputValue(prompt.text); textareaRef.current?.focus(); }, className: "group flex items-start gap-3 rounded-2xl border border-zinc-800 p-4 text-left transition-all hover:border-zinc-700 hover:bg-zinc-900/50", children: [_jsx("div", { className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-800 transition-colors group-hover:bg-primary-400/10", children: _jsx(HugeiconsIcon, { icon: prompt.icon, size: 14, className: "text-zinc-500 group-hover:text-primary-400" }) }), _jsx("span", { className: "text-sm text-zinc-400 group-hover:text-zinc-300", children: prompt.text })] }, prompt.text))) })] })) : (_jsx("div", { className: "mx-auto max-w-3xl px-4 py-6", children: _jsxs("div", { className: "space-y-6", children: [messages.map((msg) => (_jsx("div", { children: msg.role === 'user' ? (
                                        /* User message */
                                        _jsx("div", { className: "flex justify-end", children: _jsx("div", { className: "max-w-[80%] rounded-2xl rounded-br-md bg-primary-400/10 px-4 py-3", children: _jsx("p", { className: "text-sm text-zinc-200", children: msg.content }) }) })) : (
                                        /* Assistant message */
                                        _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400/20 to-primary-400/5", children: _jsx("img", { src: "/icon-color.svg", alt: "", className: "h-4 w-4" }) }), _jsxs("div", { className: "min-w-0 flex-1 space-y-2", children: [_jsx(RichContent, { content: msg.content }), msg.toolUses && msg.toolUses.length > 0 && (_jsx("div", { className: "space-y-1.5", children: msg.toolUses.map((tool, idx) => {
                                                                // Parse output if it's a JSON string
                                                                const parsed = typeof tool.output === 'string'
                                                                    ? (() => { try {
                                                                        return JSON.parse(tool.output);
                                                                    }
                                                                    catch {
                                                                        return tool.output;
                                                                    } })()
                                                                    : tool.output;
                                                                // Render inline form for access registration
                                                                if (isFormToolOutput(parsed)) {
                                                                    return (_jsx(AccessFormCard, { prefill: parsed.prefill, workspaceId: workspaceId }, `${msg.id}-form-${idx}`));
                                                                }
                                                                return _jsx(ToolCard, { tool: tool }, `${msg.id}-tool-${idx}`);
                                                            }) })), _jsx("p", { className: "text-[10px] text-zinc-600", children: relativeTime(msg.createdAt) })] })] })) }, msg.id))), sendMessage.isPending && _jsx(ThinkingIndicator, {}), _jsx("div", { ref: messagesEndRef })] }) })) }), _jsx("div", { className: "px-4 pb-4 pt-2", children: _jsxs("div", { className: "mx-auto max-w-3xl", children: [_jsxs("div", { className: "relative rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg shadow-black/20 transition-colors focus-within:border-zinc-700", children: [_jsx("textarea", { ref: textareaRef, value: inputValue, onChange: handleTextareaChange, onKeyDown: handleKeyDown, placeholder: "Ask about compliance, evidence, access...", rows: 1, disabled: sendMessage.isPending, className: "w-full resize-none bg-transparent px-4 pb-3 pt-3.5 pr-14 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none disabled:opacity-50" }), _jsx("button", { type: "button", onClick: handleSend, disabled: !inputValue.trim() || sendMessage.isPending, className: "absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-primary-400 text-zinc-950 transition-all hover:bg-primary-300 disabled:bg-zinc-800 disabled:text-zinc-600", children: _jsx(HugeiconsIcon, { icon: ArrowUp01Icon, size: 16 }) })] }), _jsx("p", { className: "mt-2 text-center text-[10px] text-zinc-700", children: "AI can make mistakes. Verify compliance data with your auditor." })] }) })] })] }));
}
//# sourceMappingURL=chat.js.map