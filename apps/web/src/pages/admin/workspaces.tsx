import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Building06Icon,
  UserGroupIcon,
  FileValidationIcon,
  Shield01Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import { useAdminWorkspaces, useAdminStats } from '@/hooks/use-admin'

export function AdminWorkspacesPage() {
  const { data: wsData, isLoading: wsLoading } = useAdminWorkspaces()
  const { data: statsData, isLoading: statsLoading } = useAdminStats()
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const workspaces = wsData?.workspaces ?? []
  const stats = statsData?.stats

  const filtered = search
    ? workspaces.filter(
        (w) =>
          w.name.toLowerCase().includes(search.toLowerCase()) ||
          w.slug.toLowerCase().includes(search.toLowerCase())
      )
    : workspaces

  const avgControls = stats && stats.totalWorkspaces > 0
    ? Math.round(stats.totalControls / stats.totalWorkspaces)
    : 0

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Workspaces</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Overview of all workspaces on the platform.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
          <p className="text-xs text-zinc-500">Total Workspaces</p>
          <p className="mt-0.5 text-xl font-bold text-zinc-100">
            {statsLoading ? '...' : stats?.totalWorkspaces ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
          <p className="text-xs text-zinc-500">Total Users</p>
          <p className="mt-0.5 text-xl font-bold text-zinc-100">
            {statsLoading ? '...' : stats?.totalUsers ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
          <p className="text-xs text-zinc-500">Total Evidence</p>
          <p className="mt-0.5 text-xl font-bold text-zinc-100">
            {statsLoading ? '...' : stats?.totalEvidence ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
          <p className="text-xs text-zinc-500">Avg Controls / Workspace</p>
          <p className="mt-0.5 text-xl font-bold text-zinc-100">
            {statsLoading ? '...' : avgControls}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <HugeiconsIcon
          icon={Search01Icon}
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search workspaces..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-9 pr-4 text-sm text-zinc-200 outline-none focus:border-zinc-700"
        />
      </div>

      {/* Table */}
      {wsLoading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-sm text-zinc-500">Loading workspaces...</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Slug</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">Plan</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">Members</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">Frameworks</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">Evidence</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">Events</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtered.map((w) => (
                <tr
                  key={w.id}
                  className="cursor-pointer bg-zinc-900 transition-colors hover:bg-zinc-800/30"
                  onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
                >
                  <td className="px-4 py-3 text-sm font-medium text-zinc-200">{w.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{w.slug}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
                      {w.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-zinc-400">{w.memberCount}</td>
                  <td className="px-4 py-3 text-center text-sm text-zinc-400">{w.frameworkCount}</td>
                  <td className="px-4 py-3 text-center text-sm text-zinc-400">{w.evidenceCount}</td>
                  <td className="px-4 py-3 text-center text-sm text-zinc-400">{w.eventCount}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {new Date(w.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-zinc-500">
                    {search ? 'No workspaces match your search.' : 'No workspaces found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
