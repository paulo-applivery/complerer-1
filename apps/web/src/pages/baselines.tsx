import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams } from '@tanstack/react-router'
import { createPortal } from 'react-dom'
import {
  useBaselines,
  useCreateBaseline,
  useUpdateBaseline,
  useDeleteBaseline,
  useBaselineViolations,
  useResolveViolation,
  useExemptViolation,
  useBaselineLibrary,
  useAddFromBaselineLibrary,
} from '@/hooks/use-settings'
import {
  useBaselineControls,
  useLinkBaselineControl,
  useUnlinkBaselineControl,
} from '@/hooks/use-compliance'
import { useAdoptions } from '@/hooks/use-frameworks'
import { api } from '@/lib/api'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Shield01Icon,
  PlusSignIcon,
  Cancel01Icon,
  LoaderPinwheelIcon,
  CheckmarkCircle01Icon,
  Alert02Icon,
  ToggleOnIcon,
  ToggleOffIcon,
  Search01Icon,
  ClipboardIcon,
  Edit01Icon,
  Delete02Icon,
} from '@hugeicons/core-free-icons'

type Tab = 'rules' | 'violations'

export function BaselinesPage() {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const workspaceId = params.workspaceId
  const [activeTab, setActiveTab] = useState<Tab>('rules')

  const tabs: { id: Tab; label: string; icon: typeof Shield01Icon }[] = [
    { id: 'rules', label: 'Baseline Rules', icon: Shield01Icon },
    { id: 'violations', label: 'Violations', icon: Alert02Icon },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Baselines</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Define configuration baselines and track violations across your environment.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <HugeiconsIcon icon={tab.icon} size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'rules' && <BaselineRulesSection workspaceId={workspaceId} />}
      {activeTab === 'violations' && <ViolationsSection workspaceId={workspaceId} />}
    </div>
  )
}

// ── Baseline Rules Section ──────────────────────────────────────────────────

function BaselineRulesSection({ workspaceId }: { workspaceId: string | undefined }) {
  const { baselines, isLoading } = useBaselines(workspaceId)
  const createMutation = useCreateBaseline(workspaceId)
  const updateMutation = useUpdateBaseline(workspaceId)
  const deleteMutation = useDeleteBaseline(workspaceId)
  const { library, isLoading: libLoading } = useBaselineLibrary(workspaceId)
  const addFromLibrary = useAddFromBaselineLibrary(workspaceId)
  const [mode, setMode] = useState<'none' | 'manual' | 'library'>('none')
  const [selectedLibIds, setSelectedLibIds] = useState<Set<string>>(new Set())
  const [libSearch, setLibSearch] = useState('')
  const [libCategoryFilter, setLibCategoryFilter] = useState('')
  const [libResult, setLibResult] = useState<{created: number; skipped: number} | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'access',
    severity: 'medium',
    ruleConfig: '',
  })

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', category: '', severity: '' })

  // Portal menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  const closeMenu = useCallback(() => setOpenMenuId(null), [])
  const openMenu = useCallback((id: string, btn: HTMLButtonElement) => {
    if (openMenuId === id) { closeMenu(); return }
    const rect = btn.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, left: rect.right - 170 })
    setOpenMenuId(id)
  }, [openMenuId, closeMenu])

  useEffect(() => {
    if (!openMenuId) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openMenuId, closeMenu])

  const startEdit = (b: any) => {
    setEditingId(b.id)
    setEditForm({ name: b.name, description: b.description ?? '', category: b.category, severity: b.severity })
    setOpenMenuId(null)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editForm.name.trim()) return
    updateMutation.mutate(
      { id: editingId, name: editForm.name, description: editForm.description || undefined, category: editForm.category, severity: editForm.severity },
      { onSuccess: () => setEditingId(null) }
    )
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this baseline? This cannot be undone.')) return
    deleteMutation.mutate(id)
    setOpenMenuId(null)
  }

  const existingNames = new Set(baselines.map((b: any) => b.name?.toLowerCase()))

  const BASELINE_CATEGORIES: Record<string, { label: string; color: string }> = {
    identity: { label: 'Identity & Access', color: 'bg-blue-500/10 text-blue-400' },
    data_protection: { label: 'Data Protection', color: 'bg-green-500/10 text-green-400' },
    network: { label: 'Network', color: 'bg-cyan-500/10 text-cyan-400' },
    endpoint: { label: 'Endpoint', color: 'bg-purple-500/10 text-purple-400' },
    logging: { label: 'Logging', color: 'bg-amber-500/10 text-amber-400' },
    application: { label: 'Application', color: 'bg-orange-500/10 text-orange-400' },
    continuity: { label: 'Continuity', color: 'bg-red-500/10 text-red-400' },
    governance: { label: 'Governance', color: 'bg-indigo-500/10 text-indigo-400' },
  }

  const libCategories = Array.from(new Set(library.map((b: any) => b.category)))
  const filteredLib = library.filter((b: any) => {
    const matchSearch = !libSearch || b.name.toLowerCase().includes(libSearch.toLowerCase()) || b.description?.toLowerCase().includes(libSearch.toLowerCase())
    const matchCat = !libCategoryFilter || b.category === libCategoryFilter
    return matchSearch && matchCat
  })

  const toggleLibSelect = (id: string) => {
    setSelectedLibIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleAddFromLibrary = () => {
    addFromLibrary.mutate(
      { libraryIds: Array.from(selectedLibIds) },
      {
        onSuccess: (data: any) => {
          setLibResult({ created: data.created, skipped: data.skipped })
          setSelectedLibIds(new Set())
        }
      }
    )
  }

  const handleSubmit = () => {
    if (!form.name.trim()) return
    createMutation.mutate(
      {
        name: form.name,
        description: form.description || undefined,
        category: form.category,
        severity: form.severity,
        ruleConfig: form.ruleConfig || undefined,
      },
      {
        onSuccess: () => {
          setForm({ name: '', description: '', category: 'access', severity: 'medium', ruleConfig: '' })
          setMode('none')
        },
      },
    )
  }

  const handleToggle = (id: string, currentEnabled: boolean) => {
    updateMutation.mutate({ id, enabled: !currentEnabled })
  }

  const severityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-400'
      case 'high':
        return 'bg-amber-500/10 text-amber-400'
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400'
      case 'low':
        return 'bg-primary-400/10 text-primary-400'
      default:
        return 'bg-zinc-500/10 text-zinc-400'
    }
  }

  const categoryBadge = (category: string) => {
    switch (category) {
      case 'access':
        return 'bg-blue-500/10 text-blue-400'
      case 'review':
        return 'bg-purple-500/10 text-purple-400'
      case 'authentication':
        return 'bg-cyan-500/10 text-cyan-400'
      case 'change_management':
        return 'bg-orange-500/10 text-orange-400'
      default:
        return 'bg-zinc-500/10 text-zinc-400'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <HugeiconsIcon icon={LoaderPinwheelIcon} size={20} className="animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Baseline Rules</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode(mode === 'library' ? 'none' : 'library')}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'library' ? 'border-primary-400/30 bg-primary-400/10 text-primary-400' : 'border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100'
            }`}
          >
            <HugeiconsIcon icon={ClipboardIcon} size={16} />
            Browse Library
          </button>
          <button
            onClick={() => setMode(mode === 'manual' ? 'none' : 'manual')}
            className="flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300"
          >
            {mode === 'manual' ? <HugeiconsIcon icon={Cancel01Icon} size={16} /> : <HugeiconsIcon icon={PlusSignIcon} size={16} />}
            {mode === 'manual' ? 'Cancel' : 'Add Custom'}
          </button>
        </div>
      </div>

      {mode === 'manual' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-100">New Baseline Rule</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="e.g. MFA Required for Admin"
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
                <option value="review">Review</option>
                <option value="authentication">Authentication</option>
                <option value="change_management">Change Management</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Severity</label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="mb-1 block text-xs text-zinc-400">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="Describe what this baseline rule checks..."
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="mb-1 block text-xs text-zinc-400">Rule Configuration (JSON)</label>
              <textarea
                value={form.ruleConfig}
                onChange={(e) => setForm({ ...form, ruleConfig: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder='{"check": "mfa_enabled", "scope": "admin_roles"}'
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!form.name.trim() || createMutation.isPending}
              className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Baseline'}
            </button>
          </div>
        </div>
      )}

      {mode === 'library' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Baseline Library</h3>
              <p className="mt-0.5 text-xs text-zinc-500">Select baselines to activate in your workspace</p>
            </div>
            {selectedLibIds.size > 0 && (
              <button
                onClick={handleAddFromLibrary}
                disabled={addFromLibrary.isPending}
                className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
              >
                {addFromLibrary.isPending ? 'Activating...' : `Activate ${selectedLibIds.size} baseline${selectedLibIds.size !== 1 ? 's' : ''}`}
              </button>
            )}
          </div>

          {libResult && (
            <div className="mb-4 rounded-lg border border-primary-400/20 bg-primary-400/5 p-3">
              <p className="text-xs text-primary-400">
                Activated {libResult.created} baseline{libResult.created !== 1 ? 's' : ''}
                {libResult.skipped > 0 && ` (${libResult.skipped} already existed)`}
              </p>
            </div>
          )}

          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={libSearch}
                onChange={(e) => setLibSearch(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="Search baselines..."
              />
            </div>
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setLibCategoryFilter('')} className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${!libCategoryFilter ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>All</button>
              {libCategories.map((cat: any) => {
                const info = BASELINE_CATEGORIES[cat] ?? { label: cat, color: 'bg-zinc-800 text-zinc-400' }
                return (
                  <button
                    key={cat}
                    onClick={() => setLibCategoryFilter(libCategoryFilter === cat ? '' : cat)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${libCategoryFilter === cat ? info.color : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {info.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 max-h-[400px] overflow-y-auto pr-1">
            {filteredLib.map((bl: any) => {
              const added = existingNames.has(bl.name?.toLowerCase())
              const selected = selectedLibIds.has(bl.id)
              const sevColor = bl.severity === 'critical' ? 'text-red-400' : bl.severity === 'high' ? 'text-orange-400' : bl.severity === 'medium' ? 'text-amber-400' : 'text-zinc-400'
              return (
                <button
                  key={bl.id}
                  onClick={() => !added && toggleLibSelect(bl.id)}
                  disabled={added}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    added ? 'border-zinc-800 bg-zinc-800/30 opacity-40 cursor-not-allowed'
                    : selected ? 'border-primary-400/50 bg-primary-400/5'
                    : 'border-zinc-800 bg-zinc-800/40 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-medium text-zinc-100 truncate">{bl.name}</p>
                    {added && <span className="shrink-0 text-[10px] text-zinc-500">Active</span>}
                    {selected && <span className="shrink-0 text-[10px] text-primary-400">&#10003;</span>}
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500 line-clamp-2">{bl.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-[10px] font-medium ${sevColor}`}>{bl.severity}</span>
                    <span className="text-[10px] text-zinc-600">&middot;</span>
                    <span className="text-[10px] text-zinc-500">{bl.check_type}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {filteredLib.length === 0 && (
            <p className="py-8 text-center text-xs text-zinc-500">No baselines match your search.</p>
          )}
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        {baselines.length === 0 ? (
          <div className="py-16 text-center">
            <HugeiconsIcon icon={Shield01Icon} size={40} className="mx-auto text-zinc-600" />
            <p className="mt-4 text-base font-medium text-zinc-300">No baseline rules yet</p>
            <p className="mt-1 text-sm text-zinc-500">Start by browsing the library or creating custom baselines.</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setMode('library')}
                className="flex items-center gap-2 rounded-lg bg-primary-400 px-5 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300"
              >
                <HugeiconsIcon icon={ClipboardIcon} size={16} />
                Browse Library
              </button>
              <button
                onClick={() => setMode('manual')}
                className="flex items-center gap-2 rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={16} />
                Add Custom Baseline
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="w-8 px-2 py-3"></th>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Severity</th>
                  <th className="px-5 py-3 font-medium text-center">Links</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="w-10 px-2 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {baselines.map((baseline) => {
                  const isEditing = editingId === baseline.id
                  return (
                    <BaselineRow key={baseline.id} baseline={baseline} isEditing={isEditing} editForm={editForm} setEditForm={setEditForm} handleSaveEdit={handleSaveEdit} setEditingId={setEditingId} updateMutation={updateMutation} categoryBadge={categoryBadge} severityBadge={severityBadge} openMenu={openMenu} workspaceId={workspaceId} />
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {openMenuId && createPortal(
          <div ref={menuRef} style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999 }} className="min-w-[170px] overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-2xl">
            {(() => {
              const bl = baselines.find(b => b.id === openMenuId)
              if (!bl) return null
              return (
                <>
                  <button onClick={() => startEdit(bl)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-300 transition-colors hover:bg-zinc-700/60">
                    <HugeiconsIcon icon={Edit01Icon} size={14} /> Edit
                  </button>
                  <button
                    onClick={() => {
                      updateMutation.mutate({ id: bl.id, enabled: !bl.enabled })
                      setOpenMenuId(null)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-300 transition-colors hover:bg-zinc-700/60"
                  >
                    <HugeiconsIcon icon={bl.enabled ? ToggleOffIcon : ToggleOnIcon} size={14} />
                    {bl.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <div className="my-1 border-t border-zinc-700/50" />
                  <button onClick={() => handleDelete(bl.id)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 transition-colors hover:bg-zinc-700/60">
                    <HugeiconsIcon icon={Delete02Icon} size={14} /> Delete
                  </button>
                </>
              )
            })()}
          </div>,
          document.body
        )}
      </div>
    </div>
  )
}

// ── Baseline Row with expand/collapse for linked controls ─────────────────────

function BaselineRow({ baseline, isEditing, editForm, setEditForm, handleSaveEdit, setEditingId, updateMutation, categoryBadge, severityBadge, openMenu, workspaceId }: {
  baseline: any
  isEditing: boolean
  editForm: any
  setEditForm: (f: any) => void
  handleSaveEdit: () => void
  setEditingId: (id: string | null) => void
  updateMutation: any
  categoryBadge: (c: string) => string
  severityBadge: (s: string) => string
  openMenu: (id: string, btn: HTMLButtonElement) => void
  workspaceId: string | undefined
}) {
  const [expanded, setExpanded] = useState(false)
  const { controls: linkedControls, isLoading: linkedLoading } = useBaselineControls(
    expanded ? workspaceId : undefined,
    expanded ? baseline.id : undefined
  )
  const unlinkMut = useUnlinkBaselineControl(workspaceId)
  const [showLinkDialog, setShowLinkDialog] = useState(false)

  const BASELINE_CATEGORIES: Record<string, { label: string; color: string }> = {
    identity: { label: 'Identity & Access', color: 'bg-blue-500/10 text-blue-400' },
    data_protection: { label: 'Data Protection', color: 'bg-green-500/10 text-green-400' },
    network: { label: 'Network', color: 'bg-cyan-500/10 text-cyan-400' },
    endpoint: { label: 'Endpoint', color: 'bg-purple-500/10 text-purple-400' },
    logging: { label: 'Logging', color: 'bg-amber-500/10 text-amber-400' },
    application: { label: 'Application', color: 'bg-orange-500/10 text-orange-400' },
    continuity: { label: 'Continuity', color: 'bg-red-500/10 text-red-400' },
    governance: { label: 'Governance', color: 'bg-indigo-500/10 text-indigo-400' },
  }

  if (isEditing) {
    return (
      <tr className="transition-colors hover:bg-zinc-800/30">
        <td className="px-2 py-2"></td>
        <td className="px-3 py-2">
          <div className="space-y-1">
            <input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" />
            <input value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} placeholder="Description..." className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 focus:border-primary-400 focus:outline-none" />
          </div>
        </td>
        <td className="px-3 py-2">
          <select value={editForm.category} onChange={(e) => setEditForm({...editForm, category: e.target.value})} className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100 focus:border-primary-400 focus:outline-none">
            {Object.entries(BASELINE_CATEGORIES).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </td>
        <td className="px-3 py-2">
          <select value={editForm.severity} onChange={(e) => setEditForm({...editForm, severity: e.target.value})} className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100 focus:border-primary-400 focus:outline-none">
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </td>
        <td className="px-3 py-2"></td>
        <td className="px-3 py-2 text-xs text-zinc-500">{baseline.enabled ? 'Enabled' : 'Disabled'}</td>
        <td className="px-2 py-2">
          <div className="flex items-center gap-1">
            <button onClick={handleSaveEdit} disabled={updateMutation.isPending} className="rounded bg-primary-400 px-2 py-1 text-xs font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50">Save</button>
            <button onClick={() => setEditingId(null)} className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:border-zinc-600">Cancel</button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <>
      <tr className="transition-colors hover:bg-zinc-800/30">
        <td className="px-2 py-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <span className={`text-xs transition-transform ${expanded ? 'inline-block rotate-90' : ''}`}>&#9654;</span>
          </button>
        </td>
        <td className="px-5 py-3">
          <div>
            <p className="font-medium text-zinc-100">
              {baseline.name}
              {baseline.templateId && (
                <span className="ml-2 rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">Template</span>
              )}
            </p>
            {baseline.description && (
              <p className="mt-0.5 text-xs text-zinc-500">{baseline.description}</p>
            )}
          </div>
        </td>
        <td className="px-5 py-3">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryBadge(baseline.category)}`}>
            {baseline.category.replace('_', ' ')}
          </span>
        </td>
        <td className="px-5 py-3">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${severityBadge(baseline.severity)}`}>
            {baseline.severity}
          </span>
        </td>
        <td className="px-5 py-3 text-center">
          {expanded && linkedControls.length > 0 ? (
            <span className="rounded-full bg-primary-400/10 px-2.5 py-0.5 text-xs font-medium text-primary-400">{linkedControls.length}</span>
          ) : (
            <span className="text-xs text-zinc-600">&mdash;</span>
          )}
        </td>
        <td className="px-5 py-3">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              baseline.enabled
                ? 'bg-primary-400/10 text-primary-400'
                : 'bg-zinc-500/10 text-zinc-400'
            }`}
          >
            {baseline.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </td>
        <td className="relative px-2 py-3">
          <button
            onClick={(e) => openMenu(baseline.id, e.currentTarget)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            title="Actions"
          >
            <span className="text-base leading-none">&#8942;</span>
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="bg-zinc-800/20 px-5 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-zinc-300">Linked Controls</h4>
                <button
                  onClick={() => setShowLinkDialog(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600"
                >
                  <HugeiconsIcon icon={PlusSignIcon} size={12} /> Link Control
                </button>
              </div>

              {linkedLoading ? (
                <div className="py-4 text-center">
                  <HugeiconsIcon icon={LoaderPinwheelIcon} size={16} className="mx-auto animate-spin text-zinc-500" />
                </div>
              ) : linkedControls.length === 0 ? (
                <p className="py-4 text-center text-xs text-zinc-500">No controls linked yet. Link controls to map this baseline to framework requirements.</p>
              ) : (
                <div className="space-y-1">
                  {linkedControls.map((ctrl: any) => (
                    <div key={ctrl.linkId} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
                      <div className="flex items-center gap-3">
                        <code className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-primary-400">{ctrl.controlCode}</code>
                        <span className="text-sm text-zinc-300">{ctrl.title}</span>
                        <span className="text-xs text-zinc-600">{ctrl.frameworkName} v{ctrl.frameworkVersion}</span>
                      </div>
                      <button
                        onClick={() => unlinkMut.mutate({ baselineId: baseline.id, linkId: ctrl.linkId })}
                        disabled={unlinkMut.isPending}
                        className="rounded px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                      >
                        Unlink
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {showLinkDialog && (
              <LinkControlDialog
                workspaceId={workspaceId}
                baselineId={baseline.id}
                linkedControlIds={new Set(linkedControls.map((c: any) => c.controlId))}
                onClose={() => setShowLinkDialog(false)}
              />
            )}
          </td>
        </tr>
      )}
    </>
  )
}

// ── Link Control Dialog ──────────────────────────────────────────────────────

function LinkControlDialog({ workspaceId, baselineId, linkedControlIds, onClose }: {
  workspaceId: string | undefined
  baselineId: string
  linkedControlIds: Set<string>
  onClose: () => void
}) {
  const { adoptions } = useAdoptions(workspaceId)
  const linkMut = useLinkBaselineControl(workspaceId)
  const [selectedFvId, setSelectedFvId] = useState('')
  const [controls, setControls] = useState<any[]>([])
  const [loadingControls, setLoadingControls] = useState(false)
  const [search, setSearch] = useState('')

  // Load controls when a framework version is selected
  useEffect(() => {
    if (!selectedFvId || !workspaceId) { setControls([]); return }
    setLoadingControls(true)
    // Find adoption to get slug and version
    const adoption = adoptions.find((a: any) => a.frameworkVersionId === selectedFvId)
    if (!adoption) { setLoadingControls(false); return }
    api.get<{ controls: any[]; total: number }>(`/workspaces/${workspaceId}/frameworks/${adoption.frameworkSlug}/versions/${adoption.frameworkVersion}/controls?limit=500`)
      .then((data) => { setControls(data.controls ?? []); setLoadingControls(false) })
      .catch(() => { setControls([]); setLoadingControls(false) })
  }, [selectedFvId, workspaceId, adoptions])

  const filtered = controls.filter((c: any) => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.controlId.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
  })

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-100">Link Controls to Baseline</h3>
          <button onClick={onClose} className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300">
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        </div>

        {/* Framework picker */}
        <div className="mb-4">
          <label className="mb-1 block text-xs text-zinc-400">Framework</label>
          <select
            value={selectedFvId}
            onChange={e => setSelectedFvId(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
          >
            <option value="">Select a framework...</option>
            {adoptions.map((a: any) => (
              <option key={a.frameworkVersionId} value={a.frameworkVersionId}>{a.frameworkName} v{a.frameworkVersion}</option>
            ))}
          </select>
        </div>

        {selectedFvId && (
          <>
            <div className="relative mb-3">
              <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search controls..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
              />
            </div>

            <div className="max-h-[360px] overflow-y-auto rounded-lg border border-zinc-800">
              {loadingControls ? (
                <div className="py-8 text-center"><HugeiconsIcon icon={LoaderPinwheelIcon} size={16} className="mx-auto animate-spin text-zinc-500" /></div>
              ) : filtered.length === 0 ? (
                <p className="py-8 text-center text-xs text-zinc-500">No controls found.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                      <th className="px-3 py-2 font-medium">Control</th>
                      <th className="px-3 py-2 font-medium">Title</th>
                      <th className="px-3 py-2 font-medium">Domain</th>
                      <th className="w-20 px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {filtered.map((ctrl: any) => {
                      const isLinked = linkedControlIds.has(ctrl.id)
                      return (
                        <tr key={ctrl.id} className="transition-colors hover:bg-zinc-800/30">
                          <td className="px-3 py-2"><code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-primary-400">{ctrl.controlId}</code></td>
                          <td className="px-3 py-2 text-xs text-zinc-300 max-w-[200px] truncate">{ctrl.title}</td>
                          <td className="px-3 py-2 text-xs text-zinc-500">{ctrl.domain ?? '\u2014'}</td>
                          <td className="px-3 py-2 text-right">
                            {isLinked ? (
                              <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">Linked</span>
                            ) : (
                              <button
                                onClick={() => linkMut.mutate({ baselineId, controlId: ctrl.id })}
                                disabled={linkMut.isPending}
                                className="rounded-lg bg-primary-400 px-3 py-1 text-xs font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
                              >
                                Link
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}

// ── Violations Section ──────────────────────────────────────────────────────

function ViolationsSection({ workspaceId }: { workspaceId: string | undefined }) {
  const [statusFilter, setStatusFilter] = useState('open')
  const { violations, isLoading } = useBaselineViolations(workspaceId, { status: statusFilter })
  const resolveMutation = useResolveViolation(workspaceId)
  const exemptMutation = useExemptViolation(workspaceId)

  const [actionId, setActionId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'resolve' | 'exempt' | null>(null)
  const [reason, setReason] = useState('')

  const handleResolve = (violationId: string) => {
    resolveMutation.mutate(
      { violationId, reason: reason || undefined },
      {
        onSuccess: () => {
          setActionId(null)
          setActionType(null)
          setReason('')
        },
      },
    )
  }

  const handleExempt = (violationId: string) => {
    if (!reason.trim()) return
    exemptMutation.mutate(
      { violationId, reason },
      {
        onSuccess: () => {
          setActionId(null)
          setActionType(null)
          setReason('')
        },
      },
    )
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-500/10 text-red-400'
      case 'resolved':
        return 'bg-primary-400/10 text-primary-400'
      case 'exempted':
        return 'bg-amber-500/10 text-amber-400'
      default:
        return 'bg-zinc-500/10 text-zinc-400'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <HugeiconsIcon icon={LoaderPinwheelIcon} size={20} className="animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Violations</h2>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-300 focus:border-primary-400 focus:outline-none"
        >
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="exempted">Exempted</option>
          <option value="">All</option>
        </select>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        {violations.length === 0 ? (
          <div className="py-12 text-center">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={32} className="mx-auto text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-400">No violations found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="px-5 py-3 font-medium">Baseline Name</th>
                  <th className="px-5 py-3 font-medium">Entity Type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Detected At</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {violations.map((violation) => (
                  <tr key={violation.id}>
                    <td className="px-5 py-3 font-medium text-zinc-100">{violation.baselineName}</td>
                    <td className="px-5 py-3 text-zinc-400">{violation.entityType}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(violation.status)}`}>
                        {violation.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-400">
                      {new Date(violation.detectedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {violation.status === 'open' && (
                        <>
                          {actionId === violation.id ? (
                            <div className="flex flex-col items-end gap-2">
                              <input
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-64 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                                placeholder={
                                  actionType === 'exempt'
                                    ? 'Reason (required)...'
                                    : 'Reason (optional)...'
                                }
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    if (actionType === 'resolve') handleResolve(violation.id)
                                    else handleExempt(violation.id)
                                  }}
                                  disabled={
                                    (actionType === 'exempt' && !reason.trim()) ||
                                    resolveMutation.isPending ||
                                    exemptMutation.isPending
                                  }
                                  className="rounded-lg bg-primary-400 px-2.5 py-1 text-xs font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => {
                                    setActionId(null)
                                    setActionType(null)
                                    setReason('')
                                  }}
                                  className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setActionId(violation.id)
                                  setActionType('resolve')
                                  setReason('')
                                }}
                                className="flex items-center gap-1 rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300"
                              >
                                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                                Resolve
                              </button>
                              <button
                                onClick={() => {
                                  setActionId(violation.id)
                                  setActionType('exempt')
                                  setReason('')
                                }}
                                className="flex items-center gap-1 rounded-lg border border-amber-500/20 px-2.5 py-1 text-xs text-amber-400 transition-colors hover:border-amber-500/40 hover:bg-amber-500/5"
                              >
                                <HugeiconsIcon icon={Shield01Icon} size={14} />
                                Exempt
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
