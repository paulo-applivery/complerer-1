import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from '@tanstack/react-router'
import Papa from 'papaparse'
import {
  useSystemsList,
  useCreateSystem,
  useUpdateSystem,
  useDeleteSystem,
  useSystemLibrary,
  useAddFromLibrary,
  useDirectoryUsers,
  useCreateDirectoryUser,
  useUpdateDirectoryUser,
  useDeleteDirectoryUser,
  useBulkImportDirectory,
  useEmployeeLibrary,
  useAccessRecords,
  useCreateAccess,
  useUpdateAccessRecord,
  useTransitionAccess,
  useCustomFieldDefinitions,
  useCustomFieldValues,
  useSaveCustomFieldValues,
  useWorkspaceSetting,
  type AccessStatus,
  type AccessRecord,
} from '@/hooks/use-compliance'
import { CustomFieldsForm } from '@/components/ui/custom-fields-form'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  DashboardBrowsingIcon,
  UserGroupIcon,
  Key01Icon,
  PlusSignIcon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Search01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  LoaderPinwheelIcon,
  CancelCircleIcon,
  ClipboardIcon,
  Upload04Icon,
  Edit01Icon,
  Delete01Icon,
} from '@hugeicons/core-free-icons'

type Tab = 'access' | 'systems' | 'people'

// ── Getting Started Tutorial ────────────────────────────────────────────────

const TUTORIAL_STORAGE_KEY = 'access-register-tutorial-dismissed'

const TUTORIAL_STEPS = [
  {
    step: 1,
    title: 'Add People',
    description: 'Start by adding the people in your organization. Import from a CSV, add them manually, or pick from the employee directory library.',
    tab: 'people' as Tab,
    icon: UserGroupIcon,
  },
  {
    step: 2,
    title: 'Add Systems & Tools',
    description: 'Register the systems, applications, and tools your organization uses. Pick from the library of common tools or create your own.',
    tab: 'systems' as Tab,
    icon: DashboardBrowsingIcon,
  },
  {
    step: 3,
    title: 'Register Access',
    description: 'Grant and track who has access to what. Create access records linking people to systems with specific roles and approval info.',
    tab: 'access' as Tab,
    icon: Key01Icon,
  },
]

function GettingStartedTutorial({
  onGoToTab,
  workspaceId,
}: {
  onGoToTab: (tab: Tab) => void
  workspaceId: string | undefined
}) {
  const [dismissed, setDismissed] = useState(() => {
    const key = workspaceId ? `${TUTORIAL_STORAGE_KEY}-${workspaceId}` : TUTORIAL_STORAGE_KEY
    return localStorage.getItem(key) === 'true'
  })

  const { systems } = useSystemsList(workspaceId)
  const { users } = useDirectoryUsers(workspaceId)
  const { records } = useAccessRecords(workspaceId)

  const completedSteps = useMemo(() => {
    const completed = new Set<number>()
    if (users && users.length > 0) completed.add(1)
    if (systems && systems.length > 0) completed.add(2)
    if (records && records.length > 0) completed.add(3)
    return completed
  }, [users, systems, records])

  const allDone = completedSteps.size === 3

  if (dismissed) return null

  const handleDismiss = () => {
    const key = workspaceId ? `${TUTORIAL_STORAGE_KEY}-${workspaceId}` : TUTORIAL_STORAGE_KEY
    localStorage.setItem(key, 'true')
    setDismissed(true)
  }

  return (
    <div className="relative rounded-xl border border-primary-400/20 bg-gradient-to-br from-primary-400/5 via-zinc-900 to-zinc-900 p-5">
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
        title="Dismiss tutorial"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={16} />
      </button>

      <div className="mb-4">
        <h2 className="text-base font-semibold text-zinc-100">
          {allDone ? 'All set!' : 'Getting Started'}
        </h2>
        <p className="mt-0.5 text-sm text-zinc-400">
          {allDone
            ? 'You\'ve completed all the setup steps. You can dismiss this guide.'
            : 'Follow these steps to set up your access register.'}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {TUTORIAL_STEPS.map((s) => {
          const done = completedSteps.has(s.step)
          return (
            <button
              key={s.step}
              onClick={() => onGoToTab(s.tab)}
              className={`group relative flex flex-col rounded-lg border p-4 text-left transition-all ${
                done
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700 hover:bg-zinc-800/60'
              }`}
            >
              <div className="mb-3 flex items-center gap-2.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    done
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-primary-400/10 text-primary-400'
                  }`}
                >
                  {done ? (
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
                  ) : (
                    s.step
                  )}
                </div>
                <div className={`flex items-center gap-1.5 ${done ? 'text-emerald-400' : 'text-zinc-200'}`}>
                  <HugeiconsIcon icon={s.icon} size={14} />
                  <span className="text-sm font-medium">{s.title}</span>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-zinc-500">{s.description}</p>
              {!done && (
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary-400 opacity-0 transition-opacity group-hover:opacity-100">
                  Go to {s.title}
                  <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-primary-400 transition-all duration-500"
            style={{ width: `${(completedSteps.size / 3) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-zinc-500">
          {completedSteps.size}/3 complete
        </span>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export function AccessRegisterPage() {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const workspaceId = params.workspaceId
  const [activeTab, setActiveTab] = useState<Tab>('access')

  const tabs: { id: Tab; label: string; icon: typeof Key01Icon }[] = [
    { id: 'access', label: 'Access Records', icon: Key01Icon },
    { id: 'systems', label: 'Systems', icon: DashboardBrowsingIcon },
    { id: 'people', label: 'People', icon: UserGroupIcon },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Access Register</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage systems, people, and access grants across your organization.
        </p>
      </div>

      {/* Getting Started Tutorial */}
      <GettingStartedTutorial onGoToTab={setActiveTab} workspaceId={workspaceId} />

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

      {activeTab === 'systems' && <SystemsSection workspaceId={workspaceId} />}
      {activeTab === 'people' && <PeopleSection workspaceId={workspaceId} />}
      {activeTab === 'access' && <AccessSection workspaceId={workspaceId} />}
    </div>
  )
}

// ── Systems Section ─────────────────────────────────────────────────────────

const LIBRARY_CATEGORIES: Record<string, { label: string; color: string }> = {
  identity: { label: 'Identity & Access', color: 'bg-blue-500/10 text-blue-400' },
  cloud: { label: 'Cloud', color: 'bg-purple-500/10 text-purple-400' },
  devops: { label: 'DevOps', color: 'bg-amber-500/10 text-amber-400' },
  communication: { label: 'Communication', color: 'bg-primary-400/10 text-primary-400' },
  project: { label: 'Project Mgmt', color: 'bg-cyan-500/10 text-cyan-400' },
  security: { label: 'Security', color: 'bg-red-500/10 text-red-400' },
  data: { label: 'Data & Analytics', color: 'bg-indigo-500/10 text-indigo-400' },
  crm: { label: 'CRM & Sales', color: 'bg-orange-500/10 text-orange-400' },
  hr: { label: 'HR & Finance', color: 'bg-pink-500/10 text-pink-400' },
}

function SystemsSection({ workspaceId }: { workspaceId: string | undefined }) {
  const { systems, isLoading } = useSystemsList(workspaceId)
  const createMutation = useCreateSystem(workspaceId)
  const saveCfMutation = useSaveCustomFieldValues(workspaceId)
  const { fields: customFields } = useCustomFieldDefinitions(workspaceId, 'system')

  // Library
  const { library, isLoading: libLoading } = useSystemLibrary(workspaceId)
  const addFromLibrary = useAddFromLibrary(workspaceId)

  const [mode, setMode] = useState<'none' | 'manual' | 'library'>('none')
  const [form, setForm] = useState({
    name: '',
    classification: 'standard',
    sensitivity: '',
    environment: '',
    mfaRequired: false,
    owner: '',
  })
  const [cfValues, setCfValues] = useState<Record<string, string>>({})

  // Library picker state
  const [selectedLibIds, setSelectedLibIds] = useState<Set<string>>(new Set())
  const [libCategoryFilter, setLibCategoryFilter] = useState('')
  const [libSearch, setLibSearch] = useState('')
  const [libResult, setLibResult] = useState<{ created: number; skipped: number } | null>(null)

  // Systems search/filter
  const [systemSearch, setSystemSearch] = useState('')
  const [systemClassFilter, setSystemClassFilter] = useState('')

  // Edit / delete system
  const [editingSystem, setEditingSystem] = useState<any>(null)
  const [deletingSystem, setDeletingSystem] = useState<any>(null)
  const [deleteSystemError, setDeleteSystemError] = useState<string | null>(null)
  const updateSystem = useUpdateSystem(workspaceId)
  const deleteSystem = useDeleteSystem(workspaceId)

  // Environment options from workspace settings
  const { value: envSettingRaw } = useWorkspaceSetting(workspaceId, 'system_environments')
  const envOptions: string[] = envSettingRaw
    ? (() => { try { return JSON.parse(envSettingRaw) } catch { return [] } })()
    : ['Production', 'Staging', 'Development', 'Testing']

  const existingNames = new Set(systems.map((s: any) => s.name.toLowerCase()))
  const libCategories = Array.from(new Set(library.map((s: any) => s.category)))

  const filteredLib = library.filter((s: any) => {
    if (libCategoryFilter && s.category !== libCategoryFilter) return false
    if (libSearch) {
      const q = libSearch.toLowerCase()
      return s.name.toLowerCase().includes(q) || (s.vendor ?? '').toLowerCase().includes(q)
    }
    return true
  })

  const handleSubmit = () => {
    if (!form.name.trim()) return
    createMutation.mutate(
      {
        name: form.name,
        classification: form.classification,
        sensitivity: form.sensitivity || undefined,
        environment: form.environment || undefined,
        mfaRequired: form.mfaRequired,
        owner: form.owner || undefined,
      },
      {
        onSuccess: (data: any) => {
          const systemId = data?.system?.id
          if (systemId && Object.keys(cfValues).length > 0) {
            saveCfMutation.mutate({ entityType: 'system', entityId: systemId, values: cfValues })
          }
          setForm({ name: '', classification: 'standard', sensitivity: '', environment: '', mfaRequired: false, owner: '' })
          setCfValues({})
          setMode('none')
        },
      },
    )
  }

  const handleAddFromLibrary = () => {
    if (selectedLibIds.size === 0) return
    addFromLibrary.mutate(
      { libraryIds: Array.from(selectedLibIds) },
      {
        onSuccess: (data: any) => {
          setLibResult({ created: data.created, skipped: data.skipped })
          setSelectedLibIds(new Set())
          setLibSearch('')
          setLibCategoryFilter('')
          setTimeout(() => setMode('none'), 2000)
        },
      },
    )
  }

  const toggleLibSelect = (id: string) => {
    const next = new Set(selectedLibIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedLibIds(next)
  }

  const classificationBadge = (c: string) => {
    switch (c) {
      case 'critical':
        return 'bg-red-500/10 text-red-400'
      case 'standard':
        return 'bg-amber-500/10 text-amber-400'
      case 'low':
        return 'bg-primary-400/10 text-primary-400'
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
      {/* Header with split button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Systems</h2>
        {mode === 'none' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('library')}
              className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
            >
              <HugeiconsIcon icon={ClipboardIcon} size={16} />
              Add from Library
            </button>
            <button
              onClick={() => setMode('manual')}
              className="flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
              Add Custom
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setMode('none'); setSelectedLibIds(new Set()); setLibResult(null) }}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
            Cancel
          </button>
        )}
      </div>

      {/* Manual form */}
      {mode === 'manual' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-100">New Custom System</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="e.g. Production Database"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Classification</label>
              <select
                value={form.classification}
                onChange={(e) => setForm({ ...form, classification: e.target.value })}
                className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
              >
                <option value="critical">Critical</option>
                <option value="standard">Standard</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Sensitivity</label>
              <input
                value={form.sensitivity}
                onChange={(e) => setForm({ ...form, sensitivity: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="e.g. PII, Financial"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Environment</label>
              <select
                value={form.environment}
                onChange={(e) => setForm({ ...form, environment: e.target.value })}
                className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
              >
                <option value="">Select environment...</option>
                {envOptions.map((env) => (
                  <option key={env} value={env}>{env}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Owner</label>
              <input
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="e.g. Security Team"
              />
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={form.mfaRequired}
                  onChange={(e) => setForm({ ...form, mfaRequired: e.target.checked })}
                  className="rounded border-zinc-600 bg-zinc-800 text-primary-400 focus:ring-primary-400"
                />
                MFA Required
              </label>
            </div>
            <CustomFieldsForm
              workspaceId={workspaceId}
              entityType="system"
              values={cfValues}
              onChange={setCfValues}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!form.name.trim() || createMutation.isPending}
              className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create System'}
            </button>
          </div>
        </div>
      )}

      {/* Library picker */}
      {mode === 'library' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Add from Library</h3>
              <p className="mt-0.5 text-xs text-zinc-500">Select tools your organization uses</p>
            </div>
            {selectedLibIds.size > 0 && (
              <button
                onClick={handleAddFromLibrary}
                disabled={addFromLibrary.isPending}
                className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
              >
                {addFromLibrary.isPending ? 'Adding...' : `Add ${selectedLibIds.size} system${selectedLibIds.size !== 1 ? 's' : ''}`}
              </button>
            )}
          </div>

          {libResult && (
            <div className="mb-4 rounded-lg border border-primary-400/20 bg-primary-400/5 p-3">
              <p className="text-xs text-primary-400">
                Added {libResult.created} system{libResult.created !== 1 ? 's' : ''}
                {libResult.skipped > 0 && ` (${libResult.skipped} already existed)`}
              </p>
            </div>
          )}

          {/* Search + Category filter */}
          <div className="mb-4 flex items-center gap-2">
            <input
              value={libSearch}
              onChange={(e) => setLibSearch(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
              placeholder="Search tools..."
            />
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setLibCategoryFilter('')}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${!libCategoryFilter ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                All
              </button>
              {libCategories.map((cat: any) => {
                const info = LIBRARY_CATEGORIES[cat] ?? { label: cat, color: 'bg-zinc-800 text-zinc-400' }
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

          {/* Grid of tools */}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-h-[400px] overflow-y-auto pr-1">
            {filteredLib.map((sys: any) => {
              const added = existingNames.has(sys.name.toLowerCase())
              const selected = selectedLibIds.has(sys.id)
              return (
                <button
                  key={sys.id}
                  onClick={() => !added && toggleLibSelect(sys.id)}
                  disabled={added}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    added
                      ? 'border-zinc-800 bg-zinc-800/30 opacity-40 cursor-not-allowed'
                      : selected
                        ? 'border-primary-400/50 bg-primary-400/5'
                        : 'border-zinc-800 bg-zinc-800/40 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-medium text-zinc-100 truncate">{sys.name}</p>
                    {added && <span className="shrink-0 text-[10px] text-zinc-500">Added</span>}
                    {selected && <span className="shrink-0 text-[10px] text-primary-400">&#10003;</span>}
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate">{sys.vendor}{sys.description ? ` · ${sys.description}` : ''}</p>
                </button>
              )
            })}
          </div>

          {filteredLib.length === 0 && (
            <p className="py-8 text-center text-xs text-zinc-500">No tools match your search.</p>
          )}
        </div>
      )}

      {/* Systems search/filter */}
      {systems.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={systemSearch}
              onChange={(e) => setSystemSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
              placeholder="Search systems..."
            />
          </div>
          <select
            value={systemClassFilter}
            onChange={(e) => setSystemClassFilter(e.target.value)}
            className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-300 focus:border-primary-400 focus:outline-none"
          >
            <option value="">All classifications</option>
            <option value="critical">Critical</option>
            <option value="standard">Standard</option>
            <option value="low">Low</option>
          </select>
        </div>
      )}

      {/* Systems table or empty state */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        {systems.length === 0 ? (
          <div className="py-16 text-center">
            <HugeiconsIcon icon={DashboardBrowsingIcon} size={40} className="mx-auto text-zinc-600" />
            <p className="mt-4 text-base font-medium text-zinc-300">No systems registered yet</p>
            <p className="mt-1 text-sm text-zinc-500">Start by adding the tools your organization uses.</p>
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
                Add Custom System
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Classification</th>
                  <th className="px-5 py-3 font-medium">Sensitivity</th>
                  <th className="px-5 py-3 font-medium">Environment</th>
                  <th className="px-5 py-3 font-medium">MFA</th>
                  <th className="px-5 py-3 font-medium">Owner</th>
                  <th className="w-24 px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {systems
                  .filter((s) => {
                    if (systemSearch && !s.name.toLowerCase().includes(systemSearch.toLowerCase())) return false
                    if (systemClassFilter && s.classification !== systemClassFilter) return false
                    return true
                  })
                  .map((system) => (
                  <tr key={system.id} className="transition-colors hover:bg-zinc-800/30">
                    <td className="px-5 py-3">
                      <span className="font-medium text-zinc-100">{system.name}</span>
                      {(system as any).templateId && (
                        <span className="ml-2 rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">Library</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${classificationBadge(system.classification)}`}>
                        {system.classification}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-400">{system.sensitivity ?? '—'}</td>
                    <td className="px-5 py-3 text-zinc-400">{system.environment ?? '—'}</td>
                    <td className="px-5 py-3">
                      {system.mfaRequired ? (
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-primary-400" />
                      ) : (
                        <HugeiconsIcon icon={Cancel01Icon} size={16} className="text-zinc-600" />
                      )}
                    </td>
                    <td className="px-5 py-3 text-zinc-400">{system.owner ?? '—'}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingSystem(system)}
                          className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                          title="Edit system"
                        >
                          <HugeiconsIcon icon={Edit01Icon} size={14} />
                        </button>
                        <button
                          onClick={() => { setDeletingSystem(system); setDeleteSystemError(null) }}
                          className="rounded p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                          title="Remove system"
                        >
                          <HugeiconsIcon icon={Delete01Icon} size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit System Modal */}
      {editingSystem && (
        <EditSystemModal
          system={editingSystem}
          envOptions={envOptions}
          onClose={() => setEditingSystem(null)}
          onSave={(data) => {
            updateSystem.mutate(
              { systemId: editingSystem.id, ...data },
              { onSuccess: () => setEditingSystem(null) }
            )
          }}
          isPending={updateSystem.isPending}
        />
      )}

      {/* Delete System Confirmation */}
      {deletingSystem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeletingSystem(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-zinc-100">Remove System</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Are you sure you want to remove <span className="font-medium text-zinc-200">{deletingSystem.name}</span> from your library? This cannot be undone.
            </p>
            {deleteSystemError && (
              <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{deleteSystemError}</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeletingSystem(null)}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600"
              >
                Cancel
              </button>
              <button
                disabled={deleteSystem.isPending}
                onClick={() => {
                  setDeleteSystemError(null)
                  deleteSystem.mutate(deletingSystem.id, {
                    onSuccess: () => setDeletingSystem(null),
                    onError: (err: any) => setDeleteSystemError(err.message ?? 'Failed to remove system'),
                  })
                }}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-400 disabled:opacity-50"
              >
                {deleteSystem.isPending ? 'Removing…' : 'Remove System'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EditSystemModal({ system, envOptions, onClose, onSave, isPending }: {
  system: any
  envOptions: string[]
  onClose: () => void
  onSave: (data: any) => void
  isPending: boolean
}) {
  const [form, setForm] = useState({
    name: system.name ?? '',
    classification: system.classification ?? 'standard',
    sensitivity: system.sensitivity ?? '',
    environment: system.environment ?? '',
    mfaRequired: system.mfaRequired ?? false,
    owner: system.owner ?? '',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-100">Edit System</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300"><HugeiconsIcon icon={Cancel01Icon} size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Classification</label>
              <select value={form.classification} onChange={(e) => setForm({ ...form, classification: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none">
                <option value="critical">Critical</option>
                <option value="standard">Standard</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Sensitivity</label>
              <select value={form.sensitivity} onChange={(e) => setForm({ ...form, sensitivity: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none">
                <option value="">None</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Environment</label>
              <select value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none">
                <option value="">Select...</option>
                {envOptions.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Owner</label>
              <input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none" placeholder="Owner email" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={form.mfaRequired} onChange={(e) => setForm({ ...form, mfaRequired: e.target.checked })} className="rounded border-zinc-600" />
            MFA Required
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600">Cancel</button>
          <button onClick={() => onSave(form)} disabled={isPending} className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50">
            {isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── People Section ──────────────────────────────────────────────────────────

interface CsvRow {
  name: string
  email: string
  department?: string
  title?: string
  status?: string
  customFields?: Record<string, string>
}

interface CsvPreview {
  rows: CsvRow[]
  errors: { row: number; reason: string }[]
  customFieldColumns: string[]
  totalRows: number
}

function SearchableInput({ value, onChange, options, placeholder }: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const filtered = options.filter(o => o.toLowerCase().includes(value.toLowerCase()))

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
        placeholder={placeholder}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-xl">
          {filtered.map((opt) => (
            <button
              key={opt}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(opt); setOpen(false) }}
              className="w-full px-3 py-1.5 text-left text-sm text-zinc-300 hover:bg-zinc-700"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function PeopleSection({ workspaceId }: { workspaceId: string | undefined }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { users, isLoading } = useDirectoryUsers(workspaceId, {
    search,
    status: statusFilter === 'all' ? '' : statusFilter,
  })
  const createMutation = useCreateDirectoryUser(workspaceId)
  const updateMutation = useUpdateDirectoryUser(workspaceId)
  const deleteMutation = useDeleteDirectoryUser(workspaceId)
  const bulkMutation = useBulkImportDirectory(workspaceId)
  const saveCfMutation = useSaveCustomFieldValues(workspaceId)
  const { fields: customFields } = useCustomFieldDefinitions(workspaceId, 'person')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { library: empLibrary } = useEmployeeLibrary(workspaceId)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', department: '', title: '' })
  const [cfValues, setCfValues] = useState<Record<string, string>>({})

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', department: '', title: '' })

  // Portal menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const peopleMenuRef = useRef<HTMLDivElement>(null)

  const closeMenu = useCallback(() => setOpenMenuId(null), [])
  const openMenu = useCallback((userId: string, btnEl: HTMLButtonElement) => {
    if (openMenuId === userId) { closeMenu(); return }
    const rect = btnEl.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, left: rect.right - 170 })
    setOpenMenuId(userId)
  }, [openMenuId, closeMenu])

  useEffect(() => {
    if (!openMenuId) return
    const handleClickOutside = (e: MouseEvent) => {
      if (peopleMenuRef.current && !peopleMenuRef.current.contains(e.target as Node)) {
        closeMenu()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId, closeMenu])

  // CSV import state
  const [csvPreview, setCsvPreview] = useState<CsvPreview | null>(null)
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: any[] } | null>(null)

  // Derive department/title suggestions from employee library
  const departments = Array.from(new Set(empLibrary.map((e: any) => e.department).filter(Boolean)))
  const titlesForDept = form.department
    ? Array.from(new Set(empLibrary.filter((e: any) => e.department === form.department).map((e: any) => e.title).filter(Boolean)))
    : Array.from(new Set(empLibrary.map((e: any) => e.title).filter(Boolean)))

  const editTitlesForDept = editForm.department
    ? Array.from(new Set(empLibrary.filter((e: any) => e.department === editForm.department).map((e: any) => e.title).filter(Boolean)))
    : Array.from(new Set(empLibrary.map((e: any) => e.title).filter(Boolean)))

  const startEdit = (user: any) => {
    setEditingId(user.id)
    setEditForm({ name: user.name, email: user.email, department: user.department ?? '', title: user.title ?? '' })
    setOpenMenuId(null)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editForm.name.trim() || !editForm.email.trim()) return
    updateMutation.mutate(
      { userId: editingId, name: editForm.name, email: editForm.email, department: editForm.department || undefined, title: editForm.title || undefined },
      { onSuccess: () => setEditingId(null) }
    )
  }

  const handleStatusChange = (userId: string, newStatus: string) => {
    updateMutation.mutate({ userId, employmentStatus: newStatus })
    setOpenMenuId(null)
  }

  const handleDelete = (userId: string) => {
    if (!confirm('Delete this person? This cannot be undone.')) return
    deleteMutation.mutate(userId)
    setOpenMenuId(null)
  }

  // Status config
  const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
    active: { label: 'Active', badge: 'bg-green-500/10 text-green-400' },
    inactive: { label: 'Inactive', badge: 'bg-zinc-500/10 text-zinc-400' },
    on_leave: { label: 'On Leave', badge: 'bg-amber-500/10 text-amber-400' },
    terminated: { label: 'Terminated', badge: 'bg-red-500/10 text-red-400' },
  }

  const STATUS_TABS = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
    { key: 'on_leave', label: 'On Leave' },
    { key: 'terminated', label: 'Terminated' },
  ]

  const handleSubmit = () => {
    if (!form.name.trim() || !form.email.trim()) return
    createMutation.mutate(
      {
        name: form.name,
        email: form.email,
        department: form.department || undefined,
        title: form.title || undefined,
      },
      {
        onSuccess: (data: any) => {
          const userId = data?.user?.id
          if (userId && Object.keys(cfValues).length > 0) {
            saveCfMutation.mutate({ entityType: 'person', entityId: userId, values: cfValues })
          }
          setForm({ name: '', email: '', department: '', title: '' })
          setCfValues({})
          setShowForm(false)
        },
      },
    )
  }

  const knownColumns = new Set(['name', 'email', 'department', 'title', 'status'])
  const customFieldNameToId = new Map(customFields.map((f) => [f.fieldName, f.id]))

  const handleCsvFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows: CsvRow[] = []
        const errors: { row: number; reason: string }[] = []
        const customFieldColumns: string[] = []

        // Detect custom field columns from headers
        const headers = result.meta.fields ?? []
        for (const h of headers) {
          if (!knownColumns.has(h.toLowerCase()) && customFieldNameToId.has(h)) {
            customFieldColumns.push(h)
          }
        }

        for (let i = 0; i < result.data.length; i++) {
          const raw = result.data[i] as Record<string, string>
          const name = raw.name?.trim() || raw.Name?.trim() || ''
          const email = raw.email?.trim() || raw.Email?.trim() || ''

          if (!name || !email) {
            errors.push({ row: i + 1, reason: `Missing ${!name ? 'name' : 'email'}` })
            continue
          }

          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push({ row: i + 1, reason: 'Invalid email format' })
            continue
          }

          const cfMap: Record<string, string> = {}
          for (const col of customFieldColumns) {
            if (raw[col]?.trim()) {
              cfMap[col] = raw[col].trim()
            }
          }

          rows.push({
            name,
            email,
            department: raw.department?.trim() || raw.Department?.trim() || undefined,
            title: raw.title?.trim() || raw.Title?.trim() || undefined,
            status: raw.status?.trim() || raw.Status?.trim() || undefined,
            customFields: Object.keys(cfMap).length > 0 ? cfMap : undefined,
          })
        }

        setCsvPreview({ rows, errors, customFieldColumns, totalRows: result.data.length })
        setImportResult(null)
      },
    })
  }

  const handleImport = () => {
    if (!csvPreview) return

    // Map custom field names to IDs for the API
    const usersPayload = csvPreview.rows.map((row) => {
      const cf: Record<string, string> = {}
      if (row.customFields) {
        for (const [fieldName, value] of Object.entries(row.customFields)) {
          const fieldId = customFieldNameToId.get(fieldName)
          if (fieldId) cf[fieldId] = value
        }
      }
      return {
        name: row.name,
        email: row.email,
        department: row.department,
        title: row.title,
        employmentStatus: row.status,
        customFields: Object.keys(cf).length > 0 ? cf : undefined,
      }
    })

    bulkMutation.mutate(
      { users: usersPayload },
      {
        onSuccess: (data: any) => {
          setImportResult({ created: data.created, skipped: data.skipped, errors: data.errors ?? [] })
          setCsvPreview(null)
        },
      },
    )
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">People</h2>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleCsvFile(file)
              e.target.value = ''
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
          >
            <HugeiconsIcon icon={Upload04Icon} size={16} />
            Import CSV
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300"
          >
            {showForm ? <HugeiconsIcon icon={Cancel01Icon} size={16} /> : <HugeiconsIcon icon={PlusSignIcon} size={16} />}
            {showForm ? 'Cancel' : 'Add Person'}
          </button>
        </div>
      </div>

      {/* Add Person Form */}
      {showForm && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-100">New Person</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Email *</label>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="john@company.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Department</label>
              <SearchableInput
                value={form.department}
                onChange={(v) => setForm({ ...form, department: v })}
                options={departments}
                placeholder="e.g. Engineering"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Title / Role</label>
              <SearchableInput
                value={form.title}
                onChange={(v) => setForm({ ...form, title: v })}
                options={titlesForDept}
                placeholder="e.g. Software Engineer"
              />
            </div>
            <CustomFieldsForm
              workspaceId={workspaceId}
              entityType="person"
              values={cfValues}
              onChange={setCfValues}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!form.name.trim() || !form.email.trim() || createMutation.isPending}
              className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Add Person'}
            </button>
          </div>
        </div>
      )}

      {/* CSV Preview */}
      {csvPreview && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-100">CSV Import Preview</h3>
            <button onClick={() => setCsvPreview(null)} className="text-xs text-zinc-500 hover:text-zinc-300">
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>
          </div>

          <div className="mb-4 flex gap-4 text-xs">
            <span className="text-primary-400">{csvPreview.rows.length} valid rows</span>
            {csvPreview.errors.length > 0 && (
              <span className="text-red-400">{csvPreview.errors.length} errors</span>
            )}
            {csvPreview.customFieldColumns.length > 0 && (
              <span className="text-amber-400">
                Custom fields: {csvPreview.customFieldColumns.join(', ')}
              </span>
            )}
          </div>

          {/* Preview table -- first 10 rows */}
          <div className="mb-4 max-h-60 overflow-auto rounded-lg border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Department</th>
                  <th className="px-3 py-2">Title</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {csvPreview.rows.slice(0, 10).map((row, i) => (
                  <tr key={i} className="text-zinc-300">
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2">{row.email}</td>
                    <td className="px-3 py-2 text-zinc-500">{row.department ?? '—'}</td>
                    <td className="px-3 py-2 text-zinc-500">{row.title ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {csvPreview.errors.length > 0 && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
              <p className="mb-1 text-xs font-medium text-red-400">Errors (will be skipped):</p>
              {csvPreview.errors.slice(0, 5).map((err, i) => (
                <p key={i} className="text-xs text-red-300/70">
                  Row {err.row}: {err.reason}
                </p>
              ))}
              {csvPreview.errors.length > 5 && (
                <p className="text-xs text-red-300/50">...and {csvPreview.errors.length - 5} more</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setCsvPreview(null)}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-xs text-zinc-400 hover:border-zinc-600"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={csvPreview.rows.length === 0 || bulkMutation.isPending}
              className="rounded-lg bg-primary-400 px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50"
            >
              {bulkMutation.isPending ? 'Importing...' : `Import ${csvPreview.rows.length} people`}
            </button>
          </div>
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div className="rounded-xl border border-primary-400/20 bg-primary-400/5 p-4">
          <p className="text-sm text-primary-400">
            Import complete: {importResult.created} created, {importResult.skipped} skipped
            {importResult.errors.length > 0 && `, ${importResult.errors.length} errors`}
          </p>
          <button onClick={() => setImportResult(null)} className="mt-1 text-xs text-zinc-500 hover:text-zinc-300">
            Dismiss
          </button>
        </div>
      )}

      {/* Status filter tabs + Search */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === tab.key
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
            placeholder="Search by name or email..."
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        {users.length === 0 ? (
          <div className="py-12 text-center">
            <HugeiconsIcon icon={UserGroupIcon} size={32} className="mx-auto text-zinc-600" />
            <p className="mt-3 text-sm font-medium text-zinc-300">
              {statusFilter !== 'all' ? `No ${STATUS_CONFIG[statusFilter]?.label?.toLowerCase() ?? ''} people found` : 'No people in your directory yet'}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {statusFilter !== 'all' ? 'Try a different filter or add new people' : 'Add people manually or import from a CSV file'}
            </p>
            {statusFilter === 'all' && (
              <div className="mt-5 flex items-center justify-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
                >
                  <HugeiconsIcon icon={Upload04Icon} size={14} />
                  Import CSV
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-xs font-medium text-zinc-950 transition-colors hover:bg-primary-300"
                >
                  <HugeiconsIcon icon={PlusSignIcon} size={14} />
                  Add Person
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Department</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="w-10 px-2 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {users.map((user) => {
                  const isEditing = editingId === user.id
                  const userStatus = (user as any).employmentStatus ?? user.status ?? 'active'
                  const sc = STATUS_CONFIG[userStatus] ?? STATUS_CONFIG.active
                  return (
                    <tr key={user.id} className="transition-colors hover:bg-zinc-800/30">
                      {isEditing ? (
                        <>
                          <td className="px-3 py-2">
                            <input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" />
                          </td>
                          <td className="px-3 py-2">
                            <input value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none" />
                          </td>
                          <td className="px-3 py-2">
                            <SearchableInput value={editForm.department} onChange={(v) => setEditForm({...editForm, department: v})} options={departments} placeholder="Department" />
                          </td>
                          <td className="px-3 py-2">
                            <SearchableInput value={editForm.title} onChange={(v) => setEditForm({...editForm, title: v})} options={editTitlesForDept} placeholder="Title" />
                          </td>
                          <td className="px-3 py-2 text-xs text-zinc-500">{sc.label}</td>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-1">
                              <button onClick={handleSaveEdit} disabled={updateMutation.isPending} className="rounded bg-primary-400 px-2 py-1 text-xs font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50">Save</button>
                              <button onClick={() => setEditingId(null)} className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:border-zinc-600">Cancel</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-3 font-medium text-zinc-100">{user.name}</td>
                          <td className="px-5 py-3 text-zinc-400">{user.email}</td>
                          <td className="px-5 py-3 text-zinc-400">{user.department ?? '—'}</td>
                          <td className="px-5 py-3 text-zinc-400">{(user as any).title ?? '—'}</td>
                          <td className="px-5 py-3">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.badge}`}>{sc.label}</span>
                          </td>
                          <td className="relative px-2 py-3">
                            <button onClick={(e) => openMenu(user.id, e.currentTarget)} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200" title="Actions">
                              <span className="text-base leading-none">&#8942;</span>
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Portal menu */}
      {openMenuId && createPortal(
        <div ref={peopleMenuRef} style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999 }} className="min-w-[170px] overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-2xl">
          {(() => {
            const user = users.find(u => u.id === openMenuId)
            if (!user) return null
            const status = (user as any).employmentStatus ?? user.status ?? 'active'
            return (
              <>
                <button onClick={() => startEdit(user)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-300 transition-colors hover:bg-zinc-700/60">
                  <HugeiconsIcon icon={Edit01Icon} size={14} /> Edit
                </button>
                <div className="my-1 border-t border-zinc-700/50" />
                {status !== 'active' && (
                  <button onClick={() => handleStatusChange(user.id, 'active')} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-green-400 transition-colors hover:bg-zinc-700/60">Set Active</button>
                )}
                {status === 'active' && (
                  <>
                    <button onClick={() => handleStatusChange(user.id, 'inactive')} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-300 transition-colors hover:bg-zinc-700/60">Set Inactive</button>
                    <button onClick={() => handleStatusChange(user.id, 'on_leave')} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-amber-400 transition-colors hover:bg-zinc-700/60">Set On Leave</button>
                  </>
                )}
                {status !== 'terminated' && (
                  <button onClick={() => handleStatusChange(user.id, 'terminated')} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 transition-colors hover:bg-zinc-700/60">Terminate</button>
                )}
                <div className="my-1 border-t border-zinc-700/50" />
                <button onClick={() => handleDelete(user.id)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 transition-colors hover:bg-zinc-700/60">
                  <HugeiconsIcon icon={Cancel01Icon} size={14} /> Delete
                </button>
              </>
            )
          })()}
        </div>,
        document.body
      )}
    </div>
  )
}

// ── Access Records Section ──────────────────────────────────────────────────

const STATUS_LABELS: Record<AccessStatus, string> = {
  requested: 'Requested',
  approved: 'Approved',
  active: 'Active',
  pending_review: 'Pending Review',
  suspended: 'Suspended',
  expired: 'Expired',
  revoked: 'Revoked',
}

const STATUS_COLORS: Record<AccessStatus, string> = {
  requested: 'bg-blue-500/10 text-blue-400',
  approved: 'bg-amber-500/10 text-amber-400',
  active: 'bg-green-500/10 text-green-400',
  pending_review: 'bg-blue-500/10 text-blue-400',
  suspended: 'bg-orange-500/10 text-orange-400',
  expired: 'bg-yellow-500/10 text-yellow-400',
  revoked: 'bg-red-500/10 text-red-400',
}

function getActionsForStatus(status: AccessStatus): { label: string; action: string; variant: 'primary' | 'danger' | 'default' }[] {
  switch (status) {
    case 'requested':
      return [
        { label: 'Approve', action: 'approve', variant: 'primary' },
        { label: 'Revoke', action: 'revoke', variant: 'danger' },
      ]
    case 'approved':
      return [
        { label: 'Activate', action: 'activate', variant: 'primary' },
        { label: 'Revoke', action: 'revoke', variant: 'danger' },
      ]
    case 'active':
      return [
        { label: 'Review', action: 'request_review', variant: 'default' },
        { label: 'Suspend', action: 'suspend', variant: 'default' },
        { label: 'Revoke', action: 'revoke', variant: 'danger' },
      ]
    case 'pending_review':
      return [
        { label: 'Activate', action: 'activate', variant: 'primary' },
        { label: 'Revoke', action: 'revoke', variant: 'danger' },
      ]
    case 'suspended':
      return [
        { label: 'Activate', action: 'activate', variant: 'primary' },
        { label: 'Revoke', action: 'revoke', variant: 'danger' },
      ]
    case 'expired':
      return [{ label: 'Revoke', action: 'revoke', variant: 'danger' }]
    case 'revoked':
      return []
    default:
      return []
  }
}

function formatCost(record: AccessRecord): string {
  if (!record.costPerPeriod) return '—'
  const currency = record.costCurrency ?? 'USD'
  const freq = record.costFrequency === 'monthly' ? '/mo' : record.costFrequency === 'annual' ? '/yr' : ''

  // EUR uses comma for decimals, period for thousands
  if (currency === 'EUR') {
    const formatted = record.costPerPeriod.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `€${formatted}${freq}`
  }
  if (currency === 'GBP') {
    const formatted = record.costPerPeriod.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `£${formatted}${freq}`
  }
  const formatted = record.costPerPeriod.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `$${formatted}${freq}`
}

function SearchableSelect({ value, onChange, options, placeholder }: {
  value: string
  onChange: (id: string) => void
  options: { id: string; label: string; sublabel?: string }[]
  placeholder: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.id === value)
  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()) || (o.sublabel ?? '').toLowerCase().includes(query.toLowerCase()))
    : options

  return (
    <div className="relative">
      <input
        value={selected && !open ? selected.label : query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange('') }}
        onFocus={() => { setOpen(true); setQuery('') }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
        placeholder={placeholder}
      />
      {open && (
        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-xl">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-zinc-500">No matches</p>
          ) : filtered.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(opt.id); setQuery(''); setOpen(false) }}
              className={`w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-zinc-700 ${value === opt.id ? 'text-primary-400' : 'text-zinc-300'}`}
            >
              {opt.label}
              {opt.sublabel && <span className="ml-1 text-xs text-zinc-500">{opt.sublabel}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function GroupedAccessView({ records, formatCost }: { records: AccessRecord[]; formatCost: (r: AccessRecord) => string }) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  // Group records by userId
  const grouped = new Map<string, { userName: string; userEmail: string; records: AccessRecord[] }>()
  for (const r of records) {
    if (!grouped.has(r.userId)) {
      grouped.set(r.userId, { userName: r.userName, userEmail: r.userEmail, records: [] })
    }
    grouped.get(r.userId)!.records.push(r)
  }

  const groups = Array.from(grouped.entries()).sort((a, b) => b[1].records.length - a[1].records.length)

  // Compute totals per user
  const computeTotal = (recs: AccessRecord[]) => {
    let monthly = 0
    for (const r of recs) {
      if (!r.costPerPeriod) continue
      if (r.costFrequency === 'annual') monthly += r.costPerPeriod / 12
      else if (r.costFrequency === 'monthly') monthly += r.costPerPeriod
      else monthly += r.costPerPeriod // one-time treated as monthly for simplicity
    }
    return monthly
  }

  return (
    <div className="space-y-2">
      {groups.map(([userId, group]) => {
        const isExpanded = expandedUser === userId
        const totalMonthly = computeTotal(group.records)
        const activeCount = group.records.filter(r => r.status === 'active').length
        const adminCount = group.records.filter(r => r.role === 'admin').length
        const uniqueSystems = new Set(group.records.map(r => r.systemName)).size

        return (
          <div key={userId} className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            {/* Person header row */}
            <button
              onClick={() => setExpandedUser(isExpanded ? null : userId)}
              className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-zinc-800/30"
            >
              {/* Avatar circle */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-400/10 text-sm font-bold text-primary-400">
                {group.userName.charAt(0).toUpperCase()}
              </div>

              {/* Name + email */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-100">{group.userName}</p>
                <p className="text-xs text-zinc-500 truncate">{group.userEmail}</p>
              </div>

              {/* Stats badges */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                  {uniqueSystems} system{uniqueSystems !== 1 ? 's' : ''}
                </span>
                {adminCount > 0 && (
                  <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                    {adminCount} admin
                  </span>
                )}
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${activeCount === group.records.length ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {activeCount}/{group.records.length} active
                </span>
                {totalMonthly > 0 && (
                  <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                    ${totalMonthly.toFixed(0)}/mo
                  </span>
                )}
              </div>

              {/* Expand arrow */}
              <svg className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Expanded: show access records */}
            {isExpanded && (
              <div className="border-t border-zinc-800">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800/50 text-[11px] text-zinc-500">
                      <th className="px-5 py-2 font-medium">System</th>
                      <th className="px-5 py-2 font-medium">Role</th>
                      <th className="px-5 py-2 font-medium">License</th>
                      <th className="px-5 py-2 font-medium">Cost</th>
                      <th className="px-5 py-2 font-medium">Status</th>
                      <th className="px-5 py-2 font-medium">Granted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                    {group.records.map(record => (
                      <tr key={record.id} className="transition-colors hover:bg-zinc-800/20">
                        <td className="px-5 py-2.5 text-sm text-zinc-200">{record.systemName}</td>
                        <td className="px-5 py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${record.role === 'admin' ? 'bg-red-500/10 text-red-400' : record.role === 'write' ? 'bg-amber-500/10 text-amber-400' : 'bg-primary-400/10 text-primary-400'}`}>
                            {record.role}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-xs text-zinc-400">{record.licenseType ?? '\u2014'}</td>
                        <td className="px-5 py-2.5 text-xs text-zinc-400">{formatCost(record)}</td>
                        <td className="px-5 py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${record.status === 'active' ? 'bg-green-500/10 text-green-400' : record.status === 'revoked' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-xs text-zinc-500">{record.grantedAt ? new Date(record.grantedAt).toLocaleDateString() : '\u2014'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Total cost row */}
                {totalMonthly > 0 && (
                  <div className="flex justify-end border-t border-zinc-800/50 px-5 py-2">
                    <span className="text-xs text-zinc-400">
                      Total: <span className="font-medium text-zinc-200">${totalMonthly.toFixed(2)}/mo</span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {groups.length === 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-12 text-center">
          <p className="text-sm text-zinc-400">No access records found.</p>
        </div>
      )}
    </div>
  )
}

function DepartmentAccessView({ records, users, formatCost }: { records: AccessRecord[]; users: any[]; formatCost: (r: AccessRecord) => string }) {
  const [expandedDept, setExpandedDept] = useState<string | null>(null)

  // Build department map from users
  const userDeptMap = new Map(users.map((u: any) => [u.id, u.department ?? 'Unassigned']))

  // Group records by department
  const grouped = new Map<string, AccessRecord[]>()
  for (const r of records) {
    const dept = userDeptMap.get(r.userId) ?? 'Unassigned'
    if (!grouped.has(dept)) grouped.set(dept, [])
    grouped.get(dept)!.push(r)
  }

  const departments = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <div className="space-y-2">
      {departments.map(([dept, recs]) => {
        const isExpanded = expandedDept === dept
        return (
          <div key={dept} className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <button
              onClick={() => setExpandedDept(isExpanded ? null : dept)}
              className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-zinc-800/30"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-zinc-100">{dept}</span>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">{recs.length} record{recs.length !== 1 ? 's' : ''}</span>
              </div>
              <HugeiconsIcon icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon} size={14} className="text-zinc-500" />
            </button>
            {isExpanded && (
              <div className="border-t border-zinc-800">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800/50 text-[11px] text-zinc-500">
                      <th className="px-5 py-2 font-medium">Person</th>
                      <th className="px-5 py-2 font-medium">System</th>
                      <th className="px-5 py-2 font-medium">Role</th>
                      <th className="px-5 py-2 font-medium">License</th>
                      <th className="px-5 py-2 font-medium">Cost</th>
                      <th className="px-5 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                    {recs.map((r) => (
                      <tr key={r.id} className="transition-colors hover:bg-zinc-800/20">
                        <td className="px-5 py-2.5">
                          <p className="text-sm text-zinc-200">{r.userName}</p>
                          <p className="text-[11px] text-zinc-500">{r.userEmail}</p>
                        </td>
                        <td className="px-5 py-2.5 text-sm text-zinc-300">{r.systemName}</td>
                        <td className="px-5 py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.role === 'admin' ? 'bg-red-500/10 text-red-400' : r.role === 'write' ? 'bg-amber-500/10 text-amber-400' : 'bg-primary-400/10 text-primary-400'}`}>
                            {r.role}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-xs text-zinc-400">{r.licenseType ?? '—'}</td>
                        <td className="px-5 py-2.5 text-xs text-zinc-400">{formatCost(r)}</td>
                        <td className="px-5 py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.status === 'active' ? 'bg-green-500/10 text-green-400' : r.status === 'revoked' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function CustomFieldsSection({ workspaceId, values, onChange }: { workspaceId: string | undefined; values: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
  const { fields } = useCustomFieldDefinitions(workspaceId, 'access_record')
  if (fields.length === 0) return null
  return (
    <div className="border-t border-zinc-800 pt-4">
      <p className="mb-3 text-xs font-medium text-zinc-500">Custom Fields</p>
      <div className="grid grid-cols-2 gap-3">
        <CustomFieldsForm workspaceId={workspaceId} entityType="access_record" values={values} onChange={onChange} />
      </div>
    </div>
  )
}

function EditAccessModal({ record, users, systems, workspaceId, onClose, onSave, isPending }: {
  record: AccessRecord
  users: any[]
  systems: any[]
  workspaceId: string | undefined
  onClose: () => void
  onSave: (data: any) => void
  isPending: boolean
}) {
  const [form, setForm] = useState({
    role: record.role,
    approvedBy: record.approvedBy ?? '',
    ticketRef: record.ticketRef ?? '',
    status: (record.status ?? 'active') as AccessStatus,
    licenseType: record.licenseType ?? '',
    costPerPeriod: record.costPerPeriod?.toString() ?? '',
    costCurrency: record.costCurrency ?? 'USD',
    costFrequency: record.costFrequency ?? '',
  })

  const { values: existingCfValues } = useCustomFieldValues(workspaceId, 'access_record', record.id)

  // User edits layered on top of the loaded DB values — no useEffect needed.
  // cfValues is recomputed every render so it always reflects the latest DB
  // state merged with whatever the user has typed.
  const [cfOverrides, setCfOverrides] = useState<Record<string, string>>({})
  const cfValues: Record<string, string> = {
    ...Object.fromEntries(existingCfValues.map((v: any) => [v.fieldId, v.value ?? ''])),
    ...cfOverrides,
  }

  const handleSubmit = () => {
    onSave({
      role: form.role || undefined,
      approvedBy: form.approvedBy || null,
      ticketRef: form.ticketRef || undefined,
      status: form.status || undefined,
      licenseType: form.licenseType || null,
      costPerPeriod: form.costPerPeriod ? parseFloat(form.costPerPeriod) : null,
      costCurrency: form.costCurrency || undefined,
      costFrequency: form.costFrequency || null,
      // Embed CF values in the same request — no separate mutation, no race condition
      customFields: Object.keys(cfValues).length > 0 ? cfValues : undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">Edit Access Record</h3>
            <p className="text-xs text-zinc-500">Granted {new Date(record.grantedAt).toLocaleDateString()}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300"><HugeiconsIcon icon={Cancel01Icon} size={18} /></button>
        </div>

        <div className="space-y-4">
          {/* Person & System (read-only context) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Person</label>
              <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-2">
                <p className="text-sm text-zinc-200">{record.userName}</p>
                <p className="text-[11px] text-zinc-500">{record.userEmail}</p>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">System</label>
              <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-2">
                <p className="text-sm text-zinc-200">{record.systemName}</p>
              </div>
            </div>
          </div>

          {/* Role & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Role *</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none">
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="write">Write</option>
                <option value="read">Read</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Status *</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AccessStatus })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none">
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Approved By & Ticket */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Approved By</label>
              <SearchableSelect
                value={form.approvedBy}
                onChange={(v) => setForm({ ...form, approvedBy: v })}
                options={users.map((u: any) => ({ id: u.name, label: u.name, sublabel: u.title ? `${u.title} · ${u.email}` : u.email }))}
                placeholder="Search approver..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Ticket Reference</label>
              <input value={form.ticketRef} onChange={(e) => setForm({ ...form, ticketRef: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none" placeholder="e.g. JIRA-1234" />
            </div>
          </div>

          {/* Cost Details */}
          <div className="border-t border-zinc-800 pt-4">
            <p className="mb-3 text-xs font-medium text-zinc-500">Cost & License</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">License Type</label>
                <input value={form.licenseType} onChange={(e) => setForm({ ...form, licenseType: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none" placeholder="e.g. Enterprise, Pro, Basic" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Billing Frequency</label>
                <select value={form.costFrequency} onChange={(e) => setForm({ ...form, costFrequency: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none">
                  <option value="">None</option>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Cost per Period</label>
                <input type="number" value={form.costPerPeriod} onChange={(e) => setForm({ ...form, costPerPeriod: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none" placeholder="0.00" step="0.01" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Currency</label>
                <select value={form.costCurrency} onChange={(e) => setForm({ ...form, costCurrency: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="BRL">BRL</option>
                </select>
              </div>
            </div>
          </div>

          {/* Custom fields */}
          <CustomFieldsSection workspaceId={workspaceId} values={cfValues} onChange={setCfOverrides} />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600">Cancel</button>
          <button onClick={handleSubmit} disabled={isPending} className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50">
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AccessSection({ workspaceId }: { workspaceId: string | undefined }) {
  const { systems } = useSystemsList(workspaceId)
  const { users } = useDirectoryUsers(workspaceId)

  const [statusFilter, setStatusFilter] = useState('active')
  const [systemFilter, setSystemFilter] = useState('')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'list' | 'grouped' | 'department'>('list')
  const limit = 25

  const { records, total, isLoading } = useAccessRecords(workspaceId, {
    status: statusFilter,
    systemId: systemFilter,
    page,
    limit,
  })

  const createMutation = useCreateAccess(workspaceId)
  const transitionMutation = useTransitionAccess(workspaceId)
  const updateMutation = useUpdateAccessRecord(workspaceId)
  const saveCfMutation = useSaveCustomFieldValues(workspaceId)

  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AccessRecord | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ recordId: string; action: string } | null>(null)
  const [form, setForm] = useState({
    userId: '',
    systemId: '',
    role: 'read',
    approvedBy: '',
    ticketRef: '',
    status: 'active' as AccessStatus,
    licenseType: '',
    costPerPeriod: '',
    costCurrency: 'USD',
    costFrequency: '',
  })
  const [cfValues, setCfValues] = useState<Record<string, string>>({})
  // Edit form is now in EditAccessModal

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  const closeMenu = useCallback(() => setOpenMenuId(null), [])

  const openMenu = useCallback((recordId: string, btnEl: HTMLButtonElement) => {
    if (openMenuId === recordId) { closeMenu(); return }
    const rect = btnEl.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, left: rect.right - 160 })
    setOpenMenuId(recordId)
  }, [openMenuId, closeMenu])

  useEffect(() => {
    if (!openMenuId) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId, closeMenu])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const handleSubmit = () => {
    if (!form.userId || !form.systemId) return
    createMutation.mutate(
      {
        userId: form.userId,
        systemId: form.systemId,
        role: form.role,
        approvedBy: form.approvedBy || undefined,
        ticketRef: form.ticketRef || undefined,
        status: form.status,
        licenseType: form.licenseType || undefined,
        costPerPeriod: form.costPerPeriod ? parseFloat(form.costPerPeriod) : undefined,
        costCurrency: form.costCurrency || undefined,
        costFrequency: form.costFrequency || undefined,
        customFields: Object.keys(cfValues).length > 0 ? cfValues : undefined,
      },
      {
        onSuccess: () => {
          setForm({
            userId: '', systemId: '', role: 'read', approvedBy: '', ticketRef: '',
            status: 'active', licenseType: '', costPerPeriod: '', costCurrency: 'USD', costFrequency: '',
          })
          setCfValues({})
          setShowForm(false)
        },
      },
    )
  }

  const handleTransition = (recordId: string, action: string) => {
    transitionMutation.mutate(
      { recordId, action: action as any },
      { onSuccess: () => setConfirmAction(null) },
    )
  }

  const startEdit = (record: AccessRecord) => {
    setEditingRecord(record)
  }

  const riskScoreColor = (score: number) => {
    if (score > 0.7) return 'text-red-400'
    if (score > 0.4) return 'text-amber-400'
    return 'text-primary-400'
  }

  const riskScoreBg = (score: number) => {
    if (score > 0.7) return 'bg-red-500/10'
    if (score > 0.4) return 'bg-amber-500/10'
    return 'bg-primary-400/10'
  }

  const roleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-red-400'
      case 'write':
        return 'bg-amber-500/10 text-amber-400'
      case 'read':
        return 'bg-primary-400/10 text-primary-400'
      default:
        return 'bg-zinc-500/10 text-zinc-400'
    }
  }

  const actionBtnClass = (variant: 'primary' | 'danger' | 'default') => {
    switch (variant) {
      case 'primary':
        return 'border-primary-400/20 text-primary-400 hover:border-primary-400/40 hover:bg-primary-400/5'
      case 'danger':
        return 'border-red-500/20 text-red-400 hover:border-red-500/40 hover:bg-red-500/5'
      default:
        return 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Access Records</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300"
        >
          {showForm ? <HugeiconsIcon icon={Cancel01Icon} size={16} /> : <HugeiconsIcon icon={PlusSignIcon} size={16} />}
          {showForm ? 'Cancel' : 'Grant Access'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-100">Grant Access</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Person *</label>
              <SearchableSelect
                value={form.userId}
                onChange={(id) => setForm({ ...form, userId: id })}
                options={users.map((u) => ({ id: u.id, label: u.name, sublabel: u.email }))}
                placeholder="Search person..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">System *</label>
              <SearchableSelect
                value={form.systemId}
                onChange={(id) => setForm({ ...form, systemId: id })}
                options={systems.map((s) => ({ id: s.id, label: s.name }))}
                placeholder="Search system..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
              >
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="write">Write</option>
                <option value="read">Read</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as AccessStatus })}
                className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Approved By</label>
              <SearchableSelect
                value={form.approvedBy}
                onChange={(id) => setForm({ ...form, approvedBy: id })}
                options={users.map((u) => ({
                  id: u.name,
                  label: u.name,
                  sublabel: u.title ? `${u.title} · ${u.email}` : u.email,
                }))}
                placeholder="Search approver..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Ticket Reference</label>
              <input
                value={form.ticketRef}
                onChange={(e) => setForm({ ...form, ticketRef: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="e.g. JIRA-1234"
              />
            </div>
          </div>

          {/* Custom fields */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CustomFieldsForm
              workspaceId={workspaceId}
              entityType="access_record"
              values={cfValues}
              onChange={setCfValues}
            />
          </div>

          {/* Cost fields */}
          <div className="mt-4 border-t border-zinc-800 pt-4">
            <p className="mb-3 text-xs font-medium text-zinc-500">Cost Details</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">License Type</label>
                <input
                  value={form.licenseType}
                  onChange={(e) => setForm({ ...form, licenseType: e.target.value })}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                  placeholder="e.g. Enterprise, Basic"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Cost per Period</label>
                <input
                  type="number"
                  value={form.costPerPeriod}
                  onChange={(e) => setForm({ ...form, costPerPeriod: e.target.value })}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Currency</label>
                <select
                  value={form.costCurrency}
                  onChange={(e) => setForm({ ...form, costCurrency: e.target.value })}
                  className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Frequency</label>
                <select
                  value={form.costFrequency}
                  onChange={(e) => setForm({ ...form, costFrequency: e.target.value })}
                  className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
                >
                  <option value="">Select...</option>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!form.userId || !form.systemId || createMutation.isPending}
              className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Granting...' : 'Grant Access'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        {/* View mode toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('grouped')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${viewMode === 'grouped' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            By Person
          </button>
          <button
            onClick={() => setViewMode('department')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${viewMode === 'department' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            By Department
          </button>
        </div>
        <select
          value={systemFilter}
          onChange={(e) => {
            setSystemFilter(e.target.value)
            setPage(1)
          }}
          className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-300 focus:border-primary-400 focus:outline-none"
        >
          <option value="">All systems</option>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-300 focus:border-primary-400 focus:outline-none"
        >
          <option value="all">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {viewMode === 'grouped' && (
        <GroupedAccessView records={records} formatCost={formatCost} />
      )}
      {viewMode === 'department' && (
        <DepartmentAccessView records={records} users={users} formatCost={formatCost} />
      )}
      {viewMode === 'list' && <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <HugeiconsIcon icon={LoaderPinwheelIcon} size={20} className="animate-spin text-zinc-500" />
          </div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center">
            <HugeiconsIcon icon={Key01Icon} size={32} className="mx-auto text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-400">No access records found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                    <th className="px-5 py-3 font-medium">Person</th>
                    <th className="px-5 py-3 font-medium">System</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Approved By</th>
                    <th className="px-5 py-3 font-medium">Ticket</th>
                    <th className="px-5 py-3 font-medium">License</th>
                    <th className="px-5 py-3 font-medium">Cost</th>
                    <th className="px-5 py-3 font-medium">Granted</th>
                    <th className="px-5 py-3 font-medium">Risk</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="w-10 px-2 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {records.map((record) => (
                    <tr key={record.id} className="transition-colors hover:bg-zinc-800/30">
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-medium text-zinc-100">{record.userName}</p>
                          <p className="text-xs text-zinc-500">{record.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-zinc-300">{record.systemName}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge(record.role)}`}>
                          {record.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-zinc-400">{record.approvedBy ?? '—'}</td>
                      <td className="px-5 py-3 text-zinc-400">{record.ticketRef ?? '—'}</td>
                      <td className="px-5 py-3 text-zinc-400">{record.licenseType ?? '—'}</td>
                      <td className="px-5 py-3 text-zinc-400">{formatCost(record)}</td>
                      <td className="px-5 py-3 text-zinc-400">{new Date(record.grantedAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${riskScoreBg(record.riskScore)} ${riskScoreColor(record.riskScore)}`}>
                          {record.riskScore.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[record.status ?? 'active'] ?? 'bg-zinc-500/10 text-zinc-400'}`}>
                          {STATUS_LABELS[record.status ?? 'active'] ?? record.status ?? 'active'}
                        </span>
                      </td>
                      <td className="relative px-2 py-3 text-center">
                        <button
                          onClick={(e) => openMenu(record.id, e.currentTarget)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                          title="Actions"
                        >
                          <span className="text-base leading-none">&#8942;</span>
                        </button>
                      </td>
                    </tr>
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
      </div>}

      {/* Portal dropdown menu — renders outside table overflow */}
      {openMenuId && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
          className="min-w-[170px] overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-2xl"
        >
          {(() => {
            const record = records.find((r: any) => r.id === openMenuId)
            if (!record) return null
            const actions = getActionsForStatus((record.status ?? 'active') as AccessStatus)
            const variantStyles: Record<string, string> = {
              primary: 'text-primary-400',
              danger: 'text-red-400',
              default: 'text-zinc-300',
            }
            return (
              <>
                {/* Edit is always available */}
                <button
                  onClick={() => { startEdit(record); setOpenMenuId(null) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-300 transition-colors hover:bg-zinc-700/60"
                >
                  <HugeiconsIcon icon={Edit01Icon} size={14} />
                  Edit
                </button>
                {actions.length > 0 && <div className="my-1 border-t border-zinc-700/50" />}
                {actions.map((act) => (
                  <button
                    key={act.action}
                    onClick={() => { handleTransition(record.id, act.action); setOpenMenuId(null) }}
                    disabled={transitionMutation.isPending}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-zinc-700/60 ${variantStyles[act.variant] ?? 'text-zinc-300'}`}
                  >
                    {act.label}
                  </button>
                ))}
                <div className="my-1 border-t border-zinc-700/50" />
                <button
                  onClick={() => { handleTransition(record.id, 'delete'); setOpenMenuId(null) }}
                  disabled={transitionMutation.isPending}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 transition-colors hover:bg-zinc-700/60"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                  Delete
                </button>
              </>
            )
          })()}
        </div>,
        document.body
      )}

      {/* Edit Access Modal */}
      {editingRecord && (
        <EditAccessModal
          record={editingRecord}
          users={users}
          systems={systems}
          workspaceId={workspaceId}
          onClose={() => setEditingRecord(null)}
          onSave={(data) => {
            updateMutation.mutate(
              { recordId: editingRecord.id, data },
              { onSuccess: () => setEditingRecord(null) }
            )
          }}
          isPending={updateMutation.isPending}
        />
      )}
    </div>
  )
}
