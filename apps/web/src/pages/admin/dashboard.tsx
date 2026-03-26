import { useNavigate } from '@tanstack/react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Building06Icon,
  UserGroupIcon,
  FileValidationIcon,
  Shield01Icon,
  Settings01Icon,
  Mail01Icon,
  Flag01Icon,
} from '@hugeicons/core-free-icons'
import { useAdminStats } from '@/hooks/use-admin'

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: typeof Building06Icon }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-zinc-100">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800">
          <HugeiconsIcon icon={icon} size={20} className="text-primary-400" />
        </div>
      </div>
    </div>
  )
}

function QuickLink({ label, description, path, icon }: { label: string; description: string; path: string; icon: typeof Settings01Icon }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate({ to: path })}
      className="flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-800/50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
        <HugeiconsIcon icon={icon} size={20} className="text-amber-400" />
      </div>
      <div>
        <p className="font-medium text-zinc-100">{label}</p>
        <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
      </div>
    </button>
  )
}

export function AdminDashboardPage() {
  const { data, isLoading } = useAdminStats()
  const stats = data?.stats

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Platform Overview</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Super admin dashboard for the Complerer platform.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Workspaces" value={isLoading ? '...' : stats?.totalWorkspaces ?? 0} icon={Building06Icon} />
        <StatCard label="Users" value={isLoading ? '...' : stats?.totalUsers ?? 0} icon={UserGroupIcon} />
        <StatCard label="Evidence Items" value={isLoading ? '...' : stats?.totalEvidence ?? 0} icon={FileValidationIcon} />
        <StatCard label="Total Controls" value={isLoading ? '...' : stats?.totalControls ?? 0} icon={Shield01Icon} />
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-200">Quick Links</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <QuickLink
            label="Providers"
            description="Manage AI, email, and integration providers"
            path="/admin/providers"
            icon={Settings01Icon}
          />
          <QuickLink
            label="Email Templates"
            description="Edit transactional and notification emails"
            path="/admin/email-templates"
            icon={Mail01Icon}
          />
          <QuickLink
            label="Feature Flags"
            description="Toggle features and control rollout"
            path="/admin/feature-flags"
            icon={Flag01Icon}
          />
          <QuickLink
            label="Workspaces"
            description="View all workspaces and their stats"
            path="/admin/workspaces"
            icon={Building06Icon}
          />
        </div>
      </div>
    </div>
  )
}
