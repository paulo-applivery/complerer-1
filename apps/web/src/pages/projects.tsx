import { useState, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  PlusSignIcon,
  Cancel01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Shield01Icon,
  Layers01Icon,
  FileValidationIcon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Folder01Icon,
  Alert02Icon,
  Search01Icon,
  Settings01Icon,
} from '@hugeicons/core-free-icons'
import { useProjects, useCreateProject, type Project } from '@/hooks/use-projects'
import { useFrameworks, useFrameworkVersions } from '@/hooks/use-frameworks'

// ── Status Config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  planning: { label: 'Planning', color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
  in_progress: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  audit_ready: { label: 'Audit Ready', color: 'text-green-400', bg: 'bg-green-500/10' },
  in_audit: { label: 'In Audit', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  archived: { label: 'Archived', color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function daysUntil(d: string | null): string | null {
  if (!d) return null
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff === 0) return 'Today'
  return `${diff}d left`
}

// ── Project Card ───────────────────────────────────────────────────────

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const sc = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.planning
  const coverage = project.controlsTotal > 0
    ? Math.round((project.controlsCovered / project.controlsTotal) * 100)
    : 0
  const deadline = daysUntil(project.targetCompletionDate)

  return (
    <button
      onClick={onClick}
      className="group w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-left transition-all hover:border-zinc-700 hover:bg-zinc-800/50 hover:shadow-lg hover:shadow-zinc-950/50"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-md bg-primary-400/10 px-2 py-0.5 text-[10px] font-semibold text-primary-400">
              {project.frameworkName}
            </span>
            <span className="text-[10px] text-zinc-500">v{project.frameworkVersion}</span>
          </div>
          <h3 className="text-base font-semibold text-zinc-100 group-hover:text-white truncate">
            {project.name}
          </h3>
          {project.description && (
            <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{project.description}</p>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${sc.bg} ${sc.color}`}>
          {sc.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-zinc-400">Coverage</span>
          <span className="text-xs font-semibold text-zinc-200">{coverage}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              coverage >= 80 ? 'bg-green-400' : coverage >= 50 ? 'bg-amber-400' : coverage > 0 ? 'bg-blue-400' : 'bg-zinc-700'
            }`}
            style={{ width: `${Math.max(coverage, 1)}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <HugeiconsIcon icon={Shield01Icon} size={12} className="text-zinc-500" />
          <span className="text-zinc-400">
            <span className="font-medium text-zinc-200">{project.controlsCovered}</span>/{project.controlsTotal} controls
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <HugeiconsIcon icon={FileValidationIcon} size={12} className="text-zinc-500" />
          <span className="text-zinc-400">{project.evidenceCount} evidence</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3">
        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
          {project.auditPeriodStart && (
            <span>{formatDate(project.auditPeriodStart)} → {formatDate(project.auditPeriodEnd)}</span>
          )}
          {project.auditorFirm && (
            <span>Auditor: {project.auditorFirm}</span>
          )}
        </div>
        {deadline && (
          <span className={`text-[10px] font-medium ${deadline.includes('overdue') ? 'text-red-400' : 'text-zinc-400'}`}>
            {deadline}
          </span>
        )}
      </div>
    </button>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────

export function ProjectsPage() {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const workspaceId = params.workspaceId
  const navigate = useNavigate()

  const { projects, isLoading } = useProjects(workspaceId)
  const [showWizard, setShowWizard] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = statusFilter
    ? projects.filter(p => p.status === statusFilter)
    : projects

  const activeCount = projects.filter(p => !['completed', 'archived'].includes(p.status)).length
  const totalControls = projects.reduce((s, p) => s + p.controlsTotal, 0)
  const totalCovered = projects.reduce((s, p) => s + p.controlsCovered, 0)
  const avgCoverage = totalControls > 0 ? Math.round((totalCovered / totalControls) * 100) : 0

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 animate-pulse rounded-xl bg-zinc-800" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-800" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => <div key={i} className="h-64 animate-pulse rounded-xl bg-zinc-800" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Compliance Projects</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Track certification efforts across frameworks with dedicated progress tracking.
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-primary-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-primary-300 hover:shadow-lg hover:shadow-primary-400/20"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} />
          New Project
        </button>
      </div>

      {/* Stats */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500">Active Projects</p>
            <p className="mt-1 text-2xl font-bold text-zinc-100">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500">Total Controls</p>
            <p className="mt-1 text-2xl font-bold text-zinc-100">{totalControls}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500">Average Coverage</p>
            <p className="mt-1 text-2xl font-bold text-zinc-100">{avgCoverage}%</p>
          </div>
        </div>
      )}

      {/* Filter */}
      {projects.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          <button onClick={() => setStatusFilter('')} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${!statusFilter ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>
            All ({projects.length})
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, val]) => {
            const count = projects.filter(p => p.status === key).length
            if (count === 0) return null
            return (
              <button key={key} onClick={() => setStatusFilter(statusFilter === key ? '' : key)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === key ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {val.label} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Projects Grid */}
      {filtered.length === 0 && projects.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-400/10">
            <HugeiconsIcon icon={Folder01Icon} size={28} className="text-primary-400" />
          </div>
          <h2 className="mt-6 text-lg font-semibold text-zinc-100">No compliance projects yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
            Create your first compliance project to start tracking a certification effort.
            Each project is scoped to a specific framework and audit period.
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-400 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-primary-300 hover:shadow-lg hover:shadow-primary-400/20"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={16} />
            Create First Project
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-500">No projects match this filter.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => navigate({ to: '/w/$workspaceId/projects/$projectId', params: { workspaceId: workspaceId!, projectId: project.id } })}
            />
          ))}
        </div>
      )}

      {/* Wizard Modal */}
      {showWizard && (
        <NewProjectWizard workspaceId={workspaceId} onClose={() => setShowWizard(false)} />
      )}
    </div>
  )
}

// ── New Project Wizard ─────────────────────────────────────────────────

function NewProjectWizard({ workspaceId, onClose }: { workspaceId: string | undefined; onClose: () => void }) {
  const navigate = useNavigate()
  const createMutation = useCreateProject(workspaceId)
  const { frameworks, isLoading: fwLoading } = useFrameworks(workspaceId)

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    description: '',
    auditorName: '',
    auditorFirm: '',
    frameworkId: '',
    frameworkVersionId: '',
    auditPeriodStart: '',
    auditPeriodEnd: '',
    targetCompletionDate: '',
  })

  // Fetch versions when framework selected
  const { versions } = useFrameworkVersions(workspaceId, frameworks.find(f => f.id === form.frameworkId)?.slug ?? '')

  // Auto-select latest version
  useEffect(() => {
    if (versions.length > 0 && !form.frameworkVersionId) {
      setForm(prev => ({ ...prev, frameworkVersionId: versions[0].id }))
    }
  }, [versions, form.frameworkVersionId])

  const handleCreate = () => {
    createMutation.mutate(
      {
        name: form.name,
        description: form.description || undefined,
        frameworkId: form.frameworkId,
        frameworkVersionId: form.frameworkVersionId,
        auditorName: form.auditorName || undefined,
        auditorFirm: form.auditorFirm || undefined,
        auditPeriodStart: form.auditPeriodStart || undefined,
        auditPeriodEnd: form.auditPeriodEnd || undefined,
        targetCompletionDate: form.targetCompletionDate || undefined,
      },
      {
        onSuccess: (data: any) => {
          onClose()
          if (data?.project?.id) {
            navigate({ to: '/w/$workspaceId/projects/$projectId', params: { workspaceId: workspaceId!, projectId: data.project.id } })
          }
        },
      }
    )
  }

  const canProceed = step === 1 ? form.name.trim() : step === 2 ? form.frameworkId && form.frameworkVersionId : true

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">New Compliance Project</h3>
            <p className="mt-0.5 text-xs text-zinc-500">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1 px-6 pt-4">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary-400' : 'bg-zinc-800'}`} />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-200">Project Name *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. SOC 2 Type II — 2025" autoFocus className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-200">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="What is this certification effort about?" rows={2} className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-200">Auditor Name</label>
                  <input value={form.auditorName} onChange={e => setForm({...form, auditorName: e.target.value})} placeholder="John Smith" className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-200">Audit Firm</label>
                  <input value={form.auditorFirm} onChange={e => setForm({...form, auditorFirm: e.target.value})} placeholder="Deloitte" className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">Select the framework for this certification project.</p>
              {fwLoading ? (
                <div className="py-8 text-center text-xs text-zinc-500">Loading frameworks...</div>
              ) : (
                <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
                  {frameworks.map(fw => {
                    const selected = form.frameworkId === fw.id
                    return (
                      <button
                        key={fw.id}
                        onClick={() => setForm({...form, frameworkId: fw.id, frameworkVersionId: ''})}
                        className={`w-full rounded-xl border p-4 text-left transition-all ${
                          selected ? 'border-primary-400 bg-primary-400/5' : 'border-zinc-800 bg-zinc-800/50 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-zinc-100">{fw.name}</p>
                            {fw.description && <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">{fw.description}</p>}
                          </div>
                          {selected && <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} className="text-primary-400" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
              {form.frameworkId && versions.length > 0 && (
                <div className="mt-3">
                  <label className="mb-1 block text-xs text-zinc-400">Version</label>
                  <select value={form.frameworkVersionId} onChange={e => setForm({...form, frameworkVersionId: e.target.value})} className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none">
                    {versions.map(v => <option key={v.id} value={v.id}>v{v.version} ({v.status})</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">Set the audit period and target completion date.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-200">Audit Period Start</label>
                  <input type="date" value={form.auditPeriodStart} onChange={e => setForm({...form, auditPeriodStart: e.target.value})} className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-200">Audit Period End</label>
                  <input type="date" value={form.auditPeriodEnd} onChange={e => setForm({...form, auditPeriodEnd: e.target.value})} className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-200">Target Completion</label>
                <input type="date" value={form.targetCompletionDate} onChange={e => setForm({...form, targetCompletionDate: e.target.value})} className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" />
              </div>

              {/* Summary */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
                <p className="text-xs font-semibold text-zinc-300 mb-2">Summary</p>
                <div className="space-y-1 text-xs text-zinc-400">
                  <p><span className="text-zinc-500">Project:</span> {form.name}</p>
                  <p><span className="text-zinc-500">Framework:</span> {frameworks.find(f => f.id === form.frameworkId)?.name ?? '—'}</p>
                  {form.auditorFirm && <p><span className="text-zinc-500">Auditor:</span> {form.auditorFirm}</p>}
                  {form.auditPeriodStart && <p><span className="text-zinc-500">Period:</span> {form.auditPeriodStart} → {form.auditPeriodEnd || '—'}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-4">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed}
              className="flex items-center gap-1.5 rounded-xl bg-primary-400 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-primary-300 disabled:opacity-50"
            >
              Continue <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="flex items-center gap-1.5 rounded-xl bg-primary-400 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-primary-300 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Project'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
