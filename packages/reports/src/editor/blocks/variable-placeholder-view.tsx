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
      <NodeViewWrapper as="span" style={{ display: 'inline' }}>
        <span style={{ color: '#111' }}>{variableKey}</span>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper as="span" style={{ display: 'inline' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          borderRadius: '4px',
          padding: '1px 6px',
          fontSize: '11px',
          fontWeight: 500,
          backgroundColor: selected ? '#dbeafe' : '#eff6ff',
          color: '#1d4ed8',
          border: selected ? '1px solid #93c5fd' : '1px solid #bfdbfe',
        }}
      >
        <span style={{ fontSize: '9px', opacity: 0.6 }}>{'{'}</span>
        {label}
        <span style={{ fontSize: '9px', opacity: 0.6 }}>{'}'}</span>
        {variableType !== 'text' && (
          <span style={{ borderRadius: '3px', backgroundColor: '#e5e7eb', padding: '0 4px', fontSize: '9px', color: '#6b7280' }}>
            {variableType}
          </span>
        )}
      </span>
    </NodeViewWrapper>
  )
}
