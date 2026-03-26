import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import {
  useBaselines,
  useCreateBaseline,
  useUpdateBaseline,
  useBaselineViolations,
  useResolveViolation,
  useExemptViolation,
} from '@/hooks/use-settings'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Shield01Icon,
  PlusSignIcon,
  Cancel01Icon,
  LoaderPinwheelIcon,
  CheckmarkCircle01Icon,
  Alert02Icon,
  ToggleOnIcon,
  ToggleOffIcon,
} from '@hugeicons/core-free-icons'

type Tab = 'rules' | 'violations'

export function BaselinesPage() {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const workspaceId = params.workspaceId
  const [activeTab, setActiveTab] = useState<Tab>('rules')

  const tabs: { id: Tab; label: string; icon: typeof Shield01Icon }[] = [
    { id: 'rules', label: 'Baseline Rules', icon: Shield01Icon },
    { id: 'violations', label: 'Violations', icon: Alert02Icon },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Baselines</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Define configuration baselines and track violations across your environment.
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

      {activeTab === 'rules' && <BaselineRulesSection workspaceId={workspaceId} />}
      {activeTab === 'violations' && <ViolationsSection workspaceId={workspaceId} />}
    </div>
  )
}

// ── Baseline Rules Section ──────────────────────────────────────────────────

function BaselineRulesSection({ workspaceId }: { workspaceId: string | undefined }) {
  const { baselines, isLoading } = useBaselines(workspaceId)
  const createMutation = useCreateBaseline(workspaceId)
  const updateMutation = useUpdateBaseline(workspaceId)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'access',
    severity: 'medium',
    ruleConfig: '',
  })

  const handleSubmit = () => {
    if (!form.name.trim()) return
    createMutation.mutate(
      {
        name: form.name,
        description: form.description || undefined,
        category: form.category,
        severity: form.severity,
        ruleConfig: form.ruleConfig || undefined,
      },
      {
        onSuccess: () => {
          setForm({ name: '', description: '', category: 'access', severity: 'medium', ruleConfig: '' })
          setShowForm(false)
        },
      },
    )
  }

  const handleToggle = (id: string, currentEnabled: boolean) => {
    updateMutation.mutate({ id, enabled: !currentEnabled })
  }

  const severityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-400'
      case 'high':
        return 'bg-amber-500/10 text-amber-400'
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400'
      case 'low':
        return 'bg-primary-400/10 text-primary-400'
      default:
        return 'bg-zinc-500/10 text-zinc-400'
    }
  }

  const categoryBadge = (category: string) => {
    switch (category) {
      case 'access':
        return 'bg-blue-500/10 text-blue-400'
      case 'review':
        return 'bg-purple-500/10 text-purple-400'
      case 'authentication':
        return 'bg-cyan-500/10 text-cyan-400'
      case 'change_management':
        return 'bg-orange-500/10 text-orange-400'
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
        <h2 className="text-lg font-semibold text-zinc-100">Baseline Rules</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300"
        >
          {showForm ? <HugeiconsIcon icon={Cancel01Icon} size={16} /> : <HugeiconsIcon icon={PlusSignIcon} size={16} />}
          {showForm ? 'Cancel' : 'Add Baseline'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-100">New Baseline Rule</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="e.g. MFA Required for Admin"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
              >
                <option value="access">Access</option>
                <option value="review">Review</option>
                <option value="authentication">Authentication</option>
                <option value="change_management">Change Management</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Severity</label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="mb-1 block text-xs text-zinc-400">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="Describe what this baseline rule checks..."
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="mb-1 block text-xs text-zinc-400">Rule Configuration (JSON)</label>
              <textarea
                value={form.ruleConfig}
                onChange={(e) => setForm({ ...form, ruleConfig: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder='{"check": "mfa_enabled", "scope": "admin_roles"}'
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!form.name.trim() || createMutation.isPending}
              className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Baseline'}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        {baselines.length === 0 ? (
          <div className="py-12 text-center">
            <HugeiconsIcon icon={Shield01Icon} size={32} className="mx-auto text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-400">No baseline rules defined yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Severity</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {baselines.map((baseline) => (
                  <tr key={baseline.id} className="transition-colors hover:bg-zinc-800/30">
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium text-zinc-100">{baseline.name}</p>
                        {baseline.description && (
                          <p className="mt-0.5 text-xs text-zinc-500">{baseline.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryBadge(baseline.category)}`}>
                        {baseline.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${severityBadge(baseline.severity)}`}>
                        {baseline.severity}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          baseline.enabled
                            ? 'bg-primary-400/10 text-primary-400'
                            : 'bg-zinc-500/10 text-zinc-400'
                        }`}
                      >
                        {baseline.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleToggle(baseline.id, baseline.enabled)}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-1 rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-50 ml-auto"
                        title={baseline.enabled ? 'Disable' : 'Enable'}
                      >
                        <HugeiconsIcon
                          icon={baseline.enabled ? ToggleOnIcon : ToggleOffIcon}
                          size={14}
                        />
                        {baseline.enabled ? 'Disable' : 'Enable'}
                      </button>
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

// ── Violations Section ──────────────────────────────────────────────────────

function ViolationsSection({ workspaceId }: { workspaceId: string | undefined }) {
  const [statusFilter, setStatusFilter] = useState('open')
  const { violations, isLoading } = useBaselineViolations(workspaceId, { status: statusFilter })
  const resolveMutation = useResolveViolation(workspaceId)
  const exemptMutation = useExemptViolation(workspaceId)

  const [actionId, setActionId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'resolve' | 'exempt' | null>(null)
  const [reason, setReason] = useState('')

  const handleResolve = (violationId: string) => {
    resolveMutation.mutate(
      { violationId, reason: reason || undefined },
      {
        onSuccess: () => {
          setActionId(null)
          setActionType(null)
          setReason('')
        },
      },
    )
  }

  const handleExempt = (violationId: string) => {
    if (!reason.trim()) return
    exemptMutation.mutate(
      { violationId, reason },
      {
        onSuccess: () => {
          setActionId(null)
          setActionType(null)
          setReason('')
        },
      },
    )
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-500/10 text-red-400'
      case 'resolved':
        return 'bg-primary-400/10 text-primary-400'
      case 'exempted':
        return 'bg-amber-500/10 text-amber-400'
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
        <h2 className="text-lg font-semibold text-zinc-100">Violations</h2>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-300 focus:border-primary-400 focus:outline-none"
        >
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="exempted">Exempted</option>
          <option value="">All</option>
        </select>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        {violations.length === 0 ? (
          <div className="py-12 text-center">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={32} className="mx-auto text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-400">No violations found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="px-5 py-3 font-medium">Baseline Name</th>
                  <th className="px-5 py-3 font-medium">Entity Type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Detected At</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {violations.map((violation) => (
                  <tr key={violation.id}>
                    <td className="px-5 py-3 font-medium text-zinc-100">{violation.baselineName}</td>
                    <td className="px-5 py-3 text-zinc-400">{violation.entityType}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(violation.status)}`}>
                        {violation.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-400">
                      {new Date(violation.detectedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {violation.status === 'open' && (
                        <>
                          {actionId === violation.id ? (
                            <div className="flex flex-col items-end gap-2">
                              <input
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-64 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                                placeholder={
                                  actionType === 'exempt'
                                    ? 'Reason (required)...'
                                    : 'Reason (optional)...'
                                }
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    if (actionType === 'resolve') handleResolve(violation.id)
                                    else handleExempt(violation.id)
                                  }}
                                  disabled={
                                    (actionType === 'exempt' && !reason.trim()) ||
                                    resolveMutation.isPending ||
                                    exemptMutation.isPending
                                  }
                                  className="rounded-lg bg-primary-400 px-2.5 py-1 text-xs font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => {
                                    setActionId(null)
                                    setActionType(null)
                                    setReason('')
                                  }}
                                  className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setActionId(violation.id)
                                  setActionType('resolve')
                                  setReason('')
                                }}
                                className="flex items-center gap-1 rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300"
                              >
                                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                                Resolve
                              </button>
                              <button
                                onClick={() => {
                                  setActionId(violation.id)
                                  setActionType('exempt')
                                  setReason('')
                                }}
                                className="flex items-center gap-1 rounded-lg border border-amber-500/20 px-2.5 py-1 text-xs text-amber-400 transition-colors hover:border-amber-500/40 hover:bg-amber-500/5"
                              >
                                <HugeiconsIcon icon={Shield01Icon} size={14} />
                                Exempt
                              </button>
                            </div>
                          )}
                        </>
                      )}
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
