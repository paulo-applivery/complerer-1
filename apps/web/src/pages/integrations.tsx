import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Link01Icon,
  RefreshIcon,
  Alert02Icon,
  CheckmarkCircle01Icon,
  Shield01Icon,
  Settings01Icon,
  LoaderPinwheelIcon,
  Search01Icon,
  Clock01Icon,
} from '@hugeicons/core-free-icons'
import {
  useIntegrationCatalog,
  useIntegrations,
  useConnectIntegration,
  useDisconnectIntegration,
  useSyncIntegration,
  useAnomalies,
  useResolveAnomaly,
  useDismissAnomaly,
} from '@/hooks/use-integrations'
import type { CatalogEntry, Integration, Anomaly } from '@/hooks/use-integrations'

// ── Helpers ───────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  identity: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  mdm: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  cloud: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ticketing: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  devops: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
}

const STATUS_STYLES: Record<string, { dot: string; label: string }> = {
  connected: { dot: 'bg-emerald-400', label: 'Connected' },
  syncing: { dot: 'bg-amber-400', label: 'Syncing' },
  error: { dot: 'bg-red-400', label: 'Error' },
  disconnected: { dot: 'bg-zinc-500', label: 'Disconnected' },
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ── Connected Integration Card ──────────────────────────────────────

function IntegrationCard({
  integration,
  onSync,
  onDisconnect,
  isSyncing,
}: {
  integration: Integration
  onSync: () => void
  onDisconnect: () => void
  isSyncing: boolean
}) {
  const status = STATUS_STYLES[integration.status] ?? STATUS_STYLES.disconnected
  const catalog = INTEGRATION_CATALOG_STATIC.find((c) => c.type === integration.type)
  const categoryClass = CATEGORY_COLORS[catalog?.category ?? ''] ?? CATEGORY_COLORS.identity

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
            <HugeiconsIcon icon={Link01Icon} size={20} className="text-primary-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">{integration.name}</h3>
            <span
              className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${categoryClass}`}
            >
              {catalog?.category ?? integration.type}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${status.dot}`} />
          <span className="text-xs text-zinc-400">{status.label}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
        <HugeiconsIcon icon={Clock01Icon} size={12} />
        <span>Last sync: {timeAgo(integration.last_sync_at)}</span>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onSync}
          disabled={isSyncing || integration.status === 'disconnected'}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HugeiconsIcon
            icon={RefreshIcon}
            size={12}
            className={isSyncing ? 'animate-spin' : ''}
          />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
        <button
          onClick={onDisconnect}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-zinc-700"
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}

// ── Catalog Card ────────────────────────────────────────────────────

function CatalogCard({
  entry,
  isConnected,
  onConnect,
}: {
  entry: CatalogEntry
  isConnected: boolean
  onConnect: () => void
}) {
  const categoryClass = CATEGORY_COLORS[entry.category] ?? CATEGORY_COLORS.identity

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
          <HugeiconsIcon icon={Settings01Icon} size={20} className="text-zinc-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-100">{entry.name}</h3>
            {isConnected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={10} />
                Connected
              </span>
            )}
          </div>
          <span
            className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${categoryClass}`}
          >
            {entry.category}
          </span>
          <p className="mt-2 text-xs text-zinc-500">{entry.description}</p>
        </div>
      </div>

      <div className="mt-4">
        {isConnected ? (
          <span className="text-xs text-zinc-500">Already connected</span>
        ) : (
          <button
            onClick={onConnect}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-400/10 px-3 py-1.5 text-xs font-medium text-primary-400 transition hover:bg-primary-400/20"
          >
            <HugeiconsIcon icon={Link01Icon} size={12} />
            Connect
          </button>
        )}
      </div>
    </div>
  )
}

// ── Anomaly Row ─────────────────────────────────────────────────────

function AnomalyRow({
  anomaly,
  onResolve,
  onDismiss,
}: {
  anomaly: Anomaly
  onResolve: () => void
  onDismiss: () => void
}) {
  const severityClass = SEVERITY_COLORS[anomaly.severity] ?? SEVERITY_COLORS.medium

  return (
    <tr className="border-b border-zinc-800/50 last:border-0">
      <td className="py-3 pr-4">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${severityClass}`}
        >
          {anomaly.type}
        </span>
      </td>
      <td className="py-3 pr-4">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${severityClass}`}
        >
          {anomaly.severity}
        </span>
      </td>
      <td className="py-3 pr-4 text-sm text-zinc-300">{anomaly.title}</td>
      <td className="py-3 pr-4 text-xs text-zinc-500">{anomaly.integration_name ?? '—'}</td>
      <td className="py-3 pr-4">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
            anomaly.status === 'open'
              ? 'bg-amber-500/10 text-amber-400'
              : anomaly.status === 'resolved'
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-zinc-500/10 text-zinc-400'
          }`}
        >
          {anomaly.status}
        </span>
      </td>
      <td className="py-3 pr-4 text-xs text-zinc-500">{timeAgo(anomaly.created_at)}</td>
      <td className="py-3">
        {anomaly.status === 'open' && (
          <div className="flex gap-2">
            <button
              onClick={onResolve}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition"
            >
              Resolve
            </button>
            <button
              onClick={onDismiss}
              className="text-xs font-medium text-zinc-400 hover:text-zinc-300 transition"
            >
              Dismiss
            </button>
          </div>
        )}
      </td>
    </tr>
  )
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
]

// ── Page ────────────────────────────────────────────────────────────

export function IntegrationsPage() {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const workspaceId = params.workspaceId

  const { catalog, isLoading: catalogLoading } = useIntegrationCatalog(workspaceId)
  const { integrations, isLoading: integrationsLoading } = useIntegrations(workspaceId)
  const { anomalies, isLoading: anomaliesLoading } = useAnomalies(workspaceId)

  const connectMutation = useConnectIntegration(workspaceId)
  const disconnectMutation = useDisconnectIntegration(workspaceId)
  const syncMutation = useSyncIntegration(workspaceId)
  const resolveMutation = useResolveAnomaly(workspaceId)
  const dismissMutation = useDismissAnomaly(workspaceId)

  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set())

  const connectedTypes = new Set(
    integrations.filter((i) => i.status !== 'disconnected').map((i) => i.type)
  )

  const activeIntegrations = integrations.filter((i) => i.status !== 'disconnected')

  const handleSync = async (integrationId: string) => {
    setSyncingIds((prev) => new Set(prev).add(integrationId))
    try {
      await syncMutation.mutateAsync(integrationId)
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev)
        next.delete(integrationId)
        return next
      })
    }
  }

  const isLoading = catalogLoading || integrationsLoading

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <HugeiconsIcon icon={LoaderPinwheelIcon} size={24} className="animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Integrations</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Connect your tools and services to automate compliance data collection.
        </p>
      </div>

      {/* Connected Integrations */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-emerald-400" />
          <h2 className="text-lg font-semibold text-zinc-100">Connected Integrations</h2>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
            {activeIntegrations.length}
          </span>
        </div>

        {activeIntegrations.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <HugeiconsIcon icon={Link01Icon} size={32} className="mx-auto text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-500">No integrations connected yet</p>
            <p className="mt-1 text-xs text-zinc-600">
              Choose a connector below to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeIntegrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onSync={() => handleSync(integration.id)}
                onDisconnect={() => disconnectMutation.mutate(integration.id)}
                isSyncing={syncingIds.has(integration.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Available Connectors */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <HugeiconsIcon icon={Search01Icon} size={16} className="text-primary-400" />
          <h2 className="text-lg font-semibold text-zinc-100">Available Connectors</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(catalog.length > 0 ? catalog : INTEGRATION_CATALOG_STATIC).map((entry) => (
            <CatalogCard
              key={entry.type}
              entry={entry as CatalogEntry}
              isConnected={connectedTypes.has(entry.type)}
              onConnect={() => connectMutation.mutate({ type: entry.type })}
            />
          ))}
        </div>
      </section>

      {/* Anomalies */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <HugeiconsIcon icon={Alert02Icon} size={16} className="text-amber-400" />
          <h2 className="text-lg font-semibold text-zinc-100">Anomalies</h2>
          {anomalies.length > 0 && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
              {anomalies.filter((a) => a.status === 'open').length} open
            </span>
          )}
        </div>

        {anomaliesLoading ? (
          <div className="flex justify-center py-8">
            <HugeiconsIcon icon={LoaderPinwheelIcon} size={20} className="animate-spin text-zinc-500" />
          </div>
        ) : anomalies.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <HugeiconsIcon icon={Shield01Icon} size={32} className="mx-auto text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-500">No anomalies detected</p>
            <p className="mt-1 text-xs text-zinc-600">
              Anomalies will appear here when integrations detect unusual patterns.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Type</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Severity</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Title</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Integration</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Status</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Detected</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((anomaly) => (
                  <AnomalyRow
                    key={anomaly.id}
                    anomaly={anomaly}
                    onResolve={() => resolveMutation.mutate({ anomalyId: anomaly.id })}
                    onDismiss={() => dismissMutation.mutate(anomaly.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
