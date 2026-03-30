import { useState, useEffect, useRef } from 'react'
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
  Cancel01Icon,
  LockPasswordIcon,
  ArrowRight01Icon,
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
  useOAuthInit,
} from '@/hooks/use-integrations'
import type { CatalogEntry, Integration, Anomaly, ProviderField } from '@/hooks/use-integrations'

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  identity: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  mdm: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  cloud: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ticketing: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  devops: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
}

const STATUS_STYLES: Record<string, { dot: string; label: string }> = {
  connected: { dot: 'bg-emerald-400', label: 'Connected' },
  syncing: { dot: 'bg-amber-400 animate-pulse', label: 'Syncing' },
  error: { dot: 'bg-red-400', label: 'Error' },
  disconnected: { dot: 'bg-zinc-500', label: 'Disconnected' },
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const AUTH_TYPE_LABEL: Record<string, string> = {
  oauth_global: 'One-click OAuth',
  oauth_custom: 'OAuth (custom credentials)',
  api_key: 'API Key',
}

const AUTH_TYPE_BADGE: Record<string, string> = {
  oauth_global: 'bg-primary-400/10 text-primary-400 border-primary-400/20',
  oauth_custom: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  api_key: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

// ── Connect Modal ─────────────────────────────────────────────────────────────

function ConnectModal({
  entry,
  onClose,
  onSubmit,
  isLoading,
}: {
  entry: CatalogEntry
  onClose: () => void
  onSubmit: (credentials: Record<string, string>) => void
  isLoading: boolean
}) {
  const [values, setValues] = useState<Record<string, string>>({})

  const fields: ProviderField[] = entry.fields ?? []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(values)
  }

  const categoryClass = CATEGORY_COLORS[entry.category] ?? CATEGORY_COLORS.identity

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800">
              <HugeiconsIcon icon={LockPasswordIcon} size={18} className="text-primary-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Connect {entry.name}</h2>
              <span
                className={`mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${categoryClass}`}
              >
                {entry.category}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <p className="text-xs text-zinc-500">{entry.description}</p>

          {fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                {field.label}
                {field.required && <span className="ml-1 text-red-400">*</span>}
              </label>
              <input
                type={field.type === 'password' ? 'password' : 'text'}
                placeholder={field.placeholder}
                value={values[field.key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                required={field.required}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-primary-400/50 focus:ring-1 focus:ring-primary-400/20"
              />
              {field.help && (
                <p className="mt-1 text-[11px] text-zinc-600">{field.help}</p>
              )}
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-400 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-primary-300 disabled:opacity-50"
            >
              {isLoading ? (
                <HugeiconsIcon icon={LoaderPinwheelIcon} size={13} className="animate-spin" />
              ) : (
                <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
              )}
              {isLoading ? 'Connecting…' : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Integration Card (connected) ──────────────────────────────────────────────

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
              className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${AUTH_TYPE_BADGE[integration.auth_type] ?? ''}`}
            >
              {AUTH_TYPE_LABEL[integration.auth_type] ?? integration.auth_type}
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

      {integration.last_sync_error && (
        <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-[11px] text-red-400">
          {integration.last_sync_error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={onSync}
          disabled={isSyncing || integration.status === 'disconnected'}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <HugeiconsIcon
            icon={RefreshIcon}
            size={12}
            className={isSyncing ? 'animate-spin' : ''}
          />
          {isSyncing ? 'Syncing…' : 'Sync Now'}
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

// ── Catalog Card ──────────────────────────────────────────────────────────────

function CatalogCard({
  entry,
  isConnected,
  onConnect,
  isConnecting,
}: {
  entry: CatalogEntry
  isConnected: boolean
  onConnect: () => void
  isConnecting: boolean
}) {
  const categoryClass = CATEGORY_COLORS[entry.category] ?? CATEGORY_COLORS.identity
  const authBadge = AUTH_TYPE_BADGE[entry.authType] ?? AUTH_TYPE_BADGE.api_key
  const authLabel = AUTH_TYPE_LABEL[entry.authType] ?? entry.authType

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col">
      <div className="flex items-start gap-3 flex-1">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
          <HugeiconsIcon icon={Settings01Icon} size={20} className="text-zinc-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-zinc-100">{entry.name}</h3>
            {isConnected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={10} />
                Connected
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${categoryClass}`}>
              {entry.category}
            </span>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${authBadge}`}>
              {authLabel}
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">{entry.description}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-800">
        {isConnected ? (
          <span className="text-xs text-zinc-600">Already connected</span>
        ) : (
          <button
            onClick={onConnect}
            disabled={isConnecting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-400/10 px-3 py-1.5 text-xs font-medium text-primary-400 transition hover:bg-primary-400/20 disabled:opacity-50"
          >
            {isConnecting ? (
              <HugeiconsIcon icon={LoaderPinwheelIcon} size={12} className="animate-spin" />
            ) : entry.authType === 'oauth_global' ? (
              <HugeiconsIcon icon={Link01Icon} size={12} />
            ) : (
              <HugeiconsIcon icon={LockPasswordIcon} size={12} />
            )}
            {isConnecting
              ? 'Connecting…'
              : entry.authType === 'oauth_global'
                ? 'Connect with OAuth'
                : 'Configure & Connect'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Anomaly Row ───────────────────────────────────────────────────────────────

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
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${severityClass}`}>
          {anomaly.type}
        </span>
      </td>
      <td className="py-3 pr-4">
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${severityClass}`}>
          {anomaly.severity}
        </span>
      </td>
      <td className="py-3 pr-4 text-sm text-zinc-300">{anomaly.title}</td>
      <td className="py-3 pr-4 text-xs text-zinc-500">{anomaly.integration_name ?? '—'}</td>
      <td className="py-3 pr-4">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
          anomaly.status === 'open' ? 'bg-amber-500/10 text-amber-400'
          : anomaly.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400'
          : 'bg-zinc-500/10 text-zinc-400'
        }`}>
          {anomaly.status}
        </span>
      </td>
      <td className="py-3 pr-4 text-xs text-zinc-500">{timeAgo(anomaly.created_at)}</td>
      <td className="py-3">
        {anomaly.status === 'open' && (
          <div className="flex gap-2">
            <button onClick={onResolve} className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition">
              Resolve
            </button>
            <button onClick={onDismiss} className="text-xs font-medium text-zinc-400 hover:text-zinc-300 transition">
              Dismiss
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

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
  const oauthInitMutation = useOAuthInit(workspaceId)

  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set())
  const [connectingType, setConnectingType] = useState<string | null>(null)
  const [modalEntry, setModalEntry] = useState<CatalogEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const popupRef = useRef<Window | null>(null)

  const connectedTypes = new Set(
    integrations.filter((i) => i.status !== 'disconnected').map((i) => i.type)
  )

  const activeIntegrations = integrations.filter((i) => i.status !== 'disconnected')

  const filteredCatalog = catalog.filter(
    (e) =>
      !searchQuery ||
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Listen for OAuth popup messages
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'OAUTH_SUCCESS') {
        setConnectingType(null)
        // Reload integrations
        window.location.reload()
      } else if (event.data?.type === 'OAUTH_ERROR') {
        setConnectingType(null)
        console.error('OAuth error:', event.data.error)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleConnect = async (entry: CatalogEntry) => {
    if (entry.authType === 'oauth_global') {
      // Open popup for OAuth flow
      setConnectingType(entry.type)
      try {
        const { authUrl } = await oauthInitMutation.mutateAsync(entry.type)
        const popup = window.open(
          authUrl,
          `oauth_${entry.type}`,
          'width=600,height=700,left=200,top=100,toolbar=0,menubar=0,location=0'
        )
        popupRef.current = popup

        // Poll for popup closure (fallback if postMessage doesn't fire)
        const poll = setInterval(() => {
          if (popup?.closed) {
            clearInterval(poll)
            setConnectingType(null)
          }
        }, 500)
      } catch {
        setConnectingType(null)
      }
    } else {
      // Show credential modal
      setModalEntry(entry)
    }
  }

  const handleCredentialSubmit = async (credentials: Record<string, string>) => {
    if (!modalEntry) return
    setConnectingType(modalEntry.type)
    try {
      await connectMutation.mutateAsync({ type: modalEntry.type, credentials })
      setModalEntry(null)
    } finally {
      setConnectingType(null)
    }
  }

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
    <>
      {/* Credential Modal */}
      {modalEntry && (
        <ConnectModal
          entry={modalEntry}
          onClose={() => setModalEntry(null)}
          onSubmit={handleCredentialSubmit}
          isLoading={connectMutation.isPending}
        />
      )}

      <div className="mx-auto max-w-6xl space-y-8 p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Integrations</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Connect your tools to automate compliance evidence collection and monitoring.
          </p>
        </div>

        {/* Connected Integrations */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-emerald-400" />
            <h2 className="text-lg font-semibold text-zinc-100">Connected</h2>
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
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Search01Icon} size={16} className="text-primary-400" />
              <h2 className="text-lg font-semibold text-zinc-100">Available Connectors</h2>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                {catalog.length}
              </span>
            </div>
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="text"
                placeholder="Search connectors…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-600 sm:w-64"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCatalog.map((entry) => (
              <CatalogCard
                key={entry.type}
                entry={entry}
                isConnected={connectedTypes.has(entry.type)}
                onConnect={() => handleConnect(entry)}
                isConnecting={connectingType === entry.type}
              />
            ))}
          </div>

          {filteredCatalog.length === 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="text-sm text-zinc-500">No connectors match your search.</p>
            </div>
          )}
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
                Anomalies appear when integrations detect unusual patterns.
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
    </>
  )
}
