import { useParams, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useWorkspace } from '@/hooks/use-workspace'
import { api } from '@/lib/api'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Layers01Icon,
  Shield01Icon,
  FileValidationIcon,
  Key01Icon,
  Alert02Icon,
  Clock01Icon,
  PlusSignIcon,
  Link01Icon,
  EyeIcon,
  ArrowRight01Icon,
  Settings01Icon,
  UserAdd01Icon,
  SecurityCheckIcon,
  File01Icon,
  RefreshIcon,
} from '@hugeicons/core-free-icons'

// ── Types ──────────────────────────────────────────────────────────────

interface FrameworkCoverage {
  name: string
  slug: string
  version: string
  totalControls: number
  coveredControls: number
  coveragePercent: number
}

interface DashboardData {
  dashboard: {
    adoptions: {
      count: number
      frameworks: FrameworkCoverage[]
    }
    evidence: {
      total: number
      expired: number
      expiringSoon: number
      fresh: number
    }
    access: {
      totalActive: number
      highRisk: number
      unreviewed: number
    }
    recentEvents: {
      id: string
      eventType: string
      entityType: string
      actorName: string
      createdAt: string
    }[]
  }
}

// ── Hook ───────────────────────────────────────────────────────────────

function useDashboard(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/dashboard`),
    enabled: !!workspaceId,
    refetchInterval: 60000,
  })

  return { dashboard: data?.dashboard, isLoading }
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

const EVENT_CONFIG: Record<string, { icon: typeof Layers01Icon; label: string }> = {
  'evidence.linked': { icon: Link01Icon, label: 'Evidence linked to control' },
  'evidence.created': { icon: PlusSignIcon, label: 'Evidence created' },
  'access.granted': { icon: UserAdd01Icon, label: 'Access granted' },
  'access.revoked': { icon: Key01Icon, label: 'Access revoked' },
  'access.reviewed': { icon: EyeIcon, label: 'Access reviewed' },
  'system.created': { icon: Settings01Icon, label: 'System created' },
  'system.updated': { icon: RefreshIcon, label: 'System updated' },
  'framework.adopted': { icon: SecurityCheckIcon, label: 'Framework adopted' },
  'directory_user.created': { icon: UserAdd01Icon, label: 'Directory user created' },
}

function getEventConfig(eventType: string) {
  return EVENT_CONFIG[eventType] ?? { icon: File01Icon, label: eventType.replace('.', ' ') }
}

// ── Component ──────────────────────────────────────────────────────────

export function DashboardPage() {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const { workspace } = useWorkspace(params.workspaceId)
  const { dashboard, isLoading } = useDashboard(params.workspaceId)

  // Aggregate totals across frameworks
  const totalControls = dashboard?.adoptions.frameworks.reduce((s, f) => s + f.totalControls, 0) ?? 0
  const coveredControls = dashboard?.adoptions.frameworks.reduce((s, f) => s + f.coveredControls, 0) ?? 0
  const overallCoverage = totalControls > 0 ? Math.round((coveredControls / totalControls) * 1000) / 10 : 0

  const stats = [
    {
      title: 'Frameworks',
      value: dashboard?.adoptions.count ?? 0,
      desc: `${dashboard?.adoptions.count === 1 ? '1 framework' : `${dashboard?.adoptions.count ?? 0} frameworks`} adopted`,
      icon: Layers01Icon,
      color: 'text-primary-400',
    },
    {
      title: 'Controls',
      value: totalControls > 0 ? `${coveredControls} / ${totalControls}` : '0',
      desc: `${overallCoverage}% coverage`,
      icon: Shield01Icon,
      color: 'text-blue-400',
    },
    {
      title: 'Evidence',
      value: dashboard?.evidence.total ?? 0,
      desc: `${dashboard?.evidence.fresh ?? 0} fresh · ${dashboard?.evidence.expiringSoon ?? 0} expiring · ${dashboard?.evidence.expired ?? 0} expired`,
      icon: FileValidationIcon,
      color: 'text-amber-400',
    },
    {
      title: 'Access',
      value: dashboard?.access.totalActive ?? 0,
      desc: `${dashboard?.access.highRisk ?? 0} high risk · ${dashboard?.access.unreviewed ?? 0} unreviewed`,
      icon: Key01Icon,
      color: 'text-red-400',
    },
  ]

  if (isLoading) {
    return (
      <>
        <div className="grid auto-rows-min gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-64 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900" />
          <div className="h-64 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900" />
        </div>
      </>
    )
  }

  return (
    <>
      {/* Row 1: Stats cards */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        {stats.map((stat) => {
          return (
            <div
              key={stat.title}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-400">{stat.title}</p>
                <HugeiconsIcon icon={stat.icon} size={16} className={stat.color} />
              </div>
              <p className="mt-3 text-3xl font-bold text-zinc-100">{stat.value}</p>
              <p className="mt-1 text-xs text-zinc-500">{stat.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Row 2: Framework Coverage */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Framework Coverage</h2>
          <Link
            to="/w/$workspaceId/gap-analysis"
            params={{ workspaceId: params.workspaceId ?? '' }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary-400/30 bg-primary-400/10 px-3 py-1.5 text-xs font-medium text-primary-400 transition-colors hover:bg-primary-400/20"
          >
            <HugeiconsIcon icon={Shield01Icon} size={14} />
            Run Gap Analysis
          </Link>
        </div>

        {dashboard && dashboard.adoptions.frameworks.length > 0 ? (
          <div className="mt-4 space-y-4">
            {dashboard.adoptions.frameworks.map((fw) => (
              <div key={`${fw.slug}-${fw.version}`} className="flex items-center gap-4">
                <div className="w-40 shrink-0">
                  <p className="text-sm font-medium text-zinc-200">
                    {fw.name}{' '}
                    <span className="text-zinc-500">{fw.version}</span>
                  </p>
                </div>
                <div className="flex-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-2 rounded-full bg-primary-400 transition-all duration-500"
                      style={{ width: `${Math.max(fw.coveragePercent, 1)}%` }}
                    />
                  </div>
                </div>
                <div className="w-44 shrink-0 text-right">
                  <span className="text-sm text-zinc-400">
                    {fw.coveredControls} / {fw.totalControls} controls covered
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-3 py-8">
            <HugeiconsIcon icon={Layers01Icon} size={32} className="text-zinc-600" />
            <p className="text-sm text-zinc-500">
              Adopt a framework to see coverage
            </p>
            <Link
              to="/w/$workspaceId/frameworks"
              params={{ workspaceId: params.workspaceId ?? '' }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary-400/30 bg-primary-400/10 px-4 py-2 text-sm font-medium text-primary-400 transition-colors hover:bg-primary-400/20"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
              Adopt Framework
            </Link>
          </div>
        )}
      </div>

      {/* Row 3: Two columns */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left: Recent Activity */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-zinc-100">Recent Activity</h2>

          {dashboard && dashboard.recentEvents.length > 0 ? (
            <div className="relative mt-4">
              {/* Timeline line */}
              <div className="absolute left-[9px] top-2 bottom-2 w-px border-l border-zinc-800" />

              <div className="space-y-4">
                {dashboard.recentEvents.map((event) => {
                  const config = getEventConfig(event.eventType)
                  return (
                    <div key={event.id} className="relative flex gap-3 pl-0">
                      {/* Dot */}
                      <div className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800">
                        <HugeiconsIcon icon={config.icon} size={12} className="text-zinc-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300">{config.label}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {event.actorName} &middot; {relativeTime(event.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center gap-2 py-8">
              <HugeiconsIcon icon={Clock01Icon} size={24} className="text-zinc-600" />
              <p className="text-sm text-zinc-500">No recent activity</p>
            </div>
          )}
        </div>

        {/* Right: Access Risk */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-zinc-100">Access Risk</h2>

          {dashboard ? (
            <div className="mt-4 space-y-4">
              {/* Total Active */}
              <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <HugeiconsIcon icon={Key01Icon} size={16} className="text-zinc-400" />
                  <span className="text-sm text-zinc-300">Active access records</span>
                </div>
                <span className="text-sm font-semibold text-zinc-100">
                  {dashboard.access.totalActive}
                </span>
              </div>

              {/* High Risk */}
              <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <HugeiconsIcon icon={Alert02Icon} size={16} className="text-red-400" />
                  <span className="text-sm text-zinc-300">High risk</span>
                </div>
                <span className="inline-flex items-center rounded-full bg-red-400/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                  {dashboard.access.highRisk}
                </span>
              </div>

              {/* Unreviewed */}
              <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <HugeiconsIcon icon={EyeIcon} size={16} className="text-amber-400" />
                  <span className="text-sm text-zinc-300">Unreviewed</span>
                </div>
                <span className="inline-flex items-center rounded-full bg-amber-400/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                  {dashboard.access.unreviewed}
                </span>
              </div>

              {/* Link to access register */}
              <Link
                to="/w/$workspaceId/access"
                params={{ workspaceId: params.workspaceId ?? '' }}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary-400 transition-colors hover:text-primary-300"
              >
                View Access Register
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
