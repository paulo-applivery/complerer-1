import { useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Shield01Icon,
  CheckmarkCircle01Icon,
  LoaderPinwheelIcon,
  Alert02Icon,
} from '@hugeicons/core-free-icons'

interface TrustProfile {
  slug: string
  company_name: string
  enabled: number
  show_frameworks: number
  show_posture_score: number
  show_evidence_freshness: number
  show_last_snapshot: number
  show_control_count: number
  badge_style: string
}

interface TrustData {
  profile: TrustProfile
  score: number
  grade: string
  breakdown: {
    frameworkCoverage: number
    evidenceFreshness: number
    violationRatio: number
    reviewCompleteness: number
    snapshotRecency: number
  }
  stats: {
    frameworksActive: number
    controlsSatisfied: number
    controlsTotal: number
    evidenceFreshness: number
    openViolations: number
  }
}

function gradeColor(grade: string) {
  switch (grade) {
    case 'A+':
    case 'A':
      return 'text-primary-400'
    case 'B':
      return 'text-blue-400'
    case 'C':
      return 'text-amber-400'
    case 'D':
      return 'text-orange-400'
    default:
      return 'text-red-400'
  }
}

function gradeBg(grade: string) {
  switch (grade) {
    case 'A+':
    case 'A':
      return 'bg-primary-400/10 border-primary-400/20'
    case 'B':
      return 'bg-blue-400/10 border-blue-400/20'
    case 'C':
      return 'bg-amber-400/10 border-amber-400/20'
    case 'D':
      return 'bg-orange-400/10 border-orange-400/20'
    default:
      return 'bg-red-400/10 border-red-400/20'
  }
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80 ? 'bg-primary-400' : value >= 50 ? 'bg-amber-400' : 'bg-red-400'

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="font-medium text-zinc-200">{value.toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-800">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  )
}

export function TrustCenterPage() {
  const params = useParams({ strict: false }) as { slug?: string }
  const slug = params.slug

  const { data, isLoading, error } = useQuery<TrustData>({
    queryKey: ['public-trust', slug],
    queryFn: async () => {
      const res = await fetch(`/api/trust/${slug}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as any).error || 'Not found')
      }
      return res.json()
    },
    enabled: !!slug,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <HugeiconsIcon icon={LoaderPinwheelIcon} size={24} className="animate-spin text-zinc-500" />
      </div>
    )
  }

  if (error || !data?.profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <HugeiconsIcon icon={Alert02Icon} size={40} className="mx-auto text-zinc-600" />
          <h1 className="mt-4 text-xl font-bold text-zinc-200">Trust Profile Not Found</h1>
          <p className="mt-2 text-sm text-zinc-500">
            The trust center for &quot;{slug}&quot; does not exist or has been disabled.
          </p>
        </div>
      </div>
    )
  }

  const { profile, score, grade, breakdown, stats } = data

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <HugeiconsIcon icon={Shield01Icon} size={24} className="text-primary-400" />
            <div>
              <h1 className="text-lg font-bold text-zinc-100">{profile.company_name}</h1>
              <p className="text-xs text-zinc-500">Trust Center</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-primary-400" />
            <span className="text-xs text-zinc-400">Verified by Complerer</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Score Card */}
          {profile.show_posture_score === 1 && (
            <div className={`rounded-2xl border p-6 text-center ${gradeBg(grade)}`}>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Compliance Score
              </p>
              <p className={`mt-2 text-5xl font-bold ${gradeColor(grade)}`}>{grade}</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-200">{score.toFixed(1)}</p>
              <p className="mt-1 text-xs text-zinc-500">out of 100</p>
            </div>
          )}

          {/* Stats */}
          <div className="space-y-4 lg:col-span-2">
            {profile.show_control_count === 1 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <h2 className="mb-3 text-sm font-semibold text-zinc-200">Frameworks</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-zinc-100">{stats.frameworksActive}</p>
                    <p className="text-xs text-zinc-500">Active Frameworks</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-zinc-100">{stats.controlsSatisfied}</p>
                    <p className="text-xs text-zinc-500">Controls Satisfied</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-zinc-100">{stats.controlsTotal}</p>
                    <p className="text-xs text-zinc-500">Total Controls</p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="mb-3 text-sm font-semibold text-zinc-200">Compliance Breakdown</h2>
              <div className="space-y-3">
                <ScoreBar label="Framework Coverage" value={breakdown.frameworkCoverage} />
                {profile.show_evidence_freshness === 1 && (
                  <ScoreBar label="Evidence Freshness" value={breakdown.evidenceFreshness} />
                )}
                <ScoreBar label="Violation Resolution" value={breakdown.violationRatio} />
                <ScoreBar label="Policy Review" value={breakdown.reviewCompleteness} />
                <ScoreBar label="Snapshot Recency" value={breakdown.snapshotRecency} />
              </div>
            </div>

            {stats.openViolations === 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-primary-400/20 bg-primary-400/5 p-4">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} className="text-primary-400" />
                <p className="text-sm text-primary-300">
                  No open compliance violations detected.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs text-zinc-600">
            Powered by{' '}
            <a href="https://dash.complerer.com" className="text-zinc-400 hover:text-zinc-300">
              Complerer
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
