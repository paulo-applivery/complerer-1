import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { api } from '@/lib/api'
import { useFrameworks, useFrameworkVersions, useAdoptFramework } from '@/hooks/use-frameworks'
import { useInviteMember } from '@/hooks/use-workspace'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
  Add01Icon,
  Delete02Icon,
  Shield01Icon,
} from '@hugeicons/core-free-icons'

type OnboardingStep = 1 | 2 | 3

interface InviteRow {
  email: string
  role: string
}

export function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1)
  const [workspaceId] = useState(() => localStorage.getItem('workspaceId') ?? '')
  const [workspaceName, setWorkspaceName] = useState(() => {
    return localStorage.getItem('workspaceName') || 'My Workspace'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 2: Framework selection
  const { frameworks, isLoading: frameworksLoading } = useFrameworks(workspaceId || undefined)
  const [selectedFrameworkSlug, setSelectedFrameworkSlug] = useState<string | null>(null)
  const selectedFramework = frameworks.find((f) => f.slug === selectedFrameworkSlug)
  const { versions } = useFrameworkVersions(
    workspaceId || undefined,
    selectedFrameworkSlug ?? ''
  )
  const adoptFramework = useAdoptFramework(workspaceId || undefined)

  // Step 3: Invites
  const [inviteRows, setInviteRows] = useState<InviteRow[]>([
    { email: '', role: 'member' },
    { email: '', role: 'member' },
    { email: '', role: 'member' },
  ])
  const inviteMember = useInviteMember(workspaceId || undefined)

  const navigate = useNavigate()

  // ── Step handlers ─────────────────────────────────────────────────────────

  const handleStep1Submit = async () => {
    if (!workspaceName.trim()) return
    setError('')
    setLoading(true)
    try {
      await api.patch(`/workspaces/${workspaceId}`, { name: workspaceName.trim() })
      setCurrentStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workspace')
    } finally {
      setLoading(false)
    }
  }

  const handleStep2Submit = async () => {
    if (selectedFrameworkSlug && versions.length > 0) {
      setError('')
      setLoading(true)
      try {
        const latestVersion = versions[0]
        await adoptFramework.mutateAsync({ frameworkVersionId: latestVersion.id })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to adopt framework')
        setLoading(false)
        return
      } finally {
        setLoading(false)
      }
    }
    setCurrentStep(3)
  }

  const handleStep3Submit = async () => {
    const validRows = inviteRows.filter((r) => r.email.trim())
    if (validRows.length > 0) {
      setError('')
      setLoading(true)
      try {
        await Promise.all(
          validRows.map((row) =>
            inviteMember.mutateAsync({ email: row.email.trim(), role: row.role })
          )
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send some invitations')
        setLoading(false)
        return
      } finally {
        setLoading(false)
      }
    }
    navigate({ to: '/w/$workspaceId/welcome', params: { workspaceId } })
  }

  const addInviteRow = () => {
    setInviteRows((prev) => [...prev, { email: '', role: 'member' }])
  }

  const removeInviteRow = (index: number) => {
    setInviteRows((prev) => prev.filter((_, i) => i !== index))
  }

  const updateInviteRow = (index: number, field: keyof InviteRow, value: string) => {
    setInviteRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    )
  }

  // ── Progress bar ──────────────────────────────────────────────────────────

  const steps = [
    { num: 1, label: 'Company' },
    { num: 2, label: 'Project' },
    { num: 3, label: 'Invite' },
  ] as const

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/50 px-8 py-5">
        <img src="/logo-white.svg" alt="Complerer" className="h-7" />
        <span className="text-sm text-zinc-500">
          Step {currentStep} of 3
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex items-center justify-center px-6 pt-10">
        <div className="flex items-center gap-0">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                    currentStep > s.num
                      ? 'border-primary-400 bg-primary-400 text-zinc-950'
                      : currentStep === s.num
                        ? 'border-primary-400 bg-primary-400/10 text-primary-400'
                        : 'border-zinc-700 bg-zinc-900 text-zinc-500'
                  }`}
                >
                  {currentStep > s.num ? (
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} />
                  ) : (
                    s.num
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    currentStep >= s.num ? 'text-zinc-300' : 'text-zinc-600'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`mx-3 mb-5 h-0.5 w-20 rounded-full transition-colors ${
                    currentStep > s.num ? 'bg-primary-400' : 'bg-zinc-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-start justify-center px-6 pt-10 pb-20">
        <div className="w-full max-w-lg">
          {error && (
            <div className="mb-6 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* ── Step 1: Name your workspace ──────────────────────────── */}
          {currentStep === 1 && (
            <div>
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-zinc-100">
                  Set up your workspace
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  This will be your compliance hub. Use your company or team name.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
                <label
                  htmlFor="workspace-name"
                  className="mb-1.5 block text-sm font-medium text-zinc-300"
                >
                  Workspace name
                </label>
                <input
                  id="workspace-name"
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Acme Corp"
                  autoFocus
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
                />

                <button
                  onClick={handleStep1Submit}
                  disabled={loading || !workspaceName.trim()}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-primary-300 hover:shadow-lg hover:shadow-primary-400/20 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Continue'}
                  {!loading && <HugeiconsIcon icon={ArrowRight01Icon} size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Choose your framework ────────────────────────── */}
          {currentStep === 2 && (
            <div>
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-zinc-100">
                  Start your first compliance project
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  Select the framework for your first compliance project. You can add more projects later for other certifications.
                </p>
              </div>

              {frameworksLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-primary-400" />
                </div>
              ) : (
                <div className="space-y-3">
                  {frameworks.map((fw) => (
                    <button
                      key={fw.slug}
                      onClick={() =>
                        setSelectedFrameworkSlug(
                          selectedFrameworkSlug === fw.slug ? null : fw.slug
                        )
                      }
                      className={`w-full rounded-2xl border p-5 text-left transition-all ${
                        selectedFrameworkSlug === fw.slug
                          ? 'border-primary-400 bg-primary-400/5'
                          : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            selectedFrameworkSlug === fw.slug
                              ? 'bg-primary-400/10'
                              : 'bg-zinc-800'
                          }`}
                        >
                          <HugeiconsIcon
                            icon={Shield01Icon}
                            size={16}
                            className={
                              selectedFrameworkSlug === fw.slug
                                ? 'text-primary-400'
                                : 'text-zinc-500'
                            }
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-zinc-100">
                              {fw.name}
                            </p>
                            {fw.sourceOrg && (
                              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                                {fw.sourceOrg}
                              </span>
                            )}
                          </div>
                          {fw.description && (
                            <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                              {fw.description}
                            </p>
                          )}
                        </div>
                        {selectedFrameworkSlug === fw.slug && (
                          <HugeiconsIcon
                            icon={CheckmarkCircle01Icon}
                            size={18}
                            className="mt-0.5 shrink-0 text-primary-400"
                          />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleStep2Submit}
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-primary-300 hover:shadow-lg hover:shadow-primary-400/20 disabled:opacity-50"
                >
                  {loading ? 'Adopting...' : 'Continue'}
                  {!loading && <HugeiconsIcon icon={ArrowRight01Icon} size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Invite your team ─────────────────────────────── */}
          {currentStep === 3 && (
            <div>
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-zinc-100">
                  Invite your team
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  Add colleagues who'll help manage compliance — auditors, engineers, or security leads.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
                <div className="space-y-3">
                  {inviteRows.map((row, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="email"
                        value={row.email}
                        onChange={(e) => updateInviteRow(i, 'email', e.target.value)}
                        placeholder="colleague@company.com"
                        className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
                      />
                      <select
                        value={row.role}
                        onChange={(e) => updateInviteRow(i, 'role', e.target.value)}
                        className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
                      >
                        <option value="admin">Admin</option>
                        <option value="auditor">Auditor</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      {inviteRows.length > 1 && (
                        <button
                          onClick={() => removeInviteRow(i)}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-500 transition-colors hover:border-red-500/30 hover:text-red-400"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={addInviteRow}
                  className="mt-3 flex items-center gap-1.5 text-sm text-primary-400 transition-colors hover:text-primary-300"
                >
                  <HugeiconsIcon icon={Add01Icon} size={14} />
                  Add another
                </button>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() =>
                    navigate({ to: '/w/$workspaceId/welcome', params: { workspaceId } })
                  }
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleStep3Submit}
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-primary-300 hover:shadow-lg hover:shadow-primary-400/20 disabled:opacity-50"
                >
                  {loading ? 'Sending invites...' : 'Get Started'}
                  {!loading && <HugeiconsIcon icon={ArrowRight01Icon} size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
