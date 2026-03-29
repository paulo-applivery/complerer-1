import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Building06Icon,
  UserGroupIcon,
  FileValidationIcon,
  Shield01Icon,
  Search01Icon,
  PlusSignIcon,
  Edit01Icon,
  Delete02Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Key01Icon,
  Settings01Icon,
  DashboardBrowsingIcon,
  Link01Icon,
} from '@hugeicons/core-free-icons'
import { api } from '@/lib/api'
import { useAdminWorkspaces, useAdminStats } from '@/hooks/use-admin'

interface WorkspaceDetail {
  workspace: {
    id: string
    name: string
    slug: string
    plan: string
    createdAt: string
    updatedAt: string
    memberCount: number
    frameworkCount: number
    evidenceCount: number
    eventCount: number
    systemCount: number
  }
  members: {
    userId: string
    email: string
    name: string
    role: string
    joinedAt: string
  }[]
}

export function AdminWorkspacesPage() {
  const qc = useQueryClient()
  const { data: wsData, isLoading: wsLoading } = useAdminWorkspaces()
  const { data: statsData, isLoading: statsLoading } = useAdminStats()
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', slug: '', plan: 'free' })

  const workspaces = wsData?.workspaces ?? []
  const stats = statsData?.stats

  const filtered = search
    ? workspaces.filter((w) =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.slug.toLowerCase().includes(search.toLowerCase())
      )
    : workspaces

  const avgControls = stats && stats.totalWorkspaces > 0
    ? Math.round(stats.totalControls / stats.totalWorkspaces)
    : 0

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/admin/workspaces', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'workspaces'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
      setShowCreate(false)
      setCreateForm({ name: '', slug: '', plan: 'free' })
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/workspaces/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'workspaces'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
      setExpandedId(null)
    },
  })

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Workspaces</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage all workspaces on the platform.</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} />
          Create Workspace
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Workspaces', value: stats?.totalWorkspaces ?? 0, icon: Building06Icon },
          { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: UserGroupIcon },
          { label: 'Total Evidence', value: stats?.totalEvidence ?? 0, icon: FileValidationIcon },
          { label: 'Avg Controls / Workspace', value: avgControls, icon: Shield01Icon },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">{s.label}</p>
              <HugeiconsIcon icon={s.icon} size={14} className="text-zinc-600" />
            </div>
            <p className="mt-1 text-xl font-bold text-zinc-100">{statsLoading ? '...' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-100">New Workspace</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Name *</label>
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value, slug: autoSlug(e.target.value) })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Slug *</label>
              <input
                value={createForm.slug}
                onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="acme-corp"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Plan</label>
              <select
                value={createForm.plan}
                onChange={(e) => setCreateForm({ ...createForm, plan: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
              >
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600">Cancel</button>
            <button
              onClick={() => createMut.mutate(createForm)}
              disabled={!createForm.name.trim() || !createForm.slug.trim() || createMut.isPending}
              className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50"
            >
              {createMut.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search workspaces..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-9 pr-4 text-sm text-zinc-200 outline-none focus:border-zinc-700"
        />
      </div>

      {/* Table */}
      {wsLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-primary-400" />
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
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">Systems</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Created</th>
                <th className="w-16 px-2 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtered.map((w) => (
                <>
                  <tr
                    key={w.id}
                    className={`cursor-pointer bg-zinc-900 transition-colors hover:bg-zinc-800/30 ${expandedId === w.id ? 'bg-zinc-800/20' : ''}`}
                    onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-zinc-200">{w.name}</td>
                    <td className="px-4 py-3"><code className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{w.slug}</code></td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                        w.plan === 'enterprise' ? 'bg-primary-400/10 text-primary-400' :
                        w.plan === 'pro' ? 'bg-blue-500/10 text-blue-400' :
                        w.plan === 'starter' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {w.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-zinc-400">{w.memberCount}</td>
                    <td className="px-4 py-3 text-center text-sm text-zinc-400">{w.frameworkCount}</td>
                    <td className="px-4 py-3 text-center text-sm text-zinc-400">{w.evidenceCount}</td>
                    <td className="px-4 py-3 text-center text-sm text-zinc-400">{w.systemCount}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{new Date(w.createdAt).toLocaleDateString()}</td>
                    <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          if (confirm(`Delete workspace "${w.name}"? This will delete ALL data including members, evidence, systems, and policies. This cannot be undone.`))
                            deleteMut.mutate(w.id)
                        }}
                        className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
                        title="Delete workspace"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={14} />
                      </button>
                    </td>
                  </tr>
                  {expandedId === w.id && (
                    <tr key={`${w.id}-detail`}>
                      <td colSpan={9} className="bg-zinc-800/20 px-4 py-4">
                        <WorkspaceDetailPanel workspaceId={w.id} workspaceName={w.name} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-zinc-500">
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

// ── Workspace Detail Panel ──────────────────────────────────────────────────

function WorkspaceDetailPanel({ workspaceId, workspaceName }: { workspaceId: string; workspaceName: string }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery<WorkspaceDetail>({
    queryKey: ['admin', 'workspace-detail', workspaceId],
    queryFn: () => api.get(`/admin/workspaces/${workspaceId}/detail`),
  })

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', slug: '', plan: '' })
  const [addMemberForm, setAddMemberForm] = useState({ email: '', role: 'member' })
  const [showAddMember, setShowAddMember] = useState(false)

  const updateMut = useMutation({
    mutationFn: (payload: any) => api.put(`/admin/workspaces/${workspaceId}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'workspaces'] })
      qc.invalidateQueries({ queryKey: ['admin', 'workspace-detail', workspaceId] })
      setEditing(false)
    },
  })

  const addMemberMut = useMutation({
    mutationFn: (payload: any) => api.post(`/admin/workspaces/${workspaceId}/members`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'workspace-detail', workspaceId] })
      qc.invalidateQueries({ queryKey: ['admin', 'workspaces'] })
      setAddMemberForm({ email: '', role: 'member' })
      setShowAddMember(false)
    },
  })

  const changeRoleMut = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.put(`/admin/workspaces/${workspaceId}/members/${userId}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'workspace-detail', workspaceId] }),
  })

  const removeMemberMut = useMutation({
    mutationFn: (userId: string) => api.delete(`/admin/workspaces/${workspaceId}/members/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'workspace-detail', workspaceId] })
      qc.invalidateQueries({ queryKey: ['admin', 'workspaces'] })
    },
  })

  if (isLoading) return <div className="py-4 text-center text-xs text-zinc-500">Loading details...</div>
  if (!data) return <div className="py-4 text-center text-xs text-zinc-500">Failed to load.</div>

  const { workspace: ws, members } = data

  const startEdit = () => {
    setEditForm({ name: ws.name, slug: ws.slug, plan: ws.plan })
    setEditing(true)
  }

  const ROLE_COLORS: Record<string, string> = {
    owner: 'bg-primary-400/10 text-primary-400',
    admin: 'bg-blue-500/10 text-blue-400',
    auditor: 'bg-purple-500/10 text-purple-400',
    member: 'bg-zinc-500/10 text-zinc-300',
    viewer: 'bg-zinc-500/10 text-zinc-500',
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Left: Workspace info */}
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-zinc-300">Workspace Details</p>
          {!editing && (
            <button onClick={startEdit} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
              <HugeiconsIcon icon={Edit01Icon} size={12} />
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[10px] text-zinc-500">Name</label>
              <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-100 focus:border-primary-400 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-zinc-500">Slug</label>
              <input value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 font-mono text-xs text-zinc-100 focus:border-primary-400 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-zinc-500">Plan</label>
              <select value={editForm.plan} onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })} className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-100 focus:border-primary-400 focus:outline-none">
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:border-zinc-600">Cancel</button>
              <button onClick={() => updateMut.mutate(editForm)} disabled={updateMut.isPending} className="rounded bg-primary-400 px-2.5 py-1 text-xs font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50">
                {updateMut.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {[
              { label: 'ID', value: ws.id },
              { label: 'Name', value: ws.name },
              { label: 'Slug', value: ws.slug },
              { label: 'Plan', value: ws.plan },
              { label: 'Created', value: new Date(ws.createdAt).toLocaleString() },
              { label: 'Updated', value: new Date(ws.updatedAt).toLocaleString() },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">{row.label}</span>
                <span className="text-zinc-300 font-mono">{row.value}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-zinc-800 grid grid-cols-4 gap-2">
              {[
                { label: 'Members', value: ws.memberCount, icon: UserGroupIcon },
                { label: 'Frameworks', value: ws.frameworkCount, icon: Shield01Icon },
                { label: 'Evidence', value: ws.evidenceCount, icon: FileValidationIcon },
                { label: 'Systems', value: ws.systemCount, icon: DashboardBrowsingIcon },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-lg font-bold text-zinc-200">{s.value}</p>
                  <p className="text-[10px] text-zinc-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Members */}
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-zinc-300">Members ({members.length})</p>
          <button onClick={() => setShowAddMember(!showAddMember)} className="flex items-center gap-1 rounded bg-primary-400 px-2 py-1 text-[10px] font-medium text-zinc-950 hover:bg-primary-300">
            <HugeiconsIcon icon={PlusSignIcon} size={10} />
            Add Member
          </button>
        </div>

        {showAddMember && (
          <div className="mb-3 flex items-end gap-2 rounded-lg border border-zinc-700 bg-zinc-800 p-2.5">
            <div className="flex-1">
              <label className="mb-0.5 block text-[10px] text-zinc-500">Email</label>
              <input value={addMemberForm.email} onChange={(e) => setAddMemberForm({ ...addMemberForm, email: e.target.value })} placeholder="user@company.com" className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 focus:border-primary-400 focus:outline-none" />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] text-zinc-500">Role</label>
              <select value={addMemberForm.role} onChange={(e) => setAddMemberForm({ ...addMemberForm, role: e.target.value })} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 focus:border-primary-400 focus:outline-none">
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="auditor">Auditor</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <button onClick={() => addMemberMut.mutate(addMemberForm)} disabled={!addMemberForm.email.trim() || addMemberMut.isPending} className="rounded bg-primary-400 px-2.5 py-1 text-xs font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50">
              {addMemberMut.isPending ? '...' : 'Add'}
            </button>
            <button onClick={() => setShowAddMember(false)} className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:border-zinc-600">
              <HugeiconsIcon icon={Cancel01Icon} size={12} />
            </button>
          </div>
        )}

        <div className="max-h-[300px] overflow-y-auto space-y-1">
          {members.length === 0 ? (
            <p className="py-4 text-center text-xs text-zinc-500">No members yet.</p>
          ) : members.map((m) => (
            <div key={m.userId} className="flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-800/30 px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-200 truncate">{m.name}</p>
                <p className="text-[10px] text-zinc-500 truncate">{m.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={m.role}
                  onChange={(e) => changeRoleMut.mutate({ userId: m.userId, role: e.target.value })}
                  className={`rounded-full border-0 px-2 py-0.5 text-[10px] font-medium ${ROLE_COLORS[m.role] ?? 'bg-zinc-800 text-zinc-400'} cursor-pointer focus:outline-none`}
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="auditor">Auditor</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  onClick={() => { if (confirm(`Remove ${m.name} from this workspace?`)) removeMemberMut.mutate(m.userId) }}
                  className="rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-red-400"
                  title="Remove member"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
