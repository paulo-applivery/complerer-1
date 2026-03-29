import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import {
  useEvidence,
  useCreateEvidence,
  useLinkEvidence,
  useUnlinkEvidence,
  useUpdateEvidence,
  useEvidenceLinks,
} from '@/hooks/use-compliance'
import { useControls, useAdoptions } from '@/hooks/use-frameworks'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  FileValidationIcon,
  PlusSignIcon,
  Cancel01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  LoaderPinwheelIcon,
  Link01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Search01Icon,
  File01Icon,
  PencilEdit01Icon,
  Delete01Icon,
  CheckmarkSquare01Icon,
} from '@hugeicons/core-free-icons'

export function EvidencePage() {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const workspaceId = params.workspaceId

  const [page, setPage] = useState(1)
  const limit = 25
  const { evidence, total, isLoading } = useEvidence(workspaceId, { page, limit })
  const createMutation = useCreateEvidence(workspaceId)

  const linkMutation = useLinkEvidence(workspaceId)
  const { adoptions } = useAdoptions(workspaceId)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    source: '',
    fileName: '',
    expiresAt: '',
  })
  // Control linking during creation
  const [linkControlId, setLinkControlId] = useState('')
  const [linkFvId, setLinkFvId] = useState('')
  const [createCtrlSearch, setCreateCtrlSearch] = useState('')

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [linkingId, setLinkingId] = useState<string | null>(null)

  // For the control picker in create form
  const firstAdoption = adoptions[0]
  const [selectedCreateAdoption, setSelectedCreateAdoption] = useState<{ slug: string; version: string } | null>(null)
  const createAdoption = selectedCreateAdoption ?? (firstAdoption ? { slug: firstAdoption.frameworkSlug, version: firstAdoption.frameworkVersion } : null)
  const { controls: createControls } = useControls(workspaceId, createAdoption?.slug ?? '', createAdoption?.version ?? '', { page: 1, limit: 200 })
  const filteredCreateControls = createControls.filter(c => {
    if (!createCtrlSearch) return true
    const q = createCtrlSearch.toLowerCase()
    return c.controlId.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
  })

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const handleSubmit = () => {
    if (!form.title.trim()) return
    createMutation.mutate(
      {
        title: form.title,
        description: form.description || undefined,
        source: form.source || undefined,
        fileName: form.fileName || undefined,
        expiresAt: form.expiresAt || undefined,
      },
      {
        onSuccess: (data: any) => {
          // If a control was selected, link it
          const evidenceId = data?.evidence?.id
          if (evidenceId && linkControlId && linkFvId) {
            linkMutation.mutate({ evidenceId, controlId: linkControlId, frameworkVersionId: linkFvId })
          }
          setForm({ title: '', description: '', source: '', fileName: '', expiresAt: '' })
          setLinkControlId('')
          setLinkFvId('')
          setCreateCtrlSearch('')
          setShowForm(false)
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Evidence</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Collect and link evidence to your compliance controls.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Evidence Library</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300"
        >
          {showForm ? <HugeiconsIcon icon={Cancel01Icon} size={16} /> : <HugeiconsIcon icon={PlusSignIcon} size={16} />}
          {showForm ? 'Cancel' : 'Upload Evidence'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-100">New Evidence</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="e.g. Access Review Q1 2026"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Source</label>
              <input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="e.g. AWS CloudTrail, Okta"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Expires At</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
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
                placeholder="Describe this evidence..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">File</label>
              <input
                type="file"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) setForm({ ...form, fileName: f.name })
                }}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-400 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-700 file:px-3 file:py-1 file:text-xs file:text-zinc-300 focus:border-primary-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Link to Control (optional) */}
          {adoptions.length > 0 && (
            <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-300">Link to Control <span className="font-normal text-zinc-500">(optional)</span></h4>
                  <p className="mt-0.5 text-[10px] text-zinc-500">Automatically link this evidence to a control when created</p>
                </div>
                {linkControlId && (
                  <button onClick={() => { setLinkControlId(''); setLinkFvId('') }} className="text-[10px] text-zinc-500 hover:text-zinc-300">Clear</button>
                )}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={createAdoption ? `${createAdoption.slug}|${createAdoption.version}` : ''}
                  onChange={(e) => {
                    const [slug, version] = e.target.value.split('|')
                    setSelectedCreateAdoption({ slug, version })
                    setLinkControlId('')
                    setLinkFvId('')
                  }}
                  className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 focus:border-primary-400 focus:outline-none"
                >
                  {adoptions.map((a) => (
                    <option key={a.id} value={`${a.frameworkSlug}|${a.frameworkVersion}`}>
                      {a.frameworkName} v{a.frameworkVersion}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    value={createCtrlSearch}
                    onChange={(e) => setCreateCtrlSearch(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-1.5 pl-8 pr-3 text-xs text-zinc-300 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                    placeholder="Search controls..."
                  />
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-zinc-800">
                <table className="w-full text-left text-xs">
                  <tbody className="divide-y divide-zinc-800/50">
                    {filteredCreateControls.slice(0, 30).map((ctrl) => (
                      <tr
                        key={ctrl.id}
                        onClick={() => { setLinkControlId(ctrl.id); setLinkFvId(ctrl.frameworkVersionId) }}
                        className={`cursor-pointer transition-colors ${linkControlId === ctrl.id ? 'bg-primary-400/10' : 'hover:bg-zinc-800/50'}`}
                      >
                        <td className="px-3 py-1.5">
                          <code className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${linkControlId === ctrl.id ? 'bg-primary-400/20 text-primary-400' : 'bg-zinc-800 text-zinc-400'}`}>{ctrl.controlId}</code>
                        </td>
                        <td className="px-3 py-1.5 text-zinc-400 truncate max-w-[300px]">{ctrl.title}</td>
                        <td className="px-3 py-1.5 text-zinc-600">{ctrl.domain ?? ''}</td>
                        <td className="px-3 py-1.5 text-right">
                          {linkControlId === ctrl.id && <span className="text-[10px] text-primary-400">✓ Selected</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredCreateControls.length === 0 && (
                  <p className="py-3 text-center text-[10px] text-zinc-500">No controls found</p>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            {linkControlId ? (
              <p className="text-xs text-primary-400">
                Will link to control after creation
              </p>
            ) : (
              <p className="text-xs text-zinc-500">No control selected — you can link later</p>
            )}
            <button
              onClick={handleSubmit}
              disabled={!form.title.trim() || createMutation.isPending}
              className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : linkControlId ? 'Create & Link' : 'Create Evidence'}
            </button>
          </div>
        </div>
      )}

      {/* Evidence Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <HugeiconsIcon icon={LoaderPinwheelIcon} size={20} className="animate-spin text-zinc-500" />
          </div>
        ) : evidence.length === 0 ? (
          <div className="py-12 text-center">
            <HugeiconsIcon icon={FileValidationIcon} size={32} className="mx-auto text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-400">No evidence collected yet.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                    <th className="w-8 px-3 py-3"></th>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Captured</th>
                    <th className="px-4 py-3 font-medium">Expires</th>
                    <th className="px-4 py-3 font-medium">File</th>
                    <th className="px-4 py-3 font-medium text-center">Links</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {evidence.map((item) => (
                    <EvidenceRow
                      key={item.id}
                      item={item}
                      workspaceId={workspaceId}
                      isExpanded={expandedId === item.id}
                      isLinking={linkingId === item.id}
                      onToggleExpand={() =>
                        setExpandedId(expandedId === item.id ? null : item.id)
                      }
                      onToggleLink={() => {
                        setLinkingId(linkingId === item.id ? null : item.id)
                        if (linkingId !== item.id) setExpandedId(item.id)
                      }}
                    />
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

// ── Evidence Row ────────────────────────────────────────────────────────────

function EvidenceRow({
  item,
  workspaceId,
  isExpanded,
  isLinking,
  onToggleExpand,
  onToggleLink,
}: {
  item: {
    id: string
    title: string
    description: string | null
    source: string | null
    capturedAt: string
    expiresAt: string | null
    fileName: string | null
    linksCount: number
    updatedAt: string | null
    updatedByName: string | null
    uploadedByName: string | null
  }
  workspaceId: string | undefined
  isExpanded: boolean
  isLinking: boolean
  onToggleExpand: () => void
  onToggleLink: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: item.title,
    source: item.source ?? '',
    description: item.description ?? '',
    expiresAt: item.expiresAt ? item.expiresAt.split('T')[0] : '',
    fileName: item.fileName ?? '',
    fileSize: 0,
    mimeType: '',
  })
  const updateMutation = useUpdateEvidence(workspaceId)

  const handleSave = () => {
    const data: Record<string, unknown> = {
      title: editForm.title,
      source: editForm.source || undefined,
      description: editForm.description || undefined,
      expiresAt: editForm.expiresAt || null,
    }
    // Always send file info if a new file was picked
    if (editForm.fileName) {
      data.fileName = editForm.fileName
    }
    if (editForm.fileSize) data.fileSize = editForm.fileSize
    if (editForm.mimeType) data.mimeType = editForm.mimeType
    updateMutation.mutate(
      { evidenceId: item.id, data },
      { onSuccess: () => setIsEditing(false) }
    )
  }

  if (isEditing) {
    return (
      <tr className="bg-zinc-800/50">
        <td className="px-3 py-2"></td>
        <td className="px-4 py-2">
          <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            className="w-full rounded border border-zinc-600 bg-zinc-700 px-2 py-1 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" />
        </td>
        <td className="px-4 py-2">
          <input value={editForm.source} onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
            className="w-full rounded border border-zinc-600 bg-zinc-700 px-2 py-1 text-sm text-zinc-300 focus:border-primary-400 focus:outline-none" placeholder="Source" />
        </td>
        <td className="px-4 py-2 text-xs text-zinc-400">{new Date(item.capturedAt).toLocaleDateString()}</td>
        <td className="px-4 py-2">
          <input type="date" value={editForm.expiresAt} onChange={(e) => setEditForm({ ...editForm, expiresAt: e.target.value })}
            className="rounded border border-zinc-600 bg-zinc-700 px-2 py-1 text-sm text-zinc-300 focus:border-primary-400 focus:outline-none" />
        </td>
        <td className="px-4 py-2">
          <input
            type="file"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) setEditForm({ ...editForm, fileName: f.name, fileSize: f.size, mimeType: f.type })
            }}
            className="w-full max-w-[140px] rounded border border-zinc-600 bg-zinc-700 px-1 py-0.5 text-xs text-zinc-400 file:mr-1 file:rounded file:border-0 file:bg-zinc-600 file:px-2 file:py-0.5 file:text-[10px] file:text-zinc-300"
          />
        </td>
        <td className="px-4 py-2"></td>
        <td className="px-4 py-2 text-right">
          <div className="flex items-center justify-end gap-1">
            <button onClick={handleSave} disabled={updateMutation.isPending}
              className="rounded bg-primary-400/10 p-1 text-primary-400 hover:bg-primary-400/20" title="Save">
              <HugeiconsIcon icon={CheckmarkSquare01Icon} size={14} />
            </button>
            <button onClick={() => setIsEditing(false)}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300" title="Cancel">
              <HugeiconsIcon icon={Cancel01Icon} size={14} />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <>
      <tr className="group transition-colors hover:bg-zinc-800/30">
        <td className="px-3 py-3">
          <button onClick={onToggleExpand} className="text-zinc-500 hover:text-zinc-300">
            <HugeiconsIcon icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon} size={16} />
          </button>
        </td>
        <td className="px-4 py-3">
          <p className="font-medium text-zinc-100">{item.title}</p>
          {item.updatedAt && (
            <p className="mt-0.5 text-[10px] text-zinc-500">
              Updated {new Date(item.updatedAt).toLocaleDateString()} by {item.updatedByName ?? 'Unknown'}
            </p>
          )}
          {!item.updatedAt && item.uploadedByName && (
            <p className="mt-0.5 text-[10px] text-zinc-500">
              by {item.uploadedByName}
            </p>
          )}
        </td>
        <td className="px-4 py-3 text-zinc-400">{item.source ?? '—'}</td>
        <td className="px-4 py-3 text-zinc-400">{new Date(item.capturedAt).toLocaleDateString()}</td>
        <td className="px-4 py-3 text-zinc-400">
          {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : '—'}
        </td>
        <td className="px-4 py-3">
          {item.fileName ? (
            <span className="flex items-center gap-1 text-zinc-400">
              <HugeiconsIcon icon={File01Icon} size={14} />
              <span className="max-w-[120px] truncate text-xs">{item.fileName}</span>
            </span>
          ) : (
            <span className="text-zinc-600">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-center">
          <span className={`inline-flex min-w-[24px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${
            item.linksCount > 0 ? 'bg-primary-400/10 text-primary-400' : 'bg-zinc-800 text-zinc-500'
          }`}>
            {item.linksCount}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => setIsEditing(true)}
              className="rounded p-1 text-zinc-500 opacity-0 transition-opacity hover:bg-zinc-700 hover:text-zinc-300 group-hover:opacity-100" title="Edit">
              <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
            </button>
            <button
              onClick={onToggleLink}
              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                isLinking
                  ? 'border-primary-400/50 bg-primary-400/10 text-primary-400'
                  : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
              }`}
            >
              <HugeiconsIcon icon={Link01Icon} size={14} />
              Link
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={8} className="border-b border-zinc-800 bg-zinc-900/50 px-5 py-4">
            <EvidenceExpandedContent
              workspaceId={workspaceId}
              evidenceId={item.id}
              isLinking={isLinking}
            />
          </td>
        </tr>
      )}
    </>
  )
}

// ── Expanded Content ────────────────────────────────────────────────────────

function EvidenceExpandedContent({
  workspaceId,
  evidenceId,
  isLinking,
}: {
  workspaceId: string | undefined
  evidenceId: string
  isLinking: boolean
}) {
  const { links, isLoading: linksLoading } = useEvidenceLinks(workspaceId, evidenceId)
  const unlinkMutation = useUnlinkEvidence(workspaceId)

  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Linked Controls ({links.length})
        </h4>
        {linksLoading ? (
          <div className="flex items-center gap-2 py-2">
            <HugeiconsIcon icon={LoaderPinwheelIcon} size={14} className="animate-spin text-zinc-500" />
            <span className="text-xs text-zinc-500">Loading links...</span>
          </div>
        ) : links.length === 0 ? (
          <p className="text-xs text-zinc-500">No controls linked yet. Click "Link" to connect evidence to controls.</p>
        ) : (
          <div className="space-y-2">
            {/* Manual links */}
            <div className="flex flex-wrap gap-2">
              {links.filter(l => l.linkType === 'manual').map((link) => (
                <div
                  key={link.id}
                  className="group/badge flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-1.5"
                >
                  <span className="font-mono text-xs text-primary-400">{link.controlCode}</span>
                  <span className="max-w-[200px] truncate text-xs text-zinc-400">{link.controlTitle}</span>
                  <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">
                    {link.frameworkName}
                  </span>
                  <button
                    onClick={() => unlinkMutation.mutate({ evidenceId, linkId: link.id })}
                    disabled={unlinkMutation.isPending}
                    className="ml-1 rounded p-0.5 text-zinc-600 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-400 group-hover/badge:opacity-100"
                    title="Unlink"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={12} />
                  </button>
                </div>
              ))}
            </div>
            {/* Auto-crosswalk links */}
            {links.filter(l => l.linkType === 'auto_crosswalk').length > 0 && (
              <div>
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                  Auto-linked via crosswalk
                </p>
                <div className="flex flex-wrap gap-2">
                  {links.filter(l => l.linkType === 'auto_crosswalk').map((link) => (
                    <div
                      key={link.id}
                      className="group/badge flex items-center gap-2 rounded-lg border border-dashed border-zinc-800 bg-zinc-800/30 px-3 py-1.5"
                    >
                      <span className="font-mono text-xs text-zinc-500">{link.controlCode}</span>
                      <span className="max-w-[200px] truncate text-xs text-zinc-500">{link.controlTitle}</span>
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
                        {link.frameworkName}
                      </span>
                      <button
                        onClick={() => unlinkMutation.mutate({ evidenceId, linkId: link.id })}
                        disabled={unlinkMutation.isPending}
                        className="ml-1 rounded p-0.5 text-zinc-600 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-400 group-hover/badge:opacity-100"
                        title="Remove auto-link"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isLinking && (
        <LinkControlDialog workspaceId={workspaceId} evidenceId={evidenceId} />
      )}
    </div>
  )
}

// ── Link Control Dialog ─────────────────────────────────────────────────────

function LinkControlDialog({
  workspaceId,
  evidenceId,
}: {
  workspaceId: string | undefined
  evidenceId: string
}) {
  const { adoptions } = useAdoptions(workspaceId)
  const { links: existingLinks } = useEvidenceLinks(workspaceId, evidenceId)
  const linkedControlIds = new Set(existingLinks.map((l) => l.controlId))

  const [selectedAdoption, setSelectedAdoption] = useState<{
    slug: string
    version: string
  } | null>(adoptions.length > 0 ? { slug: adoptions[0].frameworkSlug, version: adoptions[0].frameworkVersion } : null)
  const [searchQuery, setSearchQuery] = useState('')

  const { controls, isLoading: controlsLoading } = useControls(
    workspaceId,
    selectedAdoption?.slug ?? '',
    selectedAdoption?.version ?? '',
    { page: 1, limit: 50 },
  )

  const linkMutation = useLinkEvidence(workspaceId)

  const filteredControls = controls.filter((c) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      c.controlId.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      (c.domain ?? '').toLowerCase().includes(q)
    )
  })

  const handleLink = (controlId: string, frameworkVersionId: string) => {
    linkMutation.mutate({ evidenceId, controlId, frameworkVersionId })
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
        <p className="text-xs text-zinc-500">Adopt a framework first to link controls.</p>
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
                  <td className="max-w-[200px] truncate px-3 py-2 text-zinc-300">{control.title}</td>
                  <td className="px-3 py-2 text-zinc-500">{control.domain ?? '—'}</td>
                  <td className="px-3 py-2 text-right">
                    {linkedControlIds.has(control.id) ? (
                      <span className="rounded-md bg-zinc-700 px-2.5 py-1 text-xs text-zinc-400">
                        Linked
                      </span>
                    ) : (
                      <button
                        onClick={() => handleLink(control.id, control.frameworkVersionId)}
                        disabled={linkMutation.isPending}
                        className="rounded-md bg-primary-400 px-2.5 py-1 text-xs font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
                      >
                        Link
                      </button>
                    )}
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
