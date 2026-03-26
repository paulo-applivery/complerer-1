import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Clock01Icon,
  Shield01Icon,
  FileValidationIcon,
  Key01Icon,
  Alert02Icon,
  Link01Icon,
  Settings01Icon,
  UserAdd01Icon,
  Search01Icon,
  FilterIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  LoaderPinwheelIcon,
  CheckmarkCircle01Icon,
  Layers01Icon,
  SecurityCheckIcon,
} from '@hugeicons/core-free-icons'

// ── Types ──────────────────────────────────────────────────────────────

interface ComplianceEvent {
  id: string
  workspaceId: string
  eventType: string
  entityType: string
  entityId: string
  data: Record<string, unknown> | null
  actorId: string | null
  actorType: string
  actorName?: string | null
  createdAt: string
}

interface EventsResponse {
  events: ComplianceEvent[]
  total: number
  page: number
  limit: number
}

// ── Event config ───────────────────────────────────────────────────────

const EVENT_TYPE_CONFIG: Record<
  string,
  { icon: typeof Layers01Icon; label: string; category: string }
> = {
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
}

const CATEGORY_COLORS: Record<string, { dot: string; border: string; badge: string }> = {
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
}

function getEventConfig(eventType: string) {
  return (
    EVENT_TYPE_CONFIG[eventType] ?? {
      icon: Clock01Icon,
      label: eventType.replace('.', ' '),
      category: 'system',
    }
  )
}

function getCategoryColors(category: string) {
  return (
    CATEGORY_COLORS[category] ?? CATEGORY_COLORS.system
  )
}

// ── Helpers ────────────────────────────────────────────────────────────

function relativeTime(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then

  if (diffMs < 0) return 'just now'

  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`

  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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
]

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
]

// ── Component ──────────────────────────────────────────────────────────

export function EventsPage() {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const workspaceId = params.workspaceId

  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState('')
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 25

  // Build query params
  const queryParams = new URLSearchParams()
  queryParams.set('page', String(page))
  queryParams.set('limit', String(pageSize))
  if (eventTypeFilter) queryParams.set('eventType', eventTypeFilter)
  if (entityTypeFilter) queryParams.set('entityType', entityTypeFilter)
  if (fromDate) queryParams.set('from', new Date(fromDate).toISOString())
  if (toDate) queryParams.set('to', new Date(toDate + 'T23:59:59').toISOString())

  const { data, isLoading } = useQuery<EventsResponse>({
    queryKey: ['events', workspaceId, page, eventTypeFilter, entityTypeFilter, fromDate, toDate],
    queryFn: () =>
      api.get(`/workspaces/${workspaceId}/events?${queryParams.toString()}`),
    enabled: !!workspaceId,
  })

  const events = data?.events ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)

  const handleClearFilters = () => {
    setEventTypeFilter('')
    setEntityTypeFilter('')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  const hasFilters = eventTypeFilter || entityTypeFilter || fromDate || toDate

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Compliance Events</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Timeline of all compliance activity across the workspace
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center gap-2 mb-3">
          <HugeiconsIcon icon={FilterIcon} size={16} className="text-zinc-400" />
          <span className="text-sm font-medium text-zinc-300">Filters</span>
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="ml-auto text-xs text-primary-400 hover:text-primary-300"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Event type */}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Event Type</label>
            <select
              value={eventTypeFilter}
              onChange={(e) => {
                setEventTypeFilter(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400/40"
            >
              <option value="">All event types</option>
              {ALL_EVENT_TYPES.map((et) => (
                <option key={et} value={et}>
                  {getEventConfig(et).label}
                </option>
              ))}
            </select>
          </div>

          {/* Entity type */}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Entity Type</label>
            <select
              value={entityTypeFilter}
              onChange={(e) => {
                setEntityTypeFilter(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400/40"
            >
              <option value="">All entity types</option>
              {ALL_ENTITY_TYPES.map((et) => (
                <option key={et} value={et}>
                  {et.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* From date */}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400/40"
            />
          </div>

          {/* To date */}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400/40"
            />
          </div>
        </div>
      </div>

      {/* Results summary */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-zinc-400">
          {total} event{total !== 1 ? 's' : ''} found
          {hasFilters ? ' (filtered)' : ''}
        </span>
        <span className="text-sm text-zinc-500">
          Page {page} of {Math.max(1, totalPages)}
        </span>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <HugeiconsIcon
            icon={LoaderPinwheelIcon}
            size={24}
            className="animate-spin text-primary-400"
          />
          <span className="ml-2 text-sm text-zinc-400">Loading events...</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && events.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-20">
          <HugeiconsIcon icon={Clock01Icon} size={40} className="text-zinc-600" />
          <p className="mt-3 text-sm text-zinc-400">
            {hasFilters ? 'No events match the current filters' : 'No compliance events yet'}
          </p>
        </div>
      )}

      {/* Timeline */}
      {!isLoading && events.length > 0 && (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-zinc-800" />

          <div className="space-y-1">
            {events.map((event) => {
              const config = getEventConfig(event.eventType)
              const colors = getCategoryColors(config.category)

              return (
                <div key={event.id} className="relative flex gap-4 pl-2">
                  {/* Timeline dot */}
                  <div className="relative z-10 mt-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
                    <div className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
                  </div>

                  {/* Event card */}
                  <div
                    className={`flex-1 rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.badge}`}
                        >
                          <HugeiconsIcon icon={config.icon} size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-100">
                            {config.label}
                          </p>
                          {event.data && (
                            <p className="mt-0.5 text-xs text-zinc-400">
                              {summarizeEventData(event.eventType, event.data)}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {/* Entity type badge */}
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${colors.badge}`}
                            >
                              {event.entityType.replace(/_/g, ' ')}
                            </span>
                            {/* Actor */}
                            {(event.actorName || event.actorId) && (
                              <span className="text-xs text-zinc-500">
                                by{' '}
                                <span className="text-zinc-300">
                                  {event.actorName ?? event.actorId}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Timestamp */}
                      <div className="shrink-0 text-right">
                        <span className="text-xs text-zinc-500">{relativeTime(event.createdAt)}</span>
                        <p className="mt-0.5 text-xs text-zinc-600">{formatDate(event.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors ${
                    pageNum === page
                      ? 'bg-primary-400/10 text-primary-400 font-medium'
                      : 'text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Event data summarizer ──────────────────────────────────────────────

function summarizeEventData(
  eventType: string,
  data: Record<string, unknown>
): string {
  switch (eventType) {
    case 'framework.adopted':
      return data.frameworkVersionId
        ? `Version ${data.frameworkVersionId}${data.reason ? ` — ${data.reason}` : ''}`
        : ''
    case 'evidence.created':
      return data.title ? `${data.title}` : ''
    case 'evidence.linked':
    case 'evidence.auto_linked':
      return data.controlId ? `Control ${data.controlId}` : ''
    case 'access.granted':
      return [data.systemName, data.role].filter(Boolean).join(' / ') || ''
    case 'access.revoked':
      return data.reason ? `Reason: ${data.reason}` : ''
    case 'access.reviewed':
      return data.systemName ? `${data.systemName}` : ''
    case 'system.created':
      return data.name
        ? `${data.name}${data.classification ? ` (${data.classification})` : ''}`
        : ''
    case 'baseline.created':
      return data.name ? `${data.name}` : ''
    case 'violation.detected':
      return data.ruleName ? `Rule: ${data.ruleName}` : ''
    case 'setting.updated':
      return data.key ? `${data.key}` : ''
    case 'snapshot.captured':
      return data.name
        ? `${data.name}${data.postureScore != null ? ` (score: ${data.postureScore})` : ''}`
        : ''
    default:
      return ''
  }
}
