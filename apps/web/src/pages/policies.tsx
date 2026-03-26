import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import {
  usePolicies,
  useCreatePolicy,
  useLinkPolicyControl,
  usePolicyControls,
} from '@/hooks/use-settings'
import { useControls, useAdoptions } from '@/hooks/use-frameworks'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  File01Icon,
  PlusSignIcon,
  Cancel01Icon,
  LoaderPinwheelIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Link01Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons'

export function PoliciesPage() {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const workspaceId = params.workspaceId

  const { policies, isLoading } = usePolicies(workspaceId)
  const createMutation = useCreatePolicy(workspaceId)

  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [linkingId, setLinkingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'security',
    version: '1.0',
    owner: '',
    reviewCycleDays: '',
  })

  const handleSubmit = () => {
    if (!form.title.trim()) return
    createMutation.mutate(
      {
        title: form.title,
        description: form.description || undefined,
        category: form.category,
        version: form.version || undefined,
        owner: form.owner || undefined,
        reviewCycleDays: form.reviewCycleDays ? Number(form.reviewCycleDays) : undefined,
      },
      {
        onSuccess: () => {
          setForm({ title: '', description: '', category: 'security', version: '1.0', owner: '', reviewCycleDays: '' })
          setShowForm(false)
        },
      },
    )
  }

  const categoryBadge = (category: string) => {
    switch (category) {
      case 'access':
        return 'bg-blue-500/10 text-blue-400'
      case 'security':
        return 'bg-purple-500/10 text-purple-400'
      case 'privacy':
        return 'bg-cyan-500/10 text-cyan-400'
      case 'hr':
        return 'bg-orange-500/10 text-orange-400'
      case 'incident':
        return 'bg-red-500/10 text-red-400'
      default:
        return 'bg-zinc-500/10 text-zinc-400'
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-zinc-500/10 text-zinc-400'
      case 'active':
        return 'bg-primary-400/10 text-primary-400'
      case 'under_review':
        return 'bg-amber-500/10 text-amber-400'
      case 'archived':
        return 'bg-red-500/10 text-red-400'
      default:
        return 'bg-zinc-500/10 text-zinc-400'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Policies</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage your organization's compliance policies and link them to controls.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Policy Vault</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300"
        >
          {showForm ? <HugeiconsIcon icon={Cancel01Icon} size={16} /> : <HugeiconsIcon icon={PlusSignIcon} size={16} />}
          {showForm ? 'Cancel' : 'Add Policy'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-100">New Policy</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="e.g. Information Security Policy"
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
                <option value="security">Security</option>
                <option value="privacy">Privacy</option>
                <option value="hr">HR</option>
                <option value="incident">Incident</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Version</label>
              <input
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="e.g. 1.0"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Owner Email</label>
              <input
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="e.g. ciso@company.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Review Cycle (days)</label>
              <input
                type="number"
                value={form.reviewCycleDays}
                onChange={(e) => setForm({ ...form, reviewCycleDays: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="e.g. 365"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="mb-1 block text-xs text-zinc-400">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="Describe this policy..."
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!form.title.trim() || createMutation.isPending}
              className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Policy'}
            </button>
          </div>
        </div>
      )}

      {/* Policies Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <HugeiconsIcon icon={LoaderPinwheelIcon} size={20} className="animate-spin text-zinc-500" />
          </div>
        ) : policies.length === 0 ? (
          <div className="py-12 text-center">
            <HugeiconsIcon icon={File01Icon} size={32} className="mx-auto text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-400">No policies created yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="w-8 px-3 py-3"></th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Version</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Owner</th>
                  <th className="px-5 py-3 font-medium">Next Review</th>
                  <th className="px-5 py-3 font-medium">Controls</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {policies.map((policy) => (
                  <PolicyRow
                    key={policy.id}
                    policy={policy}
                    workspaceId={workspaceId}
                    isExpanded={expandedId === policy.id}
                    isLinking={linkingId === policy.id}
                    onToggleExpand={() =>
                      setExpandedId(expandedId === policy.id ? null : policy.id)
                    }
                    onToggleLink={() => {
                      setLinkingId(linkingId === policy.id ? null : policy.id)
                      if (linkingId !== policy.id) setExpandedId(policy.id)
                    }}
                    categoryBadge={categoryBadge}
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

// ── Policy Row ──────────────────────────────────────────────────────────────

function PolicyRow({
  policy,
  workspaceId,
  isExpanded,
  isLinking,
  onToggleExpand,
  onToggleLink,
  categoryBadge,
  statusBadge,
}: {
  policy: {
    id: string
    title: string
    description: string | null
    category: string
    version: string
    status: string
    owner: string | null
    nextReviewDate: string | null
    controlsCount: number
  }
  workspaceId: string | undefined
  isExpanded: boolean
  isLinking: boolean
  onToggleExpand: () => void
  onToggleLink: () => void
  categoryBadge: (c: string) => string
  statusBadge: (s: string) => string
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
        <td className="px-5 py-3 font-medium text-zinc-100">{policy.title}</td>
        <td className="px-5 py-3">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryBadge(policy.category)}`}>
            {policy.category}
          </span>
        </td>
        <td className="px-5 py-3 text-zinc-300">v{policy.version}</td>
        <td className="px-5 py-3">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(policy.status)}`}>
            {policy.status.replace('_', ' ')}
          </span>
        </td>
        <td className="px-5 py-3 text-zinc-400">{policy.owner ?? '—'}</td>
        <td className="px-5 py-3 text-zinc-400">
          {policy.nextReviewDate
            ? new Date(policy.nextReviewDate).toLocaleDateString()
            : '—'}
        </td>
        <td className="px-5 py-3">
          <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
            {policy.controlsCount}
          </span>
        </td>
        <td className="px-5 py-3 text-right">
          <button
            onClick={onToggleLink}
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs transition-colors ml-auto ${
              isLinking
                ? 'border-primary-400/50 bg-primary-400/10 text-primary-400'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
            }`}
          >
            <HugeiconsIcon icon={Link01Icon} size={14} />
            Link Control
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={9} className="border-b border-zinc-800 bg-zinc-900/50 px-5 py-4">
            <PolicyExpandedContent
              workspaceId={workspaceId}
              policyId={policy.id}
              isLinking={isLinking}
            />
          </td>
        </tr>
      )}
    </>
  )
}

// ── Expanded Content ────────────────────────────────────────────────────────

function PolicyExpandedContent({
  workspaceId,
  policyId,
  isLinking,
}: {
  workspaceId: string | undefined
  policyId: string
  isLinking: boolean
}) {
  const { controls, isLoading: controlsLoading } = usePolicyControls(workspaceId, policyId)

  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Linked Controls
        </h4>
        {controlsLoading ? (
          <div className="flex items-center gap-2 py-2">
            <HugeiconsIcon icon={LoaderPinwheelIcon} size={14} className="animate-spin text-zinc-500" />
            <span className="text-xs text-zinc-500">Loading controls...</span>
          </div>
        ) : controls.length === 0 ? (
          <p className="text-xs text-zinc-500">No controls linked yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {controls.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-1.5"
              >
                <span className="font-mono text-xs text-primary-400">{link.controlCode}</span>
                <span className="text-xs text-zinc-400">{link.controlTitle}</span>
                <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">
                  {link.frameworkName}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isLinking && (
        <LinkControlDialog workspaceId={workspaceId} policyId={policyId} />
      )}
    </div>
  )
}

// ── Link Control Dialog ─────────────────────────────────────────────────────

function LinkControlDialog({
  workspaceId,
  policyId,
}: {
  workspaceId: string | undefined
  policyId: string
}) {
  const { adoptions } = useAdoptions(workspaceId)
  const [selectedAdoption, setSelectedAdoption] = useState<{
    slug: string
    version: string
  } | null>(
    adoptions.length > 0
      ? { slug: adoptions[0].frameworkSlug, version: adoptions[0].frameworkVersion }
      : null,
  )
  const [searchQuery, setSearchQuery] = useState('')

  const { controls, isLoading: controlsLoading } = useControls(
    workspaceId,
    selectedAdoption?.slug ?? '',
    selectedAdoption?.version ?? '',
    { page: 1, limit: 50 },
  )

  const linkMutation = useLinkPolicyControl(workspaceId)

  const filteredControls = controls.filter((c) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      c.controlId.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      (c.domain ?? '').toLowerCase().includes(q)
    )
  })

  const handleLink = (controlId: string) => {
    linkMutation.mutate({ policyId, controlId })
  }

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
      <h4 className="mb-3 text-sm font-semibold text-zinc-100">Link to Control</h4>

      <div className="mb-3 flex items-center gap-3">
        {adoptions.length > 0 && (
          <select
            value={selectedAdoption ? `${selectedAdoption.slug}|${selectedAdoption.version}` : ''}
            onChange={(e) => {
              const [slug, version] = e.target.value.split('|')
              setSelectedAdoption({ slug, version })
            }}
            className="appearance-none rounded-lg border border-zinc-600 bg-zinc-700 px-3 py-1.5 text-xs text-zinc-300 focus:border-primary-400 focus:outline-none"
          >
            {adoptions.map((a) => (
              <option key={a.id} value={`${a.frameworkSlug}|${a.frameworkVersion}`}>
                {a.frameworkName} v{a.frameworkVersion}
              </option>
            ))}
          </select>
        )}
        <div className="relative flex-1">
          <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-600 bg-zinc-700 py-1.5 pl-8 pr-3 text-xs text-zinc-300 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
            placeholder="Search controls..."
          />
        </div>
      </div>

      {adoptions.length === 0 ? (
        <p className="text-xs text-zinc-500">
          Adopt a framework first to link controls.
        </p>
      ) : controlsLoading ? (
        <div className="flex items-center justify-center py-4">
          <HugeiconsIcon icon={LoaderPinwheelIcon} size={16} className="animate-spin text-zinc-500" />
        </div>
      ) : filteredControls.length === 0 ? (
        <p className="py-4 text-center text-xs text-zinc-500">No controls found.</p>
      ) : (
        <div className="max-h-60 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-700 text-zinc-500">
                <th className="px-3 py-2 font-medium">Control ID</th>
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Domain</th>
                <th className="px-3 py-2 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/50">
              {filteredControls.map((control) => (
                <tr key={control.id} className="transition-colors hover:bg-zinc-700/30">
                  <td className="px-3 py-2 font-mono text-primary-400">{control.controlId}</td>
                  <td className="max-w-[200px] truncate px-3 py-2 text-zinc-300">
                    {control.title}
                  </td>
                  <td className="px-3 py-2 text-zinc-500">{control.domain ?? '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => handleLink(control.id)}
                      disabled={linkMutation.isPending}
                      className="rounded-md bg-primary-400 px-2.5 py-1 text-xs font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
                    >
                      Link
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
