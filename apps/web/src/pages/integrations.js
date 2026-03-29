import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { Link01Icon, RefreshIcon, Alert02Icon, CheckmarkCircle01Icon, Shield01Icon, Settings01Icon, LoaderPinwheelIcon, Search01Icon, Clock01Icon, } from '@hugeicons/core-free-icons';
import { useIntegrationCatalog, useIntegrations, useConnectIntegration, useDisconnectIntegration, useSyncIntegration, useAnomalies, useResolveAnomaly, useDismissAnomaly, } from '@/hooks/use-integrations';
// ── Helpers ───────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
    identity: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    mdm: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    cloud: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    ticketing: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    devops: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};
const STATUS_STYLES = {
    connected: { dot: 'bg-emerald-400', label: 'Connected' },
    syncing: { dot: 'bg-amber-400', label: 'Syncing' },
    error: { dot: 'bg-red-400', label: 'Error' },
    disconnected: { dot: 'bg-zinc-500', label: 'Disconnected' },
};
const SEVERITY_COLORS = {
    low: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
};
function timeAgo(dateStr) {
    if (!dateStr)
        return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1)
        return 'Just now';
    if (minutes < 60)
        return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
// ── Connected Integration Card ──────────────────────────────────────
function IntegrationCard({ integration, onSync, onDisconnect, isSyncing, }) {
    const status = STATUS_STYLES[integration.status] ?? STATUS_STYLES.disconnected;
    const catalog = INTEGRATION_CATALOG_STATIC.find((c) => c.type === integration.type);
    const categoryClass = CATEGORY_COLORS[catalog?.category ?? ''] ?? CATEGORY_COLORS.identity;
    return (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800", children: _jsx(HugeiconsIcon, { icon: Link01Icon, size: 20, className: "text-primary-400" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-zinc-100", children: integration.name }), _jsx("span", { className: `mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${categoryClass}`, children: catalog?.category ?? integration.type })] })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: `h-2 w-2 rounded-full ${status.dot}` }), _jsx("span", { className: "text-xs text-zinc-400", children: status.label })] })] }), _jsxs("div", { className: "mt-4 flex items-center gap-2 text-xs text-zinc-500", children: [_jsx(HugeiconsIcon, { icon: Clock01Icon, size: 12 }), _jsxs("span", { children: ["Last sync: ", timeAgo(integration.last_sync_at)] })] }), _jsxs("div", { className: "mt-4 flex gap-2", children: [_jsxs("button", { onClick: onSync, disabled: isSyncing || integration.status === 'disconnected', className: "inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed", children: [_jsx(HugeiconsIcon, { icon: RefreshIcon, size: 12, className: isSyncing ? 'animate-spin' : '' }), isSyncing ? 'Syncing...' : 'Sync Now'] }), _jsx("button", { onClick: onDisconnect, className: "inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-zinc-700", children: "Disconnect" })] })] }));
}
// ── Catalog Card ────────────────────────────────────────────────────
function CatalogCard({ entry, isConnected, onConnect, }) {
    const categoryClass = CATEGORY_COLORS[entry.category] ?? CATEGORY_COLORS.identity;
    return (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-5", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800", children: _jsx(HugeiconsIcon, { icon: Settings01Icon, size: 20, className: "text-zinc-400" }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "text-sm font-semibold text-zinc-100", children: entry.name }), isConnected && (_jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20", children: [_jsx(HugeiconsIcon, { icon: CheckmarkCircle01Icon, size: 10 }), "Connected"] }))] }), _jsx("span", { className: `mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${categoryClass}`, children: entry.category }), _jsx("p", { className: "mt-2 text-xs text-zinc-500", children: entry.description })] })] }), _jsx("div", { className: "mt-4", children: isConnected ? (_jsx("span", { className: "text-xs text-zinc-500", children: "Already connected" })) : (_jsxs("button", { onClick: onConnect, className: "inline-flex items-center gap-1.5 rounded-lg bg-primary-400/10 px-3 py-1.5 text-xs font-medium text-primary-400 transition hover:bg-primary-400/20", children: [_jsx(HugeiconsIcon, { icon: Link01Icon, size: 12 }), "Connect"] })) })] }));
}
// ── Anomaly Row ─────────────────────────────────────────────────────
function AnomalyRow({ anomaly, onResolve, onDismiss, }) {
    const severityClass = SEVERITY_COLORS[anomaly.severity] ?? SEVERITY_COLORS.medium;
    return (_jsxs("tr", { className: "border-b border-zinc-800/50 last:border-0", children: [_jsx("td", { className: "py-3 pr-4", children: _jsx("span", { className: `inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${severityClass}`, children: anomaly.type }) }), _jsx("td", { className: "py-3 pr-4", children: _jsx("span", { className: `inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${severityClass}`, children: anomaly.severity }) }), _jsx("td", { className: "py-3 pr-4 text-sm text-zinc-300", children: anomaly.title }), _jsx("td", { className: "py-3 pr-4 text-xs text-zinc-500", children: anomaly.integration_name ?? '—' }), _jsx("td", { className: "py-3 pr-4", children: _jsx("span", { className: `inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${anomaly.status === 'open'
                        ? 'bg-amber-500/10 text-amber-400'
                        : anomaly.status === 'resolved'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-zinc-500/10 text-zinc-400'}`, children: anomaly.status }) }), _jsx("td", { className: "py-3 pr-4 text-xs text-zinc-500", children: timeAgo(anomaly.created_at) }), _jsx("td", { className: "py-3", children: anomaly.status === 'open' && (_jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: onResolve, className: "text-xs font-medium text-emerald-400 hover:text-emerald-300 transition", children: "Resolve" }), _jsx("button", { onClick: onDismiss, className: "text-xs font-medium text-zinc-400 hover:text-zinc-300 transition", children: "Dismiss" })] })) })] }));
}
// ── Static catalog (for icon mapping in cards) ──────────────────────
const INTEGRATION_CATALOG_STATIC = [
    { type: 'okta', name: 'Okta', category: 'identity' },
    { type: 'azure_ad', name: 'Azure AD / Entra ID', category: 'identity' },
    { type: 'google_ws', name: 'Google Workspace', category: 'identity' },
    { type: 'applivery', name: 'Applivery', category: 'mdm' },
    { type: 'aws', name: 'AWS', category: 'cloud' },
    { type: 'jira', name: 'Jira', category: 'ticketing' },
    { type: 'linear', name: 'Linear', category: 'ticketing' },
    { type: 'github', name: 'GitHub', category: 'devops' },
];
// ── Page ────────────────────────────────────────────────────────────
export function IntegrationsPage() {
    const params = useParams({ strict: false });
    const workspaceId = params.workspaceId;
    const { catalog, isLoading: catalogLoading } = useIntegrationCatalog(workspaceId);
    const { integrations, isLoading: integrationsLoading } = useIntegrations(workspaceId);
    const { anomalies, isLoading: anomaliesLoading } = useAnomalies(workspaceId);
    const connectMutation = useConnectIntegration(workspaceId);
    const disconnectMutation = useDisconnectIntegration(workspaceId);
    const syncMutation = useSyncIntegration(workspaceId);
    const resolveMutation = useResolveAnomaly(workspaceId);
    const dismissMutation = useDismissAnomaly(workspaceId);
    const [syncingIds, setSyncingIds] = useState(new Set());
    const connectedTypes = new Set(integrations.filter((i) => i.status !== 'disconnected').map((i) => i.type));
    const activeIntegrations = integrations.filter((i) => i.status !== 'disconnected');
    const handleSync = async (integrationId) => {
        setSyncingIds((prev) => new Set(prev).add(integrationId));
        try {
            await syncMutation.mutateAsync(integrationId);
        }
        finally {
            setSyncingIds((prev) => {
                const next = new Set(prev);
                next.delete(integrationId);
                return next;
            });
        }
    };
    const isLoading = catalogLoading || integrationsLoading;
    if (isLoading) {
        return (_jsx("div", { className: "flex h-full items-center justify-center", children: _jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 24, className: "animate-spin text-zinc-500" }) }));
    }
    return (_jsxs("div", { className: "mx-auto max-w-6xl space-y-8 p-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-zinc-100", children: "Integrations" }), _jsx("p", { className: "mt-1 text-sm text-zinc-500", children: "Connect your tools and services to automate compliance data collection." })] }), _jsxs("section", { children: [_jsxs("div", { className: "mb-4 flex items-center gap-2", children: [_jsx(HugeiconsIcon, { icon: CheckmarkCircle01Icon, size: 16, className: "text-emerald-400" }), _jsx("h2", { className: "text-lg font-semibold text-zinc-100", children: "Connected Integrations" }), _jsx("span", { className: "rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400", children: activeIntegrations.length })] }), activeIntegrations.length === 0 ? (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center", children: [_jsx(HugeiconsIcon, { icon: Link01Icon, size: 32, className: "mx-auto text-zinc-600" }), _jsx("p", { className: "mt-3 text-sm text-zinc-500", children: "No integrations connected yet" }), _jsx("p", { className: "mt-1 text-xs text-zinc-600", children: "Choose a connector below to get started." })] })) : (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: activeIntegrations.map((integration) => (_jsx(IntegrationCard, { integration: integration, onSync: () => handleSync(integration.id), onDisconnect: () => disconnectMutation.mutate(integration.id), isSyncing: syncingIds.has(integration.id) }, integration.id))) }))] }), _jsxs("section", { children: [_jsxs("div", { className: "mb-4 flex items-center gap-2", children: [_jsx(HugeiconsIcon, { icon: Search01Icon, size: 16, className: "text-primary-400" }), _jsx("h2", { className: "text-lg font-semibold text-zinc-100", children: "Available Connectors" })] }), _jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", children: (catalog.length > 0 ? catalog : INTEGRATION_CATALOG_STATIC).map((entry) => (_jsx(CatalogCard, { entry: entry, isConnected: connectedTypes.has(entry.type), onConnect: () => connectMutation.mutate({ type: entry.type }) }, entry.type))) })] }), _jsxs("section", { children: [_jsxs("div", { className: "mb-4 flex items-center gap-2", children: [_jsx(HugeiconsIcon, { icon: Alert02Icon, size: 16, className: "text-amber-400" }), _jsx("h2", { className: "text-lg font-semibold text-zinc-100", children: "Anomalies" }), anomalies.length > 0 && (_jsxs("span", { className: "rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400", children: [anomalies.filter((a) => a.status === 'open').length, " open"] }))] }), anomaliesLoading ? (_jsx("div", { className: "flex justify-center py-8", children: _jsx(HugeiconsIcon, { icon: LoaderPinwheelIcon, size: 20, className: "animate-spin text-zinc-500" }) })) : anomalies.length === 0 ? (_jsxs("div", { className: "rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center", children: [_jsx(HugeiconsIcon, { icon: Shield01Icon, size: 32, className: "mx-auto text-zinc-600" }), _jsx("p", { className: "mt-3 text-sm text-zinc-500", children: "No anomalies detected" }), _jsx("p", { className: "mt-1 text-xs text-zinc-600", children: "Anomalies will appear here when integrations detect unusual patterns." })] })) : (_jsx("div", { className: "overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900", children: _jsxs("table", { className: "w-full text-left", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-zinc-800", children: [_jsx("th", { className: "px-5 py-3 text-xs font-medium text-zinc-500", children: "Type" }), _jsx("th", { className: "px-5 py-3 text-xs font-medium text-zinc-500", children: "Severity" }), _jsx("th", { className: "px-5 py-3 text-xs font-medium text-zinc-500", children: "Title" }), _jsx("th", { className: "px-5 py-3 text-xs font-medium text-zinc-500", children: "Integration" }), _jsx("th", { className: "px-5 py-3 text-xs font-medium text-zinc-500", children: "Status" }), _jsx("th", { className: "px-5 py-3 text-xs font-medium text-zinc-500", children: "Detected" }), _jsx("th", { className: "px-5 py-3 text-xs font-medium text-zinc-500", children: "Actions" })] }) }), _jsx("tbody", { children: anomalies.map((anomaly) => (_jsx(AnomalyRow, { anomaly: anomaly, onResolve: () => resolveMutation.mutate({ anomalyId: anomaly.id }), onDismiss: () => dismissMutation.mutate(anomaly.id) }, anomaly.id))) })] }) }))] })] }));
}
//# sourceMappingURL=integrations.js.map