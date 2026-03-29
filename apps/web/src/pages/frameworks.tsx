import { useState, useRef, useCallback } from 'react'
import { useParams } from '@tanstack/react-router'
import {
  useFrameworks,
  useFrameworkVersions,
  useAdoptions,
  useControls,
  useAdoptFramework,
  useUnadoptFramework,
  useCreateControl,
  useUpdateControl,
  useDeleteControl,
  useImportFramework,
} from '@/hooks/use-frameworks'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Layers01Icon,
  Shield01Icon,
  CheckmarkCircle01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  FilterIcon,
  BookOpen01Icon,
  LoaderPinwheelIcon,
  Add01Icon,
  Delete01Icon,
  PencilEdit01Icon,
  Cancel01Icon,
  CheckmarkSquare01Icon,
  Upload01Icon,
  Download01Icon,
  File01Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons'

type Tab = 'catalog' | 'controls' | 'import'

export function FrameworksPage() {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const workspaceId = params.workspaceId
  const [activeTab, setActiveTab] = useState<Tab>('catalog')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'catalog', label: 'Catalog' },
    { id: 'controls', label: 'Controls' },
    { id: 'import', label: 'Import CSV' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Frameworks</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage compliance frameworks, browse controls, and import custom frameworks.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'catalog' && <CatalogTab workspaceId={workspaceId} />}
      {activeTab === 'controls' && <ControlsTab workspaceId={workspaceId} />}
      {activeTab === 'import' && <ImportTab workspaceId={workspaceId} onComplete={() => setActiveTab('catalog')} />}
    </div>
  )
}

// ─── Catalog Tab ──────────────────────────────────────────────────────────────

function CatalogTab({ workspaceId }: { workspaceId: string | undefined }) {
  const { frameworks, isLoading: frameworksLoading } = useFrameworks(workspaceId)
  const { adoptions, isLoading: adoptionsLoading } = useAdoptions(workspaceId)
  const adoptMutation = useAdoptFramework(workspaceId)
  const unadoptMutation = useUnadoptFramework(workspaceId)
  const [confirmUnenroll, setConfirmUnenroll] = useState<string | null>(null)
  const adoptedSlugs = new Set(adoptions.map((a) => a.frameworkSlug))
  const isLoading = frameworksLoading || adoptionsLoading

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <HugeiconsIcon icon={LoaderPinwheelIcon} size={24} className="animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Active Adoptions */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-zinc-100">Active Adoptions</h2>
        {adoptions.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <HugeiconsIcon icon={BookOpen01Icon} size={32} className="mx-auto text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-400">
              No frameworks adopted yet. Browse below and adopt one to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {adoptions.map((adoption) => (
              <div
                key={adoption.id}
                className="rounded-xl border border-l-4 border-zinc-800 border-l-primary-400 bg-zinc-900 p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-100">{adoption.frameworkName}</p>
                  <span className="rounded-full bg-primary-400/10 px-3 py-1 text-xs text-primary-400">
                    v{adoption.frameworkVersion}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    Adopted {new Date(adoption.adoptedAt).toLocaleDateString()}
                  </span>
                  {confirmUnenroll === adoption.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          unadoptMutation.mutate(adoption.id, {
                            onSuccess: () => setConfirmUnenroll(null),
                          })
                        }}
                        disabled={unadoptMutation.isPending}
                        className="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20"
                      >
                        {unadoptMutation.isPending ? 'Removing...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmUnenroll(null)}
                        className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:border-zinc-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmUnenroll(adoption.id)}
                      className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-500 transition-colors hover:border-red-500/30 hover:text-red-400"
                    >
                      Unenroll
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Frameworks */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-zinc-100">Available Frameworks</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {frameworks.map((fw) => (
            <FrameworkCard
              key={fw.id}
              framework={fw}
              isAdopted={adoptedSlugs.has(fw.slug)}
              workspaceId={workspaceId}
              adoptMutation={adoptMutation}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function FrameworkCard({
  framework,
  isAdopted,
  workspaceId,
  adoptMutation,
}: {
  framework: { id: string; slug: string; name: string; description: string | null; sourceOrg: string | null }
  isAdopted: boolean
  workspaceId: string | undefined
  adoptMutation: ReturnType<typeof useAdoptFramework>
}) {
  const { versions } = useFrameworkVersions(workspaceId, framework.slug)
  const currentVersion = versions.find((v) => v.status === 'current') ?? versions[0]

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Layers01Icon} size={16} className="text-primary-400" />
          <p className="text-sm font-semibold text-zinc-100">{framework.name}</p>
        </div>
        {isAdopted && (
          <span className="flex items-center gap-1 rounded-full bg-primary-400/10 px-3 py-1 text-xs text-primary-400">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} />
            Adopted
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-zinc-500">{framework.sourceOrg}</p>
      <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{framework.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          {currentVersion && (
            <>
              <span className="flex items-center gap-1">
                <HugeiconsIcon icon={Shield01Icon} size={12} />
                {currentVersion.totalControls} controls
              </span>
              <span>v{currentVersion.version}</span>
            </>
          )}
        </div>
        {!isAdopted && currentVersion && (
          <button
            onClick={() =>
              adoptMutation.mutate({
                frameworkVersionId: currentVersion.id,
                reason: 'Adopted from frameworks page',
              })
            }
            disabled={adoptMutation.isPending}
            className="rounded-lg bg-primary-400 px-4 py-1.5 text-xs font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
          >
            {adoptMutation.isPending ? 'Adopting...' : 'Adopt'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Controls Tab ─────────────────────────────────────────────────────────────

function ControlsTab({ workspaceId }: { workspaceId: string | undefined }) {
  const { adoptions, isLoading: adoptionsLoading } = useAdoptions(workspaceId)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [controlsPage, setControlsPage] = useState(1)
  const [domainFilter, setDomainFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const selected = adoptions[selectedIdx]
  const { controls, total, isLoading: controlsLoading } = useControls(
    workspaceId,
    selected?.frameworkSlug ?? '',
    selected?.frameworkVersion ?? '',
    { page: controlsPage, limit: 50, domain: domainFilter },
  )

  const createMutation = useCreateControl(workspaceId)
  const updateMutation = useUpdateControl(workspaceId)
  const deleteMutation = useDeleteControl(workspaceId)

  // We need the framework version ID for CRUD. Get it from versions.
  const { versions } = useFrameworkVersions(workspaceId, selected?.frameworkSlug ?? '')
  const fvId = versions.find((v) => v.version === selected?.frameworkVersion)?.id ?? ''

  const totalPages = Math.max(1, Math.ceil(total / 50))
  const domains = Array.from(new Set(controls.map((c) => c.domain).filter(Boolean)))

  const filteredControls = searchQuery
    ? controls.filter(
        (c) =>
          c.controlId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.requirementText.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : controls

  if (adoptionsLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <HugeiconsIcon icon={LoaderPinwheelIcon} size={24} className="animate-spin text-zinc-500" />
      </div>
    )
  }

  if (adoptions.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <HugeiconsIcon icon={BookOpen01Icon} size={32} className="mx-auto text-zinc-600" />
        <p className="mt-3 text-sm text-zinc-400">
          Adopt a framework first to browse and manage its controls.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Framework selector */}
      <div className="flex flex-wrap items-center gap-2">
        {adoptions.map((a, idx) => (
          <button
            key={a.id}
            onClick={() => { setSelectedIdx(idx); setControlsPage(1); setDomainFilter(''); setSearchQuery('') }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              idx === selectedIdx
                ? 'bg-primary-400/10 text-primary-400 ring-1 ring-primary-400/30'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-300'
            }`}
          >
            {a.frameworkName} v{a.frameworkVersion}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search controls..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-9 pr-3 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div className="relative">
          <HugeiconsIcon icon={FilterIcon} size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <select
            value={domainFilter}
            onChange={(e) => { setDomainFilter(e.target.value); setControlsPage(1) }}
            className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-8 pr-8 text-sm text-zinc-300 focus:border-primary-400 focus:outline-none"
          >
            <option value="">All domains</option>
            {domains.map((d) => <option key={d} value={d!}>{d}</option>)}
          </select>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300"
        >
          <HugeiconsIcon icon={Add01Icon} size={14} />
          Add Control
        </button>
      </div>

      {/* Add Control Form */}
      {showAddForm && (
        <AddControlForm
          fvId={fvId}
          createMutation={createMutation}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Controls Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        {controlsLoading ? (
          <div className="flex items-center justify-center py-12">
            <HugeiconsIcon icon={LoaderPinwheelIcon} size={20} className="animate-spin text-zinc-500" />
          </div>
        ) : filteredControls.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-500">No controls found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                    <th className="px-4 py-3 font-medium">Control ID</th>
                    <th className="px-4 py-3 font-medium">Domain</th>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium text-right">Risk</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filteredControls.map((control) => (
                    editingId === control.id ? (
                      <EditControlRow
                        key={control.id}
                        control={control}
                        fvId={fvId}
                        updateMutation={updateMutation}
                        onCancel={() => setEditingId(null)}
                        onSave={() => setEditingId(null)}
                      />
                    ) : (
                      <tr key={control.id} className="group transition-colors hover:bg-zinc-800/30">
                        <td className="px-4 py-3 font-mono text-xs text-primary-400">{control.controlId}</td>
                        <td className="max-w-[180px] truncate px-4 py-3 text-zinc-400">{control.domain}</td>
                        <td className="px-4 py-3 text-zinc-100">{control.title}</td>
                        <td className="px-4 py-3 text-right text-zinc-400">{control.riskWeight}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => setEditingId(control.id)}
                              className="rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
                              title="Edit"
                            >
                              <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
                            </button>
                            {deleteConfirm === control.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    deleteMutation.mutate({ fvId, ctrlId: control.id })
                                    setDeleteConfirm(null)
                                  }}
                                  className="rounded bg-red-500/10 p-1 text-red-400 hover:bg-red-500/20"
                                  title="Confirm delete"
                                >
                                  <HugeiconsIcon icon={CheckmarkSquare01Icon} size={14} />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
                                  title="Cancel"
                                >
                                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(control.id)}
                                className="rounded p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                                title="Delete"
                              >
                                <HugeiconsIcon icon={Delete01Icon} size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
                <p className="text-xs text-zinc-500">
                  Page {controlsPage} of {totalPages} · {total} controls
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setControlsPage((p) => Math.max(1, p - 1))}
                    disabled={controlsPage === 1}
                    className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-40"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                  </button>
                  <button
                    onClick={() => setControlsPage((p) => Math.min(totalPages, p + 1))}
                    disabled={controlsPage === totalPages}
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

function AddControlForm({
  fvId,
  createMutation,
  onClose,
}: {
  fvId: string
  createMutation: ReturnType<typeof useCreateControl>
  onClose: () => void
}) {
  const [form, setForm] = useState({
    controlId: '',
    domain: '',
    subdomain: '',
    title: '',
    requirementText: '',
    guidance: '',
    evidenceRequirements: '',
    riskWeight: '0.5',
    implementationGroup: '',
  })

  const handleSubmit = () => {
    if (!form.controlId || !form.title || !form.requirementText) return
    createMutation.mutate(
      {
        fvId,
        data: {
          controlId: form.controlId,
          domain: form.domain || undefined,
          subdomain: form.subdomain || undefined,
          title: form.title,
          requirementText: form.requirementText,
          guidance: form.guidance || undefined,
          evidenceRequirements: form.evidenceRequirements
            ? form.evidenceRequirements.split(';').map((s) => s.trim()).filter(Boolean)
            : undefined,
          riskWeight: parseFloat(form.riskWeight) || 0.5,
          implementationGroup: form.implementationGroup || undefined,
        },
      },
      { onSuccess: () => onClose() }
    )
  }

  return (
    <div className="rounded-xl border border-primary-400/30 bg-zinc-900 p-5">
      <h3 className="mb-4 text-sm font-semibold text-zinc-100">New Control</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <InputField label="Control ID *" value={form.controlId} onChange={(v) => setForm({ ...form, controlId: v })} placeholder="e.g. CC6.1" />
        <InputField label="Title *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Control title" />
        <InputField label="Domain" value={form.domain} onChange={(v) => setForm({ ...form, domain: v })} placeholder="e.g. Access Control" />
        <InputField label="Subdomain" value={form.subdomain} onChange={(v) => setForm({ ...form, subdomain: v })} placeholder="e.g. Authentication" />
        <InputField label="Risk Weight" value={form.riskWeight} onChange={(v) => setForm({ ...form, riskWeight: v })} placeholder="0.0 - 1.0" />
        <InputField label="Implementation Group" value={form.implementationGroup} onChange={(v) => setForm({ ...form, implementationGroup: v })} placeholder="e.g. IG1" />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Requirement Text *</label>
          <textarea
            value={form.requirementText}
            onChange={(e) => setForm({ ...form, requirementText: e.target.value })}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-primary-400 focus:outline-none"
            rows={3}
            placeholder="Full requirement text..."
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Evidence Requirements (semicolon-separated)</label>
          <textarea
            value={form.evidenceRequirements}
            onChange={(e) => setForm({ ...form, evidenceRequirements: e.target.value })}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-primary-400 focus:outline-none"
            rows={3}
            placeholder="MFA report; Access review; Policy doc"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-300">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!form.controlId || !form.title || !form.requirementText || createMutation.isPending}
          className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50"
        >
          {createMutation.isPending ? 'Creating...' : 'Create Control'}
        </button>
      </div>
    </div>
  )
}

function EditControlRow({
  control,
  fvId,
  updateMutation,
  onCancel,
  onSave,
}: {
  control: { id: string; controlId: string; domain: string | null; title: string; requirementText: string; riskWeight: number }
  fvId: string
  updateMutation: ReturnType<typeof useUpdateControl>
  onCancel: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    controlId: control.controlId,
    domain: control.domain ?? '',
    title: control.title,
    requirementText: control.requirementText,
    riskWeight: String(control.riskWeight),
  })

  const handleSave = () => {
    updateMutation.mutate(
      {
        fvId,
        ctrlId: control.id,
        data: {
          controlId: form.controlId,
          domain: form.domain || undefined,
          title: form.title,
          requirementText: form.requirementText,
          riskWeight: parseFloat(form.riskWeight) || 0.5,
        },
      },
      { onSuccess: () => onSave() }
    )
  }

  return (
    <tr className="bg-zinc-800/50">
      <td className="px-4 py-2">
        <input
          value={form.controlId}
          onChange={(e) => setForm({ ...form, controlId: e.target.value })}
          className="w-full rounded border border-zinc-600 bg-zinc-700 px-2 py-1 font-mono text-xs text-primary-400 focus:border-primary-400 focus:outline-none"
        />
      </td>
      <td className="px-4 py-2">
        <input
          value={form.domain}
          onChange={(e) => setForm({ ...form, domain: e.target.value })}
          className="w-full rounded border border-zinc-600 bg-zinc-700 px-2 py-1 text-sm text-zinc-300 focus:border-primary-400 focus:outline-none"
        />
      </td>
      <td className="px-4 py-2">
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded border border-zinc-600 bg-zinc-700 px-2 py-1 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
        />
      </td>
      <td className="px-4 py-2">
        <input
          value={form.riskWeight}
          onChange={(e) => setForm({ ...form, riskWeight: e.target.value })}
          className="w-20 rounded border border-zinc-600 bg-zinc-700 px-2 py-1 text-right text-sm text-zinc-300 focus:border-primary-400 focus:outline-none"
        />
      </td>
      <td className="px-4 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="rounded bg-primary-400/10 p-1 text-primary-400 hover:bg-primary-400/20"
            title="Save"
          >
            <HugeiconsIcon icon={CheckmarkSquare01Icon} size={14} />
          </button>
          <button
            onClick={onCancel}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
            title="Cancel"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Import Tab ───────────────────────────────────────────────────────────────

interface ParsedRow {
  control_id: string
  domain: string
  title: string
  requirement_text: string
  risk_weight: string
  [key: string]: string
}

function ImportTab({ workspaceId, onComplete }: { workspaceId: string | undefined; onComplete: () => void }) {
  const [step, setStep] = useState(1)
  const [meta, setMeta] = useState({ name: '', slug: '', version: '', description: '', sourceOrg: '' })
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importMutation = useImportFramework(workspaceId)

  const handleFileSelect = useCallback(async (f: File) => {
    setFile(f)
    setError('')
    try {
      const text = await f.text()
      const rows = parseCSVClient(text)
      if (rows.length === 0) {
        setError('CSV file is empty or has no data rows.')
        return
      }
      const requiredCols = ['control_id', 'title', 'requirement_text']
      for (const col of requiredCols) {
        if (!(col in rows[0])) {
          setError(`Missing required column: ${col}`)
          return
        }
      }
      setParsedRows(rows as ParsedRow[])
      setStep(3)
    } catch {
      setError('Failed to parse CSV file.')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.csv') || f.type === 'text/csv')) handleFileSelect(f)
    else setError('Please drop a .csv file.')
  }, [handleFileSelect])

  const handleImport = () => {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', meta.name)
    formData.append('slug', meta.slug)
    formData.append('version', meta.version)
    if (meta.description) formData.append('description', meta.description)
    if (meta.sourceOrg) formData.append('sourceOrg', meta.sourceOrg)

    importMutation.mutate(formData, {
      onSuccess: () => {
        setStep(1)
        setFile(null)
        setParsedRows([])
        setMeta({ name: '', slug: '', version: '', description: '', sourceOrg: '' })
        onComplete()
      },
      onError: (err) => setError(err.message),
    })
  }

  const downloadTemplate = () => {
    window.open(`/api/workspaces/${workspaceId}/frameworks/csv-template`, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
              s <= step ? 'bg-primary-400 text-zinc-950' : 'bg-zinc-800 text-zinc-500'
            }`}>
              {s}
            </div>
            {s < 4 && <div className={`h-0.5 w-8 ${s < step ? 'bg-primary-400' : 'bg-zinc-800'}`} />}
          </div>
        ))}
        <span className="ml-3 text-sm text-zinc-400">
          {step === 1 && 'Framework details'}
          {step === 2 && 'Upload CSV'}
          {step === 3 && 'Preview data'}
          {step === 4 && 'Confirm import'}
        </span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Step 1: Framework metadata */}
      {step === 1 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="mb-4 text-base font-semibold text-zinc-100">Framework Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="Framework Name *" value={meta.name} onChange={(v) => setMeta({ ...meta, name: v })} placeholder="e.g. HIPAA Security Rule" />
            <InputField label="Slug *" value={meta.slug} onChange={(v) => setMeta({ ...meta, slug: v.toLowerCase().replace(/[^a-z0-9_-]/g, '_') })} placeholder="e.g. hipaa_security" />
            <InputField label="Version *" value={meta.version} onChange={(v) => setMeta({ ...meta, version: v })} placeholder="e.g. 2024" />
            <InputField label="Source Organization" value={meta.sourceOrg} onChange={(v) => setMeta({ ...meta, sourceOrg: v })} placeholder="e.g. HHS" />
          </div>
          <div className="mt-4">
            <InputField label="Description" value={meta.description} onChange={(v) => setMeta({ ...meta, description: v })} placeholder="Brief description..." />
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!meta.name || !meta.slug || !meta.version}
              className="rounded-lg bg-primary-400 px-6 py-2 text-sm font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 2: File upload */}
      {step === 2 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-100">Upload CSV File</h3>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300"
            >
              <HugeiconsIcon icon={Download01Icon} size={14} />
              Download Template
            </button>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-800/50 transition-colors hover:border-primary-400/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <HugeiconsIcon icon={Upload01Icon} size={32} className="text-zinc-500" />
            <p className="mt-3 text-sm text-zinc-400">
              Drag & drop your CSV file here, or <span className="text-primary-400">browse</span>
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              Required columns: control_id, title, requirement_text
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFileSelect(f)
              }}
            />
          </div>

          <div className="mt-4 flex justify-between">
            <button onClick={() => setStep(1)} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-300">
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 3 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-100">
              Preview — {parsedRows.length} controls
            </h3>
            {file && (
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <HugeiconsIcon icon={File01Icon} size={14} />
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          <div className="max-h-[400px] overflow-auto rounded-lg border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-zinc-800">
                <tr className="text-xs text-zinc-500">
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Control ID</th>
                  <th className="px-3 py-2 font-medium">Domain</th>
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-3 py-2 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {parsedRows.slice(0, 50).map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/30">
                    <td className="px-3 py-2 text-xs text-zinc-600">{idx + 1}</td>
                    <td className="px-3 py-2 font-mono text-xs text-primary-400">{row.control_id}</td>
                    <td className="max-w-[150px] truncate px-3 py-2 text-zinc-400">{row.domain}</td>
                    <td className="px-3 py-2 text-zinc-100">{row.title}</td>
                    <td className="px-3 py-2 text-zinc-400">{row.risk_weight || '0.5'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsedRows.length > 50 && (
            <p className="mt-2 text-xs text-zinc-500">
              Showing first 50 of {parsedRows.length} rows.
            </p>
          )}

          <div className="mt-4 flex justify-between">
            <button onClick={() => { setStep(2); setParsedRows([]); setFile(null) }} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-300">
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="rounded-lg bg-primary-400 px-6 py-2 text-sm font-medium text-zinc-950 hover:bg-primary-300"
            >
              Looks Good — Next
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="mb-4 text-base font-semibold text-zinc-100">Confirm Import</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
              <p className="text-xs text-zinc-500">Framework</p>
              <p className="mt-1 text-sm font-medium text-zinc-100">{meta.name}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
              <p className="text-xs text-zinc-500">Version</p>
              <p className="mt-1 text-sm font-medium text-zinc-100">{meta.version}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
              <p className="text-xs text-zinc-500">Slug</p>
              <p className="mt-1 font-mono text-sm text-zinc-100">{meta.slug}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
              <p className="text-xs text-zinc-500">Controls</p>
              <p className="mt-1 text-sm font-medium text-primary-400">{parsedRows.length} controls</p>
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep(3)} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-300">
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={importMutation.isPending}
              className="rounded-lg bg-primary-400 px-8 py-2 text-sm font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50"
            >
              {importMutation.isPending ? 'Importing...' : 'Import Framework'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Shared Components ────────────────────────────────────────────────────────

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-zinc-400">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-primary-400 focus:outline-none"
        placeholder={placeholder}
      />
    </div>
  )
}

// ─── Client-side CSV parser ───────────────────────────────────────────────────

function parseCSVClient(text: string): Record<string, string>[] {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
  if (lines.length < 2) return []

  const headers = parseCsvLineClient(lines[0])
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLineClient(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h.trim().toLowerCase()] = (values[idx] ?? '').trim()
    })
    rows.push(row)
  }
  return rows
}

function parseCsvLineClient(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}
