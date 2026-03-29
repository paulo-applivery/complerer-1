import { useState, useCallback } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ReportEditor, EditorToolbar, SectionOutline, BlockConfigPanel } from '@complerer/reports'

export function AdminReportTemplateEditorPage() {
  const params = useParams({ strict: false }) as { templateId?: string }
  const templateId = params.templateId
  const qc = useQueryClient()

  const { data: template, isLoading } = useQuery<any>({
    queryKey: ['admin-library-report', templateId],
    queryFn: () => api.get(`/admin/libraries/reports`).then((r: any) => r.items?.find((i: any) => i.id === templateId)),
    enabled: !!templateId,
  })

  const updateMut = useMutation({
    mutationFn: (data: any) => api.put(`/admin/libraries/reports/${templateId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-library-report', templateId] }),
  })

  const [editor, setEditor] = useState<any>(null)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [nameInit, setNameInit] = useState(false)

  // Initialize form from template data
  if (template && !nameInit) {
    setName(template.name || '')
    setDescription(template.description || '')
    setNameInit(true)
  }

  const handleContentUpdate = useCallback(
    (json: Record<string, unknown>) => {
      if (!templateId) return
      updateMut.mutate({ content: JSON.stringify(json) }, {
        onSuccess: () => setLastSaved(new Date().toLocaleTimeString()),
      })
    },
    [templateId, updateMut]
  )

  const handleSaveMeta = () => {
    if (!templateId) return
    updateMut.mutate({ name, description }, {
      onSuccess: () => setLastSaved(new Date().toLocaleTimeString()),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-primary-400" />
      </div>
    )
  }

  if (!template) {
    return <p className="text-zinc-500 py-10 text-center">Template not found</p>
  }

  const content = template.content ? tryParseJSON(template.content) : undefined

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/libraries" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            Libraries
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-xs text-zinc-500">Report Templates</span>
          <span className="text-zinc-700">/</span>
          <h1 className="text-sm font-medium text-zinc-100">{template.name}</h1>
          <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-400">Template Mode</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {updateMut.isPending && <span className="text-zinc-500">Saving...</span>}
          {lastSaved && !updateMut.isPending && <span className="text-zinc-600">Saved {lastSaved}</span>}
        </div>
      </div>

      {/* Template metadata */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName((e.target as HTMLInputElement).value)}
            onBlur={handleSaveMeta}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription((e.target as HTMLInputElement).value)}
            onBlur={handleSaveMeta}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div className="shrink-0 pt-5">
          <span className="rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400">
            {template.framework_slug || 'No framework'}
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor in template mode */}
      <div className="flex gap-4">
        <SectionOutline editor={editor} />
        <ReportEditor
          content={content}
          mode="template"
          placeholder="Edit template content... Variables appear as chips. Type / for commands."
          onUpdate={handleContentUpdate}
          onSelectionUpdate={(ed: any) => setEditor(ed)}
          editable={true}
        />
        <BlockConfigPanel editor={editor} />
      </div>
    </div>
  )
}

function tryParseJSON(str: string): Record<string, unknown> | undefined {
  try { return JSON.parse(str) } catch { return undefined }
}
