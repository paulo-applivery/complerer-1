import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

const COLUMN_LABELS: Record<string, string> = {
  name: 'Evidence',
  type: 'Type',
  status: 'Status',
  date: 'Collected',
  source: 'Source',
  controls: 'Linked Controls',
}

const STATUS_COLORS: Record<string, string> = {
  collected: 'bg-emerald-400/10 text-emerald-400',
  pending: 'bg-amber-400/10 text-amber-400',
  expired: 'bg-red-400/10 text-red-400',
  missing: 'bg-zinc-700 text-zinc-400',
}

export function EvidenceTableView({ node, selected, updateAttributes }: NodeViewProps) {
  const { columns, filterStatus, controlIds } = node.attrs
  const cols = columns as string[]

  const isEmpty = !controlIds || (controlIds as string[]).length === 0

  return (
    <NodeViewWrapper>
      <div
        className={`my-3 rounded-xl border bg-zinc-900 transition-colors ${
          selected ? 'border-primary-400/40 ring-1 ring-primary-400/20' : 'border-zinc-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm">Evidence Table</span>
            {filterStatus !== 'all' && (
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                {filterStatus}
              </span>
            )}
          </div>
          <span className="text-[10px] text-zinc-600">
            {isEmpty ? 'No controls selected' : `${(controlIds as string[]).length} controls`}
          </span>
        </div>

        {isEmpty ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
              <span className="text-lg text-zinc-600">{'\u2637'}</span>
            </div>
            <p className="mt-3 text-xs text-zinc-500">No evidence to display</p>
            <p className="mt-1 text-[10px] text-zinc-600">
              Select this block and configure controls in the properties panel
            </p>
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800">
                  {cols.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-2 text-left font-medium text-zinc-400"
                    >
                      {COLUMN_LABELS[col] || col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Placeholder rows — real data comes from API in Phase 3 */}
                <tr className="border-b border-zinc-800/50">
                  {cols.map((col) => (
                    <td key={col} className="px-4 py-2">
                      <div className="h-3 w-20 animate-pulse rounded bg-zinc-800" />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-zinc-800/50">
                  {cols.map((col) => (
                    <td key={col} className="px-4 py-2">
                      <div className="h-3 w-16 animate-pulse rounded bg-zinc-800" />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}
