import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { FileAttachmentIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useReports } from '@/hooks/use-reports'
import type { ReportStatus } from '@complerer/reports'

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-zinc-700', text: 'text-zinc-300', label: 'Draft' },
  review: { bg: 'bg-amber-400/10', text: 'text-amber-400', label: 'In Review' },
  approved: { bg: 'bg-emerald-400/10', text: 'text-emerald-400', label: 'Approved' },
  published: { bg: 'bg-blue-400/10', text: 'text-blue-400', label: 'Published' },
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'In Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Published' },
]

export function ReportsPage() {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const { workspaceId } = params
  const navigate = useNavigate()
  const { reports, isLoading } = useReports(workspaceId)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = reports.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Reports</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Generate certification-grade audit reports from your compliance data.
          </p>
        </div>
        <button
          onClick={() => {
            // Phase 3: will open CreateReportModal
          }}
          className="rounded-lg bg-primary-400 px-4 py-2 text-xs font-medium text-zinc-950 transition-colors hover:bg-primary-300"
        >
          New Report
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reports..."
          className="w-64 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-primary-400 focus:outline-none"
        />
        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-20">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-400/10">
            <HugeiconsIcon icon={FileAttachmentIcon} className="h-6 w-6 text-primary-400" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-zinc-100">
            {reports.length === 0 ? 'No reports yet' : 'No matching reports'}
          </h2>
          <p className="mt-2 max-w-md text-center text-sm text-zinc-500">
            {reports.length === 0
              ? 'Create your first report from a template to get started with SOC 2, ISO 27001, GDPR, or ENS certification reports.'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((report) => {
            const sty = STATUS_STYLES[report.status] || STATUS_STYLES.draft
            return (
              <button
                key={report.id}
                onClick={() =>
                  navigate({
                    to: '/w/$workspaceId/reports/$reportId/edit',
                    params: { workspaceId: workspaceId!, reportId: report.id },
                  })
                }
                className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left transition-all hover:border-zinc-700 hover:bg-zinc-800/50"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-medium text-zinc-100">{report.name}</h3>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${sty.bg} ${sty.text}`}>
                    {sty.label}
                  </span>
                </div>
                {report.auditPeriodStart && report.auditPeriodEnd && (
                  <p className="mt-2 text-xs text-zinc-500">
                    {report.auditPeriodStart} — {report.auditPeriodEnd}
                  </p>
                )}
                <p className="mt-auto pt-3 text-[10px] text-zinc-600">
                  Updated {new Date(report.updatedAt).toLocaleDateString()}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
