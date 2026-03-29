import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Building06Icon,
  UserGroupIcon,
  FileValidationIcon,
  Shield01Icon,
  Settings01Icon,
  Mail01Icon,
  Flag01Icon,
  Layers01Icon,
  Key01Icon,
  DashboardBrowsingIcon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons'
import { api } from '@/lib/api'

interface AdminStatsData {
  stats: {
    totalWorkspaces: number
    totalUsers: number
    totalEvidence: number
    totalControls: number
    totalSystems: number
    totalBaselines: number
    totalPolicies: number
    totalAccessRecords: number
    totalFrameworks: number
    totalPeople: number
    recentUsersWeek: number
  }
  recentWorkspaces: {
    id: string
    name: string
    slug: string
    plan: string
    created_at: string
    member_count: number
  }[]
  planDistribution: {
    plan: string
    count: number
  }[]
}

function useAdminDashboard() {
  return useQuery<AdminStatsData>({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get('/admin/stats'),
  })
}

// ── Components ──────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, onClick }: {
  label: string
  value: number | string
  icon: any
  color: string
  onClick?: () => void
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={`rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left transition-colors ${onClick ? 'hover:border-zinc-700 hover:bg-zinc-800/50 cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
          <HugeiconsIcon icon={icon} size={14} />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-zinc-100">{value}</p>
    </Comp>
  )
}

const PLAN_COLORS: Record<string, string> = {
  enterprise: 'bg-primary-400',
  pro: 'bg-blue-400',
  starter: 'bg-amber-400',
  free: 'bg-zinc-600',
}

// ── Main Page ───────────────────────────────────────────────────────────

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useAdminDashboard()
  const s = data?.stats
  const loading = isLoading ? '...' : undefined

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Platform Overview</h1>
        <p className="mt-1 text-sm text-zinc-500">Super admin dashboard for the Complerer platform.</p>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Workspaces" value={loading ?? s?.totalWorkspaces ?? 0} icon={Building06Icon} color="bg-primary-400/10 text-primary-400" onClick={() => navigate({ to: '/admin/workspaces' })} />
        <StatCard label="Users" value={loading ?? s?.totalUsers ?? 0} icon={UserGroupIcon} color="bg-blue-400/10 text-blue-400" onClick={() => navigate({ to: '/admin/members' })} />
        <StatCard label="Frameworks" value={loading ?? s?.totalFrameworks ?? 0} icon={Layers01Icon} color="bg-purple-400/10 text-purple-400" onClick={() => navigate({ to: '/admin/libraries' })} />
        <StatCard label="New Users (7d)" value={loading ?? s?.recentUsersWeek ?? 0} icon={UserGroupIcon} color="bg-green-400/10 text-green-400" />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
        {[
          { label: 'Controls', value: s?.totalControls ?? 0, icon: Shield01Icon, color: 'bg-blue-400/10 text-blue-400' },
          { label: 'Evidence', value: s?.totalEvidence ?? 0, icon: FileValidationIcon, color: 'bg-amber-400/10 text-amber-400' },
          { label: 'Systems', value: s?.totalSystems ?? 0, icon: DashboardBrowsingIcon, color: 'bg-cyan-400/10 text-cyan-400' },
          { label: 'Baselines', value: s?.totalBaselines ?? 0, icon: Settings01Icon, color: 'bg-purple-400/10 text-purple-400' },
          { label: 'Access Records', value: s?.totalAccessRecords ?? 0, icon: Key01Icon, color: 'bg-green-400/10 text-green-400' },
          { label: 'People', value: s?.totalPeople ?? 0, icon: UserGroupIcon, color: 'bg-pink-400/10 text-pink-400' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
            <div className="flex items-center gap-2">
              <div className={`flex h-6 w-6 items-center justify-center rounded-md ${item.color}`}>
                <HugeiconsIcon icon={item.icon} size={12} />
              </div>
              <p className="text-[10px] text-zinc-500">{item.label}</p>
            </div>
            <p className="mt-1 text-lg font-bold text-zinc-100">{loading ?? item.value}</p>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Workspaces */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-200">Recent Workspaces</h2>
            <button
              onClick={() => navigate({ to: '/admin/workspaces' })}
              className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
            >
              View all <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
            </button>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-zinc-500">Loading...</div>
          ) : (data?.recentWorkspaces ?? []).length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">No workspaces yet.</div>
          ) : (
            <div className="space-y-2">
              {(data?.recentWorkspaces ?? []).map((ws: any) => (
                <div
                  key={ws.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-800/30 px-3 py-2.5 transition-colors hover:border-zinc-700"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200">{ws.name}</p>
                    <p className="text-[10px] text-zinc-500">
                      <code>{ws.slug}</code> · {ws.member_count} members · {new Date(ws.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                    ws.plan === 'enterprise' ? 'bg-primary-400/10 text-primary-400' :
                    ws.plan === 'pro' ? 'bg-blue-500/10 text-blue-400' :
                    ws.plan === 'starter' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {ws.plan}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plan Distribution + Quick Links */}
        <div className="space-y-6">
          {/* Plan Distribution */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4">Plan Distribution</h2>
            {isLoading ? (
              <div className="py-4 text-center text-xs text-zinc-500">Loading...</div>
            ) : (data?.planDistribution ?? []).length === 0 ? (
              <div className="py-4 text-center text-xs text-zinc-500">No data.</div>
            ) : (
              <div className="space-y-2">
                {(data?.planDistribution ?? []).map((p: any) => {
                  const total = s?.totalWorkspaces ?? 1
                  const pct = Math.round((p.count / total) * 100)
                  return (
                    <div key={p.plan} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-300 capitalize">{p.plan}</span>
                        <span className="text-zinc-500">{p.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className={`h-2 rounded-full transition-all ${PLAN_COLORS[p.plan] ?? 'bg-zinc-600'}`}
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-sm font-semibold text-zinc-200 mb-3">Quick Links</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Providers', path: '/admin/providers', icon: Settings01Icon, color: 'bg-amber-400/10 text-amber-400' },
                { label: 'Email Templates', path: '/admin/email-templates', icon: Mail01Icon, color: 'bg-pink-400/10 text-pink-400' },
                { label: 'Feature Flags', path: '/admin/feature-flags', icon: Flag01Icon, color: 'bg-orange-400/10 text-orange-400' },
                { label: 'Libraries', path: '/admin/libraries', icon: Layers01Icon, color: 'bg-purple-400/10 text-purple-400' },
                { label: 'Workspaces', path: '/admin/workspaces', icon: Building06Icon, color: 'bg-primary-400/10 text-primary-400' },
                { label: 'Members', path: '/admin/members', icon: UserGroupIcon, color: 'bg-blue-400/10 text-blue-400' },
              ].map((link) => (
                <button
                  key={link.label}
                  onClick={() => navigate({ to: link.path })}
                  className="flex items-center gap-2.5 rounded-lg border border-zinc-800/50 bg-zinc-800/30 px-3 py-2.5 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-800/50"
                >
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${link.color}`}>
                    <HugeiconsIcon icon={link.icon} size={13} />
                  </div>
                  <span className="text-xs font-medium text-zinc-300">{link.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
