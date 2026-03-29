import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

const SEVERITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: 'bg-red-400/10', text: 'text-red-400', label: 'Critical' },
  high: { bg: 'bg-orange-400/10', text: 'text-orange-400', label: 'High' },
  medium: { bg: 'bg-amber-400/10', text: 'text-amber-400', label: 'Medium' },
  low: { bg: 'bg-blue-400/10', text: 'text-blue-400', label: 'Low' },
  informational: { bg: 'bg-zinc-700', text: 'text-zinc-400', label: 'Info' },
}

interface FieldRowProps {
  label: string
  value: string
}

function FieldRow({ label, value }: FieldRowProps) {
  if (!value) return null
  return (
    <div className="border-t border-zinc-800/50 px-4 py-2.5">
      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="text-xs text-zinc-300">{value}</p>
    </div>
  )
}

export function FindingCardView({ node, selected }: NodeViewProps) {
  const { severity, title, condition, criteria, cause, effect, recommendation, mode, findingId } =
    node.attrs

  const sev = SEVERITY_STYLES[severity] || SEVERITY_STYLES.medium

  return (
    <NodeViewWrapper>
      <div
        className={`my-3 rounded-xl border bg-zinc-900 transition-colors ${
          selected ? 'border-primary-400/40 ring-1 ring-primary-400/20' : 'border-zinc-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3">
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${sev.bg} ${sev.text}`}>
            {sev.label}
          </span>
          <span className="text-sm font-medium text-zinc-100">{title || 'Untitled Finding'}</span>
          {mode === 'linked' && findingId && (
            <span className="ml-auto rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
              Linked: {findingId.slice(0, 8)}
            </span>
          )}
        </div>

        {/* Fields */}
        <FieldRow label="Condition" value={condition} />
        <FieldRow label="Criteria" value={criteria} />
        <FieldRow label="Cause" value={cause} />
        <FieldRow label="Effect" value={effect} />
        <FieldRow label="Recommendation" value={recommendation} />

        {/* Empty inline state */}
        {mode === 'inline' && !condition && !criteria && !cause && !effect && !recommendation && (
          <div className="border-t border-zinc-800/50 px-4 py-4 text-center">
            <p className="text-[10px] text-zinc-600">
              Select this block to edit finding details in the properties panel
            </p>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}
