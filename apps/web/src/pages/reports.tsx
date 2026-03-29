import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { FileAttachmentIcon, Cancel01Icon, ArrowRight01Icon, ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { useReports, useReportTemplates, useReportTemplateLibrary, useAdoptReportTemplates, useCreateReport } from '@/hooks/use-reports'

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-zinc-700', text: 'text-zinc-300', label: 'Draft' },
  review: { bg: 'bg-amber-400/10', text: 'text-amber-400', label: 'In Review' },
  approved: { bg: 'bg-emerald-400/10', text: 'text-emerald-400', label: 'Approved' },
  published: { bg: 'bg-blue-400/10', text: 'text-blue-400', label: 'Published' },
}

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'In Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Published' },
]

export function ReportsPage() {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const { workspaceId } = params
  const navigate = useNavigate()
  const { reports, isLoading } = useReports(workspaceId)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)

  const filtered = reports.filter((r: any) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Reports</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Generate certification-grade audit reports from your compliance data.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-primary-400 px-4 py-2 text-xs font-medium text-zinc-950 transition-colors hover:bg-primary-300"
        >
          New Report
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
          placeholder="Search reports..."
          className="w-64 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-primary-400 focus:outline-none"
        />
        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === f.value ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-20">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-400/10">
            <HugeiconsIcon icon={FileAttachmentIcon} className="h-6 w-6 text-primary-400" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-zinc-100">
            {reports.length === 0 ? 'No reports yet' : 'No matching reports'}
          </h2>
          <p className="mt-2 max-w-md text-center text-sm text-zinc-500">
            {reports.length === 0
              ? 'Create your first report from a template to get started with SOC 2, ISO 27001, GDPR, or ENS certification reports.'
              : 'Try adjusting your search or filters.'}
          </p>
          {reports.length === 0 && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 rounded-lg bg-primary-400 px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-primary-300"
            >
              Create First Report
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((report: any) => {
            const sty = STATUS_STYLES[report.status] || STATUS_STYLES.draft
            return (
              <button
                key={report.id}
                onClick={() =>
                  navigate({
                    to: '/w/$workspaceId/reports/$reportId/edit',
                    params: { workspaceId: workspaceId!, reportId: report.id },
                  })
                }
                className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left transition-all hover:border-zinc-700 hover:bg-zinc-800/50"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-medium text-zinc-100">{report.name}</h3>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${sty.bg} ${sty.text}`}>
                    {sty.label}
                  </span>
                </div>
                {report.auditPeriodStart && report.auditPeriodEnd && (
                  <p className="mt-2 text-xs text-zinc-500">
                    {report.auditPeriodStart} — {report.auditPeriodEnd}
                  </p>
                )}
                <p className="mt-auto pt-3 text-[10px] text-zinc-600">
                  Updated {new Date(report.updatedAt).toLocaleDateString()}
                </p>
              </button>
            )
          })}
        </div>
      )}

      {showCreate && <CreateReportModal workspaceId={workspaceId!} onClose={() => setShowCreate(false)} />}
    </div>
  )
}

// ── Create Report Modal (Multi-step wizard) ────────────────────────────────

function CreateReportModal({ workspaceId, onClose }: { workspaceId: string; onClose: () => void }) {
  const navigate = useNavigate()
  const { templates } = useReportTemplates(workspaceId)
  const { libraryTemplates } = useReportTemplateLibrary(workspaceId)
  const adoptMut = useAdoptReportTemplates(workspaceId)
  const createMut = useCreateReport(workspaceId)

  const [step, setStep] = useState(1)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [name, setName] = useState('')
  const [auditPeriodStart, setAuditPeriodStart] = useState('')
  const [auditPeriodEnd, setAuditPeriodEnd] = useState('')

  // Merge workspace templates with unadopted library templates
  const adoptedLibraryIds = new Set(templates.filter((t: any) => t.template_library_id).map((t: any) => t.template_library_id))
  const unadoptedLibrary = libraryTemplates.filter((lt: any) => !adoptedLibraryIds.has(lt.id))
  const allTemplates = [...templates, ...unadoptedLibrary.map((lt: any) => ({ ...lt, _isLibrary: true }))]

  const selectedTemplate = allTemplates.find((t: any) => t.id === selectedTemplateId)

  const handleCreate = async () => {
    let templateId = selectedTemplateId

    // If selecting a library template, adopt it first
    if (selectedTemplate?._isLibrary) {
      await adoptMut.mutateAsync([selectedTemplateId])
      // Re-fetch to get the workspace template ID
      // For now, use the library ID — the API handles adoption
    }

    // Find the workspace template ID for library-adopted templates
    const wsTemplate = templates.find((t: any) => t.template_library_id === selectedTemplateId)
    if (wsTemplate) templateId = wsTemplate.id

    const result = await createMut.mutateAsync({
      templateId,
      name,
      auditPeriodStart: auditPeriodStart || undefined,
      auditPeriodEnd: auditPeriodEnd || undefined,
    }) as any

    if (result?.id) {
      navigate({ to: '/w/$workspaceId/reports/$reportId/edit', params: { workspaceId, reportId: result.id } })
    }
    onClose()
  }

  const inputClass = 'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-primary-400 focus:outline-none'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-100">New Report</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300">
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 px-6 pt-4">
          {[1, 2].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary-400' : 'bg-zinc-800'}`} />
          ))}
        </div>

        <div className="px-6 py-5">
          {step === 1 && (
            <div>
              <p className="mb-3 text-sm font-medium text-zinc-200">Select a template</p>
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {allTemplates.length === 0 ? (
                  <p className="py-4 text-center text-xs text-zinc-500">No templates available. Add templates from the admin library.</p>
                ) : (
                  allTemplates.map((t: any) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTemplateId(t.id)
                        setName(t.name || '')
                      }}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                        selectedTemplateId === t.id
                          ? 'border-primary-400/40 bg-primary-400/5'
                          : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-sm">
                        <HugeiconsIcon icon={FileAttachmentIcon} size={16} className="text-zinc-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-zinc-100">{t.name}</p>
                        {t.description && <p className="mt-0.5 text-[10px] text-zinc-500 line-clamp-2">{t.description}</p>}
                        <div className="mt-1 flex items-center gap-2">
                          {(t.framework_slug || t.frameworkSlug) && (
                            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-400">
                              {t.framework_slug || t.frameworkSlug}
                            </span>
                          )}
                          {t._isLibrary && (
                            <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[9px] text-amber-400">Library</span>
                          )}
                          {(t.category) && (
                            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-400">{t.category}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Report Name</label>
                <input type="text" value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} placeholder="e.g. SOC 2 Type II — 2025" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Audit Period Start</label>
                  <input type="date" value={auditPeriodStart} onChange={(e) => setAuditPeriodStart((e.target as HTMLInputElement).value)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Audit Period End</label>
                  <input type="date" value={auditPeriodEnd} onChange={(e) => setAuditPeriodEnd((e.target as HTMLInputElement).value)} className={inputClass} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-4">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="flex items-center gap-1 rounded-lg border border-zinc-700 px-4 py-2 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
            {step > 1 ? 'Back' : 'Cancel'}
          </button>

          {step < 2 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!selectedTemplateId}
              className="flex items-center gap-1 rounded-lg bg-primary-400 px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-40"
            >
              Next <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={!name.trim() || createMut.isPending}
              className="rounded-lg bg-primary-400 px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-40"
            >
              {createMut.isPending ? 'Creating...' : 'Create Report'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
