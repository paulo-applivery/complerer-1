import { useState } from 'react'
import { useParams, Link, useNavigate } from '@tanstack/react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Shield01Icon,
  FileValidationIcon,
  ArrowLeft01Icon,
  Edit01Icon,
  Delete02Icon,
  CheckmarkCircle01Icon,
  Alert02Icon,
  Settings01Icon,
  Search01Icon,
  File01Icon,
  Cancel01Icon,
  LoaderPinwheelIcon,
  FileAttachmentIcon,
} from '@hugeicons/core-free-icons'
import {
  useProject,
  useProjectStats,
  useUpdateProject,
  useDeleteProject,
  useProjectControls,
  useProjectEvidence,
  useLinkProjectEvidence,
  useUnlinkProjectEvidence,
  useCreateAndLinkEvidence,
  useAvailableEvidence,
  useProjectPolicies,
  useProjectBaselines,
  useProjectGaps,
  useProjectRisks,
} from '@/hooks/use-projects'

type ProjectTab = 'overview' | 'controls' | 'evidence' | 'policies' | 'baselines' | 'gaps' | 'risks'

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'audit_ready', label: 'Audit Ready' },
  { value: 'in_audit', label: 'In Audit' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-zinc-500/10 text-zinc-400',
  in_progress: 'bg-blue-500/10 text-blue-400',
  audit_ready: 'bg-green-500/10 text-green-400',
  in_audit: 'bg-amber-500/10 text-amber-400',
  completed: 'bg-emerald-500/10 text-emerald-400',
  archived: 'bg-zinc-500/10 text-zinc-500',
}

export function ProjectDetailPage() {
  const params = useParams({ strict: false }) as { workspaceId?: string; projectId?: string }
  const workspaceId = params.workspaceId
  const projectId = params.projectId
  const navigate = useNavigate()

  const { project, isLoading } = useProject(workspaceId, projectId)
  const { stats } = useProjectStats(workspaceId, projectId)
  const updateMut = useUpdateProject(workspaceId)
  const deleteMut = useDeleteProject(workspaceId)

  const [tab, setTab] = useState<ProjectTab>('overview')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '', description: '', auditorName: '', auditorFirm: '',
    auditPeriodStart: '', auditPeriodEnd: '', targetCompletionDate: '',
  })

  const startEdit = () => {
    if (!project) return
    setEditForm({
      name: project.name,
      description: project.description ?? '',
      auditorName: project.auditorName ?? '',
      auditorFirm: project.auditorFirm ?? '',
      auditPeriodStart: project.auditPeriodStart ?? '',
      auditPeriodEnd: project.auditPeriodEnd ?? '',
      targetCompletionDate: project.targetCompletionDate ?? '',
    })
    setEditing(true)
  }

  const saveEdit = () => {
    if (!projectId) return
    updateMut.mutate(
      { projectId, name: editForm.name, description: editForm.description || undefined, auditorName: editForm.auditorName || undefined, auditorFirm: editForm.auditorFirm || undefined, auditPeriodStart: editForm.auditPeriodStart || undefined, auditPeriodEnd: editForm.auditPeriodEnd || undefined, targetCompletionDate: editForm.targetCompletionDate || undefined },
      { onSuccess: () => setEditing(false) }
    )
  }

  const handleDelete = () => {
    if (!projectId) return
    if (!confirm(`Delete project "${project?.name}"? This will remove all linked evidence. This cannot be undone.`)) return
    deleteMut.mutate(projectId, {
      onSuccess: () => navigate({ to: '/w/$workspaceId/projects', params: { workspaceId: workspaceId! } })
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-800" />
        <div className="h-4 w-full animate-pulse rounded-full bg-zinc-800" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-800" />)}
        </div>
      </div>
    )
  }

  if (!project) return <div className="py-20 text-center text-sm text-zinc-500">Project not found.</div>

  const coverage = stats?.coveragePercent ?? 0

  const TABS: { id: ProjectTab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'controls', label: 'Controls', count: stats?.controlsTotal ?? 0 },
    { id: 'evidence', label: 'Evidence', count: stats?.evidenceLinked ?? 0 },
    { id: 'gaps', label: 'Gaps', count: (stats?.controlsTotal ?? 0) - (stats?.controlsCovered ?? 0) },
    { id: 'policies', label: 'Policies' },
    { id: 'baselines', label: 'Baselines' },
    { id: 'risks', label: 'Risks' },
  ]

  return (
    <div className="space-y-6">
      {/* Header with back link */}
      <div>
        <Link to="/w/$workspaceId/projects" params={{ workspaceId: workspaceId! }} className="mb-3 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} /> All Projects
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="rounded-md bg-primary-400/10 px-2.5 py-0.5 text-xs font-semibold text-primary-400">{project.frameworkName} v{project.frameworkVersion}</span>
              <select value={project.status} onChange={(e) => updateMut.mutate({ projectId: projectId!, status: e.target.value })} className={`rounded-full border-0 px-2.5 py-0.5 text-xs font-medium cursor-pointer focus:outline-none ${STATUS_COLORS[project.status] ?? ''}`}>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <h1 className="text-2xl font-bold text-zinc-100">{project.name}</h1>
            {project.description && <p className="mt-1 text-sm text-zinc-400">{project.description}</p>}
            <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
              {project.auditPeriodStart && <span>Audit: {new Date(project.auditPeriodStart).toLocaleDateString()} &rarr; {project.auditPeriodEnd ? new Date(project.auditPeriodEnd).toLocaleDateString() : '\u2014'}</span>}
              {project.auditorFirm && <span>Auditor: {project.auditorFirm}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate({ to: `/w/${workspaceId}/reports`, search: { projectId } })}
              className="flex items-center gap-1.5 rounded-lg bg-primary-400 px-3 py-2 text-xs font-medium text-zinc-950 hover:bg-primary-300"
            >
              <HugeiconsIcon icon={FileAttachmentIcon} size={14} /> Generate Report
            </button>
            <button onClick={startEdit} className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:border-zinc-600">
              <HugeiconsIcon icon={Edit01Icon} size={14} /> Edit
            </button>
            <button onClick={handleDelete} className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-400 hover:border-red-500/50">
              <HugeiconsIcon icon={Delete02Icon} size={14} /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-300">Overall Coverage</span>
          <span className="text-lg font-bold text-zinc-100">{coverage}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
          <div className={`h-3 rounded-full transition-all duration-700 ${coverage >= 80 ? 'bg-green-400' : coverage >= 50 ? 'bg-amber-400' : coverage > 0 ? 'bg-blue-400' : 'bg-zinc-700'}`} style={{ width: `${Math.max(coverage, 0.5)}%` }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tab === t.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {t.label}
            {t.count !== undefined && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${tab === t.id ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-800 text-zinc-500'}`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && <OverviewTab stats={stats} project={project} />}
      {tab === 'controls' && <ControlsTab workspaceId={workspaceId} projectId={projectId} />}
      {tab === 'evidence' && <EvidenceTab workspaceId={workspaceId} projectId={projectId} />}
      {tab === 'gaps' && <GapsTab workspaceId={workspaceId} projectId={projectId} />}
      {tab === 'policies' && <PoliciesTab workspaceId={workspaceId} projectId={projectId} />}
      {tab === 'baselines' && <BaselinesTab workspaceId={workspaceId} projectId={projectId} />}
      {tab === 'risks' && <RisksTab workspaceId={workspaceId} projectId={projectId} />}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditing(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">Edit Project</h3>
            <div className="space-y-4">
              <div><label className="mb-1 block text-xs text-zinc-400">Name</label><input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" /></div>
              <div><label className="mb-1 block text-xs text-zinc-400">Description</label><textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={2} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-zinc-400">Auditor</label><input value={editForm.auditorName} onChange={e => setEditForm({ ...editForm, auditorName: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" /></div>
                <div><label className="mb-1 block text-xs text-zinc-400">Firm</label><input value={editForm.auditorFirm} onChange={e => setEditForm({ ...editForm, auditorFirm: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="mb-1 block text-xs text-zinc-400">Period Start</label><input type="date" value={editForm.auditPeriodStart} onChange={e => setEditForm({ ...editForm, auditPeriodStart: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" /></div>
                <div><label className="mb-1 block text-xs text-zinc-400">Period End</label><input type="date" value={editForm.auditPeriodEnd} onChange={e => setEditForm({ ...editForm, auditPeriodEnd: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" /></div>
                <div><label className="mb-1 block text-xs text-zinc-400">Target</label><input type="date" value={editForm.targetCompletionDate} onChange={e => setEditForm({ ...editForm, targetCompletionDate: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" /></div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600">Cancel</button>
              <button onClick={saveEdit} disabled={updateMut.isPending} className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50">{updateMut.isPending ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Overview Tab ───────────────────────────────────────────────────────

function OverviewTab({ stats, project }: { stats: any; project: any }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {[
        { label: 'Total Controls', value: stats?.controlsTotal ?? 0, icon: Shield01Icon, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { label: 'Covered', value: stats?.controlsCovered ?? 0, icon: CheckmarkCircle01Icon, color: 'text-green-400', bg: 'bg-green-400/10' },
        { label: 'Gaps', value: (stats?.controlsTotal ?? 0) - (stats?.controlsCovered ?? 0), icon: Alert02Icon, color: 'text-red-400', bg: 'bg-red-400/10' },
        { label: 'Evidence', value: stats?.evidenceLinked ?? 0, icon: FileValidationIcon, color: 'text-amber-400', bg: 'bg-amber-400/10' },
      ].map(s => (
        <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">{s.label}</p>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg}`}><HugeiconsIcon icon={s.icon} size={14} className={s.color} /></div>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-100">{s.value}</p>
        </div>
      ))}
    </div>
  )
}

// ── Controls Tab ──────────────────────────────────────────────────────

function ControlsTab({ workspaceId, projectId }: { workspaceId?: string; projectId?: string }) {
  const [domain, setDomain] = useState('')
  const [search, setSearch] = useState('')
  const { controls, domains, isLoading } = useProjectControls(workspaceId, projectId, { domain, search })

  if (isLoading) return <div className="py-12 text-center"><HugeiconsIcon icon={LoaderPinwheelIcon} size={20} className="mx-auto animate-spin text-zinc-500" /></div>

  const covered = controls.filter((c: any) => c.status === 'covered').length
  const gaps = controls.filter((c: any) => c.status === 'gap').length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search controls..." className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none" />
        </div>
        <select value={domain} onChange={e => setDomain(e.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-primary-400 focus:outline-none">
          <option value="">All domains</option>
          {domains.map((d: string) => <option key={d} value={d}>{d}</option>)}
        </select>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-green-400">{covered} covered</span>
          <span className="text-red-400">{gaps} gaps</span>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                <th className="px-4 py-3 font-medium">Control</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Domain</th>
                <th className="px-4 py-3 font-medium text-center">Evidence</th>
                <th className="px-4 py-3 font-medium text-center">Policies</th>
                <th className="px-4 py-3 font-medium text-center">Baselines</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {controls.map((ctrl: any) => (
                <tr key={ctrl.id} className="transition-colors hover:bg-zinc-800/30">
                  <td className="px-4 py-3"><code className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-primary-400">{ctrl.controlId}</code></td>
                  <td className="px-4 py-3 text-sm text-zinc-300 max-w-xs truncate">{ctrl.title}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{ctrl.domain ?? '\u2014'}</td>
                  <td className="px-4 py-3 text-center text-sm text-zinc-400">{ctrl.evidenceCount}</td>
                  <td className="px-4 py-3 text-center text-sm text-zinc-400">{ctrl.policyCount}</td>
                  <td className="px-4 py-3 text-center text-sm text-zinc-400">{ctrl.baselineCount ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ctrl.status === 'covered' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {ctrl.status === 'covered' ? 'Covered' : 'Gap'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {controls.length === 0 && <div className="py-12 text-center text-sm text-zinc-500">No controls found.</div>}
      </div>
    </div>
  )
}

// ── Evidence Tab ──────────────────────────────────────────────────────

function EvidenceTab({ workspaceId, projectId }: { workspaceId?: string; projectId?: string }) {
  const { evidence, isLoading } = useProjectEvidence(workspaceId, projectId)
  const { controls } = useProjectControls(workspaceId, projectId)
  const { evidence: availableEvidence } = useAvailableEvidence(workspaceId, projectId)
  const linkMut = useLinkProjectEvidence(workspaceId)
  const unlinkMut = useUnlinkProjectEvidence(workspaceId)
  const createAndLinkMut = useCreateAndLinkEvidence(workspaceId)

  const [showLinker, setShowLinker] = useState<false | 'existing' | 'create'>(false)
  const [linkForm, setLinkForm] = useState({ evidenceId: '', controlId: '' })
  const [createForm, setCreateForm] = useState({ title: '', description: '', source: 'manual', controlId: '' })
  const [evSearch, setEvSearch] = useState('')
  const [ctrlSearch, setCtrlSearch] = useState('')
  const [createCtrlSearch, setCreateCtrlSearch] = useState('')

  // Already linked pairs for disabling
  const linkedPairs = new Set(evidence.map((e: any) => `${e.evidenceId}:${e.controlId}`))
  // Map evidenceId → array of linked controls (with linkId for unlink)
  const linkedByEvidence = new Map<string, { linkId: string; controlCode: string | null; controlTitle: string | null; controlId: string | null }[]>()
  for (const ev of evidence as any[]) {
    if (!linkedByEvidence.has(ev.evidenceId)) linkedByEvidence.set(ev.evidenceId, [])
    linkedByEvidence.get(ev.evidenceId)!.push({ linkId: ev.linkId, controlCode: ev.controlCode ?? null, controlTitle: ev.controlTitle ?? null, controlId: ev.controlId ?? null })
  }

  const filteredEvidence = availableEvidence.filter((e: any) =>
    e.title.toLowerCase().includes(evSearch.toLowerCase())
  )
  const gapControls = controls.filter((c: any) => c.status === 'gap' && c.controlId.toLowerCase().includes(ctrlSearch.toLowerCase()))
  const existingAllControls = controls.filter((c: any) => {
    if (!ctrlSearch) return true
    const q = ctrlSearch.toLowerCase()
    return c.controlId.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
  })
  const allFilteredControls = controls.filter((c: any) => {
    if (!createCtrlSearch) return true
    const q = createCtrlSearch.toLowerCase()
    return c.controlId.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
  })

  const handleLink = () => {
    if (!linkForm.evidenceId) return
    linkMut.mutate(
      { projectId: projectId!, evidenceId: linkForm.evidenceId, controlId: linkForm.controlId || undefined },
      { onSuccess: () => { setLinkForm({ evidenceId: '', controlId: '' }); setShowLinker(false) } }
    )
  }

  const handleCreateAndLink = () => {
    if (!createForm.title.trim()) return
    createAndLinkMut.mutate(
      { projectId: projectId!, title: createForm.title, description: createForm.description || undefined, source: createForm.source, controlId: createForm.controlId || undefined },
      { onSuccess: () => { setCreateForm({ title: '', description: '', source: 'manual', controlId: '' }); setShowLinker(false) } }
    )
  }

  if (isLoading) return <div className="py-12 text-center"><HugeiconsIcon icon={LoaderPinwheelIcon} size={20} className="mx-auto animate-spin text-zinc-500" /></div>

  return (
    <div className="space-y-4">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">{evidence.length} evidence items linked</p>
        <div className="flex items-center gap-2">
          {showLinker ? (
            <button onClick={() => setShowLinker(false)} className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-600">
              <HugeiconsIcon icon={Cancel01Icon} size={14} /> Cancel
            </button>
          ) : (
            <>
              <button onClick={() => setShowLinker('existing')} className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-600">
                <HugeiconsIcon icon={FileValidationIcon} size={14} /> Link Existing
              </button>
              <button onClick={() => setShowLinker('create')} className="flex items-center gap-1.5 rounded-lg bg-primary-400 px-3 py-2 text-xs font-medium text-zinc-950 hover:bg-primary-300">
                <HugeiconsIcon icon={FileValidationIcon} size={14} /> Create &amp; Link
              </button>
            </>
          )}
        </div>
      </div>

      {/* Create & Link form */}
      {showLinker === 'create' && (
        <div className="rounded-xl border border-primary-400/20 bg-primary-400/5 p-5">
          <h3 className="mb-3 text-sm font-semibold text-zinc-100">Create Evidence &amp; Link to Control</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Evidence details */}
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Title *</label>
                <input value={createForm.title} onChange={e => setCreateForm({...createForm, title: e.target.value})} placeholder="e.g. MFA Configuration Screenshot" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Description</label>
                <textarea value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} rows={2} placeholder="What does this evidence prove?" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Source</label>
                <select value={createForm.source} onChange={e => setCreateForm({...createForm, source: e.target.value})} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-primary-400 focus:outline-none">
                  <option value="manual">Manual</option>
                  <option value="screenshot">Screenshot</option>
                  <option value="api">API</option>
                  <option value="integration">Integration</option>
                  <option value="document">Document</option>
                  <option value="attestation">Attestation</option>
                </select>
              </div>
            </div>
            {/* Control picker — optional */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs text-zinc-400">Link to Control <span className="text-zinc-600">(optional)</span></label>
                {createForm.controlId && (
                  <button onClick={() => setCreateForm({...createForm, controlId: ''})} className="text-[10px] text-zinc-500 hover:text-zinc-300">Clear</button>
                )}
              </div>
              <input value={createCtrlSearch} onChange={e => setCreateCtrlSearch(e.target.value)} placeholder="Search controls..." className="mb-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none" />
              <div className="max-h-52 overflow-y-auto space-y-1">
                {allFilteredControls.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => setCreateForm({...createForm, controlId: createForm.controlId === c.id ? '' : c.id})}
                    className={`w-full rounded-lg border p-2 text-left transition-all ${createForm.controlId === c.id ? 'border-primary-400/50 bg-primary-400/10' : 'border-zinc-800 bg-zinc-800/40 hover:border-zinc-700'}`}
                  >
                    <div className="flex items-center gap-2">
                      <code className={`rounded px-1.5 py-0.5 text-[10px] ${c.status === 'gap' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>{c.controlId}</code>
                      {c.status === 'covered' && <span className="text-[10px] text-green-500">covered</span>}
                      {createForm.controlId === c.id && <span className="text-[10px] text-primary-400">✓</span>}
                    </div>
                    <p className="mt-0.5 text-[10px] text-zinc-500 truncate">{c.title}</p>
                  </button>
                ))}
                {allFilteredControls.length === 0 && <p className="py-4 text-center text-xs text-zinc-500">No controls found.</p>}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              {createForm.controlId ? '✓ Will link to selected control' : 'No control selected — you can link later'}
            </p>
            <button onClick={handleCreateAndLink} disabled={!createForm.title.trim() || createAndLinkMut.isPending} className="rounded-lg bg-primary-400 px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50">
              {createAndLinkMut.isPending ? 'Creating...' : createForm.controlId ? 'Create & Link' : 'Create Evidence'}
            </button>
          </div>
        </div>
      )}

      {/* Link existing evidence form */}
      {showLinker === 'existing' && (
        <div className="rounded-xl border border-primary-400/20 bg-primary-400/5 p-5">
          <h3 className="mb-3 text-sm font-semibold text-zinc-100">Link Existing Evidence to Control</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Evidence picker */}
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Evidence</label>
              <input value={evSearch} onChange={e => setEvSearch(e.target.value)} placeholder="Search evidence..." className="mb-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none" />
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredEvidence.length === 0 ? (
                  <p className="py-4 text-center text-xs text-zinc-500">No evidence found. Create evidence from the Evidence page first.</p>
                ) : filteredEvidence.map((ev: any) => {
                  const evLinks = linkedByEvidence.get(ev.id) ?? []
                  const isLinked = evLinks.length > 0
                  const isSelected = linkForm.evidenceId === ev.id
                  return (
                    <div key={ev.id} className={`rounded-lg border transition-all ${isSelected ? 'border-primary-400/50 bg-primary-400/10' : isLinked ? 'border-green-500/20 bg-green-500/5' : 'border-zinc-800 bg-zinc-800/40 hover:border-zinc-700'}`}>
                      <button
                        onClick={() => setLinkForm({ ...linkForm, evidenceId: isSelected ? '' : ev.id })}
                        className="w-full p-2 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-zinc-200 truncate">{ev.title}</p>
                          {isLinked && !isSelected && <span className="shrink-0 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400">{evLinks.length} linked</span>}
                          {isSelected && <span className="shrink-0 text-[10px] text-primary-400">✓ Selected</span>}
                        </div>
                        <p className="text-[10px] text-zinc-500">{ev.source} · {ev.capturedAt ? new Date(ev.capturedAt).toLocaleDateString() : 'No date'}</p>
                      </button>
                      {/* Show linked controls with unlink buttons */}
                      {isLinked && (isSelected || true) && (
                        <div className="border-t border-zinc-800/50 px-2 py-1.5">
                          <div className="flex flex-wrap gap-1">
                            {evLinks.map((link) => (
                              <div key={link.linkId} className="group/chip flex items-center gap-1 rounded-md bg-zinc-800/80 px-1.5 py-0.5">
                                <code className="text-[9px] text-green-400">{link.controlCode ?? 'Unlinked'}</code>
                                <button
                                  onClick={(e) => { e.stopPropagation(); unlinkMut.mutate({ projectId: projectId!, linkId: link.linkId }) }}
                                  disabled={unlinkMut.isPending}
                                  className="rounded p-0.5 text-zinc-600 opacity-0 transition-opacity hover:text-red-400 group-hover/chip:opacity-100"
                                  title="Unlink"
                                >
                                  <HugeiconsIcon icon={Cancel01Icon} size={10} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            {/* Control picker — optional, all controls shown, gaps highlighted */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs text-zinc-400">Control <span className="text-zinc-600">(optional — gaps highlighted)</span></label>
                {linkForm.controlId && (
                  <button onClick={() => setLinkForm({...linkForm, controlId: ''})} className="text-[10px] text-zinc-500 hover:text-zinc-300">Clear</button>
                )}
              </div>
              <input value={ctrlSearch} onChange={e => setCtrlSearch(e.target.value)} placeholder="Search controls..." className="mb-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none" />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {existingAllControls.length === 0 && ctrlSearch ? (
                  <p className="py-4 text-center text-xs text-zinc-500">No matching controls.</p>
                ) : existingAllControls.map((c: any) => {
                  const alreadyLinked = linkForm.evidenceId && linkedPairs.has(`${linkForm.evidenceId}:${c.id}`)
                  return (
                    <button
                      key={c.id}
                      onClick={() => !alreadyLinked && setLinkForm({ ...linkForm, controlId: linkForm.controlId === c.id ? '' : c.id })}
                      disabled={!!alreadyLinked}
                      className={`w-full rounded-lg border p-2 text-left transition-all ${alreadyLinked ? 'border-zinc-800 opacity-40 cursor-not-allowed' : linkForm.controlId === c.id ? 'border-primary-400/50 bg-primary-400/10' : 'border-zinc-800 bg-zinc-800/40 hover:border-zinc-700'}`}
                    >
                      <div className="flex items-center gap-2">
                        <code className={`rounded px-1.5 py-0.5 text-[10px] ${c.status === 'gap' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>{c.controlId}</code>
                        {c.status === 'covered' && <span className="text-[10px] text-green-500">covered</span>}
                        {alreadyLinked && <span className="text-[10px] text-zinc-500">Linked</span>}
                        {linkForm.controlId === c.id && <span className="text-[10px] text-primary-400">✓</span>}
                      </div>
                      <p className="mt-0.5 text-[10px] text-zinc-500 truncate">{c.title}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              {linkForm.controlId ? '✓ Will link to selected control' : 'No control selected — evidence will be added without linking'}
            </p>
            <button
              onClick={handleLink}
              disabled={!linkForm.evidenceId || linkMut.isPending}
              className="rounded-lg bg-primary-400 px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50"
            >
              {linkMut.isPending ? 'Linking...' : linkForm.controlId ? 'Link Evidence to Control' : 'Add Evidence'}
            </button>
          </div>
        </div>
      )}

      {/* Evidence table or empty */}
      {evidence.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-12 text-center">
          <HugeiconsIcon icon={FileValidationIcon} size={32} className="mx-auto text-zinc-600" />
          <p className="mt-3 text-sm text-zinc-400">No evidence linked to this project yet.</p>
          <p className="mt-1 text-xs text-zinc-500">Click "Link Evidence" above to connect evidence to controls, or create evidence from the Evidence page.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="px-4 py-3 font-medium">Evidence</th>
                  <th className="px-4 py-3 font-medium">Control</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Captured</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                  <th className="w-10 px-2 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {evidence.map((ev: any) => (
                  <tr key={ev.linkId} className="transition-colors hover:bg-zinc-800/30">
                    <td className="px-4 py-3 text-sm font-medium text-zinc-200">{ev.evidenceTitle}</td>
                    <td className="px-4 py-3">
                      {ev.controlCode ? (
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-primary-400">{ev.controlCode}</code>
                          <span className="text-xs text-zinc-500 truncate max-w-[150px]">{ev.controlTitle}</span>
                        </div>
                      ) : (
                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">No control</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{ev.source}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{ev.capturedAt ? new Date(ev.capturedAt).toLocaleDateString() : '\u2014'}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{ev.expiresAt ? new Date(ev.expiresAt).toLocaleDateString() : '\u2014'}</td>
                    <td className="px-2 py-3">
                      <button onClick={() => unlinkMut.mutate({ projectId: projectId!, linkId: ev.linkId })} disabled={unlinkMut.isPending} className="rounded p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-400" title="Unlink">
                        <HugeiconsIcon icon={Cancel01Icon} size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Gaps Tab ──────────────────────────────────────────────────────────

function GapsTab({ workspaceId, projectId }: { workspaceId?: string; projectId?: string }) {
  const { gaps, isLoading } = useProjectGaps(workspaceId, projectId)

  if (isLoading) return <div className="py-12 text-center"><HugeiconsIcon icon={LoaderPinwheelIcon} size={20} className="mx-auto animate-spin text-zinc-500" /></div>

  if (gaps.length === 0) {
    return (
      <div className="rounded-xl border border-green-500/20 bg-green-500/5 py-12 text-center">
        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={32} className="mx-auto text-green-400" />
        <p className="mt-3 text-sm font-medium text-green-400">No gaps!</p>
        <p className="mt-1 text-xs text-zinc-500">All controls have at least one evidence item linked.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500">{gaps.length} controls without evidence &mdash; sorted by risk weight (highest first)</p>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                <th className="px-4 py-3 font-medium">Control</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Domain</th>
                <th className="px-4 py-3 font-medium">Risk Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {gaps.map((g: any) => (
                <tr key={g.id} className="transition-colors hover:bg-zinc-800/30">
                  <td className="px-4 py-3"><code className="rounded bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">{g.controlId}</code></td>
                  <td className="px-4 py-3 text-sm text-zinc-300 max-w-xs truncate">{g.title}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{g.domain ?? '\u2014'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-800">
                        <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${(g.riskWeight ?? 0.5) * 100}%` }} />
                      </div>
                      <span className="text-xs text-zinc-500">{g.riskWeight}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Policies Tab ─────────────────────────────────────────────────────

function PoliciesTab({ workspaceId, projectId }: { workspaceId?: string; projectId?: string }) {
  const { policies, isLoading } = useProjectPolicies(workspaceId, projectId)

  if (isLoading) return <div className="py-12 text-center"><HugeiconsIcon icon={LoaderPinwheelIcon} size={20} className="mx-auto animate-spin text-zinc-500" /></div>

  if (policies.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-12 text-center">
        <HugeiconsIcon icon={File01Icon} size={32} className="mx-auto text-zinc-600" />
        <p className="mt-3 text-sm text-zinc-400">No policies cover this project's controls yet.</p>
        <p className="mt-1 text-xs text-zinc-500">Go to Policies to create policies and link them to controls.</p>
      </div>
    )
  }

  const CATEGORY_COLORS: Record<string, string> = {
    security: 'bg-blue-500/10 text-blue-400',
    access: 'bg-cyan-500/10 text-cyan-400',
    privacy: 'bg-purple-500/10 text-purple-400',
    hr: 'bg-pink-500/10 text-pink-400',
    incident: 'bg-red-500/10 text-red-400',
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-500">
              <th className="px-4 py-3 font-medium">Policy</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Version</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium text-center">Controls Covered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {policies.map((p: any) => (
              <tr key={p.id} className="transition-colors hover:bg-zinc-800/30">
                <td className="px-4 py-3 font-medium text-zinc-200">{p.title}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[p.category] ?? 'bg-zinc-800 text-zinc-400'}`}>{p.category}</span></td>
                <td className="px-4 py-3 text-xs text-zinc-400">v{p.version}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${p.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-500/10 text-zinc-400'}`}>{p.status}</span></td>
                <td className="px-4 py-3 text-xs text-zinc-500">{p.owner ?? '\u2014'}</td>
                <td className="px-4 py-3 text-center text-sm font-medium text-primary-400">{p.controlsCovered}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Baselines Tab ────────────────────────────────────────────────────

function BaselinesTab({ workspaceId, projectId }: { workspaceId?: string; projectId?: string }) {
  const { baselines, isLoading } = useProjectBaselines(workspaceId, projectId)

  if (isLoading) return <div className="py-12 text-center"><HugeiconsIcon icon={LoaderPinwheelIcon} size={20} className="mx-auto animate-spin text-zinc-500" /></div>

  if (baselines.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-12 text-center">
        <HugeiconsIcon icon={Settings01Icon} size={32} className="mx-auto text-zinc-600" />
        <p className="mt-3 text-sm text-zinc-400">No active baselines.</p>
        <p className="mt-1 text-xs text-zinc-500">Go to Baselines to activate rules from the library.</p>
      </div>
    )
  }

  const SEVERITY_COLORS: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-400',
    high: 'bg-orange-500/10 text-orange-400',
    medium: 'bg-amber-500/10 text-amber-400',
    low: 'bg-zinc-500/10 text-zinc-400',
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-500">
              <th className="px-4 py-3 font-medium">Baseline</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Severity</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium text-center">Controls</th>
              <th className="px-4 py-3 font-medium text-center">Open Violations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {baselines.map((b: any) => (
              <tr key={b.id} className="transition-colors hover:bg-zinc-800/30">
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-200">{b.name}</p>
                  {b.description && <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">{b.description}</p>}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-400">{b.category?.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SEVERITY_COLORS[b.severity] ?? SEVERITY_COLORS.medium}`}>{b.severity}</span></td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${b.ruleType === 'automated' ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-500/10 text-zinc-400'}`}>{b.ruleType}</span></td>
                <td className="px-4 py-3 text-center">
                  {b.controlsLinked > 0 ? (
                    <span className="rounded-full bg-primary-400/10 px-2.5 py-0.5 text-xs font-medium text-primary-400">{b.controlsLinked}</span>
                  ) : (
                    <span className="text-xs text-zinc-600">0</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {b.openViolations > 0 ? (
                    <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">{b.openViolations}</span>
                  ) : (
                    <span className="text-xs text-zinc-600">0</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Risks Tab ────────────────────────────────────────────────────────

function RisksTab({ workspaceId, projectId }: { workspaceId?: string; projectId?: string }) {
  const { risks, isLoading } = useProjectRisks(workspaceId, projectId)

  if (isLoading) return <div className="py-12 text-center"><HugeiconsIcon icon={LoaderPinwheelIcon} size={20} className="mx-auto animate-spin text-zinc-500" /></div>

  if (risks.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-12 text-center">
        <HugeiconsIcon icon={Alert02Icon} size={32} className="mx-auto text-zinc-600" />
        <p className="mt-3 text-sm text-zinc-400">No open risks.</p>
        <p className="mt-1 text-xs text-zinc-500">Go to Risk Register to create and track risks.</p>
      </div>
    )
  }

  const RISK_COLORS = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500/10 text-red-400'
      case 'high': return 'bg-orange-500/10 text-orange-400'
      case 'medium': return 'bg-amber-500/10 text-amber-400'
      case 'low': return 'bg-green-500/10 text-green-400'
      default: return 'bg-zinc-500/10 text-zinc-400'
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-500">
              <th className="px-4 py-3 font-medium">Risk</th>
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="px-4 py-3 font-medium">Likelihood</th>
              <th className="px-4 py-3 font-medium">Impact</th>
              <th className="px-4 py-3 font-medium">Inherent Risk</th>
              <th className="px-4 py-3 font-medium">Treatment</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {risks.map((r: any) => (
              <tr key={r.id} className="transition-colors hover:bg-zinc-800/30">
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-200">{r.title}</p>
                  {r.threat && <p className="mt-0.5 text-xs text-zinc-500">{r.threat}</p>}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-400">{r.asset ?? '\u2014'}</td>
                <td className="px-4 py-3 text-xs text-zinc-400">{r.likelihood ?? '\u2014'}</td>
                <td className="px-4 py-3 text-xs text-zinc-400">{r.impact ?? '\u2014'}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${RISK_COLORS(r.inherentRisk)}`}>{r.inherentRisk ?? '\u2014'}</span></td>
                <td className="px-4 py-3 text-xs text-zinc-400">{r.treatment ?? '\u2014'}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r.status === 'open' ? 'bg-red-500/10 text-red-400' : r.status === 'mitigated' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-500/10 text-zinc-400'}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
