import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useRisks, useCreateRisk } from '@/hooks/use-settings'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  PlusSignIcon,
  Cancel01Icon,
  LoaderPinwheelIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
} from '@hugeicons/core-free-icons'

export function RiskRegisterPage() {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const workspaceId = params.workspaceId

  const { risks, isLoading } = useRisks(workspaceId)
  const createMutation = useCreateRisk(workspaceId)

  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    asset: '',
    threat: '',
    vulnerability: '',
    likelihood: '3',
    impact: '3',
    treatment: 'mitigate',
    owner: '',
    reviewDate: '',
  })

  const handleSubmit = () => {
    if (!form.title.trim()) return
    createMutation.mutate(
      {
        title: form.title,
        description: form.description || undefined,
        asset: form.asset || undefined,
        threat: form.threat || undefined,
        vulnerability: form.vulnerability || undefined,
        likelihood: Number(form.likelihood),
        impact: Number(form.impact),
        treatment: form.treatment,
        owner: form.owner || undefined,
        reviewDate: form.reviewDate || undefined,
      },
      {
        onSuccess: () => {
          setForm({
            title: '', description: '', asset: '', threat: '', vulnerability: '',
            likelihood: '3', impact: '3', treatment: 'mitigate', owner: '', reviewDate: '',
          })
          setShowForm(false)
        },
      },
    )
  }

  const riskColor = (score: number) => {
    if (score >= 16) return 'bg-red-500/10 text-red-400'
    if (score >= 10) return 'bg-orange-500/10 text-orange-400'
    if (score >= 5) return 'bg-yellow-500/10 text-yellow-400'
    return 'bg-primary-400/10 text-primary-400'
  }

  const treatmentBadge = (treatment: string) => {
    switch (treatment) {
      case 'mitigate':
        return 'bg-blue-500/10 text-blue-400'
      case 'accept':
        return 'bg-primary-400/10 text-primary-400'
      case 'transfer':
        return 'bg-purple-500/10 text-purple-400'
      case 'avoid':
        return 'bg-red-500/10 text-red-400'
      default:
        return 'bg-zinc-500/10 text-zinc-400'
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-500/10 text-red-400'
      case 'mitigated':
        return 'bg-primary-400/10 text-primary-400'
      case 'accepted':
        return 'bg-amber-500/10 text-amber-400'
      case 'closed':
        return 'bg-zinc-500/10 text-zinc-400'
      default:
        return 'bg-zinc-500/10 text-zinc-400'
    }
  }

  // Build heatmap data
  const heatmapData: Record<string, number> = {}
  risks.forEach((r) => {
    const key = `${r.likelihood}-${r.impact}`
    heatmapData[key] = (heatmapData[key] || 0) + 1
  })

  const heatmapCellColor = (likelihood: number, impact: number) => {
    const score = likelihood * impact
    if (score >= 16) return 'bg-red-500'
    if (score >= 10) return 'bg-orange-500'
    if (score >= 5) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Risk Register</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Identify, assess, and track risks across your organization.
        </p>
      </div>

      {/* Risk Heatmap */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">Risk Heatmap</h2>
        <div className="flex items-end gap-4">
          {/* Y-axis label */}
          <div className="flex flex-col items-center justify-center">
            <span className="mb-2 text-xs font-medium text-zinc-500 [writing-mode:vertical-lr] rotate-180">
              Likelihood
            </span>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-5 gap-1.5" style={{ direction: 'ltr' }}>
              {/* Render rows from likelihood 5 (top) to 1 (bottom) */}
              {[5, 4, 3, 2, 1].map((likelihood) =>
                [1, 2, 3, 4, 5].map((impact) => {
                  const count = heatmapData[`${likelihood}-${impact}`] || 0
                  return (
                    <div
                      key={`${likelihood}-${impact}`}
                      className={`flex h-12 items-center justify-center rounded-lg text-sm font-semibold text-white ${heatmapCellColor(likelihood, impact)} ${
                        count > 0 ? 'opacity-100' : 'opacity-30'
                      }`}
                    >
                      {count > 0 ? count : ''}
                    </div>
                  )
                }),
              )}
            </div>
            {/* X-axis labels */}
            <div className="mt-2 grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="text-center text-xs text-zinc-500">
                  {i}
                </div>
              ))}
            </div>
            <p className="mt-1 text-center text-xs font-medium text-zinc-500">Impact</p>
          </div>
        </div>
        {/* Legend */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-green-500" />
            <span className="text-xs text-zinc-400">Low (1-4)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-yellow-500" />
            <span className="text-xs text-zinc-400">Medium (5-9)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-orange-500" />
            <span className="text-xs text-zinc-400">High (10-15)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-red-500" />
            <span className="text-xs text-zinc-400">Critical (16-25)</span>
          </div>
        </div>
      </div>

      {/* Risk List */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Risk List</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300"
        >
          {showForm ? <HugeiconsIcon icon={Cancel01Icon} size={16} /> : <HugeiconsIcon icon={PlusSignIcon} size={16} />}
          {showForm ? 'Cancel' : 'Add Risk'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-100">New Risk</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="e.g. Unauthorized data access"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Asset</label>
              <input
                value={form.asset}
                onChange={(e) => setForm({ ...form, asset: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="e.g. Customer Database"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Threat</label>
              <input
                value={form.threat}
                onChange={(e) => setForm({ ...form, threat: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="e.g. External attacker"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Vulnerability</label>
              <input
                value={form.vulnerability}
                onChange={(e) => setForm({ ...form, vulnerability: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="e.g. Weak authentication"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Likelihood (1-5)</label>
              <select
                value={form.likelihood}
                onChange={(e) => setForm({ ...form, likelihood: e.target.value })}
                className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>{v} - {['Very Low', 'Low', 'Medium', 'High', 'Very High'][v - 1]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Impact (1-5)</label>
              <select
                value={form.impact}
                onChange={(e) => setForm({ ...form, impact: e.target.value })}
                className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>{v} - {['Negligible', 'Minor', 'Moderate', 'Major', 'Severe'][v - 1]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Treatment</label>
              <select
                value={form.treatment}
                onChange={(e) => setForm({ ...form, treatment: e.target.value })}
                className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
              >
                <option value="mitigate">Mitigate</option>
                <option value="accept">Accept</option>
                <option value="transfer">Transfer</option>
                <option value="avoid">Avoid</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Owner</label>
              <input
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="e.g. security-team@company.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Review Date</label>
              <input
                type="date"
                value={form.reviewDate}
                onChange={(e) => setForm({ ...form, reviewDate: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="mb-1 block text-xs text-zinc-400">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="Describe this risk..."
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!form.title.trim() || createMutation.isPending}
              className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Risk'}
            </button>
          </div>
        </div>
      )}

      {/* Risk Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <HugeiconsIcon icon={LoaderPinwheelIcon} size={20} className="animate-spin text-zinc-500" />
          </div>
        ) : risks.length === 0 ? (
          <div className="py-12 text-center">
            <HugeiconsIcon icon={Alert02Icon} size={32} className="mx-auto text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-400">No risks registered yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="w-8 px-3 py-3"></th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Asset</th>
                  <th className="px-5 py-3 font-medium">Likelihood</th>
                  <th className="px-5 py-3 font-medium">Impact</th>
                  <th className="px-5 py-3 font-medium">Inherent Risk</th>
                  <th className="px-5 py-3 font-medium">Treatment</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {risks.map((risk) => (
                  <RiskRow
                    key={risk.id}
                    risk={risk}
                    isExpanded={expandedId === risk.id}
                    onToggleExpand={() =>
                      setExpandedId(expandedId === risk.id ? null : risk.id)
                    }
                    riskColor={riskColor}
                    treatmentBadge={treatmentBadge}
                    statusBadge={statusBadge}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Risk Row ────────────────────────────────────────────────────────────────

function RiskRow({
  risk,
  isExpanded,
  onToggleExpand,
  riskColor,
  treatmentBadge,
  statusBadge,
}: {
  risk: {
    id: string
    title: string
    asset: string | null
    threat: string | null
    vulnerability: string | null
    likelihood: number
    impact: number
    inherentRisk: number
    treatment: string
    status: string
    owner: string | null
    controls: string[]
  }
  isExpanded: boolean
  onToggleExpand: () => void
  riskColor: (score: number) => string
  treatmentBadge: (treatment: string) => string
  statusBadge: (status: string) => string
}) {
  return (
    <>
      <tr className="transition-colors hover:bg-zinc-800/30">
        <td className="px-3 py-3">
          <button onClick={onToggleExpand} className="text-zinc-500 hover:text-zinc-300">
            {isExpanded ? (
              <HugeiconsIcon icon={ArrowUp01Icon} size={16} />
            ) : (
              <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
            )}
          </button>
        </td>
        <td className="px-5 py-3 font-medium text-zinc-100">{risk.title}</td>
        <td className="px-5 py-3 text-zinc-400">{risk.asset ?? '—'}</td>
        <td className="px-5 py-3 text-zinc-300">{risk.likelihood}</td>
        <td className="px-5 py-3 text-zinc-300">{risk.impact}</td>
        <td className="px-5 py-3">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${riskColor(risk.inherentRisk)}`}>
            {risk.inherentRisk}
          </span>
        </td>
        <td className="px-5 py-3">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${treatmentBadge(risk.treatment)}`}>
            {risk.treatment}
          </span>
        </td>
        <td className="px-5 py-3">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(risk.status)}`}>
            {risk.status}
          </span>
        </td>
        <td className="px-5 py-3 text-zinc-400">{risk.owner ?? '—'}</td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={9} className="border-b border-zinc-800 bg-zinc-900/50 px-5 py-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Threat
                </h4>
                <p className="text-sm text-zinc-300">{risk.threat || 'Not specified'}</p>
              </div>
              <div>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Vulnerability
                </h4>
                <p className="text-sm text-zinc-300">{risk.vulnerability || 'Not specified'}</p>
              </div>
              <div>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Controls Applied
                </h4>
                {risk.controls.length === 0 ? (
                  <p className="text-sm text-zinc-500">No controls linked</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {risk.controls.map((control, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300"
                      >
                        {control}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
