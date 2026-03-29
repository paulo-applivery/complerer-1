import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { HugeiconsIcon } from '@hugeicons/react';
import { Clock01Icon, Shield01Icon, FileValidationIcon, Key01Icon, Alert02Icon, Link01Icon, Settings01Icon, UserAdd01Icon, FilterIcon, ArrowLeft01Icon, ArrowRight01Icon, LoaderPinwheelIcon, CheckmarkCircle01Icon, Layers01Icon, SecurityCheckIcon, } from '@hugeicons/core-free-icons';
// ── Event config ───────────────────────────────────────────────────────
const EVENT_TYPE_CONFIG = {
    'framework.adopted': {
        icon: SecurityCheckIcon,
        label: 'Framework adopted',
        category: 'framework',
    },
    'evidence.created': {
        icon: FileValidationIcon,
        label: 'Evidence uploaded',
        category: 'evidence',
    },
    'evidence.linked': {
        icon: Link01Icon,
        label: 'Evidence linked to control',
        category: 'evidence',
    },
    'evidence.auto_linked': {
        icon: Link01Icon,
        label: 'Evidence auto-linked via crosswalk',
        category: 'evidence',
    },
    'access.granted': {
        icon: UserAdd01Icon,
        label: 'Access granted',
        category: 'access',
    },
    'access.revoked': {
        icon: Key01Icon,
        label: 'Access revoked',
        category: 'access',
    },
    'access.reviewed': {
        icon: CheckmarkCircle01Icon,
        label: 'Access reviewed',
        category: 'access',
    },
    'system.created': {
        icon: Settings01Icon,
        label: 'System registered',
        category: 'system',
    },
    'baseline.created': {
        icon: Shield01Icon,
        label: 'Baseline rule created',
        category: 'baseline',
    },
    'violation.detected': {
        icon: Alert02Icon,
        label: 'Baseline violation detected',
        category: 'baseline',
    },
    'setting.updated': {
        icon: Settings01Icon,
        label: 'Workspace setting updated',
        category: 'system',
    },
    'snapshot.captured': {
        icon: Layers01Icon,
        label: 'Compliance snapshot captured',
        category: 'framework',
    },
};
const CATEGORY_COLORS = {
    framework: {
        dot: 'bg-primary-400',
        border: 'border-primary-400/20',
        badge: 'bg-primary-400/10 text-primary-400',
    },
    evidence: {
        dot: 'bg-amber-400',
        border: 'border-amber-400/20',
        badge: 'bg-amber-400/10 text-amber-400',
    },
    access: {
        dot: 'bg-blue-400',
        border: 'border-blue-400/20',
        badge: 'bg-blue-400/10 text-blue-400',
    },
    baseline: {
        dot: 'bg-red-400',
        border: 'border-red-400/20',
        badge: 'bg-red-400/10 text-red-400',
    },
    system: {
        dot: 'bg-zinc-400',
        border: 'border-zinc-400/20',
        badge: 'bg-zinc-400/10 text-zinc-400',
    },
};
function getEventConfig(eventType) {
    return (EVENT_TYPE_CONFIG[eventType] ?? {
        icon: Clock01Icon,
        label: eventType.replace('.', ' '),
        category: 'system',
    });
}
function getCategoryColors(category) {
    return (CATEGORY_COLORS[category] ?? CATEGORY_COLORS.system);
}
// ── Helpers ────────────────────────────────────────────────────────────
function relativeTime(timestamp) {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMs = now - then;
    if (diffMs < 0)
        return 'just now';
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60)
        return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
        return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30)
        return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}
function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
// ── Unique event types / entity types for filter dropdowns ────────────
const ALL_EVENT_TYPES = [
    'framework.adopted',
    'evidence.created',
    'evidence.linked',
    'evidence.auto_linked',
    'access.granted',
    'access.revoked',
    'access.reviewed',
    'system.created',
    'baseline.created',
    'violation.detected',
    'setting.updated',
    'snapshot.captured',
];
const ALL_ENTITY_TYPES = [
    'workspace_adoption',
    'evidence',
    'evidence_link',
    'access_record',
    'system',
    'baseline_rule',
    'baseline_violation',
    'workspace_setting',
    'compliance_snapshot',
    'directory_user',
    'policy',
];
// ── Component ──────────────────────────────────────────────────────────
export function EventsPage() {
    const params = useParams({ strict: false });
    const workspaceId = params.workspaceId;
    // Filters
    const [eventTypeFilter, setEventTypeFilter] = useState('');
    const [entityTypeFilter, setEntityTypeFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 25;
    // Build query params
    const queryParams = new URLSearchParams();
    queryParams.set('page', String(page));
    queryParams.set('limit', String(pageSize));
    if (eventTypeFilter)
        queryParams.set('eventType', eventTypeFilter);
    if (entityTypeFilter)
        queryParams.set('entityType', entityTypeFilter);
    if (fromDate)
        queryParams.set('from', new Date(fromDate).toISOString());
    if (toDate)
        queryParams.set('to', new Date(toDate + 'T23:59:59').toISOString());
    const { data, isLoading } = useQuery({
        queryKey: ['events', workspaceId, page, eventTypeFilter, entityTypeFilter, fromDate, toDate],
        queryFn: () => api.get(`/workspaces/${workspaceId}/events?${queryParams.toString()}`),
        enabled: !!workspaceId,
    });
    const events = data?.events ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / pageSize);
    const handleClearFilters = () => {
        setEventTypeFilter('');
        setEntityTypeFilter('');
        setFromDate('');
        setToDate('');
        setPage(1);
    };
    const hasFilters = eventTypeFilter || entityTypeFilter || fromDate || toDate;
    return (_jsxs("div", { className: "min-h-screen bg-zinc-950 p-6", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h1", { className: "text-2xl font-bold text-zinc-100", children: "Compliance Events" }), _jsx("p", { className: "mt-1 text-sm text-zinc-400", children: "Timeline of all compliance activity across the workspace" })] }), _jsxs("div", { className: "mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(HugeiconsIcon, { icon: FilterIcon, size: 16, className: "text-zinc-400" }), _jsx("span", { className: "text-sm font-medium text-zinc-300", children: "Filters" }), hasFilters && (_jsx("button", { onClick: handleClearFilters, className: "ml-auto text-xs text-primary-400 hover:text-primary-300", children: "Clear all" }))] }), _jsxs("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-500", children: "Event Type" }), _jsxs("select", { value: eventTypeFilter, onChange: (e) => {
                                            setEventTypeFilter(e.target.value);
                                            setPage(1);
                                        }, className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400/40", children: [_jsx("option", { value: "", children: "All event types" }), ALL_EVENT_TYPES.map((et) => (_jsx("option", { value: et, children: getEventConfig(et).label }, et)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-500", children: "Entity Type" }), _jsxs("select", { value: entityTypeFilter, onChange: (e) => {
                                            setEntityTypeFilter(e.target.value);
                                            setPage(1);
                                        }, className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400/40", children: [_jsx("option", { value: "", children: "All entity types" }), ALL_ENTITY_TYPES.map((et) => (_jsx("option", { value: et, children: et.replace(/_/g, ' ') }, et)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-500", children: "From" }), _jsx("input", { type: "date", value: fromDate, onChange: (e) => {
                                            setFromDate(e.target.value);
                                            setPage(1);
                                        }, className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400/40" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-zinc-500", children: "To" }), _jsx("input", { type: "date", value: toDate, onChange: (e) => {
                                            setToDate(e.target.value);
                                            setPage(1);
                                        }, className: "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400/40" })] })] })] }), _jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsxs("span", { className: "text-sm text-zinc-400", children: [total, " event", total !== 1 ? 's' : '', " found", hasFilters ? ' (filtered)' : ''] }), _jsxs("span", { className: "text-sm text-zinc-500", children: ["Page ", page, " of ", Math.max(1, totalPages)] })] }), isLoading && (_jsxs("div", { className: "flex items-center justify-center py-20", children: [_jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 24, className: "animate-spin text-primary-400" }), _jsx("span", { className: "ml-2 text-sm text-zinc-400", children: "Loading events..." })] })), !isLoading && events.length === 0 && (_jsxs("div", { className: "flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-20", children: [_jsx(HugeiconsIcon, { icon: Clock01Icon, size: 40, className: "text-zinc-600" }), _jsx("p", { className: "mt-3 text-sm text-zinc-400", children: hasFilters ? 'No events match the current filters' : 'No compliance events yet' })] })), !isLoading && events.length > 0 && (_jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute left-6 top-0 bottom-0 w-px bg-zinc-800" }), _jsx("div", { className: "space-y-1", children: events.map((event) => {
                            const config = getEventConfig(event.eventType);
                            const colors = getCategoryColors(config.category);
                            return (_jsxs("div", { className: "relative flex gap-4 pl-2", children: [_jsx("div", { className: "relative z-10 mt-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900", children: _jsx("div", { className: `h-2.5 w-2.5 rounded-full ${colors.dot}` }) }), _jsx("div", { className: `flex-1 rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700`, children: _jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: `mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.badge}`, children: _jsx(HugeiconsIcon, { icon: config.icon, size: 16 }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-zinc-100", children: config.label }), event.data && (_jsx("p", { className: "mt-0.5 text-xs text-zinc-400", children: summarizeEventData(event.eventType, event.data) })), _jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-2", children: [_jsx("span", { className: `inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${colors.badge}`, children: event.entityType.replace(/_/g, ' ') }), (event.actorName || event.actorId) && (_jsxs("span", { className: "text-xs text-zinc-500", children: ["by", ' ', _jsx("span", { className: "text-zinc-300", children: event.actorName ?? event.actorId })] }))] })] })] }), _jsxs("div", { className: "shrink-0 text-right", children: [_jsx("span", { className: "text-xs text-zinc-500", children: relativeTime(event.createdAt) }), _jsx("p", { className: "mt-0.5 text-xs text-zinc-600", children: formatDate(event.createdAt) })] })] }) })] }, event.id));
                        }) })] })), totalPages > 1 && (_jsxs("div", { className: "mt-6 flex items-center justify-center gap-2", children: [_jsxs("button", { onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page <= 1, className: "flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-40", children: [_jsx(HugeiconsIcon, { icon: ArrowLeft01Icon, size: 14 }), "Previous"] }), _jsx("div", { className: "flex items-center gap-1", children: Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            }
                            else if (page <= 3) {
                                pageNum = i + 1;
                            }
                            else if (page >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            }
                            else {
                                pageNum = page - 2 + i;
                            }
                            return (_jsx("button", { onClick: () => setPage(pageNum), className: `flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors ${pageNum === page
                                    ? 'bg-primary-400/10 text-primary-400 font-medium'
                                    : 'text-zinc-400 hover:bg-zinc-800'}`, children: pageNum }, pageNum));
                        }) }), _jsxs("button", { onClick: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page >= totalPages, className: "flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-40", children: ["Next", _jsx(HugeiconsIcon, { icon: ArrowRight01Icon, size: 14 })] })] }))] }));
}
// ── Event data summarizer ──────────────────────────────────────────────
function summarizeEventData(eventType, data) {
    switch (eventType) {
        case 'framework.adopted':
            return data.frameworkVersionId
                ? `Version ${data.frameworkVersionId}${data.reason ? ` — ${data.reason}` : ''}`
                : '';
        case 'evidence.created':
            return data.title ? `${data.title}` : '';
        case 'evidence.linked':
        case 'evidence.auto_linked':
            return data.controlId ? `Control ${data.controlId}` : '';
        case 'access.granted':
            return [data.systemName, data.role].filter(Boolean).join(' / ') || '';
        case 'access.revoked':
            return data.reason ? `Reason: ${data.reason}` : '';
        case 'access.reviewed':
            return data.systemName ? `${data.systemName}` : '';
        case 'system.created':
            return data.name
                ? `${data.name}${data.classification ? ` (${data.classification})` : ''}`
                : '';
        case 'baseline.created':
            return data.name ? `${data.name}` : '';
        case 'violation.detected':
            return data.ruleName ? `Rule: ${data.ruleName}` : '';
        case 'setting.updated':
            return data.key ? `${data.key}` : '';
        case 'snapshot.captured':
            return data.name
                ? `${data.name}${data.postureScore != null ? ` (score: ${data.postureScore})` : ''}`
                : '';
        default:
            return '';
    }
}
//# sourceMappingURL=events.js.map