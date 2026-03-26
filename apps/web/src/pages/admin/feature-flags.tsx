import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Flag01Icon,
  Add01Icon,
  Delete01Icon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons'
import {
  useAdminFeatureFlags,
  useUpdateFeatureFlag,
  useCreateFeatureFlag,
  useDeleteFeatureFlag,
} from '@/hooks/use-admin'

function CreateFlagModal({ onClose }: { onClose: () => void }) {
  const createFlag = useCreateFeatureFlag()
  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [rollout, setRollout] = useState(100)

  const handleCreate = () => {
    if (!slug.trim() || !name.trim()) return
    createFlag.mutate(
      {
        slug: slug.trim(),
        name: name.trim(),
        description: description || undefined,
        enabled: false,
        rolloutPercentage: rollout,
      },
      { onSuccess: () => onClose() }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-100">Create Feature Flag</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-feature"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-700"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Feature"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-700"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-700"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">
              Rollout Percentage: {rollout}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={rollout}
              onChange={(e) => setRollout(Number(e.target.value))}
              className="w-full accent-primary-400"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!slug.trim() || !name.trim()}
            className="rounded-xl bg-primary-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-primary-400/90 disabled:opacity-40"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminFeatureFlagsPage() {
  const { data, isLoading } = useAdminFeatureFlags()
  const updateFlag = useUpdateFeatureFlag()
  const deleteFlag = useDeleteFeatureFlag()
  const [showCreate, setShowCreate] = useState(false)

  const flags = data?.featureFlags ?? []

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Feature Flags</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Control feature availability and rollout across the platform.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-primary-400/90"
        >
          <HugeiconsIcon icon={Add01Icon} size={14} />
          Create Flag
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-sm text-zinc-500">Loading feature flags...</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Slug</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">Rollout %</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {flags.map((flag) => (
                <tr key={flag.id} className="bg-zinc-900 transition-colors hover:bg-zinc-800/30">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{flag.name}</p>
                      {flag.description && (
                        <p className="mt-0.5 text-xs text-zinc-500">{flag.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-zinc-500">{flag.slug}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => updateFlag.mutate({ id: flag.id, enabled: !flag.enabled })}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        flag.enabled ? 'bg-primary-400' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          flag.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={flag.rolloutPercentage}
                      onBlur={(e) => {
                        const val = Math.min(100, Math.max(0, Number(e.target.value)))
                        if (val !== flag.rolloutPercentage) {
                          updateFlag.mutate({ id: flag.id, rolloutPercentage: val })
                        }
                      }}
                      className="w-16 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-center text-xs text-zinc-300 outline-none focus:border-zinc-700"
                    />
                    <span className="ml-0.5 text-xs text-zinc-600">%</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Delete flag "${flag.name}"?`)) {
                          deleteFlag.mutate(flag.id)
                        }
                      }}
                      className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <HugeiconsIcon icon={Delete01Icon} size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {flags.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">
                    No feature flags configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateFlagModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
