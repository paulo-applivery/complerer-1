import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Book02Icon,
  Search01Icon,
  LoaderPinwheelIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Alert02Icon,
  ThumbsUpIcon,
  Layers01Icon,
  Cancel01Icon,
  StarIcon,
  FlashIcon,
} from '@hugeicons/core-free-icons'
import { useAdoptedControls, usePlaybook, type Playbook, type EvidencePattern, type PlaybookTip } from '@/hooks/use-playbooks'

export function PlaybooksPage() {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const workspaceId = params.workspaceId

  const [search, setSearch] = useState('')
  const [selectedControlId, setSelectedControlId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const { controls, isLoading } = useAdoptedControls(workspaceId)

  // Client-side filter by search
  const filtered = search
    ? controls.filter(
        (c: any) =>
          c.title?.toLowerCase().includes(search.toLowerCase()) ||
          c.control_id?.toLowerCase().includes(search.toLowerCase()) ||
          c.framework_name?.toLowerCase().includes(search.toLowerCase())
      )
    : controls

  const limit = 20
  const totalPages = Math.max(1, Math.ceil(filtered.length / limit))
  const paged = filtered.slice((page - 1) * limit, page * limit)

  if (selectedControlId) {
    return (
      <PlaybookDetail
        workspaceId={workspaceId}
        controlId={selectedControlId}
        onBack={() => setSelectedControlId(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Community Playbooks</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Step-by-step guides for satisfying compliance controls, with evidence patterns and community tips.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none"
          placeholder="Search controls by ID, title, or framework..."
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <HugeiconsIcon icon={LoaderPinwheelIcon} size={20} className="animate-spin text-zinc-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <HugeiconsIcon icon={Book02Icon} size={40} className="mx-auto text-zinc-600" />
          <p className="mt-4 text-sm text-zinc-400">
            {search ? 'No controls match your search.' : 'No adopted controls yet. Adopt a framework to browse playbooks.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {paged.map((ctrl: any) => (
              <button
                key={ctrl.id}
                onClick={() => setSelectedControlId(ctrl.id)}
                className="group rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-left transition-all hover:border-zinc-700 hover:bg-zinc-800/50"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="rounded-md bg-primary-400/10 px-2 py-0.5 text-xs font-mono font-medium text-primary-400">
                    {ctrl.control_id}
                  </span>
                  <span className="shrink-0 rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                    {ctrl.framework_name}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-primary-400 transition-colors line-clamp-2">
                  {ctrl.title}
                </h3>
                {ctrl.domain && (
                  <p className="mt-1 text-xs text-zinc-500">{ctrl.domain}{ctrl.subdomain ? ` / ${ctrl.subdomain}` : ''}</p>
                )}
                <p className="mt-2 text-xs text-zinc-500 line-clamp-2">{ctrl.requirement_text}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-zinc-600 group-hover:text-zinc-500">
                  <HugeiconsIcon icon={Book02Icon} size={12} />
                  View Playbook
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, filtered.length)} of {filtered.length} controls
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-40"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                </button>
                <span className="text-xs text-zinc-400">
                  {page} / {totalPages}
                </span>
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
    </div>
  )
}

// ── Playbook Detail ──────────────────────────────────────────────────────────

function PlaybookDetail({
  workspaceId,
  controlId,
  onBack,
}: {
  workspaceId: string | undefined
  controlId: string
  onBack: () => void
}) {
  const { playbook, evidencePatterns, tips, isLoading } = usePlaybook(workspaceId, controlId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <HugeiconsIcon icon={LoaderPinwheelIcon} size={20} className="animate-spin text-zinc-500" />
      </div>
    )
  }

  if (!playbook) {
    return (
      <div className="py-16 text-center">
        <HugeiconsIcon icon={Alert02Icon} size={40} className="mx-auto text-zinc-600" />
        <p className="mt-4 text-sm text-zinc-400">Playbook not found.</p>
        <button onClick={onBack} className="mt-2 text-xs text-primary-400 hover:underline">
          Back to list
        </button>
      </div>
    )
  }

  const difficultyLabel = (d: number) => {
    if (d <= 1.5) return { text: 'Easy', color: 'text-primary-400 bg-primary-400/10' }
    if (d <= 2.5) return { text: 'Moderate', color: 'text-amber-400 bg-amber-400/10' }
    if (d <= 3.5) return { text: 'Complex', color: 'text-orange-400 bg-orange-400/10' }
    return { text: 'Advanced', color: 'text-red-400 bg-red-400/10' }
  }

  const diff = difficultyLabel(playbook.difficulty_rating)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          Back to Playbooks
        </button>

        <h1 className="text-2xl font-bold text-zinc-100">{playbook.title}</h1>
        <p className="mt-2 text-sm text-zinc-400">{playbook.summary}</p>

        {/* Meta badges */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${diff.color}`}>
            <HugeiconsIcon icon={FlashIcon} size={12} />
            {diff.text}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
            <HugeiconsIcon icon={Clock01Icon} size={12} />
            ~{playbook.estimated_effort_hours}h effort
          </span>
          {playbook.avg_audit_pass_rate !== null && (
            <span className="flex items-center gap-1 rounded-full bg-primary-400/10 px-2.5 py-0.5 text-xs font-medium text-primary-400">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} />
              {(playbook.avg_audit_pass_rate * 100).toFixed(0)}% audit pass
            </span>
          )}
          <span className="flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
            <HugeiconsIcon icon={Layers01Icon} size={12} />
            {playbook.source === 'ai_generated' ? 'AI Generated' : `${playbook.contributor_count} contributors`}
          </span>
        </div>
      </div>

      {/* Evidence Patterns */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-primary-400" />
          Evidence Patterns
        </h2>

        {evidencePatterns.length === 0 ? (
          <p className="text-xs text-zinc-500">No evidence patterns documented yet.</p>
        ) : (
          <div className="space-y-3">
            {evidencePatterns.map((pattern) => (
              <EvidencePatternCard key={pattern.id} pattern={pattern} />
            ))}
          </div>
        )}
      </div>

      {/* Community Tips */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <HugeiconsIcon icon={StarIcon} size={16} className="text-amber-400" />
          Community Tips
        </h2>

        {tips.length === 0 ? (
          <p className="text-xs text-zinc-500">No community tips available yet.</p>
        ) : (
          <div className="space-y-3">
            {tips.map((tip) => (
              <TipCard key={tip.id} tip={tip} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Evidence Pattern Card ────────────────────────────────────────────────────

function EvidencePatternCard({ pattern }: { pattern: EvidencePattern }) {
  const acceptanceColor =
    pattern.auditor_acceptance_rate >= 0.8
      ? 'text-primary-400'
      : pattern.auditor_acceptance_rate >= 0.6
        ? 'text-amber-400'
        : 'text-red-400'

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-zinc-100">{pattern.evidence_type}</h3>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-400">
            {pattern.evidence_source_tool && (
              <span className="flex items-center gap-1">
                Tool: <span className="text-zinc-300">{pattern.evidence_source_tool}</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              Frequency: <span className="text-zinc-300">{pattern.collection_frequency}</span>
            </span>
            <span className="flex items-center gap-1">
              Effort: <span className="text-zinc-300">{pattern.effort_minutes} min</span>
            </span>
            {pattern.automation_available === 1 && (
              <span className="flex items-center gap-1 text-primary-400">
                <HugeiconsIcon icon={FlashIcon} size={10} />
                Automatable
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs text-zinc-500">Acceptance</p>
          <p className={`text-lg font-bold ${acceptanceColor}`}>
            {(pattern.auditor_acceptance_rate * 100).toFixed(0)}%
          </p>
          <p className="text-[10px] text-zinc-600">{pattern.usage_percentage}% usage</p>
        </div>
      </div>
    </div>
  )
}

// ── Tip Card ────────────────────────────────────────────────────────────────

function TipCard({ tip }: { tip: PlaybookTip }) {
  const tipTypeIcon = (type: string) => {
    switch (type) {
      case 'pro_tip':
        return { icon: StarIcon, color: 'text-amber-400', label: 'Pro Tip' }
      case 'gotcha':
        return { icon: Alert02Icon, color: 'text-red-400', label: 'Gotcha' }
      case 'shortcut':
        return { icon: FlashIcon, color: 'text-primary-400', label: 'Shortcut' }
      default:
        return { icon: Book02Icon, color: 'text-zinc-400', label: 'Tip' }
    }
  }

  const { icon, color, label } = tipTypeIcon(tip.tip_type)

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
      <div className="flex items-start gap-3">
        <HugeiconsIcon icon={icon} size={16} className={`mt-0.5 shrink-0 ${color}`} />
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className={`text-xs font-medium ${color}`}>{label}</span>
            {tip.source_segment !== 'all' && (
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                {tip.source_segment}
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-300">{tip.content}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <HugeiconsIcon icon={ThumbsUpIcon} size={12} />
              {tip.upvotes}
            </span>
            <span>{new Date(tip.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
