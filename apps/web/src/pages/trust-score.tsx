import { useState, useEffect } from 'react'
import { useParams } from '@tanstack/react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Shield01Icon,
  CheckmarkCircle01Icon,
  Link01Icon,
  Settings01Icon,
  EyeIcon,
  SecurityCheckIcon,
} from '@hugeicons/core-free-icons'
import { useTrustScore, useUpdateTrustProfile } from '@/hooks/use-trust'

// ── Score Breakdown Bar ──────────────────────────────────────────────────────

function BreakdownBar({
  label,
  value,
  weight,
}: {
  label: string
  value: number
  weight: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">{weight}</span>
          <span className="font-medium text-zinc-100">{value}%</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-zinc-800">
        <div
          className="h-2 rounded-full bg-primary-400 transition-all duration-500"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  )
}

// ── Grade Display ────────────────────────────────────────────────────────────

function GradeDisplay({ grade, score }: { grade: string; score: number }) {
  const gradeColors: Record<string, string> = {
    'A+': 'text-primary-400',
    A: 'text-primary-400',
    'B+': 'text-yellow-400',
    B: 'text-yellow-400',
    C: 'text-orange-400',
    D: 'text-red-400',
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`text-6xl font-bold ${gradeColors[grade] ?? 'text-zinc-400'}`}
      >
        {grade}
      </div>
      <div className="text-sm text-zinc-400">
        Trust Score: <span className="font-medium text-zinc-200">{score}</span>
        /100
      </div>
    </div>
  )
}

// ── Trust Score Page ─────────────────────────────────────────────────────────

export function TrustScorePage() {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const workspaceId = params.workspaceId
  const { profile, score, grade, breakdown, stats, isLoading } =
    useTrustScore(workspaceId)
  const updateProfile = useUpdateTrustProfile(workspaceId)

  // Form state
  const [slug, setSlug] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [showFrameworks, setShowFrameworks] = useState(true)
  const [showPostureScore, setShowPostureScore] = useState(true)
  const [showEvidenceFreshness, setShowEvidenceFreshness] = useState(true)
  const [showLastSnapshot, setShowLastSnapshot] = useState(true)
  const [showControlCount, setShowControlCount] = useState(true)
  const [badgeStyle, setBadgeStyle] = useState<'minimal' | 'standard' | 'detailed'>('standard')

  // Sync form state from loaded profile
  useEffect(() => {
    if (profile) {
      setSlug(profile.slug)
      setCompanyName(profile.company_name)
      setEnabled(!!profile.enabled)
      setShowFrameworks(!!profile.show_frameworks)
      setShowPostureScore(!!profile.show_posture_score)
      setShowEvidenceFreshness(!!profile.show_evidence_freshness)
      setShowLastSnapshot(!!profile.show_last_snapshot)
      setShowControlCount(!!profile.show_control_count)
      setBadgeStyle((profile.badge_style as 'minimal' | 'standard' | 'detailed') ?? 'standard')
    }
  }, [profile])

  const handleSave = () => {
    updateProfile.mutate({
      slug,
      companyName,
      enabled,
      showFrameworks,
      showPostureScore,
      showEvidenceFreshness,
      showLastSnapshot,
      showControlCount,
      badgeStyle,
    })
  }

  const embedCode = slug
    ? `<a href="https://complerer.com/trust/${slug}">\n  <img src="https://complerer.com/trust/${slug}/badge.svg" alt="Complerer Trust Score" />\n</a>`
    : ''

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-400 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Trust Score</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Your public compliance posture badge. Share your trust score with
          customers and partners.
        </p>
      </div>

      {/* Score Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-start gap-8">
          {/* Grade */}
          <div className="flex flex-col items-center gap-4 border-r border-zinc-800 pr-8">
            <GradeDisplay grade={grade} score={score} />
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <HugeiconsIcon icon={SecurityCheckIcon} size={14} />
              <span>Computed in real-time</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="flex-1 space-y-4">
            <h3 className="text-sm font-medium text-zinc-300">
              Score Breakdown
            </h3>
            <BreakdownBar
              label="Framework Coverage"
              value={breakdown.frameworkCoverage}
              weight="35%"
            />
            <BreakdownBar
              label="Evidence Freshness"
              value={breakdown.evidenceFreshness}
              weight="25%"
            />
            <BreakdownBar
              label="Violation Resolution"
              value={breakdown.violationRatio}
              weight="20%"
            />
            <BreakdownBar
              label="Review Completeness"
              value={breakdown.reviewCompleteness}
              weight="10%"
            />
            <BreakdownBar
              label="Snapshot Recency"
              value={breakdown.snapshotRecency}
              weight="10%"
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-6 grid grid-cols-5 gap-4 border-t border-zinc-800 pt-6">
          <div className="text-center">
            <div className="text-lg font-semibold text-zinc-100">
              {stats.frameworksActive}
            </div>
            <div className="text-xs text-zinc-500">Active Frameworks</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-zinc-100">
              {stats.controlsSatisfied}/{stats.controlsTotal}
            </div>
            <div className="text-xs text-zinc-500">Controls Met</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-zinc-100">
              {stats.evidenceFreshness}%
            </div>
            <div className="text-xs text-zinc-500">Evidence Fresh</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-zinc-100">
              {stats.openViolations}
            </div>
            <div className="text-xs text-zinc-500">Open Violations</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-primary-400">{grade}</div>
            <div className="text-xs text-zinc-500">Overall Grade</div>
          </div>
        </div>
      </div>

      {/* Trust Profile Configuration */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-6 flex items-center gap-2">
          <HugeiconsIcon
            icon={Settings01Icon}
            size={18}
            className="text-zinc-400"
          />
          <h3 className="text-lg font-semibold text-zinc-100">
            Trust Profile Configuration
          </h3>
        </div>

        <div className="space-y-5">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-zinc-200">
                Enable Trust Profile
              </div>
              <div className="text-xs text-zinc-500">
                Make your trust score publicly accessible
              </div>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                enabled ? 'bg-primary-400' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Company Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Corp"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              URL Slug
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">
                complerer.com/trust/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                }
                placeholder="acme-corp"
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
          </div>

          {/* Visibility Toggles */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-zinc-300">
              Visible Sections
            </div>
            {[
              { key: 'showFrameworks', label: 'Frameworks', state: showFrameworks, setter: setShowFrameworks },
              { key: 'showPostureScore', label: 'Posture Score', state: showPostureScore, setter: setShowPostureScore },
              { key: 'showEvidenceFreshness', label: 'Evidence Freshness', state: showEvidenceFreshness, setter: setShowEvidenceFreshness },
              { key: 'showLastSnapshot', label: 'Last Snapshot', state: showLastSnapshot, setter: setShowLastSnapshot },
              { key: 'showControlCount', label: 'Control Count', state: showControlCount, setter: setShowControlCount },
            ].map((toggle) => (
              <div
                key={toggle.key}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <HugeiconsIcon icon={EyeIcon} size={14} />
                  <span>{toggle.label}</span>
                </div>
                <button
                  onClick={() => toggle.setter(!toggle.state)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    toggle.state ? 'bg-primary-400' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                      toggle.state ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          {/* Badge Style */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              Badge Style
            </label>
            <div className="flex gap-3">
              {(['minimal', 'standard', 'detailed'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setBadgeStyle(style)}
                  className={`rounded-lg border px-4 py-2 text-sm capitalize transition-colors ${
                    badgeStyle === style
                      ? 'border-primary-400 bg-primary-400/10 text-primary-400'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={!slug || !companyName || updateProfile.isPending}
              className="rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateProfile.isPending ? 'Saving...' : 'Save Profile'}
            </button>
            {updateProfile.isSuccess && (
              <span className="flex items-center gap-1 text-sm text-primary-400">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                Saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Embed Code */}
      {slug && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            <HugeiconsIcon
              icon={Link01Icon}
              size={18}
              className="text-zinc-400"
            />
            <h3 className="text-lg font-semibold text-zinc-100">Embed Code</h3>
          </div>

          <p className="mb-3 text-sm text-zinc-400">
            Add this snippet to your website to display your trust badge.
          </p>

          <div className="relative">
            <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
              <code>{embedCode}</code>
            </pre>
            <button
              onClick={() => navigator.clipboard.writeText(embedCode)}
              className="absolute right-3 top-3 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
            >
              Copy
            </button>
          </div>

          {/* Badge Preview */}
          <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-2 text-xs text-zinc-500">Badge Preview</div>
            <div className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5">
              <HugeiconsIcon
                icon={Shield01Icon}
                size={16}
                className="text-primary-400"
              />
              <span className="text-sm font-medium text-zinc-200">
                {companyName || 'Your Company'}
              </span>
              <span className="rounded bg-primary-400/10 px-1.5 py-0.5 text-xs font-bold text-primary-400">
                {grade}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
