import { useState, useEffect } from 'react'
import { useParams } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Settings01Icon,
  Shield01Icon,
  UserGroupIcon,
  Link01Icon,
  CheckmarkCircle01Icon,
  LoaderPinwheelIcon,
  Alert02Icon,
  Mail01Icon,
  Clock01Icon,
} from '@hugeicons/core-free-icons'
import { api } from '@/lib/api'
import { useWorkspace } from '@/hooks/use-workspace'
import {
  useInvitations,
  useApproveInvitation,
  useRejectInvitation,
} from '@/hooks/use-invitations'

interface Setting {
  key: string
  value: string
  updated_by: string | null
  updated_at: string
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', workspaceId] })
    },
  })
}

// AI setting keys and their defaults
const AI_SETTINGS = [
  {
    key: 'ai.model',
    label: 'AI Model',
    description: 'The Claude model used for the chat assistant',
    default: 'claude-sonnet-4-20250514',
    type: 'select' as const,
    options: [
      'claude-sonnet-4-20250514',
      'claude-haiku-4-5-20251001',
      'claude-opus-4-20250514',
    ],
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
  const updateSetting = useUpdateSetting(workspaceId)

  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'members'>('ai')
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
    { id: 'ai' as const, label: 'AI Configuration', icon: Shield01Icon },
    { id: 'general' as const, label: 'General', icon: Settings01Icon },
    { id: 'members' as const, label: 'Members', icon: UserGroupIcon },
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
      <div className="flex gap-1 rounded-lg bg-zinc-900 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <HugeiconsIcon icon={tab.icon} size={16} />
            {tab.label}
          </button>
        ))}
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
                            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-primary-400 focus:outline-none"
                          >
                            {setting.options?.map((opt) => (
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

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <HugeiconsIcon icon={Alert02Icon} size={16} className="mt-0.5 shrink-0 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-400">API Keys</p>
                <p className="mt-1 text-xs text-zinc-400">
                  API keys (ANTHROPIC_API_KEY, GEMINI_API_KEY) are configured as environment secrets
                  and cannot be changed from this UI. Contact your system administrator to update them.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-zinc-100">General Settings</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-200">Workspace Name</label>
              <input
                type="text"
                value={workspace?.name ?? ''}
                disabled
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-200">Slug</label>
              <input
                type="text"
                value={workspace?.slug ?? ''}
                disabled
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <MembersTab workspaceId={workspaceId} />
      )}
    </div>
  )
}

// ── Members Tab Component ──────────────────────────────────────────────────

function MembersTab({ workspaceId }: { workspaceId: string | undefined }) {
  const { members, role } = useWorkspace(workspaceId)
  const { data: invitationsData, isLoading: invLoading } = useInvitations(workspaceId)
  const approveInvitation = useApproveInvitation(workspaceId)
  const rejectInvitation = useRejectInvitation(workspaceId)

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
    settingsData?.settings?.find((s) => s.key === 'allow_invitation_requests')
      ?.value !== 'false'

  const isAdmin = role === 'admin' || role === 'owner'

  const pendingInvitations =
    invitationsData?.invitations?.filter((i) => i.status === 'pending') ?? []

  const handleToggleInvitations = () => {
    updateSetting.mutate({
      key: 'allow_invitation_requests',
      value: allowInvitations ? 'false' : 'true',
    })
  }

  return (
    <div className="space-y-4">
      {/* Invitation requests toggle */}
      {isAdmin && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-zinc-200">
                Allow invitation requests
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500">
                Let new users with matching email domains request to join this
                workspace
              </p>
            </div>
            <button
              onClick={handleToggleInvitations}
              disabled={updateSetting.isPending}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                allowInvitations ? 'bg-primary-400' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  allowInvitations ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Pending invitations */}
      {isAdmin && pendingInvitations.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-zinc-100">
            Pending Invitations
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            {pendingInvitations.length} pending request
            {pendingInvitations.length !== 1 ? 's' : ''}
          </p>

          <div className="mt-4 space-y-3">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700 text-sm font-medium text-zinc-300">
                    {inv.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      {inv.name}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-zinc-500">
                      <HugeiconsIcon icon={Mail01Icon} size={12} />
                      {inv.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-zinc-500">
                    <HugeiconsIcon icon={Clock01Icon} size={12} />
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => rejectInvitation.mutate(inv.id)}
                    disabled={rejectInvitation.isPending}
                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => approveInvitation.mutate(inv.id)}
                    disabled={approveInvitation.isPending}
                    className="rounded-lg bg-primary-400 px-3 py-1.5 text-xs font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && pendingInvitations.length === 0 && !invLoading && (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 p-6 text-center">
          <HugeiconsIcon
            icon={CheckmarkCircle01Icon}
            size={24}
            className="mx-auto mb-2 text-zinc-600"
          />
          <p className="text-sm text-zinc-500">No pending invitation requests</p>
        </div>
      )}

      {/* Current members */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-zinc-100">Members</h2>
        <p className="mt-1 text-sm text-zinc-400">
          {members.length} member{members.length !== 1 ? 's' : ''} in this
          workspace
        </p>

        <div className="mt-4 space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/50 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700 text-sm font-medium text-zinc-300">
                  {member.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    {member.name}
                  </p>
                  <p className="text-xs text-zinc-500">{member.email}</p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  member.role === 'owner'
                    ? 'bg-primary-400/10 text-primary-400'
                    : member.role === 'admin'
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
