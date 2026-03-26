import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Settings01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Add01Icon,
  Delete01Icon,
} from '@hugeicons/core-free-icons'
import {
  useAdminProviders,
  useAdminProvider,
  useUpdateProvider,
  useUpdateProviderConfig,
  useDeleteProviderConfig,
} from '@/hooks/use-admin'

type Category = 'ai' | 'email' | 'integration'

const tabs: { label: string; value: Category }[] = [
  { label: 'AI', value: 'ai' },
  { label: 'Email', value: 'email' },
  { label: 'Integration', value: 'integration' },
]

function ConfigEditor({ providerId }: { providerId: string }) {
  const { data } = useAdminProvider(providerId)
  const updateConfig = useUpdateProviderConfig()
  const deleteConfig = useDeleteProviderConfig()
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newIsSecret, setNewIsSecret] = useState(false)

  const configs = data?.configs ?? []

  const handleAddConfig = () => {
    if (!newKey.trim()) return
    updateConfig.mutate({
      providerId,
      key: newKey.trim(),
      value: newValue,
      isSecret: newIsSecret,
    })
    setNewKey('')
    setNewValue('')
    setNewIsSecret(false)
  }

  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Configuration</p>

      {configs.map((cfg) => (
        <div key={cfg.key} className="flex items-center gap-2">
          <span className="w-32 shrink-0 text-xs font-medium text-zinc-400">{cfg.key}</span>
          <input
            type={cfg.isSecret ? 'password' : 'text'}
            defaultValue={cfg.value}
            onBlur={(e) => {
              if (e.target.value !== cfg.value) {
                updateConfig.mutate({
                  providerId,
                  key: cfg.key,
                  value: e.target.value,
                  isSecret: cfg.isSecret,
                })
              }
            }}
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-zinc-700"
          />
          <button
            onClick={() => deleteConfig.mutate({ providerId, key: cfg.key })}
            className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <HugeiconsIcon icon={Delete01Icon} size={14} />
          </button>
        </div>
      ))}

      {/* Add new config */}
      <div className="flex items-center gap-2 border-t border-zinc-800/50 pt-3">
        <input
          type="text"
          placeholder="Key"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className="w-32 shrink-0 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-zinc-700"
        />
        <input
          type="text"
          placeholder="Value"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-zinc-700"
        />
        <label className="flex items-center gap-1 text-xs text-zinc-500">
          <input
            type="checkbox"
            checked={newIsSecret}
            onChange={(e) => setNewIsSecret(e.target.checked)}
            className="rounded"
          />
          Secret
        </label>
        <button
          onClick={handleAddConfig}
          disabled={!newKey.trim()}
          className="rounded-xl bg-primary-400/10 px-3 py-1.5 text-sm font-medium text-primary-400 transition-colors hover:bg-primary-400/20 disabled:opacity-40"
        >
          <HugeiconsIcon icon={Add01Icon} size={14} />
        </button>
      </div>
    </div>
  )
}

function ProviderCard({ provider }: { provider: { id: string; name: string; description: string | null; slug: string; enabled: boolean } }) {
  const updateProvider = useUpdateProvider()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-zinc-100">{provider.name}</h3>
            <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500">
              {provider.slug}
            </span>
          </div>
          {provider.description && (
            <p className="mt-1 text-sm text-zinc-500">{provider.description}</p>
          )}
        </div>

        <button
          onClick={() => {
            updateProvider.mutate({ id: provider.id, enabled: !provider.enabled })
          }}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            provider.enabled ? 'bg-primary-400' : 'bg-zinc-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
              provider.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300"
      >
        {expanded ? 'Hide config' : 'Show config'}
      </button>

      {expanded && <ConfigEditor providerId={provider.id} />}
    </div>
  )
}

export function AdminProvidersPage() {
  const [activeTab, setActiveTab] = useState<Category>('ai')
  const { data, isLoading } = useAdminProviders(activeTab)

  const providers = data?.providers ?? []

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Providers</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage AI models, email services, and integration providers.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Provider cards */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-sm text-zinc-500">Loading providers...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {providers.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
          {providers.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-zinc-500">
              No providers in this category.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
