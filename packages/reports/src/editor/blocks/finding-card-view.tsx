import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

const SEVERITY_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  critical: { bg: '#fef2f2', color: '#dc2626', label: 'Critical' },
  high: { bg: '#fff7ed', color: '#ea580c', label: 'High' },
  medium: { bg: '#fffbeb', color: '#d97706', label: 'Medium' },
  low: { bg: '#eff6ff', color: '#2563eb', label: 'Low' },
  informational: { bg: '#f3f4f6', color: '#6b7280', label: 'Info' },
}

function FieldRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div style={{ borderTop: '1px solid #e5e7eb', padding: '8px 16px' }}>
      <p style={{ marginBottom: '2px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>{label}</p>
      <p style={{ fontSize: '11px', color: '#111', margin: 0 }}>{value}</p>
    </div>
  )
}

export function FindingCardView({ node, selected }: NodeViewProps) {
  const { severity, title, condition, criteria, cause, effect, recommendation, mode, findingId } = node.attrs
  const sev = SEVERITY_STYLES[severity] || SEVERITY_STYLES.medium
  const border = selected ? '2px solid #3b82f6' : '1px solid #d1d5db'

  return (
    <NodeViewWrapper>
      <div style={{ margin: '12px 0', borderRadius: '8px', border, backgroundColor: '#fafafa', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', backgroundColor: '#f9fafb' }}>
          <span style={{ borderRadius: '4px', padding: '2px 8px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', backgroundColor: sev.bg, color: sev.color }}>{sev.label}</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{title || 'Untitled Finding'}</span>
          {mode === 'linked' && findingId && (
            <span style={{ marginLeft: 'auto', borderRadius: '4px', backgroundColor: '#e5e7eb', padding: '1px 6px', fontSize: '9px', color: '#6b7280' }}>Linked: {findingId.slice(0, 8)}</span>
          )}
        </div>
        <FieldRow label="Condition" value={condition} />
        <FieldRow label="Criteria" value={criteria} />
        <FieldRow label="Cause" value={cause} />
        <FieldRow label="Effect" value={effect} />
        <FieldRow label="Recommendation" value={recommendation} />
        {mode === 'inline' && !condition && !criteria && !cause && !effect && !recommendation && (
          <div style={{ borderTop: '1px solid #e5e7eb', padding: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0 }}>Select this block to edit finding details in the properties panel</p>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}
