import { useState, useRef } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Mail01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import {
  useAdminEmailTemplates,
  useAdminEmailTemplate,
  useUpdateEmailTemplate,
  usePreviewEmailTemplate,
} from '@/hooks/use-admin'

const categories = [
  { label: 'All', value: undefined },
  { label: 'Auth', value: 'auth' },
  { label: 'Notification', value: 'notification' },
  { label: 'Compliance', value: 'compliance' },
] as const

export function AdminEmailTemplatesPage() {
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: listData, isLoading } = useAdminEmailTemplates(categoryFilter)
  const { data: detailData } = useAdminEmailTemplate(selectedId)
  const updateTemplate = useUpdateEmailTemplate()
  const previewTemplate = usePreviewEmailTemplate()
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [editSubject, setEditSubject] = useState('')
  const [editBodyHtml, setEditBodyHtml] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  const templates = listData?.emailTemplates ?? []
  const template = detailData?.template

  // Sync editor state when template changes
  const lastLoadedId = useRef<string | null>(null)
  if (template && template.id !== lastLoadedId.current) {
    lastLoadedId.current = template.id
    setEditSubject(template.subject)
    setEditBodyHtml(template.bodyHtml ?? '')
    setHasChanges(false)
    setPreviewHtml(null)
  }

  const handleSave = () => {
    if (!selectedId) return
    updateTemplate.mutate({
      id: selectedId,
      subject: editSubject,
      bodyHtml: editBodyHtml,
    })
    setHasChanges(false)
  }

  const handlePreview = () => {
    if (!selectedId) return
    previewTemplate.mutate(selectedId, {
      onSuccess: (data) => setPreviewHtml(data.html),
    })
  }

  const handleToggleEnabled = () => {
    if (!selectedId || !template) return
    updateTemplate.mutate({ id: selectedId, enabled: !template.enabled })
  }

  // Group templates by category
  const grouped: Record<string, typeof templates> = {}
  for (const t of templates) {
    const cat = t.category
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(t)
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-6">
      {/* Left sidebar - template list */}
      <div className="w-72 shrink-0 space-y-4">
        <h1 className="text-2xl font-bold text-zinc-100">Email Templates</h1>

        {/* Category filter */}
        <div className="flex flex-wrap gap-1">
          {categories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setCategoryFilter(cat.value)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                categoryFilter === cat.value
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-zinc-500">Loading...</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                  {category}
                </p>
                <div className="space-y-0.5">
                  {items.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedId(t.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        selectedId === t.id
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                      }`}
                    >
                      <HugeiconsIcon icon={Mail01Icon} size={14} className="shrink-0" />
                      <span className="truncate">{t.name}</span>
                      {!t.enabled && (
                        <span className="ml-auto text-[10px] text-zinc-600">OFF</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right panel - editor */}
      <div className="flex-1 space-y-4">
        {template ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">{template.name}</h2>
                <p className="text-xs font-mono text-zinc-500">{template.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Enable/disable toggle */}
                <button
                  onClick={handleToggleEnabled}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    template.enabled ? 'bg-primary-400' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      template.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Subject</label>
              <input
                type="text"
                value={editSubject}
                onChange={(e) => { setEditSubject(e.target.value); setHasChanges(true) }}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-700"
              />
            </div>

            {/* Body HTML */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Body HTML</label>
              <textarea
                value={editBodyHtml}
                onChange={(e) => { setEditBodyHtml(e.target.value); setHasChanges(true) }}
                rows={14}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-xs text-zinc-300 outline-none focus:border-zinc-700"
              />
            </div>

            {/* Variables */}
            {template.variables.length > 0 && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Variables</label>
                <div className="flex flex-wrap gap-1.5">
                  {template.variables.map((v) => (
                    <span
                      key={v}
                      className="rounded-lg bg-zinc-800 px-2 py-1 text-xs font-mono text-primary-400"
                    >
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="rounded-xl bg-primary-400 px-5 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-primary-400/90 disabled:opacity-40"
              >
                Save changes
              </button>
              <button
                onClick={handlePreview}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                <HugeiconsIcon icon={ViewIcon} size={14} />
                Preview
              </button>
            </div>

            {/* Preview panel */}
            {previewHtml && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-zinc-400">Preview (with sample data)</p>
                  <button
                    onClick={() => setPreviewHtml(null)}
                    className="text-xs text-zinc-600 hover:text-zinc-400"
                  >
                    Close
                  </button>
                </div>
                <div className="overflow-hidden rounded-xl border border-zinc-800">
                  <iframe
                    srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="background:#09090b;margin:0;padding:20px;">${previewHtml}</body></html>`}
                    className="h-[400px] w-full"
                    title="Email preview"
                    sandbox=""
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
            <p className="text-sm text-zinc-500">Select a template to edit</p>
          </div>
        )}
      </div>
    </div>
  )
}
