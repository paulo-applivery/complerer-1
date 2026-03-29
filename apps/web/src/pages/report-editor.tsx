import { useState, useCallback, useRef } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import {
  ReportEditor,
  EditorToolbar,
  SectionOutline,
  BlockConfigPanel,
} from '@complerer/reports'
import {
  useReport,
  useUpdateReport,
  useSubmitForReview,
  useApproveReport,
  useRejectReport,
  usePublishReport,
  useExportPDF,
  useReportFindings,
  useCreateFinding,
} from '@/hooks/use-reports'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-zinc-700 text-zinc-300',
  review: 'bg-amber-400/10 text-amber-400',
  approved: 'bg-emerald-400/10 text-emerald-400',
  published: 'bg-blue-400/10 text-blue-400',
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-400/10 text-red-400',
  high: 'bg-orange-400/10 text-orange-400',
  medium: 'bg-amber-400/10 text-amber-400',
  low: 'bg-blue-400/10 text-blue-400',
  informational: 'bg-zinc-700 text-zinc-400',
}

export function ReportEditorPage() {
  const params = useParams({ strict: false }) as { workspaceId?: string; reportId?: string }
  const { workspaceId, reportId } = params
  const { report, isLoading } = useReport(workspaceId, reportId)
  const updateMut = useUpdateReport(workspaceId)
  const submitMut = useSubmitForReview(workspaceId)
  const approveMut = useApproveReport(workspaceId)
  const rejectMut = useRejectReport(workspaceId)
  const publishMut = usePublishReport(workspaceId)
  const exportMut = useExportPDF(workspaceId)
  const { findings } = useReportFindings(workspaceId, reportId)
  const createFindingMut = useCreateFinding(workspaceId)

  const [editor, setEditor] = useState<any>(null)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [showFindings, setShowFindings] = useState(false)
  const [showOutline, setShowOutline] = useState(true)
  const savingRef = useRef(false)

  const handleUpdate = useCallback(
    (json: Record<string, unknown>) => {
      if (!reportId || savingRef.current) return
      savingRef.current = true
      updateMut.mutate(
        { reportId, content: JSON.stringify(json) },
        { onSettled: () => { savingRef.current = false; setLastSaved(new Date().toLocaleTimeString()) } }
      )
    },
    [reportId, updateMut]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-primary-400" />
      </div>
    )
  }

  const content = report?.content ? tryParseJSON(report.content) : undefined
  const status = report?.status || 'draft'
  const isLocked = status === 'approved' || status === 'published'

  return (
    <div className="flex flex-col gap-4">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/w/$workspaceId/reports" params={{ workspaceId: workspaceId! }}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Reports</Link>
          <span className="text-zinc-700">/</span>
          <h1 className="text-sm font-medium text-zinc-100">{report?.name || 'Untitled Report'}</h1>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>{status}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {updateMut.isPending && <span className="text-zinc-500">Saving...</span>}
          {lastSaved && !updateMut.isPending && <span className="text-zinc-600">Saved {lastSaved}</span>}
        </div>
      </div>

      {/* Approval Workflow Bar */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2">
        <div className="flex items-center gap-3">
          {isLocked && <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">Read-only</span>}
          <span className="text-xs text-zinc-500">{findings.length} finding{findings.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFindings(!showFindings)}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-[11px] text-zinc-300 hover:border-zinc-600">
            {showFindings ? 'Hide' : 'Show'} Findings
          </button>
          <button onClick={() => reportId && exportMut.mutate(reportId)} disabled={exportMut.isPending}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-[11px] text-zinc-300 hover:border-zinc-600 disabled:opacity-40">
            {exportMut.isPending ? 'Exporting...' : 'Export PDF'}
          </button>

          {status === 'draft' && (
            <button onClick={() => reportId && submitMut.mutate({ reportId })} disabled={submitMut.isPending}
              className="rounded-lg bg-primary-400 px-3 py-1.5 text-[11px] font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-40">
              {submitMut.isPending ? 'Submitting...' : 'Submit for Review'}
            </button>
          )}
          {status === 'review' && (
            <>
              <button onClick={() => reportId && rejectMut.mutate({ reportId })} disabled={rejectMut.isPending}
                className="rounded-lg border border-red-500/30 px-3 py-1.5 text-[11px] text-red-400 hover:border-red-500/50 disabled:opacity-40">
                Return
              </button>
              <button onClick={() => reportId && approveMut.mutate({ reportId })} disabled={approveMut.isPending}
                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-400 disabled:opacity-40">
                {approveMut.isPending ? 'Approving...' : 'Approve'}
              </button>
            </>
          )}
          {status === 'approved' && (
            <button onClick={() => reportId && publishMut.mutate(reportId)} disabled={publishMut.isPending}
              className="rounded-lg bg-blue-500 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-blue-400 disabled:opacity-40">
              {publishMut.isPending ? 'Publishing...' : 'Publish'}
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowOutline(!showOutline)}
          className={`rounded-lg px-2.5 py-1.5 text-[11px] transition-colors ${showOutline ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}
          title={showOutline ? 'Hide outline' : 'Show outline'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="9" y1="9" x2="21" y2="9"/><line x1="9" y1="15" x2="21" y2="15"/></svg>
        </button>
        <div className="flex-1"><EditorToolbar editor={editor} /></div>
      </div>

      {/* Editor layout */}
      <div className="flex gap-4">
        {showOutline && (
          <div className="shrink-0 w-56 border-r border-zinc-800 pr-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
            <SectionOutline editor={editor} />
          </div>
        )}

        <ReportEditor
          content={content}
          mode="report"
          onUpdate={handleUpdate}
          onSelectionUpdate={(ed: any) => setEditor(ed)}
          editable={!isLocked}
        />

        <div className="flex flex-col gap-4">
          <BlockConfigPanel editor={editor} />

          {/* Findings Panel */}
          {showFindings && (
            <div className="w-64 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Findings</p>
                <button onClick={() => reportId && createFindingMut.mutate({ reportId, severity: 'medium', findingType: 'deficiency', title: 'New Finding' })}
                  className="rounded px-2 py-0.5 text-[10px] text-primary-400 hover:bg-zinc-800">+ Add</button>
              </div>
              {findings.length === 0 ? (
                <p className="text-xs text-zinc-600">No findings yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {findings.map((f: any) => (
                    <div key={f.id} className="rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`rounded px-1 py-px text-[9px] font-bold uppercase ${SEVERITY_STYLES[f.severity] || ''}`}>
                          {f.severity}
                        </span>
                        <span className="truncate text-[10px] text-zinc-300">{f.title}</span>
                      </div>
                      <span className="text-[9px] text-zinc-600">{f.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function tryParseJSON(str: string): Record<string, unknown> | undefined {
  try { return JSON.parse(str) } catch { return undefined }
}
