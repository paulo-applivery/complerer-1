import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { api } from '@/lib/api'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  PlusSignIcon,
  Search01Icon,
  Delete02Icon,
  Edit01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  DashboardBrowsingIcon,
  Shield01Icon,
  UserGroupIcon,
  Settings01Icon,
  Layers01Icon,
  FileAttachmentIcon,
} from '@hugeicons/core-free-icons'

type LibraryTab = 'systems' | 'roles' | 'baselines' | 'policies' | 'frameworks' | 'reports'

// ── Generic hooks ─────────────────────────────────────────────────────

function useLibraryItems(tab: LibraryTab) {
  return useQuery<{ items: any[] }>({
    queryKey: ['admin-library', tab],
    queryFn: () => api.get(`/admin/libraries/${tab}`),
  })
}

function useCreateLibraryItem(tab: LibraryTab) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post(`/admin/libraries/${tab}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-library', tab] }),
  })
}

function useUpdateLibraryItem(tab: LibraryTab) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/admin/libraries/${tab}/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-library', tab] }),
  })
}

function useDeleteLibraryItem(tab: LibraryTab) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/libraries/${tab}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-library', tab] }),
  })
}

// ── Category configs ──────────────────────────────────────────────────

const SYSTEM_CATEGORIES = [
  'identity', 'cloud', 'devops', 'communication', 'project',
  'security', 'data', 'crm', 'hr',
  'finance', 'marketing', 'design', 'productivity', 'business',
  'monitoring', 'support',
]
const ROLE_CATEGORIES = ['executive', 'engineering', 'security', 'it_ops', 'product', 'sales_marketing', 'hr_people', 'finance_legal']
const BASELINE_CATEGORIES = ['identity', 'data_protection', 'network', 'endpoint', 'logging', 'application', 'continuity', 'governance']
const POLICY_CATEGORIES = ['security', 'access', 'privacy', 'hr', 'incident']
const SEVERITY_OPTIONS = ['critical', 'high', 'medium', 'low']

function catLabel(cat: string): string {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400',
  high: 'bg-orange-500/10 text-orange-400',
  medium: 'bg-amber-500/10 text-amber-400',
  low: 'bg-zinc-500/10 text-zinc-400',
}

// ── Skeleton helpers ──────────────────────────────────────────────────

const SK_WIDTHS = ['w-1/2', 'w-2/3', 'w-3/4', 'w-1/3', 'w-4/5', 'w-2/5', 'w-3/5', 'w-5/6']

function SkCell({ i, offset = 0, badge = false, code = false }: { i: number; offset?: number; badge?: boolean; code?: boolean }) {
  if (badge) return <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-800" />
  if (code) return <div className="h-5 w-20 animate-pulse rounded bg-zinc-800" />
  return <div className={`h-3.5 animate-pulse rounded bg-zinc-800 ${SK_WIDTHS[(i + offset) % SK_WIDTHS.length]}`} />
}

function SkActions({ n = 2 }: { n?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: n }).map((_, k) => (
        <div key={k} className="h-6 w-6 animate-pulse rounded bg-zinc-800" />
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────

export function AdminLibrariesPage() {
  const [tab, setTab] = useState<LibraryTab>('systems')
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)

  const { data, isLoading } = useLibraryItems(tab)
  const items = data?.items ?? []

  const createMut = useCreateLibraryItem(tab)
  const updateMut = useUpdateLibraryItem(tab)
  const deleteMut = useDeleteLibraryItem(tab)

  // Reset filters on tab change
  const switchTab = (t: LibraryTab) => {
    setTab(t)
    setSearch('')
    setCatFilter('')
    setShowModal(false)
    setEditItem(null)
  }

  // Filter items
  const filtered = items.filter((item: any) => {
    const s = search.toLowerCase()
    const nameField = item.name ?? item.title ?? ''
    const matchSearch = !s || nameField.toLowerCase().includes(s) || item.description?.toLowerCase().includes(s) || item.vendor?.toLowerCase().includes(s) || item.department?.toLowerCase().includes(s) || item.title?.toLowerCase().includes(s)
    const matchCat = !catFilter || item.category === catFilter
    return matchSearch && matchCat
  })

  const categories = tab === 'systems' ? SYSTEM_CATEGORIES : tab === 'roles' ? ROLE_CATEGORIES : tab === 'baselines' ? BASELINE_CATEGORIES : tab === 'policies' ? POLICY_CATEGORIES : tab === 'reports' ? REPORT_CATEGORIES : []

  const openCreate = () => { setEditItem(null); setShowModal(true) }
  const openEdit = (item: any) => { setEditItem(item); setShowModal(true) }
  const handleDelete = (id: string) => {
    if (!confirm('Delete this item? This cannot be undone.')) return
    deleteMut.mutate(id)
  }

  const TABS: { key: LibraryTab; label: string; icon: typeof Layers01Icon }[] = [
    { key: 'systems', label: 'Systems', icon: DashboardBrowsingIcon },
    { key: 'roles', label: 'Departments & Roles', icon: UserGroupIcon },
    { key: 'baselines', label: 'Baselines', icon: Settings01Icon },
    { key: 'policies', label: 'Policies', icon: Shield01Icon },
    { key: 'frameworks', label: 'Frameworks', icon: Layers01Icon },
    { key: 'reports', label: 'Report Templates', icon: FileAttachmentIcon },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Platform Libraries</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage seed data available to all workspaces</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} />
          Add Item
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <HugeiconsIcon icon={t.icon} size={14} />
            {t.label}
            {tab === t.key && items.length > 0 && (
              <span className="ml-1 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                {items.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search + Category filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
            placeholder="Search..."
          />
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setCatFilter('')}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${!catFilter ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCatFilter(catFilter === cat ? '' : cat)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${catFilter === cat ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {catLabel(cat)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        {!isLoading && filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-zinc-500">No items found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {tab === 'systems' && <SystemsTable items={filtered} onEdit={openEdit} onDelete={handleDelete} isLoading={isLoading} />}
            {tab === 'roles' && <RolesTable items={filtered} onEdit={openEdit} onDelete={handleDelete} isLoading={isLoading} />}
            {tab === 'baselines' && <BaselinesTable items={filtered} onEdit={openEdit} onDelete={handleDelete} isLoading={isLoading} />}
            {tab === 'policies' && <PoliciesTable items={filtered} onEdit={openEdit} onDelete={handleDelete} isLoading={isLoading} />}
            {tab === 'frameworks' && <FrameworksTable items={filtered} onEdit={openEdit} onDelete={handleDelete} isLoading={isLoading} />}
            {tab === 'reports' && <ReportTemplatesTable items={filtered} onEdit={openEdit} onDelete={handleDelete} isLoading={isLoading} />}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <LibraryModal
          tab={tab}
          item={editItem}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onCreate={(data) => createMut.mutate(data, { onSuccess: () => { setShowModal(false); setEditItem(null) } })}
          onUpdate={(data) => updateMut.mutate(data, { onSuccess: () => { setShowModal(false); setEditItem(null) } })}
          isPending={createMut.isPending || updateMut.isPending}
        />
      )}
    </div>
  )
}

// ── Tables ────────────────────────────────────────────────────────────

function SystemsTable({ items, onEdit, onDelete, isLoading }: { items: any[]; onEdit: (i: any) => void; onDelete: (id: string) => void; isLoading?: boolean }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-zinc-800 text-xs text-zinc-500">
          <th className="px-5 py-3 font-medium">Name</th>
          <th className="px-5 py-3 font-medium">Category</th>
          <th className="px-5 py-3 font-medium">Vendor</th>
          <th className="px-5 py-3 font-medium">Classification</th>
          <th className="w-20 px-3 py-3"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-800/50">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-zinc-800/50">
                <td className="px-5 py-3.5">
                  <SkCell i={i} offset={0} />
                  {i % 3 !== 0 && <div className="mt-1.5 h-3 w-2/5 animate-pulse rounded bg-zinc-800/50" />}
                </td>
                <td className="px-5 py-3.5"><SkCell i={i} offset={1} badge /></td>
                <td className="px-5 py-3.5"><SkCell i={i} offset={2} /></td>
                <td className="px-5 py-3.5"><SkCell i={i} offset={3} /></td>
                <td className="px-3 py-3.5"><SkActions /></td>
              </tr>
            ))
          : items.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-zinc-800/30">
                <td className="px-5 py-3">
                  <p className="font-medium text-zinc-100">{item.name}</p>
                  {item.description && <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">{item.description}</p>}
                </td>
                <td className="px-5 py-3"><span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">{catLabel(item.category)}</span></td>
                <td className="px-5 py-3 text-zinc-400">{item.vendor ?? '—'}</td>
                <td className="px-5 py-3 text-zinc-400">{item.default_classification ?? '—'}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onEdit(item)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"><HugeiconsIcon icon={Edit01Icon} size={14} /></button>
                    <button onClick={() => onDelete(item.id)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"><HugeiconsIcon icon={Delete02Icon} size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
      </tbody>
    </table>
  )
}

function RolesTable({ items, onEdit, onDelete, isLoading }: { items: any[]; onEdit: (i: any) => void; onDelete: (id: string) => void; isLoading?: boolean }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-zinc-800 text-xs text-zinc-500">
          <th className="px-5 py-3 font-medium">Department</th>
          <th className="px-5 py-3 font-medium">Title</th>
          <th className="px-5 py-3 font-medium">Category</th>
          <th className="px-5 py-3 font-medium">Description</th>
          <th className="w-20 px-3 py-3"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-800/50">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-zinc-800/50">
                <td className="px-5 py-3.5"><SkCell i={i} offset={0} /></td>
                <td className="px-5 py-3.5"><SkCell i={i} offset={1} /></td>
                <td className="px-5 py-3.5"><SkCell i={i} offset={2} badge /></td>
                <td className="px-5 py-3.5"><SkCell i={i} offset={3} /></td>
                <td className="px-3 py-3.5"><SkActions /></td>
              </tr>
            ))
          : items.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-zinc-800/30">
                <td className="px-5 py-3 font-medium text-zinc-100">{item.department}</td>
                <td className="px-5 py-3 text-zinc-300">{item.title}</td>
                <td className="px-5 py-3"><span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">{catLabel(item.category)}</span></td>
                <td className="px-5 py-3 text-xs text-zinc-500 max-w-xs truncate">{item.description ?? '—'}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onEdit(item)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"><HugeiconsIcon icon={Edit01Icon} size={14} /></button>
                    <button onClick={() => onDelete(item.id)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"><HugeiconsIcon icon={Delete02Icon} size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
      </tbody>
    </table>
  )
}

function BaselinesTable({ items, onEdit, onDelete, isLoading }: { items: any[]; onEdit: (i: any) => void; onDelete: (id: string) => void; isLoading?: boolean }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-zinc-800 text-xs text-zinc-500">
          <th className="px-5 py-3 font-medium">Name</th>
          <th className="px-5 py-3 font-medium">Category</th>
          <th className="px-5 py-3 font-medium">Check Type</th>
          <th className="px-5 py-3 font-medium">Severity</th>
          <th className="px-5 py-3 font-medium">Framework Hints</th>
          <th className="w-20 px-3 py-3"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-800/50">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-zinc-800/50">
                <td className="px-5 py-3.5">
                  <SkCell i={i} offset={0} />
                  {i % 3 !== 0 && <div className="mt-1.5 h-3 w-2/5 animate-pulse rounded bg-zinc-800/50" />}
                </td>
                <td className="px-5 py-3.5"><SkCell i={i} offset={1} badge /></td>
                <td className="px-5 py-3.5"><SkCell i={i} offset={2} badge /></td>
                <td className="px-5 py-3.5"><SkCell i={i} offset={3} badge /></td>
                <td className="px-5 py-3.5"><SkCell i={i} offset={4} /></td>
                <td className="px-3 py-3.5"><SkActions /></td>
              </tr>
            ))
          : items.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-zinc-800/30">
                <td className="px-5 py-3">
                  <p className="font-medium text-zinc-100">{item.name}</p>
                  {item.description && <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">{item.description}</p>}
                </td>
                <td className="px-5 py-3"><span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">{catLabel(item.category)}</span></td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${item.check_type === 'automated' ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                    {item.check_type}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SEVERITY_COLORS[item.severity] ?? SEVERITY_COLORS.medium}`}>
                    {item.severity}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-zinc-500 max-w-[200px] truncate">{item.framework_hints ?? '—'}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onEdit(item)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"><HugeiconsIcon icon={Edit01Icon} size={14} /></button>
                    <button onClick={() => onDelete(item.id)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"><HugeiconsIcon icon={Delete02Icon} size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
      </tbody>
    </table>
  )
}

function PoliciesTable({ items, onEdit, onDelete, isLoading }: { items: any[]; onEdit: (i: any) => void; onDelete: (id: string) => void; isLoading?: boolean }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-zinc-800 text-xs text-zinc-500">
          <th className="px-5 py-3 font-medium">Title</th>
          <th className="px-5 py-3 font-medium">Category</th>
          <th className="px-5 py-3 font-medium">Version</th>
          <th className="px-5 py-3 font-medium">Review Cycle</th>
          <th className="w-20 px-3 py-3"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-800/50">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-zinc-800/50">
                <td className="px-5 py-3.5">
                  <SkCell i={i} offset={0} />
                  {i % 2 !== 0 && <div className="mt-1.5 h-3 w-1/2 animate-pulse rounded bg-zinc-800/50" />}
                </td>
                <td className="px-5 py-3.5"><SkCell i={i} offset={1} badge /></td>
                <td className="px-5 py-3.5"><div className="h-3.5 w-8 animate-pulse rounded bg-zinc-800" /></td>
                <td className="px-5 py-3.5"><div className="h-3.5 w-12 animate-pulse rounded bg-zinc-800" /></td>
                <td className="px-3 py-3.5"><SkActions /></td>
              </tr>
            ))
          : items.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-zinc-800/30">
                <td className="px-5 py-3">
                  <p className="font-medium text-zinc-100">{item.title}</p>
                  {item.description && <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">{item.description}</p>}
                </td>
                <td className="px-5 py-3"><span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">{catLabel(item.category)}</span></td>
                <td className="px-5 py-3 text-xs text-zinc-400">{item.version}</td>
                <td className="px-5 py-3 text-xs text-zinc-400">{item.review_cycle_days}d</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onEdit(item)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"><HugeiconsIcon icon={Edit01Icon} size={14} /></button>
                    <button onClick={() => onDelete(item.id)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"><HugeiconsIcon icon={Delete02Icon} size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
      </tbody>
    </table>
  )
}

function FrameworksTable({ items, onEdit, onDelete, isLoading }: { items: any[]; onEdit: (i: any) => void; onDelete: (id: string) => void; isLoading?: boolean }) {
  const [expandedFw, setExpandedFw] = useState<string | null>(null)
  const [expandedVer, setExpandedVer] = useState<string | null>(null)

  return (
    <div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-xs text-zinc-500">
            <th className="px-5 py-3 font-medium">Name</th>
            <th className="px-5 py-3 font-medium">Slug</th>
            <th className="px-5 py-3 font-medium">Source</th>
            <th className="px-5 py-3 font-medium">Versions</th>
            <th className="px-5 py-3 font-medium">Controls</th>
            <th className="w-24 px-3 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-zinc-800/50">
                  <td className="px-5 py-3.5">
                    <SkCell i={i} offset={0} />
                    {i % 3 !== 0 && <div className="mt-1.5 h-3 w-2/5 animate-pulse rounded bg-zinc-800/50" />}
                  </td>
                  <td className="px-5 py-3.5"><SkCell i={i} offset={1} code /></td>
                  <td className="px-5 py-3.5"><SkCell i={i} offset={2} /></td>
                  <td className="px-5 py-3.5"><div className="h-3.5 w-6 animate-pulse rounded bg-zinc-800" /></td>
                  <td className="px-5 py-3.5"><div className="h-3.5 w-10 animate-pulse rounded bg-zinc-800" /></td>
                  <td className="px-3 py-3.5"><SkActions n={3} /></td>
                </tr>
              ))
            : items.map((item) => (
                <>
                  <tr key={item.id} className="transition-colors hover:bg-zinc-800/30">
                    <td className="px-5 py-3">
                      <button onClick={() => setExpandedFw(expandedFw === item.id ? null : item.id)} className="text-left">
                        <p className="font-medium text-zinc-100 hover:text-primary-400 transition-colors">{item.name}</p>
                        {item.description && <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">{item.description}</p>}
                      </button>
                    </td>
                    <td className="px-5 py-3"><code className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{item.slug}</code></td>
                    <td className="px-5 py-3 text-zinc-400">{item.source_org ?? '—'}</td>
                    <td className="px-5 py-3 text-zinc-300">{item.version_count ?? 0}</td>
                    <td className="px-5 py-3 text-zinc-300">{item.control_count ?? 0}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setExpandedFw(expandedFw === item.id ? null : item.id)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-primary-400" title="Manage versions & controls">
                          <HugeiconsIcon icon={Settings01Icon} size={14} />
                        </button>
                        <button onClick={() => onEdit(item)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"><HugeiconsIcon icon={Edit01Icon} size={14} /></button>
                        <button onClick={() => onDelete(item.id)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"><HugeiconsIcon icon={Delete02Icon} size={14} /></button>
                      </div>
                    </td>
                  </tr>
                  {expandedFw === item.id && (
                    <tr key={`${item.id}-expanded`}>
                      <td colSpan={6} className="px-5 py-4 bg-zinc-800/20">
                        <FrameworkVersionsPanel
                          frameworkId={item.id}
                          frameworkName={item.name}
                          expandedVer={expandedVer}
                          setExpandedVer={setExpandedVer}
                        />
                      </td>
                    </tr>
                  )}
                </>
              ))}
        </tbody>
      </table>
    </div>
  )
}

const REPORT_CATEGORIES = ['compliance', 'privacy', 'risk']

function ReportTemplatesTable({ items, onEdit, onDelete, isLoading }: { items: any[]; onEdit: (i: any) => void; onDelete: (id: string) => void; isLoading?: boolean }) {
  const navigate = useNavigate()
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-zinc-800 text-xs text-zinc-500">
          <th className="px-5 py-3 font-medium">Name</th>
          <th className="px-5 py-3 font-medium">Framework</th>
          <th className="px-5 py-3 font-medium">Category</th>
          <th className="px-5 py-3 font-medium">Version</th>
          <th className="px-5 py-3 font-medium">Sections</th>
          <th className="w-24 px-3 py-3"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-800/50">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b border-zinc-800/50">
                <td className="px-5 py-3.5">
                  <SkCell i={i} offset={0} />
                  {i % 2 !== 0 && <div className="mt-1.5 h-3 w-2/5 animate-pulse rounded bg-zinc-800/50" />}
                </td>
                <td className="px-5 py-3.5"><SkCell i={i} offset={1} code /></td>
                <td className="px-5 py-3.5"><SkCell i={i} offset={2} badge /></td>
                <td className="px-5 py-3.5"><div className="h-3.5 w-8 animate-pulse rounded bg-zinc-800" /></td>
                <td className="px-5 py-3.5"><div className="h-3.5 w-6 animate-pulse rounded bg-zinc-800" /></td>
                <td className="px-3 py-3.5"><SkActions /></td>
              </tr>
            ))
          : items.map((item) => {
              let sectionCount = 0
              try { sectionCount = JSON.parse(item.sections || '[]').length } catch {}
              return (
                <tr key={item.id} className="transition-colors hover:bg-zinc-800/30">
                  <td className="px-5 py-3">
                    <p className="font-medium text-zinc-100">{item.name}</p>
                    {item.description && <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">{item.description}</p>}
                  </td>
                  <td className="px-5 py-3">
                    {item.framework_slug ? <code className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{item.framework_slug}</code> : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-5 py-3"><span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{item.category}</span></td>
                  <td className="px-5 py-3 text-zinc-400">{item.version}</td>
                  <td className="px-5 py-3 text-zinc-300">{sectionCount}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate({ to: `/admin/report-templates/${item.id}` })} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-primary-400" title="Edit template content"><HugeiconsIcon icon={Edit01Icon} size={14} /></button>
                      <button onClick={() => onDelete(item.id)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"><HugeiconsIcon icon={Delete02Icon} size={14} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
      </tbody>
    </table>
  )
}

function FrameworkVersionsPanel({ frameworkId, frameworkName, expandedVer, setExpandedVer }: {
  frameworkId: string; frameworkName: string; expandedVer: string | null; setExpandedVer: (id: string | null) => void
}) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery<{ items: any[] }>({
    queryKey: ['admin-fw-versions', frameworkId],
    queryFn: () => api.get(`/admin/libraries/frameworks/${frameworkId}/versions`),
  })
  const versions = data?.items ?? []

  const [showCreate, setShowCreate] = useState(false)
  const [newVersion, setNewVersion] = useState({ version: '', status: 'draft', changelog: '' })
  const [editingVer, setEditingVer] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ version: '', status: 'draft' })

  const createMut = useMutation({
    mutationFn: (payload: any) => api.post(`/admin/libraries/frameworks/${frameworkId}/versions`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-fw-versions', frameworkId] }); setShowCreate(false); setNewVersion({ version: '', status: 'draft', changelog: '' }) },
  })

  const updateMut = useMutation({
    mutationFn: ({ verId, ...payload }: any) => api.put(`/admin/libraries/frameworks/${frameworkId}/versions/${verId}`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-fw-versions', frameworkId] }); setEditingVer(null) },
  })

  const deleteMut = useMutation({
    mutationFn: (verId: string) => api.delete(`/admin/libraries/frameworks/${frameworkId}/versions/${verId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-fw-versions', frameworkId] }),
  })

  if (isLoading) return <div className="py-4 text-center text-xs text-zinc-500">Loading versions...</div>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-300">{frameworkName} — Versions</p>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1 rounded bg-primary-400 px-2.5 py-1 text-xs font-medium text-zinc-950 hover:bg-primary-300">
          <HugeiconsIcon icon={PlusSignIcon} size={12} />
          Add Version
        </button>
      </div>

      {showCreate && (
        <div className="flex items-end gap-2 rounded-lg border border-zinc-700 bg-zinc-800 p-3">
          <div className="flex-1">
            <label className="mb-1 block text-[10px] text-zinc-500">Version</label>
            <input value={newVersion.version} onChange={(e) => setNewVersion({...newVersion, version: e.target.value})} placeholder="e.g. 2024" className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 focus:border-primary-400 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] text-zinc-500">Status</label>
            <select value={newVersion.status} onChange={(e) => setNewVersion({...newVersion, status: e.target.value})} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 focus:border-primary-400 focus:outline-none">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <button onClick={() => createMut.mutate(newVersion)} disabled={!newVersion.version.trim() || createMut.isPending} className="rounded bg-primary-400 px-3 py-1 text-xs font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50">
            {createMut.isPending ? '...' : 'Create'}
          </button>
          <button onClick={() => setShowCreate(false)} className="rounded border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:border-zinc-600">Cancel</button>
        </div>
      )}

      {versions.length === 0 ? (
        <p className="py-4 text-center text-xs text-zinc-500">No versions yet. Create one to start adding controls.</p>
      ) : (
        <div className="space-y-2">
          {versions.map((ver: any) => (
            <div key={ver.id}>
              {editingVer === ver.id ? (
                <div className="flex items-center gap-2 rounded-lg border border-primary-400/40 bg-zinc-800 px-3 py-2">
                  <div className="flex-1">
                    <label className="mb-1 block text-[10px] text-zinc-500">Version name</label>
                    <input
                      autoFocus
                      value={editForm.version}
                      onChange={(e) => setEditForm({ ...editForm, version: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') updateMut.mutate({ verId: ver.id, ...editForm }); if (e.key === 'Escape') setEditingVer(null) }}
                      className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 focus:border-primary-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-zinc-500">Status</label>
                    <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 focus:border-primary-400 focus:outline-none">
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                  <button onClick={() => updateMut.mutate({ verId: ver.id, ...editForm })} disabled={!editForm.version.trim() || updateMut.isPending} className="mt-3 rounded bg-primary-400 px-3 py-1 text-xs font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50">
                    {updateMut.isPending ? '...' : 'Save'}
                  </button>
                  <button onClick={() => setEditingVer(null)} className="mt-3 rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:border-zinc-600">✕</button>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-2">
                  <button onClick={() => setExpandedVer(expandedVer === ver.id ? null : ver.id)} className="flex items-center gap-3 text-left">
                    <code className="rounded bg-zinc-700 px-2 py-0.5 text-xs font-medium text-zinc-200">v{ver.version}</code>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ver.status === 'published' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-500/10 text-zinc-400'}`}>{ver.status}</span>
                    <span className="text-xs text-zinc-500">{ver.control_count ?? ver.total_controls ?? 0} controls</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setExpandedVer(expandedVer === ver.id ? null : ver.id)} className="rounded p-1 text-xs text-primary-400 hover:bg-zinc-700" title="View controls">
                      <HugeiconsIcon icon={Settings01Icon} size={12} />
                    </button>
                    <button
                      onClick={() => { setEditingVer(ver.id); setEditForm({ version: ver.version, status: ver.status ?? 'draft' }) }}
                      className="rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
                      title="Edit version name"
                    >
                      <HugeiconsIcon icon={Edit01Icon} size={12} />
                    </button>
                    <button onClick={() => { if (confirm('Delete this version and all its controls?')) deleteMut.mutate(ver.id) }} className="rounded p-1 text-xs text-red-400 hover:bg-zinc-700">
                      <HugeiconsIcon icon={Delete02Icon} size={12} />
                    </button>
                  </div>
                </div>
              )}
              {expandedVer === ver.id && editingVer !== ver.id && (
                <div className="ml-4 mt-2 mb-2">
                  <FrameworkControlsPanel frameworkId={frameworkId} versionId={ver.id} versionLabel={ver.version} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FrameworkControlsPanel({ frameworkId, versionId, versionLabel }: { frameworkId: string; versionId: string; versionLabel: string }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery<{ items: any[] }>({
    queryKey: ['admin-fw-controls', versionId],
    queryFn: () => api.get(`/admin/libraries/frameworks/${frameworkId}/versions/${versionId}/controls`),
  })
  const controls = data?.items ?? []

  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ control_id: '', domain: '', subdomain: '', title: '', requirement_text: '', guidance: '', implementation_group: '' })

  const createMut = useMutation({
    mutationFn: (payload: any) => api.post(`/admin/libraries/frameworks/${frameworkId}/versions/${versionId}/controls`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-fw-controls', versionId] }); qc.invalidateQueries({ queryKey: ['admin-fw-versions', frameworkId] }); resetForm() },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, ...payload }: any) => api.put(`/admin/libraries/frameworks/${frameworkId}/versions/${versionId}/controls/${id}`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-fw-controls', versionId] }); setEditId(null) },
  })

  const deleteMut = useMutation({
    mutationFn: (ctrlId: string) => api.delete(`/admin/libraries/frameworks/${frameworkId}/versions/${versionId}/controls/${ctrlId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-fw-controls', versionId] }); qc.invalidateQueries({ queryKey: ['admin-fw-versions', frameworkId] }) },
  })

  const resetForm = () => { setShowCreate(false); setForm({ control_id: '', domain: '', subdomain: '', title: '', requirement_text: '', guidance: '', implementation_group: '' }) }

  const startEdit = (ctrl: any) => {
    setEditId(ctrl.id)
    setForm({ control_id: ctrl.control_id, domain: ctrl.domain ?? '', subdomain: ctrl.subdomain ?? '', title: ctrl.title, requirement_text: ctrl.requirement_text, guidance: ctrl.guidance ?? '', implementation_group: ctrl.implementation_group ?? '' })
  }

  const filtered = controls.filter((c: any) => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.control_id?.toLowerCase().includes(q) || c.title?.toLowerCase().includes(q) || c.domain?.toLowerCase().includes(q)
  })

  // Group by domain
  const domains = Array.from(new Set(filtered.map((c: any) => c.domain ?? 'Uncategorized')))

  if (isLoading) return <div className="py-3 text-center text-xs text-zinc-500">Loading controls...</div>

  return (
    <div className="space-y-3 rounded-lg border border-zinc-700/30 bg-zinc-900/50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-300">v{versionLabel} — {controls.length} Controls</p>
        <button onClick={() => { setShowCreate(!showCreate); setEditId(null) }} className="flex items-center gap-1 rounded bg-primary-400 px-2 py-1 text-[10px] font-medium text-zinc-950 hover:bg-primary-300">
          <HugeiconsIcon icon={PlusSignIcon} size={10} />
          Add Control
        </button>
      </div>

      {/* Search */}
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search controls..." className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none" />

      {/* Create/Edit form */}
      {(showCreate || editId) && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-3 space-y-2">
          <p className="text-[10px] font-semibold text-zinc-400">{editId ? 'Edit Control' : 'New Control'}</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-0.5 block text-[10px] text-zinc-500">Control ID *</label>
              <input value={form.control_id} onChange={(e) => setForm({...form, control_id: e.target.value})} placeholder="CC6.1" className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 focus:border-primary-400 focus:outline-none" />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] text-zinc-500">Domain</label>
              <input value={form.domain} onChange={(e) => setForm({...form, domain: e.target.value})} placeholder="Logical Access" className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 focus:border-primary-400 focus:outline-none" />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] text-zinc-500">Group</label>
              <input value={form.implementation_group} onChange={(e) => setForm({...form, implementation_group: e.target.value})} placeholder="IG1" className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 focus:border-primary-400 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] text-zinc-500">Title *</label>
            <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="Logical and Physical Access Controls" className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 focus:border-primary-400 focus:outline-none" />
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] text-zinc-500">Requirement Text *</label>
            <textarea value={form.requirement_text} onChange={(e) => setForm({...form, requirement_text: e.target.value})} rows={2} placeholder="The entity implements logical access..." className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 focus:border-primary-400 focus:outline-none" />
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] text-zinc-500">Guidance</label>
            <textarea value={form.guidance} onChange={(e) => setForm({...form, guidance: e.target.value})} rows={2} placeholder="Implementation guidance..." className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 focus:border-primary-400 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { resetForm(); setEditId(null) }} className="rounded border border-zinc-700 px-2 py-1 text-[10px] text-zinc-400 hover:border-zinc-600">Cancel</button>
            <button
              onClick={() => {
                if (editId) {
                  updateMut.mutate({ id: editId, ...form })
                } else {
                  createMut.mutate(form)
                }
              }}
              disabled={!form.control_id.trim() || !form.title.trim() || !form.requirement_text.trim() || createMut.isPending || updateMut.isPending}
              className="rounded bg-primary-400 px-3 py-1 text-[10px] font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50"
            >
              {createMut.isPending || updateMut.isPending ? 'Saving...' : editId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Controls list grouped by domain */}
      {filtered.length === 0 ? (
        <p className="py-4 text-center text-xs text-zinc-500">No controls yet.</p>
      ) : (
        <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1">
          {domains.map((domain) => {
            const domainControls = filtered.filter((c: any) => (c.domain ?? 'Uncategorized') === domain)
            return (
              <div key={domain}>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{domain} ({domainControls.length})</p>
                <div className="space-y-1">
                  {domainControls.map((ctrl: any) => (
                    <div key={ctrl.id} className="flex items-start justify-between gap-2 rounded border border-zinc-800/50 bg-zinc-800/30 px-2.5 py-2 hover:border-zinc-700/50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="shrink-0 rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] font-medium text-primary-400">{ctrl.control_id}</code>
                          <p className="text-xs font-medium text-zinc-200 truncate">{ctrl.title}</p>
                        </div>
                        <p className="mt-0.5 text-[10px] text-zinc-500 line-clamp-1">{ctrl.requirement_text}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button onClick={() => startEdit(ctrl)} className="rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"><HugeiconsIcon icon={Edit01Icon} size={11} /></button>
                        <button onClick={() => { if (confirm('Delete this control?')) deleteMut.mutate(ctrl.id) }} className="rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-red-400"><HugeiconsIcon icon={Delete02Icon} size={11} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────

function LibraryModal({ tab, item, onClose, onCreate, onUpdate, isPending }: {
  tab: LibraryTab
  item: any | null
  onClose: () => void
  onCreate: (data: any) => void
  onUpdate: (data: any) => void
  isPending: boolean
}) {
  const isEdit = !!item

  // Dynamic form state based on tab
  const [form, setForm] = useState(() => {
    if (isEdit) return { ...item }
    switch (tab) {
      case 'systems': return { name: '', category: 'identity', description: '', vendor: '', website: '', default_classification: 'standard', default_sensitivity: 'medium' }
      case 'roles': return { name: '', department: '', title: '', category: 'engineering', description: '' }
      case 'baselines': return { name: '', category: 'identity', description: '', check_type: 'manual', expected_value: '', severity: 'medium', framework_hints: '' }
      case 'frameworks': return { name: '', slug: '', description: '', source_org: '', website: '' }
    }
  })

  const set = (key: string, val: string) => setForm((prev: any) => ({ ...prev, [key]: val }))

  const handleSubmit = () => {
    if (isEdit) {
      onUpdate({ id: item.id, ...form })
    } else {
      onCreate(form)
    }
  }

  const entityName = tab === 'roles' ? 'Role' : tab === 'baselines' ? 'Baseline' : tab === 'policies' ? 'Policy' : tab === 'frameworks' ? 'Framework' : tab === 'reports' ? 'Report Template' : 'System'
  const title = isEdit ? `Edit ${entityName}` : `Add ${entityName}`

  const categories = tab === 'systems' ? SYSTEM_CATEGORIES : tab === 'roles' ? ROLE_CATEGORIES : tab === 'baselines' ? BASELINE_CATEGORIES : tab === 'policies' ? POLICY_CATEGORIES : tab === 'reports' ? REPORT_CATEGORIES : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300"><HugeiconsIcon icon={Cancel01Icon} size={18} /></button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Common: name/title */}
          <Field label={tab === 'policies' ? 'Title' : 'Name'} value={tab === 'policies' ? form.title ?? '' : form.name ?? ''} onChange={(v) => tab === 'policies' ? set('title', v) : set('name', v)} placeholder={tab === 'policies' ? 'e.g. Information Security Policy' : 'e.g. Okta, MFA enabled...'} />

          {/* Category select */}
          {categories.length > 0 && (
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Category</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none">
                {categories.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Description</label>
            <textarea value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} rows={2} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none" placeholder="Description..." />
          </div>

          {/* Tab-specific fields */}
          {tab === 'systems' && (
            <>
              <Field label="Vendor" value={form.vendor ?? ''} onChange={(v) => set('vendor', v)} placeholder="e.g. Okta Inc." />
              <Field label="Website" value={form.website ?? ''} onChange={(v) => set('website', v)} placeholder="https://..." />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Classification</label>
                  <select value={form.default_classification ?? ''} onChange={(e) => set('default_classification', e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none">
                    <option value="">None</option>
                    <option value="critical">Critical</option>
                    <option value="standard">Standard</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Sensitivity</label>
                  <select value={form.default_sensitivity ?? ''} onChange={(e) => set('default_sensitivity', e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none">
                    <option value="">None</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {tab === 'roles' && (
            <>
              <Field label="Department" value={form.department ?? ''} onChange={(v) => set('department', v)} placeholder="e.g. Engineering" />
              <Field label="Title" value={form.title ?? ''} onChange={(v) => set('title', v)} placeholder="e.g. Senior Engineer" />
            </>
          )}

          {tab === 'baselines' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Check Type</label>
                  <select value={form.check_type ?? 'manual'} onChange={(e) => set('check_type', e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none">
                    <option value="manual">Manual</option>
                    <option value="automated">Automated</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Severity</label>
                  <select value={form.severity ?? 'medium'} onChange={(e) => set('severity', e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none">
                    {SEVERITY_OPTIONS.map((s) => <option key={s} value={s}>{catLabel(s)}</option>)}
                  </select>
                </div>
              </div>
              <Field label="Expected Value" value={form.expected_value ?? ''} onChange={(v) => set('expected_value', v)} placeholder="e.g. enabled, >=12, <=90 days" />
              <Field label="Framework Hints" value={form.framework_hints ?? ''} onChange={(v) => set('framework_hints', v)} placeholder="e.g. SOC2:CC6.1,ISO27001:A.9.4.2" />
            </>
          )}

          {tab === 'policies' && (
            <>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Content</label>
                <textarea value={form.content_text ?? ''} onChange={(e) => set('content_text', e.target.value)} rows={4} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none" placeholder="Policy content or requirements..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Version" value={form.version ?? '1.0'} onChange={(v) => set('version', v)} placeholder="1.0" />
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Review Cycle (days)</label>
                  <input type="number" value={form.review_cycle_days ?? 365} onChange={(e) => set('review_cycle_days', e.target.value || '365')} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" />
                </div>
              </div>
            </>
          )}

          {tab === 'frameworks' && (
            <>
              <Field label="Slug" value={form.slug ?? ''} onChange={(v) => set('slug', v)} placeholder="e.g. soc2, iso27001" />
              <Field label="Source Organization" value={form.source_org ?? ''} onChange={(v) => set('source_org', v)} placeholder="e.g. AICPA, ISO" />
              <Field label="Website" value={form.website ?? ''} onChange={(v) => set('website', v)} placeholder="https://..." />
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!(tab === 'policies' ? form.title?.trim() : form.name?.trim()) || isPending}
            className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-zinc-400">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
        placeholder={placeholder}
      />
    </div>
  )
}
