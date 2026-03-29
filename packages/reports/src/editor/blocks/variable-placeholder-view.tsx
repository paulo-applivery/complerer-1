import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

const VARIABLE_LABELS: Record<string, string> = {
  'org.name': 'Organization Name',
  'org.address': 'Organization Address',
  'audit.period_start': 'Audit Period Start',
  'audit.period_end': 'Audit Period End',
  'audit.scope': 'Audit Scope',
  'audit.auditor': 'Auditor Name',
  'audit.date': 'Audit Date',
}

export function VariablePlaceholderView({ node, selected }: NodeViewProps) {
  const { variableKey, variableType, displayMode } = node.attrs
  const label = VARIABLE_LABELS[variableKey] || variableKey

  if (displayMode === 'resolved') {
    return (
      <NodeViewWrapper as="span" className="inline">
        <span className="text-zinc-100">{variableKey}</span>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper as="span" className="inline">
      <span
        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${
          selected
            ? 'bg-primary-400/20 text-primary-300 ring-1 ring-primary-400/40'
            : 'bg-primary-400/10 text-primary-400'
        }`}
      >
        <span className="text-[10px] opacity-60">{'{'}</span>
        {label}
        <span className="text-[10px] opacity-60">{'}'}</span>
        {variableType !== 'text' && (
          <span className="rounded bg-zinc-700/50 px-1 py-px text-[9px] text-zinc-400">
            {variableType}
          </span>
        )}
      </span>
    </NodeViewWrapper>
  )
}
