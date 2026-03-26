import { useState, useMemo } from 'react'
import { useParams } from '@tanstack/react-router'
import { useAdoptions, useFrameworks } from '@/hooks/use-frameworks'
import { useGapAnalysis } from '@/hooks/use-gap-analysis'
import type { GapControl } from '@/hooks/use-gap-analysis'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Shield01Icon,
  CheckmarkCircle01Icon,
  Alert02Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  LoaderPinwheelIcon,
  Layers01Icon,
  Link01Icon,
  Search01Icon,
  FilterIcon,
  ArrowDown01Icon,
} from '@hugeicons/core-free-icons'

// ── Status helpers ──────────────────────────────────────────────────────

const STATUS_CONFIG = {
  compliant: {
    label: 'Compliant',
    bg: 'bg-green-500/10',
    text: 'text-green-400',
  },
  auto_satisfied: {
    label: 'Auto-satisfied',
    bg: 'bg-primary-400/10',
    text: 'text-primary-400',
  },
  partial: {
    label: 'Partial',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
  },
  gap: {
    label: 'Gap',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
  },
} as const

// ── Component ───────────────────────────────────────────────────────────

export function GapAnalysisPage() {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const workspaceId = params.workspaceId

  // Framework selection state
  const [sourceFramework, setSourceFramework] = useState('')
  const [targetFramework, setTargetFramework] = useState('')
  const [analysisTriggered, setAnalysisTriggered] = useState(false)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [domainFilter, setDomainFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 50

  // Data hooks
  const { adoptions, isLoading: adoptionsLoading } = useAdoptions(workspaceId)
  const { frameworks, isLoading: frameworksLoading } = useFrameworks(workspaceId)

  const activeSource = analysisTriggered ? sourceFramework : ''
  const activeTarget = analysisTriggered ? targetFramework : ''

  const { gapAnalysis, isLoading: analysisLoading } = useGapAnalysis(
    workspaceId,
    activeSource,
    activeTarget,
  )

  const handleAnalyze = () => {
    if (sourceFramework && targetFramework) {
      setAnalysisTriggered(true)
      setPage(1)
      setStatusFilter('')
      setDomainFilter('')
      setSearchQuery('')
    }
  }

  // Derived data
  const domains = useMemo(() => {
    if (!gapAnalysis) return []
    return Array.from(
      new Set(gapAnalysis.controls.map((c) => c.domain).filter(Boolean)),
    ) as string[]
  }, [gapAnalysis])

  const filteredControls = useMemo(() => {
    if (!gapAnalysis) return []
    let result = gapAnalysis.controls
    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter)
    }
    if (domainFilter) {
      result = result.filter((c) => c.domain === domainFilter)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.controlId.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q),
      )
    }
    return result
  }, [gapAnalysis, statusFilter, domainFilter, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredControls.length / pageSize))
  const paginatedControls = filteredControls.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )

  const isInitialLoading = adoptionsLoading || frameworksLoading

  if (isInitialLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <HugeiconsIcon
          icon={LoaderPinwheelIcon}
          size={24}
          className="animate-spin text-zinc-500"
        />
      </div>
    )
  }

  const summary = gapAnalysis?.summary

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Gap Analysis</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Compare frameworks to identify compliance gaps and crosswalk coverage.
        </p>
      </div>

      {/* Step 1: Framework Selection */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">
          Select Frameworks
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {/* Source Framework */}
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Source Framework
              <span className="ml-1 text-zinc-600">
                (what you're compliant with)
              </span>
            </label>
            <div className="relative">
              <HugeiconsIcon
                icon={Shield01Icon}
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <select
                value={sourceFramework}
                onChange={(e) => {
                  setSourceFramework(e.target.value)
                  setAnalysisTriggered(false)
                }}
                className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-8 text-sm text-zinc-300 focus:border-primary-400 focus:outline-none"
              >
                <option value="">Select source framework...</option>
                {adoptions.map((a) => (
                  <option key={a.id} value={a.frameworkSlug}>
                    {a.frameworkName} (v{a.frameworkVersion})
                  </option>
                ))}
              </select>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden items-center pb-1 sm:flex">
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={20}
              className="text-zinc-600"
            />
          </div>

          {/* Target Framework */}
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Target Framework
              <span className="ml-1 text-zinc-600">
                (what you want to check against)
              </span>
            </label>
            <div className="relative">
              <HugeiconsIcon
                icon={Layers01Icon}
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <select
                value={targetFramework}
                onChange={(e) => {
                  setTargetFramework(e.target.value)
                  setAnalysisTriggered(false)
                }}
                className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-8 text-sm text-zinc-300 focus:border-primary-400 focus:outline-none"
              >
                <option value="">Select target framework...</option>
                {frameworks.map((fw) => (
                  <option key={fw.id} value={fw.slug}>
                    {fw.name}
                  </option>
                ))}
              </select>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={!sourceFramework || !targetFramework || analysisLoading}
            className="rounded-lg bg-primary-400 px-6 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analysisLoading ? (
              <span className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={LoaderPinwheelIcon}
                  size={14}
                  className="animate-spin"
                />
                Analyzing...
              </span>
            ) : (
              'Analyze Gaps'
            )}
          </button>
        </div>
      </div>

      {/* Step 2: Results */}
      {analysisTriggered && analysisLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <HugeiconsIcon
              icon={LoaderPinwheelIcon}
              size={32}
              className="animate-spin text-primary-400"
            />
            <p className="text-sm text-zinc-400">Running gap analysis...</p>
          </div>
        </div>
      )}

      {analysisTriggered && gapAnalysis && summary && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <SummaryCard
              label="Total Controls"
              value={summary.totalControls}
              icon={Layers01Icon}
              iconColor="text-zinc-400"
            />
            <SummaryCard
              label="Compliant"
              value={summary.compliant}
              icon={CheckmarkCircle01Icon}
              iconColor="text-green-400"
              badgeClass="bg-green-500/10 text-green-400"
            />
            <SummaryCard
              label="Auto-satisfied"
              value={summary.autoSatisfied}
              icon={Link01Icon}
              iconColor="text-primary-400"
              badgeClass="bg-primary-400/10 text-primary-400"
            />
            <SummaryCard
              label="Partial"
              value={summary.partial}
              icon={Alert02Icon}
              iconColor="text-amber-400"
              badgeClass="bg-amber-500/10 text-amber-400"
            />
            <SummaryCard
              label="Gap"
              value={summary.gap}
              icon={Shield01Icon}
              iconColor="text-red-400"
              badgeClass="bg-red-500/10 text-red-400"
            />
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-xs font-medium text-zinc-400">Coverage</p>
              <p className="mt-2 text-3xl font-bold text-zinc-100">
                {summary.coveragePercent}
                <span className="text-lg text-zinc-500">%</span>
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-300">
                Coverage Breakdown
              </p>
              <p className="text-xs text-zinc-500">
                {summary.compliant + summary.autoSatisfied + summary.partial} /{' '}
                {summary.totalControls} addressed
              </p>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-800">
              {summary.compliant > 0 && (
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{
                    width: `${(summary.compliant / summary.totalControls) * 100}%`,
                  }}
                  title={`Compliant: ${summary.compliant}`}
                />
              )}
              {summary.autoSatisfied > 0 && (
                <div
                  className="h-full bg-primary-400 transition-all duration-500"
                  style={{
                    width: `${(summary.autoSatisfied / summary.totalControls) * 100}%`,
                  }}
                  title={`Auto-satisfied: ${summary.autoSatisfied}`}
                />
              )}
              {summary.partial > 0 && (
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{
                    width: `${(summary.partial / summary.totalControls) * 100}%`,
                  }}
                  title={`Partial: ${summary.partial}`}
                />
              )}
              {summary.gap > 0 && (
                <div
                  className="h-full bg-red-500 transition-all duration-500"
                  style={{
                    width: `${(summary.gap / summary.totalControls) * 100}%`,
                  }}
                  title={`Gap: ${summary.gap}`}
                />
              )}
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                Compliant
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-primary-400" />
                Auto-satisfied
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                Partial
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                Gap
              </span>
            </div>
          </div>

          {/* Controls Table */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900">
            {/* Table header with filters */}
            <div className="flex flex-col gap-3 border-b border-zinc-800 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-zinc-100">
                  Target Controls
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {filteredControls.length} controls
                  {filteredControls.length !== gapAnalysis.controls.length &&
                    ` (filtered from ${gapAnalysis.controls.length})`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setPage(1)
                    }}
                    placeholder="Search controls..."
                    className="rounded-lg border border-zinc-700 bg-zinc-800 py-1.5 pl-8 pr-3 text-xs text-zinc-300 placeholder-zinc-600 focus:border-primary-400 focus:outline-none"
                  />
                </div>

                {/* Status filter */}
                <div className="relative">
                  <HugeiconsIcon
                    icon={FilterIcon}
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value)
                      setPage(1)
                    }}
                    className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 py-1.5 pl-8 pr-8 text-xs text-zinc-300 focus:border-primary-400 focus:outline-none"
                  >
                    <option value="">All statuses</option>
                    <option value="compliant">Compliant</option>
                    <option value="auto_satisfied">Auto-satisfied</option>
                    <option value="partial">Partial</option>
                    <option value="gap">Gap</option>
                  </select>
                </div>

                {/* Domain filter */}
                <div className="relative">
                  <HugeiconsIcon
                    icon={FilterIcon}
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
                  />
                  <select
                    value={domainFilter}
                    onChange={(e) => {
                      setDomainFilter(e.target.value)
                      setPage(1)
                    }}
                    className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 py-1.5 pl-8 pr-8 text-xs text-zinc-300 focus:border-primary-400 focus:outline-none"
                  >
                    <option value="">All domains</option>
                    {domains.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            {paginatedControls.length === 0 ? (
              <div className="py-12 text-center text-sm text-zinc-500">
                No controls found matching filters.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                        <th className="px-5 py-3 font-medium">Control ID</th>
                        <th className="px-5 py-3 font-medium">Domain</th>
                        <th className="px-5 py-3 font-medium">Title</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Satisfied By</th>
                        <th className="px-5 py-3 font-medium text-right">
                          Evidence
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {paginatedControls.map((control) => (
                        <ControlRow key={control.controlId} control={control} />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-3">
                    <p className="text-xs text-zinc-500">
                      Page {page} of {totalPages}
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
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
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
        </>
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon,
  iconColor,
  badgeClass,
}: {
  label: string
  value: number
  icon: typeof Layers01Icon
  iconColor: string
  badgeClass?: string
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-400">{label}</p>
        <HugeiconsIcon icon={icon} size={16} className={iconColor} />
      </div>
      <p className="mt-2 text-3xl font-bold text-zinc-100">{value}</p>
      {badgeClass && (
        <span
          className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}
        >
          {label}
        </span>
      )}
    </div>
  )
}

function ControlRow({ control }: { control: GapControl }) {
  const config = STATUS_CONFIG[control.status]

  return (
    <tr className="transition-colors hover:bg-zinc-800/30">
      <td className="px-5 py-3 font-mono text-xs text-primary-400">
        {control.controlId}
      </td>
      <td className="max-w-[200px] truncate px-5 py-3 text-zinc-400">
        {control.domain}
      </td>
      <td className="px-5 py-3 text-zinc-100">{control.title}</td>
      <td className="px-5 py-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}
        >
          {config.label}
        </span>
      </td>
      <td className="px-5 py-3">
        {control.satisfiedBy.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {control.satisfiedBy.map((s) => (
              <span
                key={s.controlId}
                className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300"
              >
                {s.controlId}
                <span className="text-zinc-500">
                  ({s.relationship === 'equivalent'
                    ? 'equiv'
                    : s.confidence !== undefined
                      ? `${s.confidence}%`
                      : s.relationship})
                </span>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-zinc-600">&mdash;</span>
        )}
      </td>
      <td className="px-5 py-3 text-right text-zinc-400">
        {control.evidenceCount}
      </td>
    </tr>
  )
}
