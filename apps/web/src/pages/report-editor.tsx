import { useState, useCallback, useRef } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import {
  ReportEditor,
  EditorToolbar,
  SectionOutline,
  BlockConfigPanel,
} from '@complerer/reports'
import { useReport, useUpdateReport } from '@/hooks/use-reports'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-zinc-700 text-zinc-300',
  review: 'bg-amber-400/10 text-amber-400',
  approved: 'bg-emerald-400/10 text-emerald-400',
  published: 'bg-blue-400/10 text-blue-400',
}

export function ReportEditorPage() {
  const params = useParams({ strict: false }) as { workspaceId?: string; reportId?: string }
  const { workspaceId, reportId } = params
  const { report, isLoading } = useReport(workspaceId, reportId)
  const updateMut = useUpdateReport(workspaceId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editor, setEditor] = useState<any>(null)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const savingRef = useRef(false)

  const handleUpdate = useCallback(
    (json: Record<string, unknown>) => {
      if (!reportId || savingRef.current) return
      savingRef.current = true
      updateMut.mutate(
        { reportId, content: JSON.stringify(json) },
        {
          onSettled: () => {
            savingRef.current = false
            setLastSaved(new Date().toLocaleTimeString())
          },
        }
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
          <Link
            to="/w/$workspaceId/reports"
            params={{ workspaceId: workspaceId! }}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Reports
          </Link>
          <span className="text-zinc-700">/</span>
          <h1 className="text-sm font-medium text-zinc-100">
            {report?.name || 'Untitled Report'}
          </h1>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
            {status}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          {updateMut.isPending && <span>Saving...</span>}
          {lastSaved && !updateMut.isPending && <span>Saved at {lastSaved}</span>}
          {isLocked && (
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
              Read-only
            </span>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor layout: outline | editor | config panel */}
      <div className="flex gap-4">
        <SectionOutline editor={editor} />

        <ReportEditor
          content={content}
          mode="report"
          onUpdate={handleUpdate}
          onSelectionUpdate={(ed) => setEditor(ed)}
          editable={!isLocked}
        />

        <BlockConfigPanel editor={editor} />
      </div>
    </div>
  )
}

function tryParseJSON(str: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(str)
  } catch {
    return undefined
  }
}
