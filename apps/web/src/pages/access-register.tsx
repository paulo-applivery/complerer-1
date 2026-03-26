import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import {
  useSystemsList,
  useCreateSystem,
  useDirectoryUsers,
  useCreateDirectoryUser,
  useAccessRecords,
  useCreateAccess,
  useRevokeAccess,
  useReviewAccess,
} from '@/hooks/use-compliance'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  DashboardBrowsingIcon,
  UserGroupIcon,
  Key01Icon,
  PlusSignIcon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Shield01Icon,
  Search01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  LoaderPinwheelIcon,
  CancelCircleIcon,
  ClipboardIcon,
} from '@hugeicons/core-free-icons'

type Tab = 'access' | 'systems' | 'people'

export function AccessRegisterPage() {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const workspaceId = params.workspaceId
  const [activeTab, setActiveTab] = useState<Tab>('access')

  const tabs: { id: Tab; label: string; icon: typeof Key01Icon }[] = [
    { id: 'access', label: 'Access Records', icon: Key01Icon },
    { id: 'systems', label: 'Systems', icon: DashboardBrowsingIcon },
    { id: 'people', label: 'People', icon: UserGroupIcon },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Access Register</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage systems, people, and access grants across your organization.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <HugeiconsIcon icon={tab.icon} size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'systems' && <SystemsSection workspaceId={workspaceId} />}
      {activeTab === 'people' && <PeopleSection workspaceId={workspaceId} />}
      {activeTab === 'access' && <AccessSection workspaceId={workspaceId} />}
    </div>
  )
}

// ── Systems Section ─────────────────────────────────────────────────────────

function SystemsSection({ workspaceId }: { workspaceId: string | undefined }) {
  const { systems, isLoading } = useSystemsList(workspaceId)
  const createMutation = useCreateSystem(workspaceId)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    classification: 'standard',
    sensitivity: '',
    environment: '',
    mfaRequired: false,
    owner: '',
  })

  const handleSubmit = () => {
    if (!form.name.trim()) return
    createMutation.mutate(
      {
        name: form.name,
        classification: form.classification,
        sensitivity: form.sensitivity || undefined,
        environment: form.environment || undefined,
        mfaRequired: form.mfaRequired,
        owner: form.owner || undefined,
      },
      {
        onSuccess: () => {
          setForm({ name: '', classification: 'standard', sensitivity: '', environment: '', mfaRequired: false, owner: '' })
          setShowForm(false)
        },
      },
    )
  }

  const classificationBadge = (c: string) => {
    switch (c) {
      case 'critical':
        return 'bg-red-500/10 text-red-400'
      case 'standard':
        return 'bg-amber-500/10 text-amber-400'
      case 'low':
        return 'bg-primary-400/10 text-primary-400'
      default:
        return 'bg-zinc-500/10 text-zinc-400'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <HugeiconsIcon icon={LoaderPinwheelIcon} size={20} className="animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Systems</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300"
        >
          {showForm ? <HugeiconsIcon icon={Cancel01Icon} size={16} /> : <HugeiconsIcon icon={PlusSignIcon} size={16} />}
          {showForm ? 'Cancel' : 'Add System'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-100">New System</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="e.g. Production Database"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Classification</label>
              <select
                value={form.classification}
                onChange={(e) => setForm({ ...form, classification: e.target.value })}
                className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
              >
                <option value="critical">Critical</option>
                <option value="standard">Standard</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Sensitivity</label>
              <input
                value={form.sensitivity}
                onChange={(e) => setForm({ ...form, sensitivity: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="e.g. PII, Financial"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Environment</label>
              <input
                value={form.environment}
                onChange={(e) => setForm({ ...form, environment: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="e.g. Production"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Owner</label>
              <input
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="e.g. Security Team"
              />
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={form.mfaRequired}
                  onChange={(e) => setForm({ ...form, mfaRequired: e.target.checked })}
                  className="rounded border-zinc-600 bg-zinc-800 text-primary-400 focus:ring-primary-400"
                />
                MFA Required
              </label>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!form.name.trim() || createMutation.isPending}
              className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create System'}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        {systems.length === 0 ? (
          <div className="py-12 text-center">
            <HugeiconsIcon icon={DashboardBrowsingIcon} size={32} className="mx-auto text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-400">No systems registered yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Classification</th>
                  <th className="px-5 py-3 font-medium">Sensitivity</th>
                  <th className="px-5 py-3 font-medium">Environment</th>
                  <th className="px-5 py-3 font-medium">MFA</th>
                  <th className="px-5 py-3 font-medium">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {systems.map((system) => (
                  <tr key={system.id} className="transition-colors hover:bg-zinc-800/30">
                    <td className="px-5 py-3 font-medium text-zinc-100">{system.name}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${classificationBadge(system.classification)}`}>
                        {system.classification}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-400">{system.sensitivity ?? '—'}</td>
                    <td className="px-5 py-3 text-zinc-400">{system.environment ?? '—'}</td>
                    <td className="px-5 py-3">
                      {system.mfaRequired ? (
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-primary-400" />
                      ) : (
                        <HugeiconsIcon icon={Cancel01Icon} size={16} className="text-zinc-600" />
                      )}
                    </td>
                    <td className="px-5 py-3 text-zinc-400">{system.owner ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── People Section ──────────────────────────────────────────────────────────

function PeopleSection({ workspaceId }: { workspaceId: string | undefined }) {
  const [search, setSearch] = useState('')
  const { users, isLoading } = useDirectoryUsers(workspaceId, { search })
  const createMutation = useCreateDirectoryUser(workspaceId)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', department: '' })

  const handleSubmit = () => {
    if (!form.name.trim() || !form.email.trim()) return
    createMutation.mutate(
      {
        name: form.name,
        email: form.email,
        department: form.department || undefined,
      },
      {
        onSuccess: () => {
          setForm({ name: '', email: '', department: '' })
          setShowForm(false)
        },
      },
    )
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-primary-400/10 text-primary-400'
      case 'inactive':
        return 'bg-zinc-500/10 text-zinc-400'
      case 'terminated':
        return 'bg-red-500/10 text-red-400'
      default:
        return 'bg-zinc-500/10 text-zinc-400'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <HugeiconsIcon icon={LoaderPinwheelIcon} size={20} className="animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">People</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300"
        >
          {showForm ? <HugeiconsIcon icon={Cancel01Icon} size={16} /> : <HugeiconsIcon icon={PlusSignIcon} size={16} />}
          {showForm ? 'Cancel' : 'Add Person'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-100">New Person</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Email *</label>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="john@company.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Department</label>
              <input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="Engineering"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!form.name.trim() || !form.email.trim() || createMutation.isPending}
              className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Add Person'}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
          placeholder="Search by name or email..."
        />
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        {users.length === 0 ? (
          <div className="py-12 text-center">
            <HugeiconsIcon icon={UserGroupIcon} size={32} className="mx-auto text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-400">No people found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Department</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-zinc-800/30">
                    <td className="px-5 py-3 font-medium text-zinc-100">{user.name}</td>
                    <td className="px-5 py-3 text-zinc-400">{user.email}</td>
                    <td className="px-5 py-3 text-zinc-400">{user.department ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Access Records Section ──────────────────────────────────────────────────

function AccessSection({ workspaceId }: { workspaceId: string | undefined }) {
  const { systems } = useSystemsList(workspaceId)
  const { users } = useDirectoryUsers(workspaceId)

  const [statusFilter, setStatusFilter] = useState('active')
  const [systemFilter, setSystemFilter] = useState('')
  const [page, setPage] = useState(1)
  const limit = 25

  const { records, total, isLoading } = useAccessRecords(workspaceId, {
    status: statusFilter,
    systemId: systemFilter,
    page,
    limit,
  })

  const createMutation = useCreateAccess(workspaceId)
  const revokeMutation = useRevokeAccess(workspaceId)
  const reviewMutation = useReviewAccess(workspaceId)

  const [showForm, setShowForm] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null)
  const [form, setForm] = useState({
    userId: '',
    systemId: '',
    role: 'read',
    approvedBy: '',
    ticketRef: '',
  })

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const handleSubmit = () => {
    if (!form.userId || !form.systemId) return
    createMutation.mutate(
      {
        userId: form.userId,
        systemId: form.systemId,
        role: form.role,
        approvedBy: form.approvedBy || undefined,
        ticketRef: form.ticketRef || undefined,
      },
      {
        onSuccess: () => {
          setForm({ userId: '', systemId: '', role: 'read', approvedBy: '', ticketRef: '' })
          setShowForm(false)
        },
      },
    )
  }

  const handleRevoke = (id: string) => {
    revokeMutation.mutate(id, {
      onSuccess: () => setConfirmRevoke(null),
    })
  }

  const riskScoreColor = (score: number) => {
    if (score > 0.7) return 'text-red-400'
    if (score > 0.4) return 'text-amber-400'
    return 'text-primary-400'
  }

  const riskScoreBg = (score: number) => {
    if (score > 0.7) return 'bg-red-500/10'
    if (score > 0.4) return 'bg-amber-500/10'
    return 'bg-primary-400/10'
  }

  const roleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-red-400'
      case 'write':
        return 'bg-amber-500/10 text-amber-400'
      case 'read':
        return 'bg-primary-400/10 text-primary-400'
      default:
        return 'bg-zinc-500/10 text-zinc-400'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Access Records</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300"
        >
          {showForm ? <HugeiconsIcon icon={Cancel01Icon} size={16} /> : <HugeiconsIcon icon={PlusSignIcon} size={16} />}
          {showForm ? 'Cancel' : 'Grant Access'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-100">Grant Access</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Person *</label>
              <select
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
              >
                <option value="">Select person...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">System *</label>
              <select
                value={form.systemId}
                onChange={(e) => setForm({ ...form, systemId: e.target.value })}
                className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
              >
                <option value="">Select system...</option>
                {systems.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
              >
                <option value="admin">Admin</option>
                <option value="write">Write</option>
                <option value="read">Read</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Approved By</label>
              <input
                value={form.approvedBy}
                onChange={(e) => setForm({ ...form, approvedBy: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="Approver name"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Ticket Reference</label>
              <input
                value={form.ticketRef}
                onChange={(e) => setForm({ ...form, ticketRef: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="e.g. JIRA-1234"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!form.userId || !form.systemId || createMutation.isPending}
              className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Granting...' : 'Grant Access'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={systemFilter}
          onChange={(e) => {
            setSystemFilter(e.target.value)
            setPage(1)
          }}
          className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-300 focus:border-primary-400 focus:outline-none"
        >
          <option value="">All systems</option>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-300 focus:border-primary-400 focus:outline-none"
        >
          <option value="active">Active</option>
          <option value="revoked">Revoked</option>
          <option value="">All</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <HugeiconsIcon icon={LoaderPinwheelIcon} size={20} className="animate-spin text-zinc-500" />
          </div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center">
            <HugeiconsIcon icon={Key01Icon} size={32} className="mx-auto text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-400">No access records found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                    <th className="px-5 py-3 font-medium">Person</th>
                    <th className="px-5 py-3 font-medium">System</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Access Type</th>
                    <th className="px-5 py-3 font-medium">Granted</th>
                    <th className="px-5 py-3 font-medium">Approved By</th>
                    <th className="px-5 py-3 font-medium">Risk</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {records.map((record) => (
                    <tr key={record.id} className="transition-colors hover:bg-zinc-800/30">
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-medium text-zinc-100">{record.userName}</p>
                          <p className="text-xs text-zinc-500">{record.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-zinc-300">{record.systemName}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge(record.role)}`}>
                          {record.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-zinc-400">{record.accessType ?? '—'}</td>
                      <td className="px-5 py-3 text-zinc-400">
                        {new Date(record.grantedAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-zinc-400">{record.approvedBy ?? '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${riskScoreBg(record.riskScore)} ${riskScoreColor(record.riskScore)}`}>
                          {record.riskScore.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            record.status === 'active'
                              ? 'bg-primary-400/10 text-primary-400'
                              : 'bg-zinc-500/10 text-zinc-400'
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {record.status === 'active' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => reviewMutation.mutate(record.id)}
                              disabled={reviewMutation.isPending}
                              className="flex items-center gap-1 rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300"
                              title="Mark as reviewed"
                            >
                              <HugeiconsIcon icon={ClipboardIcon} size={14} />
                              Review
                            </button>
                            {confirmRevoke === record.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleRevoke(record.id)}
                                  disabled={revokeMutation.isPending}
                                  className="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setConfirmRevoke(null)}
                                  className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmRevoke(record.id)}
                                className="flex items-center gap-1 rounded-lg border border-red-500/20 px-2.5 py-1 text-xs text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/5"
                                title="Revoke access"
                              >
                                <HugeiconsIcon icon={CancelCircleIcon} size={14} />
                                Revoke
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-3">
                <p className="text-xs text-zinc-500">
                  Page {page} of {totalPages} ({total} total)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-40"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-40"
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
