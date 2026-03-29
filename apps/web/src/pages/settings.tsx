import { useState, useEffect } from 'react'
import { useParams } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Settings01Icon,
  Shield01Icon,
  UserGroupIcon,
  Link01Icon,
  Layers01Icon,
  CheckmarkCircle01Icon,
  LoaderPinwheelIcon,
  Alert02Icon,
  Mail01Icon,
  Clock01Icon,
  Key01Icon,
} from '@hugeicons/core-free-icons'
import { api } from '@/lib/api'
import { IntegrationsPage } from '@/pages/integrations'
import {
  useWorkspace,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
  useDirectInvitations,
  useCancelInvitation,
} from '@/hooks/use-workspace'
import {
  useInvitations,
  useApproveInvitation,
  useRejectInvitation,
} from '@/hooks/use-invitations'
import {
  useCustomFieldDefinitions,
  useCreateCustomField,
  useUpdateCustomField,
  useDeleteCustomField,
  useWorkspaceSetting,
  useUpdateWorkspaceSetting,
  useSystemLibrary,
  useAddFromLibrary,
  useSystemsList,
  useEmployeeLibrary,
  type CustomFieldDefinition,
} from '@/hooks/use-compliance'
import {
  useBaselineLibrary,
  useAddFromBaselineLibrary,
  useBaselines,
} from '@/hooks/use-settings'

interface Setting {
  key: string
  value: string
  updated_by: string | null
  updated_at: string
}

interface AIProvider {
  id: string
  slug: string
  name: string
  enabled: boolean
  hasAdminKey: boolean
  hasUserKey: boolean
  keySource: 'platform' | 'user'
}

function useSettings(workspaceId: string | undefined) {
  return useQuery<{ settings: Setting[] }>({
    queryKey: ['settings', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/settings`),
    enabled: !!workspaceId,
  })
}

function useUpdateSetting(workspaceId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { key: string; value: string }) =>
      api.put(`/workspaces/${workspaceId}/settings`, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settings', workspaceId] })
      // Refresh provider status when a provider key or key source is saved
      if (variables.key.startsWith('ai.provider_key.') || variables.key.startsWith('ai.key_source.')) {
        queryClient.invalidateQueries({ queryKey: ['ai-providers', workspaceId] })
      }
    },
  })
}

function useAIProviders(workspaceId: string | undefined) {
  return useQuery<{
    providers: AIProvider[]
    activeProviders: AIProvider[]
    hasActiveProvider: boolean
  }>({
    queryKey: ['ai-providers', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/settings/ai-providers`),
    enabled: !!workspaceId,
  })
}

// Model options per provider
const PROVIDER_MODELS: Record<string, string[]> = {
  anthropic: ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001', 'claude-opus-4-20250514'],
  'google-gemini': ['gemini-2.5-pro', 'gemini-2.5-flash'],
  openai: ['gpt-5', 'gpt-5-mini'],
}

// AI setting keys and their defaults
const AI_SETTINGS = [
  {
    key: 'ai.model',
    label: 'AI Model',
    description: 'The model used for the chat assistant',
    default: 'claude-sonnet-4-20250514',
    type: 'select' as const,
    options: [] as string[],
  },
  {
    key: 'ai.max_tokens',
    label: 'Max Response Tokens',
    description: 'Maximum number of tokens in AI responses',
    default: '4096',
    type: 'number' as const,
  },
  {
    key: 'ai.temperature',
    label: 'Temperature',
    description: 'Controls randomness (0.0 = deterministic, 1.0 = creative)',
    default: '0.3',
    type: 'number' as const,
  },
  {
    key: 'ai.system_prompt',
    label: 'Custom System Prompt',
    description: 'Override the default AI system prompt. Workspace context is always appended automatically.',
    default: '',
    type: 'textarea' as const,
  },
]

export function SettingsPage() {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const workspaceId = params.workspaceId
  const { workspace } = useWorkspace(workspaceId)
  const { data: settingsData, isLoading } = useSettings(workspaceId)
  const { data: aiProvidersData } = useAIProviders(workspaceId)
  const updateSetting = useUpdateSetting(workspaceId)

  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'members' | 'access-fields' | 'libraries' | 'integrations'>('members')
  const [localValues, setLocalValues] = useState<Record<string, string>>({})
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())

  // Initialize local values from server settings
  useEffect(() => {
    if (settingsData?.settings) {
      const values: Record<string, string> = {}
      for (const setting of settingsData.settings) {
        values[setting.key] = setting.value
      }
      setLocalValues(values)
    }
  }, [settingsData])

  const getValue = (key: string, defaultValue: string) =>
    localValues[key] ?? defaultValue

  const allAIProviders = aiProvidersData?.providers ?? []
  const activeAIProviders = aiProvidersData?.activeProviders ?? []
  const hasActiveAIProvider = aiProvidersData?.hasActiveProvider ?? false

  // Check effective key source per provider (local override or server value)
  const getKeySource = (p: AIProvider) =>
    (localValues[`ai.key_source.${p.slug}`] ?? p.keySource) as 'platform' | 'user'

  // A provider is "ready" if it has a key available based on key source
  const isProviderReady = (p: AIProvider) => {
    const source = getKeySource(p)
    if (source === 'platform') return p.hasAdminKey
    return p.hasUserKey
  }

  // Only show models for providers that are active AND have a key available
  const modelOptions: string[] = []
  for (const p of activeAIProviders) {
    if (isProviderReady(p)) {
      modelOptions.push(...(PROVIDER_MODELS[p.slug] ?? []))
    }
  }

  // Providers where user needs to provide a key (key_source=user, or platform but no admin key)
  const providersNeedingKey = activeAIProviders.filter(
    (p) => getKeySource(p) === 'user' || !p.hasAdminKey
  )

  const handleSave = async (key: string, value: string) => {
    await updateSetting.mutateAsync({ key, value })
    setSavedKeys((prev) => new Set([...prev, key]))
    setTimeout(() => setSavedKeys((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    }), 2000)
  }

  const tabs = [
    { id: 'members' as const, label: 'Members', icon: UserGroupIcon },
    { id: 'libraries' as const, label: 'Libraries', icon: Layers01Icon },
    { id: 'integrations' as const, label: 'Integrations', icon: Link01Icon },
    { id: 'access-fields' as const, label: 'Custom Fields', icon: Key01Icon },
    { id: 'ai' as const, label: 'AI Configuration', icon: Shield01Icon },
    { id: 'general' as const, label: 'General', icon: Settings01Icon },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Configure workspace settings for {workspace?.name ?? 'your workspace'}.
        </p>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-1 rounded-lg bg-zinc-900 p-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <HugeiconsIcon icon={tab.icon} size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* AI Configuration Tab */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-zinc-100">AI Assistant Configuration</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Configure the AI model, behavior, and system prompt for the chat assistant.
              These settings affect all users in this workspace.
            </p>

            {isLoading ? (
              <div className="mt-6 flex justify-center">
                <HugeiconsIcon icon={LoaderPinwheelIcon} size={24} className="animate-spin text-zinc-500" />
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {AI_SETTINGS.map((setting) => {
                  const currentValue = getValue(setting.key, setting.default)
                  const isSaved = savedKeys.has(setting.key)
                  const effectiveOptions =
                    (setting.key === 'ai.model' ? modelOptions : setting.options) ?? []

                  return (
                    <div key={setting.key} className="border-b border-zinc-800 pb-6 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <label className="text-sm font-medium text-zinc-200">{setting.label}</label>
                          <p className="mt-0.5 text-xs text-zinc-500">{setting.description}</p>
                        </div>
                        {isSaved && (
                          <span className="flex items-center gap-1 text-xs text-primary-400">
                            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                            Saved
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-end gap-3">
                        {setting.type === 'select' ? (
                          <select
                            value={currentValue}
                            onChange={(e) =>
                              setLocalValues((prev) => ({ ...prev, [setting.key]: e.target.value }))
                            }
                            disabled={effectiveOptions.length === 0}
                            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
                          >
                            {effectiveOptions?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : setting.type === 'textarea' ? (
                          <textarea
                            value={currentValue}
                            onChange={(e) =>
                              setLocalValues((prev) => ({ ...prev, [setting.key]: e.target.value }))
                            }
                            rows={6}
                            placeholder="Leave empty to use the default system prompt. Workspace context is always appended."
                            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-primary-400 focus:outline-none"
                          />
                        ) : (
                          <input
                            type="text"
                            value={currentValue}
                            onChange={(e) =>
                              setLocalValues((prev) => ({ ...prev, [setting.key]: e.target.value }))
                            }
                            className="w-32 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
                          />
                        )}

                        <button
                          onClick={() => handleSave(setting.key, currentValue)}
                          disabled={updateSetting.isPending}
                          className="shrink-0 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>

                      {setting.default && (
                        <p className="mt-2 text-xs text-zinc-600">
                          Default: <code className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-500">{setting.default}</code>
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Provider API Keys & Key Source */}
          {activeAIProviders.length > 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Key01Icon} size={18} className="text-zinc-400" />
                <h2 className="text-lg font-semibold text-zinc-100">API Keys</h2>
              </div>
              <p className="mt-1 text-sm text-zinc-400">
                Choose whether each provider uses the platform key (set by admin) or a workspace-specific key.
              </p>

              <div className="mt-4 space-y-5">
                {activeAIProviders.map((provider) => {
                  const sourceKey = `ai.key_source.${provider.slug}`
                  const keySettingKey = `ai.provider_key.${provider.slug}`
                  const currentSource = getKeySource(provider)
                  const currentKey = getValue(keySettingKey, '')
                  const isKeySaved = savedKeys.has(keySettingKey)
                  const isSourceSaved = savedKeys.has(sourceKey)

                  return (
                    <div key={provider.slug} className="border-b border-zinc-800 pb-5 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${
                            isProviderReady(provider) ? 'bg-primary-400' : 'bg-zinc-600'
                          }`} />
                          <label className="text-sm font-medium text-zinc-200">{provider.name}</label>
                          {(isSourceSaved || isKeySaved) && (
                            <span className="flex items-center gap-1 text-xs text-primary-400">
                              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                              Saved
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Key source toggle */}
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setLocalValues((prev) => ({ ...prev, [sourceKey]: 'platform' }))
                            handleSave(sourceKey, 'platform')
                          }}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            currentSource === 'platform'
                              ? 'bg-primary-400/15 text-primary-400 border border-primary-400/30'
                              : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:text-zinc-300'
                          }`}
                        >
                          Use platform key
                        </button>
                        <button
                          onClick={() => {
                            setLocalValues((prev) => ({ ...prev, [sourceKey]: 'user' }))
                            handleSave(sourceKey, 'user')
                          }}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            currentSource === 'user'
                              ? 'bg-blue-400/15 text-blue-400 border border-blue-400/30'
                              : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:text-zinc-300'
                          }`}
                        >
                          Use own key
                        </button>
                      </div>

                      {/* Status / key input based on source */}
                      {currentSource === 'platform' ? (
                        <p className="mt-2 text-xs text-zinc-500">
                          {provider.hasAdminKey
                            ? 'Using the API key configured by the platform admin.'
                            : 'No platform key configured. Ask a super admin to set it in Admin > Providers.'}
                        </p>
                      ) : (
                        <div className="mt-2">
                          <p className="text-xs text-zinc-500 mb-2">
                            {provider.hasUserKey
                              ? 'Using your workspace API key.'
                              : 'Enter your own API key for this provider.'}
                          </p>
                          <div className="flex items-end gap-3">
                            <input
                              type="password"
                              value={currentKey}
                              onChange={(e) =>
                                setLocalValues((prev) => ({ ...prev, [keySettingKey]: e.target.value }))
                              }
                              placeholder="sk-..."
                              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-primary-400 focus:outline-none"
                            />
                            <button
                              onClick={() => handleSave(keySettingKey, currentKey)}
                              disabled={updateSetting.isPending}
                              className="shrink-0 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
              <div className="flex items-start gap-3">
                <HugeiconsIcon icon={Alert02Icon} size={16} className="mt-0.5 shrink-0 text-zinc-500" />
                <div>
                  <p className="text-sm font-medium text-zinc-300">AI Providers</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    No AI provider is active in Admin {' > '} Providers.
                    Enable at least one provider there first.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* General Tab */}
      {activeTab === 'general' && (
        <GeneralSettingsTab workspaceId={workspaceId} workspace={workspace} />
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <MembersTab workspaceId={workspaceId} />
      )}

      {/* Access Fields Tab */}
      {activeTab === 'access-fields' && (
        <AccessFieldsTab workspaceId={workspaceId} />
      )}

      {/* Libraries Tab */}
      {activeTab === 'libraries' && (
        <LibrariesTab workspaceId={workspaceId} />
      )}

      {activeTab === 'integrations' && (
        <IntegrationsPage />
      )}
    </div>
  )
}

// ── Members Tab Component ──────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-primary-400/10 text-primary-400',
  admin: 'bg-blue-500/10 text-blue-400',
  auditor: 'bg-purple-500/10 text-purple-400',
  member: 'bg-zinc-700/50 text-zinc-300',
  viewer: 'bg-zinc-800 text-zinc-500',
}

// ── General Settings Tab ────────────────────────────────────────────────────

function GeneralSettingsTab({ workspaceId, workspace }: { workspaceId: string | undefined; workspace: any }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '' })
  const [saved, setSaved] = useState(false)

  const updateMut = useMutation({
    mutationFn: (payload: { name?: string; slug?: string }) =>
      api.patch(`/workspaces/${workspaceId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] })
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const startEdit = () => {
    setForm({ name: workspace?.name ?? '', slug: workspace?.slug ?? '' })
    setEditing(true)
  }

  return (
    <div className="space-y-6">
      {/* Workspace info */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Workspace Details</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Your workspace name and identifier</p>
          </div>
          {!editing && (
            <button
              onClick={startEdit}
              className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
            >
              <HugeiconsIcon icon={Settings01Icon} size={14} />
              Edit
            </button>
          )}
        </div>

        {saved && (
          <div className="mb-4 rounded-lg border border-primary-400/20 bg-primary-400/5 p-2.5">
            <p className="text-xs text-primary-400 flex items-center gap-1">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
              Workspace updated successfully
            </p>
          </div>
        )}

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-200">Workspace Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
                placeholder="Your workspace name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-200">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
                placeholder="your-workspace-slug"
              />
              <p className="mt-1 text-[10px] text-zinc-500">Used in URLs and the Trust Center. Only lowercase letters, numbers, and hyphens.</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600"
              >
                Cancel
              </button>
              <button
                onClick={() => updateMut.mutate({ name: form.name, slug: form.slug })}
                disabled={!form.name.trim() || !form.slug.trim() || updateMut.isPending}
                className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
              >
                {updateMut.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3">
              <span className="text-sm text-zinc-400">Name</span>
              <span className="text-sm font-medium text-zinc-100">{workspace?.name ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3">
              <span className="text-sm text-zinc-400">Slug</span>
              <code className="rounded bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300">{workspace?.slug ?? '—'}</code>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3">
              <span className="text-sm text-zinc-400">Plan</span>
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                workspace?.plan === 'enterprise' ? 'bg-primary-400/10 text-primary-400' :
                workspace?.plan === 'pro' ? 'bg-blue-500/10 text-blue-400' :
                workspace?.plan === 'starter' ? 'bg-amber-500/10 text-amber-400' :
                'bg-zinc-800 text-zinc-400'
              }`}>
                {workspace?.plan ?? 'free'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3">
              <span className="text-sm text-zinc-400">Created</span>
              <span className="text-xs text-zinc-500">{workspace?.createdAt ? new Date(workspace.createdAt).toLocaleString() : '—'}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3">
              <span className="text-sm text-zinc-400">Workspace ID</span>
              <code className="rounded bg-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">{workspaceId}</code>
            </div>
          </div>
        )}
      </div>

      {/* Organization Details */}
      <OrganizationSection workspaceId={workspaceId} workspace={workspace} />

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
        <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
        <p className="mt-1 text-xs text-zinc-500">These actions are irreversible. Please be certain.</p>
        <div className="mt-4">
          <button
            disabled
            className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 opacity-50 cursor-not-allowed"
          >
            Delete Workspace
          </button>
          <p className="mt-1 text-[10px] text-zinc-600">Contact a super admin to delete this workspace.</p>
        </div>
      </div>
    </div>
  )
}

const ASSIGNABLE_ROLES = ['admin', 'auditor', 'member', 'viewer']

// ── Organization Section ───────────────────────────────────────────────────

function OrganizationSection({ workspaceId, workspace }: { workspaceId: string | undefined; workspace: any }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    orgAddress: '', orgIndustry: '', orgSize: '', orgWebsite: '', orgRegistrationId: '',
    securityOfficerName: '', securityOfficerEmail: '', securityOfficerPhone: '',
    dpoName: '', dpoEmail: '', dpoPhone: '',
    legalRepName: '', legalRepEmail: '',
  })

  const updateMut = useMutation({
    mutationFn: (payload: Record<string, string>) =>
      api.patch(`/workspaces/${workspaceId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] })
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const startEdit = () => {
    setForm({
      orgAddress: workspace?.orgAddress ?? '',
      orgIndustry: workspace?.orgIndustry ?? '',
      orgSize: workspace?.orgSize ?? '',
      orgWebsite: workspace?.orgWebsite ?? '',
      orgRegistrationId: workspace?.orgRegistrationId ?? '',
      securityOfficerName: workspace?.securityOfficerName ?? '',
      securityOfficerEmail: workspace?.securityOfficerEmail ?? '',
      securityOfficerPhone: workspace?.securityOfficerPhone ?? '',
      dpoName: workspace?.dpoName ?? '',
      dpoEmail: workspace?.dpoEmail ?? '',
      dpoPhone: workspace?.dpoPhone ?? '',
      legalRepName: workspace?.legalRepName ?? '',
      legalRepEmail: workspace?.legalRepEmail ?? '',
    })
    setEditing(true)
  }

  const handleSave = () => {
    const payload: Record<string, string> = {}
    for (const [key, val] of Object.entries(form)) {
      if (val) payload[key] = val
    }
    updateMut.mutate(payload)
  }

  const inputClass = 'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none'

  const InfoRow = ({ label, value }: { label: string; value: string | undefined }) => (
    <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-2.5">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className="text-sm text-zinc-100">{value || '—'}</span>
    </div>
  )

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Organization Details</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Company information used in audit reports and compliance documentation</p>
        </div>
        {!editing && (
          <button onClick={startEdit} className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-600 hover:text-zinc-100">
            <HugeiconsIcon icon={Settings01Icon} size={14} /> Edit
          </button>
        )}
      </div>

      {saved && (
        <div className="mb-4 rounded-lg border border-primary-400/20 bg-primary-400/5 p-2.5">
          <p className="text-xs text-primary-400 flex items-center gap-1">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} /> Organization details updated
          </p>
        </div>
      )}

      {editing ? (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Company Information</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="mb-1 block text-xs text-zinc-400">Address</label><input value={form.orgAddress} onChange={e => setForm({ ...form, orgAddress: e.target.value })} placeholder="Street, City, State, Postal Code, Country" className={inputClass} /></div>
              <div><label className="mb-1 block text-xs text-zinc-400">Industry</label><input value={form.orgIndustry} onChange={e => setForm({ ...form, orgIndustry: e.target.value })} placeholder="e.g. Technology, Healthcare, Finance" className={inputClass} /></div>
              <div><label className="mb-1 block text-xs text-zinc-400">Company Size</label><input value={form.orgSize} onChange={e => setForm({ ...form, orgSize: e.target.value })} placeholder="e.g. 50-200 employees" className={inputClass} /></div>
              <div><label className="mb-1 block text-xs text-zinc-400">Website</label><input value={form.orgWebsite} onChange={e => setForm({ ...form, orgWebsite: e.target.value })} placeholder="https://example.com" className={inputClass} /></div>
              <div><label className="mb-1 block text-xs text-zinc-400">Registration / Company ID</label><input value={form.orgRegistrationId} onChange={e => setForm({ ...form, orgRegistrationId: e.target.value })} placeholder="e.g. CIF, EIN, Company Number" className={inputClass} /></div>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Security Officer / CISO</p>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="mb-1 block text-xs text-zinc-400">Name</label><input value={form.securityOfficerName} onChange={e => setForm({ ...form, securityOfficerName: e.target.value })} className={inputClass} /></div>
              <div><label className="mb-1 block text-xs text-zinc-400">Email</label><input type="email" value={form.securityOfficerEmail} onChange={e => setForm({ ...form, securityOfficerEmail: e.target.value })} className={inputClass} /></div>
              <div><label className="mb-1 block text-xs text-zinc-400">Phone</label><input value={form.securityOfficerPhone} onChange={e => setForm({ ...form, securityOfficerPhone: e.target.value })} className={inputClass} /></div>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Data Protection Officer (DPO)</p>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="mb-1 block text-xs text-zinc-400">Name</label><input value={form.dpoName} onChange={e => setForm({ ...form, dpoName: e.target.value })} className={inputClass} /></div>
              <div><label className="mb-1 block text-xs text-zinc-400">Email</label><input type="email" value={form.dpoEmail} onChange={e => setForm({ ...form, dpoEmail: e.target.value })} className={inputClass} /></div>
              <div><label className="mb-1 block text-xs text-zinc-400">Phone</label><input value={form.dpoPhone} onChange={e => setForm({ ...form, dpoPhone: e.target.value })} className={inputClass} /></div>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Legal Representative</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-xs text-zinc-400">Name</label><input value={form.legalRepName} onChange={e => setForm({ ...form, legalRepName: e.target.value })} className={inputClass} /></div>
              <div><label className="mb-1 block text-xs text-zinc-400">Email</label><input type="email" value={form.legalRepEmail} onChange={e => setForm({ ...form, legalRepEmail: e.target.value })} className={inputClass} /></div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditing(false)} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600">Cancel</button>
            <button onClick={handleSave} disabled={updateMut.isPending} className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50">{updateMut.isPending ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Company</p>
            <div className="space-y-1">
              <InfoRow label="Address" value={workspace?.orgAddress} />
              <InfoRow label="Industry" value={workspace?.orgIndustry} />
              <InfoRow label="Size" value={workspace?.orgSize} />
              <InfoRow label="Website" value={workspace?.orgWebsite} />
              <InfoRow label="Registration ID" value={workspace?.orgRegistrationId} />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Security Officer</p>
            <div className="space-y-1">
              <InfoRow label="Name" value={workspace?.securityOfficerName} />
              <InfoRow label="Email" value={workspace?.securityOfficerEmail} />
              <InfoRow label="Phone" value={workspace?.securityOfficerPhone} />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">DPO</p>
            <div className="space-y-1">
              <InfoRow label="Name" value={workspace?.dpoName} />
              <InfoRow label="Email" value={workspace?.dpoEmail} />
              <InfoRow label="Phone" value={workspace?.dpoPhone} />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Legal Representative</p>
            <div className="space-y-1">
              <InfoRow label="Name" value={workspace?.legalRepName} />
              <InfoRow label="Email" value={workspace?.legalRepEmail} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MembersTab({ workspaceId }: { workspaceId: string | undefined }) {
  const { members, role } = useWorkspace(workspaceId)
  const userId = localStorage.getItem('userId')

  // Invitation requests (user-initiated)
  const { data: invitationsData, isLoading: invLoading } = useInvitations(workspaceId)
  const approveInvitation = useApproveInvitation(workspaceId)
  const rejectInvitation = useRejectInvitation(workspaceId)
  const pendingRequests = invitationsData?.invitations?.filter((i) => i.status === 'pending') ?? []

  // Direct invitations (admin-sent)
  const { invitations: directInvitations } = useDirectInvitations(workspaceId)
  const inviteMember = useInviteMember(workspaceId)
  const cancelInvitation = useCancelInvitation(workspaceId)

  // Member management
  const updateRole = useUpdateMemberRole(workspaceId)
  const removeMember = useRemoveMember(workspaceId)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [inviteError, setInviteError] = useState('')

  // Settings
  const { data: settingsData } = useQuery<{ settings: Array<{ key: string; value: string }> }>({
    queryKey: ['settings', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/settings`),
    enabled: !!workspaceId,
  })
  const queryClient = useQueryClient()
  const updateSetting = useMutation({
    mutationFn: (payload: { key: string; value: string }) =>
      api.put(`/workspaces/${workspaceId}/settings`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', workspaceId] })
    },
  })
  const allowInvitations =
    settingsData?.settings?.find((s) => s.key === 'allow_invitation_requests')?.value !== 'false'

  const isAdmin = role === 'admin' || role === 'owner'

  const handleInvite = () => {
    if (!inviteEmail.trim()) return
    setInviteError('')
    setInviteSuccess('')
    inviteMember.mutate(
      { email: inviteEmail.trim(), role: inviteRole },
      {
        onSuccess: () => {
          setInviteSuccess(`Invitation sent to ${inviteEmail}`)
          setInviteEmail('')
          setInviteRole('member')
        },
        onError: (err) => {
          setInviteError(err.message || 'Failed to send invitation')
        },
      },
    )
  }

  const handleRoleChange = (memberId: string, newRole: string) => {
    updateRole.mutate({ memberId, role: newRole })
  }

  const handleRemove = (memberId: string) => {
    removeMember.mutate(memberId, {
      onSuccess: () => setConfirmRemove(null),
    })
  }

  return (
    <div className="space-y-5">
      {/* ── Invite Form (admin+) ── */}
      {isAdmin && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-1 text-sm font-semibold text-zinc-100">Invite Member</h2>
          <p className="mb-4 text-xs text-zinc-500">Send an email invitation to join this workspace.</p>

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-zinc-400">Email address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => { setInviteEmail(e.target.value); setInviteError(''); setInviteSuccess('') }}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                placeholder="colleague@company.com"
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              />
            </div>
            <div className="w-36">
              <label className="mb-1 block text-xs text-zinc-400">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleInvite}
              disabled={!inviteEmail.trim() || inviteMember.isPending}
              className="rounded-lg bg-primary-400 px-5 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
            >
              {inviteMember.isPending ? 'Sending...' : 'Send Invite'}
            </button>
          </div>

          {inviteSuccess && (
            <p className="mt-2 flex items-center gap-1 text-xs text-primary-400">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} /> {inviteSuccess}
            </p>
          )}
          {inviteError && (
            <p className="mt-2 flex items-center gap-1 text-xs text-red-400">
              <HugeiconsIcon icon={Alert02Icon} size={12} /> {inviteError}
            </p>
          )}
        </div>
      )}

      {/* ── Pending Direct Invitations (admin+) ── */}
      {isAdmin && directInvitations.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold text-zinc-100">Pending Invitations</h2>
          <p className="mt-0.5 mb-4 text-xs text-zinc-500">{directInvitations.length} invitation{directInvitations.length !== 1 ? 's' : ''} awaiting response</p>

          <div className="space-y-2">
            {directInvitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <HugeiconsIcon icon={Mail01Icon} size={16} className="text-zinc-500" />
                  <div>
                    <p className="text-sm text-zinc-200">{inv.email}</p>
                    <p className="text-xs text-zinc-500">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${ROLE_COLORS[inv.role] ?? 'bg-zinc-800 text-zinc-400'}`}>{inv.role}</span>
                      {' · '}Expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => cancelInvitation.mutate(inv.id)}
                  disabled={cancelInvitation.isPending}
                  className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-red-500/30 hover:text-red-400 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Invitation Requests (admin+) ── */}
      {isAdmin && pendingRequests.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold text-zinc-100">Join Requests</h2>
          <p className="mt-0.5 mb-4 text-xs text-zinc-500">{pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}</p>

          <div className="space-y-2">
            {pendingRequests.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-xs font-medium text-zinc-300">
                    {inv.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{inv.name}</p>
                    <p className="text-xs text-zinc-500">{inv.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-600">{new Date(inv.createdAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => rejectInvitation.mutate(inv.id)}
                    disabled={rejectInvitation.isPending}
                    className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:bg-zinc-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => approveInvitation.mutate(inv.id)}
                    disabled={approveInvitation.isPending}
                    className="rounded-lg bg-primary-400 px-3 py-1 text-xs font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Allow Invitation Requests Toggle (admin+) ── */}
      {isAdmin && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-zinc-200">Allow join requests</h3>
              <p className="mt-0.5 text-xs text-zinc-500">Let users with matching email domains request to join</p>
            </div>
            <button
              onClick={() => updateSetting.mutate({ key: 'allow_invitation_requests', value: allowInvitations ? 'false' : 'true' })}
              disabled={updateSetting.isPending}
              className={`relative h-6 w-11 rounded-full transition-colors ${allowInvitations ? 'bg-primary-400' : 'bg-zinc-700'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${allowInvitations ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      )}

      {/* ── Members List ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-sm font-semibold text-zinc-100">Members</h2>
        <p className="mt-0.5 mb-4 text-xs text-zinc-500">{members.length} member{members.length !== 1 ? 's' : ''}</p>

        <div className="space-y-2">
          {members.map((member) => {
            const isSelf = member.userId === userId
            const isOwner = member.role === 'owner'
            const canEdit = isAdmin && !isOwner && !isSelf

            return (
              <div key={member.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-800/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-zinc-600 to-zinc-700 text-xs font-medium text-zinc-200">
                    {member.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      {member.name}
                      {isSelf && <span className="ml-1.5 text-[10px] text-zinc-500">(you)</span>}
                    </p>
                    <p className="text-xs text-zinc-500">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {canEdit ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      disabled={updateRole.isPending}
                      className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 focus:border-primary-400 focus:outline-none"
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_COLORS[member.role] ?? 'bg-zinc-800 text-zinc-400'}`}>
                      {member.role}
                    </span>
                  )}

                  {canEdit && (
                    confirmRemove === member.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRemove(member.id)}
                          disabled={removeMember.isPending}
                          className="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20"
                        >
                          {removeMember.isPending ? '...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmRemove(null)}
                          className="rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-400"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRemove(member.id)}
                        className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-500 transition-colors hover:border-red-500/30 hover:text-red-400"
                      >
                        Remove
                      </button>
                    )
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Access Fields Tab Component ─────────────────────────────────────────────

const ENTITY_TYPES = [
  { value: 'person' as const, label: 'People' },
  { value: 'system' as const, label: 'Systems' },
  { value: 'access_record' as const, label: 'Access Records' },
]

const FIELD_TYPES = [
  { value: 'text' as const, label: 'Text' },
  { value: 'number' as const, label: 'Number' },
  { value: 'select' as const, label: 'Select (dropdown)' },
  { value: 'date' as const, label: 'Date' },
  { value: 'boolean' as const, label: 'Yes/No' },
]

function AccessFieldsTab({ workspaceId }: { workspaceId: string | undefined }) {
  const { fields, isLoading } = useCustomFieldDefinitions(workspaceId)
  const createMutation = useCreateCustomField(workspaceId)
  const deleteMutation = useDeleteCustomField(workspaceId)
  const updateSettingMutation = useUpdateWorkspaceSetting(workspaceId)

  // Environment options
  const { value: envSettingRaw } = useWorkspaceSetting(workspaceId, 'system_environments')
  const envOptions: string[] = envSettingRaw
    ? (() => { try { return JSON.parse(envSettingRaw) } catch { return [] } })()
    : ['Production', 'Staging', 'Development', 'Testing']
  const [envInput, setEnvInput] = useState('')
  const [localEnvs, setLocalEnvs] = useState<string[] | null>(null)

  const displayEnvs = localEnvs ?? envOptions

  const addEnv = () => {
    if (!envInput.trim()) return
    const updated = [...displayEnvs, envInput.trim()]
    setLocalEnvs(updated)
    updateSettingMutation.mutate({ key: 'system_environments', value: JSON.stringify(updated) })
    setEnvInput('')
  }

  const removeEnv = (idx: number) => {
    const updated = displayEnvs.filter((_, i) => i !== idx)
    setLocalEnvs(updated)
    updateSettingMutation.mutate({ key: 'system_environments', value: JSON.stringify(updated) })
  }

  // New field form
  const [showFieldForm, setShowFieldForm] = useState(false)
  const [fieldForm, setFieldForm] = useState({
    entityType: 'person' as 'person' | 'system' | 'access_record',
    fieldName: '',
    fieldLabel: '',
    fieldType: 'text' as 'text' | 'number' | 'select' | 'date' | 'boolean',
    fieldOptions: '',
    required: false,
  })

  const handleCreateField = () => {
    if (!fieldForm.fieldName.trim() || !fieldForm.fieldLabel.trim()) return
    createMutation.mutate(
      {
        entityType: fieldForm.entityType,
        fieldName: fieldForm.fieldName.replace(/\s+/g, '_').toLowerCase(),
        fieldLabel: fieldForm.fieldLabel,
        fieldType: fieldForm.fieldType,
        fieldOptions: fieldForm.fieldType === 'select'
          ? fieldForm.fieldOptions.split(',').map((o) => o.trim()).filter(Boolean)
          : undefined,
        required: fieldForm.required,
      },
      {
        onSuccess: () => {
          setFieldForm({ entityType: 'person', fieldName: '', fieldLabel: '', fieldType: 'text', fieldOptions: '', required: false })
          setShowFieldForm(false)
        },
      },
    )
  }

  // Group fields by entity type
  const grouped = ENTITY_TYPES.map((et) => ({
    ...et,
    fields: fields.filter((f) => f.entityType === et.value),
  }))

  return (
    <div className="space-y-6">
      {/* Environment Options */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-zinc-100">System Environment Options</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Configure the environment values available in the Systems dropdown.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {displayEnvs.map((env, idx) => (
            <span
              key={idx}
              className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
            >
              {env}
              <button
                onClick={() => removeEnv(idx)}
                className="text-zinc-500 hover:text-red-400"
              >
                x
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={envInput}
            onChange={(e) => setEnvInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addEnv()}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
            placeholder="New environment..."
          />
          <button
            onClick={addEnv}
            disabled={!envInput.trim()}
            className="rounded-lg bg-primary-400 px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Custom Fields */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Custom Fields</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Define custom fields for People, Systems, and Access Records.
            </p>
          </div>
          <button
            onClick={() => setShowFieldForm(!showFieldForm)}
            className="flex items-center gap-2 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-primary-300"
          >
            {showFieldForm ? 'Cancel' : 'Add Field'}
          </button>
        </div>

        {showFieldForm && (
          <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Entity Type *</label>
                <select
                  value={fieldForm.entityType}
                  onChange={(e) => setFieldForm({ ...fieldForm, entityType: e.target.value as any })}
                  className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
                >
                  {ENTITY_TYPES.map((et) => (
                    <option key={et.value} value={et.value}>{et.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Field Label *</label>
                <input
                  value={fieldForm.fieldLabel}
                  onChange={(e) => {
                    setFieldForm({
                      ...fieldForm,
                      fieldLabel: e.target.value,
                      fieldName: e.target.value.replace(/\s+/g, '_').toLowerCase(),
                    })
                  }}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                  placeholder="e.g. Team, License Tier"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Field Type *</label>
                <select
                  value={fieldForm.fieldType}
                  onChange={(e) => setFieldForm({ ...fieldForm, fieldType: e.target.value as any })}
                  className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
                >
                  {FIELD_TYPES.map((ft) => (
                    <option key={ft.value} value={ft.value}>{ft.label}</option>
                  ))}
                </select>
              </div>
              {fieldForm.fieldType === 'select' && (
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs text-zinc-400">Options (comma-separated)</label>
                  <input
                    value={fieldForm.fieldOptions}
                    onChange={(e) => setFieldForm({ ...fieldForm, fieldOptions: e.target.value })}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
                    placeholder="e.g. Engineering, Marketing, Sales"
                  />
                </div>
              )}
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={fieldForm.required}
                    onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })}
                    className="rounded border-zinc-600 bg-zinc-800 text-primary-400 focus:ring-primary-400"
                  />
                  Required
                </label>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleCreateField}
                disabled={!fieldForm.fieldLabel.trim() || createMutation.isPending}
                className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-primary-300 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Field'}
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <HugeiconsIcon icon={LoaderPinwheelIcon} size={20} className="animate-spin text-zinc-500" />
          </div>
        ) : fields.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No custom fields defined yet.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {grouped
              .filter((g) => g.fields.length > 0)
              .map((group) => (
                <div key={group.value}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {group.label}
                  </h3>
                  <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
                    {group.fields.map((field) => (
                      <div key={field.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-zinc-200">{field.fieldLabel}</p>
                          <p className="text-xs text-zinc-500">
                            {field.fieldName} &middot; {field.fieldType}
                            {field.required && ' &middot; required'}
                            {field.fieldOptions && ` &middot; ${field.fieldOptions.length} options`}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm(`Delete custom field "${field.fieldLabel}"? This will remove all values.`)) {
                              deleteMutation.mutate(field.id)
                            }
                          }}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Libraries Tab Component ───────────────────────────────────────────────────

type LibSubTab = 'systems' | 'baselines' | 'roles'

function LibrariesTab({ workspaceId }: { workspaceId: string | undefined }) {
  const [subTab, setSubTab] = useState<LibSubTab>('systems')

  const SUB_TABS: { id: LibSubTab; label: string }[] = [
    { id: 'systems', label: 'Systems' },
    { id: 'baselines', label: 'Baselines' },
    { id: 'roles', label: 'Departments & Roles' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-800/50 p-1">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              subTab === t.id ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'systems' && <SystemsLibraryTab workspaceId={workspaceId} />}
      {subTab === 'baselines' && <BaselinesLibraryTab workspaceId={workspaceId} />}
      {subTab === 'roles' && <RolesLibraryTab workspaceId={workspaceId} />}
    </div>
  )
}

// ── Systems Library Tab Component ─────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  identity: { label: 'Identity & Access', color: 'bg-blue-500/10 text-blue-400' },
  cloud: { label: 'Cloud Infrastructure', color: 'bg-purple-500/10 text-purple-400' },
  devops: { label: 'DevOps & Development', color: 'bg-amber-500/10 text-amber-400' },
  communication: { label: 'Communication', color: 'bg-primary-400/10 text-primary-400' },
  project: { label: 'Project Management', color: 'bg-cyan-500/10 text-cyan-400' },
  security: { label: 'Security & Compliance', color: 'bg-red-500/10 text-red-400' },
  data: { label: 'Data & Analytics', color: 'bg-indigo-500/10 text-indigo-400' },
  crm: { label: 'CRM & Sales', color: 'bg-orange-500/10 text-orange-400' },
  hr: { label: 'HR & Finance', color: 'bg-pink-500/10 text-pink-400' },
}

function SystemsLibraryTab({ workspaceId }: { workspaceId: string | undefined }) {
  const { library, isLoading: libLoading } = useSystemLibrary(workspaceId)
  const { systems: existingSystems } = useSystemsList(workspaceId)
  const addFromLibrary = useAddFromLibrary(workspaceId)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null)

  const existingNames = new Set(existingSystems.map((s: any) => s.name.toLowerCase()))

  // Group by category
  const categories = Array.from(new Set(library.map((s: any) => s.category)))

  const filtered = library.filter((s: any) => {
    if (categoryFilter && s.category !== categoryFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return s.name.toLowerCase().includes(q) || (s.vendor ?? '').toLowerCase().includes(q)
    }
    return true
  })

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleAdd = () => {
    if (selectedIds.size === 0) return
    addFromLibrary.mutate(
      { libraryIds: Array.from(selectedIds) },
      {
        onSuccess: (data: any) => {
          setResult({ created: data.created, skipped: data.skipped })
          setSelectedIds(new Set())
        },
      },
    )
  }

  if (libLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <HugeiconsIcon icon={LoaderPinwheelIcon} size={20} className="animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-sm font-semibold text-zinc-100">Systems Library</h2>
        <p className="mt-0.5 mb-4 text-xs text-zinc-500">
          Browse common enterprise tools and add them to your workspace. Systems already added are marked.
        </p>

        {/* Result banner */}
        {result && (
          <div className="mb-4 rounded-lg border border-primary-400/20 bg-primary-400/5 p-3">
            <p className="text-xs text-primary-400">
              Added {result.created} system{result.created !== 1 ? 's' : ''}
              {result.skipped > 0 && ` (${result.skipped} already existed)`}
            </p>
            <button onClick={() => setResult(null)} className="mt-1 text-[10px] text-zinc-500 hover:text-zinc-300">Dismiss</button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-3 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
              placeholder="Search systems..."
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-primary-400 focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((cat: any) => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat]?.label ?? cat}</option>
            ))}
          </select>

          {selectedIds.size > 0 && (
            <button
              onClick={handleAdd}
              disabled={addFromLibrary.isPending}
              className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
            >
              {addFromLibrary.isPending ? 'Adding...' : `Add ${selectedIds.size} selected`}
            </button>
          )}
        </div>

        {/* Category sections */}
        {(categoryFilter ? [categoryFilter] : categories).map((cat: any) => {
          const items = filtered.filter((s: any) => s.category === cat)
          if (items.length === 0) return null
          const catInfo = CATEGORY_LABELS[cat] ?? { label: cat, color: 'bg-zinc-800 text-zinc-400' }

          return (
            <div key={cat} className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${catInfo.color}`}>
                  {catInfo.label}
                </span>
                <span className="text-xs text-zinc-600">{items.length} tools</span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((system: any) => {
                  const alreadyAdded = existingNames.has(system.name.toLowerCase())
                  const isSelected = selectedIds.has(system.id)

                  return (
                    <button
                      key={system.id}
                      onClick={() => !alreadyAdded && toggleSelect(system.id)}
                      disabled={alreadyAdded}
                      className={`rounded-lg border p-3 text-left transition-all ${
                        alreadyAdded
                          ? 'border-zinc-800 bg-zinc-800/30 opacity-50 cursor-not-allowed'
                          : isSelected
                            ? 'border-primary-400/50 bg-primary-400/5'
                            : 'border-zinc-800 bg-zinc-800/50 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-100 truncate">{system.name}</p>
                          <p className="text-[11px] text-zinc-500">{system.vendor}</p>
                        </div>
                        {alreadyAdded ? (
                          <span className="shrink-0 rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400">Added</span>
                        ) : isSelected ? (
                          <span className="shrink-0 rounded bg-primary-400/20 px-1.5 py-0.5 text-[10px] text-primary-400">Selected</span>
                        ) : null}
                      </div>
                      {system.description && (
                        <p className="mt-1 text-[11px] text-zinc-500 line-clamp-1">{system.description}</p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[10px] text-zinc-600">{system.default_classification}</span>
                        <span className="text-[10px] text-zinc-700">·</span>
                        <span className="text-[10px] text-zinc-600">{system.default_sensitivity} sensitivity</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Baselines Library Tab Component ──────────────────────────────────────────

function BaselinesLibraryTab({ workspaceId }: { workspaceId: string | undefined }) {
  const { library, isLoading: libLoading } = useBaselineLibrary(workspaceId)
  const { baselines: existingBaselines } = useBaselines(workspaceId)
  const addFromLibrary = useAddFromBaselineLibrary(workspaceId)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null)

  const existingNames = new Set((existingBaselines ?? []).map((b: any) => b.name?.toLowerCase()))
  const categories = Array.from(new Set(library.map((b: any) => b.category)))

  const BASELINE_CATS: Record<string, { label: string; color: string }> = {
    identity: { label: 'Identity & Access', color: 'bg-blue-500/10 text-blue-400' },
    data_protection: { label: 'Data Protection', color: 'bg-green-500/10 text-green-400' },
    network: { label: 'Network', color: 'bg-cyan-500/10 text-cyan-400' },
    endpoint: { label: 'Endpoint', color: 'bg-purple-500/10 text-purple-400' },
    logging: { label: 'Logging', color: 'bg-amber-500/10 text-amber-400' },
    application: { label: 'Application', color: 'bg-orange-500/10 text-orange-400' },
    continuity: { label: 'Continuity', color: 'bg-red-500/10 text-red-400' },
    governance: { label: 'Governance', color: 'bg-indigo-500/10 text-indigo-400' },
  }

  const filtered = library.filter((b: any) => {
    if (categoryFilter && b.category !== categoryFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return b.name.toLowerCase().includes(q) || (b.description ?? '').toLowerCase().includes(q)
    }
    return true
  })

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedIds(next)
  }

  const handleAdd = () => {
    if (selectedIds.size === 0) return
    addFromLibrary.mutate(
      { libraryIds: Array.from(selectedIds) },
      {
        onSuccess: (data: any) => {
          setResult({ created: data.created, skipped: data.skipped })
          setSelectedIds(new Set())
        },
      },
    )
  }

  if (libLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <HugeiconsIcon icon={LoaderPinwheelIcon} size={20} className="animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-sm font-semibold text-zinc-100">Baselines Library</h2>
        <p className="mt-0.5 mb-4 text-xs text-zinc-500">
          Browse compliance baselines and activate them in your workspace. Already active baselines are marked.
        </p>

        {result && (
          <div className="mb-4 rounded-lg border border-primary-400/20 bg-primary-400/5 p-3">
            <p className="text-xs text-primary-400">
              Activated {result.created} baseline{result.created !== 1 ? 's' : ''}
              {result.skipped > 0 && ` (${result.skipped} already existed)`}
            </p>
            <button onClick={() => setResult(null)} className="mt-1 text-[10px] text-zinc-500 hover:text-zinc-300">Dismiss</button>
          </div>
        )}

        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-3 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
              placeholder="Search baselines..."
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-primary-400 focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((cat: any) => (
              <option key={cat} value={cat}>{BASELINE_CATS[cat]?.label ?? cat}</option>
            ))}
          </select>

          {selectedIds.size > 0 && (
            <button
              onClick={handleAdd}
              disabled={addFromLibrary.isPending}
              className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
            >
              {addFromLibrary.isPending ? 'Activating...' : `Activate ${selectedIds.size} selected`}
            </button>
          )}
        </div>

        {(categoryFilter ? [categoryFilter] : categories).map((cat: any) => {
          const items = filtered.filter((b: any) => b.category === cat)
          if (items.length === 0) return null
          const catInfo = BASELINE_CATS[cat] ?? { label: cat, color: 'bg-zinc-800 text-zinc-400' }

          return (
            <div key={cat} className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${catInfo.color}`}>{catInfo.label}</span>
                <span className="text-xs text-zinc-600">{items.length} baselines</span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {items.map((bl: any) => {
                  const alreadyAdded = existingNames.has(bl.name?.toLowerCase())
                  const isSelected = selectedIds.has(bl.id)
                  const sevColor = bl.severity === 'critical' ? 'text-red-400' : bl.severity === 'high' ? 'text-orange-400' : bl.severity === 'medium' ? 'text-amber-400' : 'text-zinc-400'

                  return (
                    <button
                      key={bl.id}
                      onClick={() => !alreadyAdded && toggleSelect(bl.id)}
                      disabled={alreadyAdded}
                      className={`rounded-lg border p-3 text-left transition-all ${
                        alreadyAdded ? 'border-zinc-800 bg-zinc-800/30 opacity-50 cursor-not-allowed'
                        : isSelected ? 'border-primary-400/50 bg-primary-400/5'
                        : 'border-zinc-800 bg-zinc-800/50 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-zinc-100">{bl.name}</p>
                        {alreadyAdded ? (
                          <span className="shrink-0 rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400">Active</span>
                        ) : isSelected ? (
                          <span className="shrink-0 rounded bg-primary-400/20 px-1.5 py-0.5 text-[10px] text-primary-400">Selected</span>
                        ) : null}
                      </div>
                      {bl.description && <p className="mt-1 text-[11px] text-zinc-500 line-clamp-2">{bl.description}</p>}
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className={`text-[10px] font-medium ${sevColor}`}>{bl.severity}</span>
                        <span className="text-[10px] text-zinc-700">&middot;</span>
                        <span className="text-[10px] text-zinc-600">{bl.check_type}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Roles Library Tab Component ──────────────────────────────────────────────

function RolesLibraryTab({ workspaceId }: { workspaceId: string | undefined }) {
  const { library, isLoading } = useEmployeeLibrary(workspaceId)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const ROLE_CATS: Record<string, { label: string; color: string }> = {
    executive: { label: 'Executive', color: 'bg-amber-500/10 text-amber-400' },
    engineering: { label: 'Engineering', color: 'bg-blue-500/10 text-blue-400' },
    security: { label: 'Security & Compliance', color: 'bg-red-500/10 text-red-400' },
    it_ops: { label: 'IT & Operations', color: 'bg-purple-500/10 text-purple-400' },
    product: { label: 'Product & Design', color: 'bg-cyan-500/10 text-cyan-400' },
    sales_marketing: { label: 'Sales & Marketing', color: 'bg-orange-500/10 text-orange-400' },
    hr_people: { label: 'HR & People', color: 'bg-pink-500/10 text-pink-400' },
    finance_legal: { label: 'Finance & Legal', color: 'bg-indigo-500/10 text-indigo-400' },
  }

  const categories = Array.from(new Set(library.map((r: any) => r.category)))
  const filtered = library.filter((r: any) => {
    if (categoryFilter && r.category !== categoryFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return r.department?.toLowerCase().includes(q) || r.title?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
    }
    return true
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <HugeiconsIcon icon={LoaderPinwheelIcon} size={20} className="animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-sm font-semibold text-zinc-100">Departments & Roles</h2>
        <p className="mt-0.5 mb-4 text-xs text-zinc-500">
          These departments and roles are used as suggestions when adding people to your directory. They are maintained by the platform.
        </p>

        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-3 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
              placeholder="Search departments or roles..."
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-primary-400 focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((cat: any) => (
              <option key={cat} value={cat}>{ROLE_CATS[cat]?.label ?? cat}</option>
            ))}
          </select>
        </div>

        {(categoryFilter ? [categoryFilter] : categories).map((cat: any) => {
          const items = filtered.filter((r: any) => r.category === cat)
          if (items.length === 0) return null
          const catInfo = ROLE_CATS[cat] ?? { label: cat, color: 'bg-zinc-800 text-zinc-400' }

          return (
            <div key={cat} className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${catInfo.color}`}>{catInfo.label}</span>
                <span className="text-xs text-zinc-600">{items.length} roles</span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                      <th className="px-4 py-2 font-medium">Department</th>
                      <th className="px-4 py-2 font-medium">Title</th>
                      <th className="px-4 py-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {items.map((role: any) => (
                      <tr key={role.id} className="hover:bg-zinc-800/30">
                        <td className="px-4 py-2 font-medium text-zinc-200">{role.department}</td>
                        <td className="px-4 py-2 text-zinc-300">{role.title}</td>
                        <td className="px-4 py-2 text-xs text-zinc-500">{role.description ?? '\u2014'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
