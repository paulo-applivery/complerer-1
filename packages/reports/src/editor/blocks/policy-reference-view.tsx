import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active: { bg: '#dcfce7', color: '#16a34a' },
  draft: { bg: '#f3f4f6', color: '#6b7280' },
  archived: { bg: '#f3f4f6', color: '#9ca3af' },
}

export function PolicyReferenceView({ node, selected }: NodeViewProps) {
  const { policyName, policyVersion, policyStatus, policyId } = node.attrs
  const sc = STATUS_COLORS[policyStatus] || STATUS_COLORS.draft
  const border = selected ? '2px solid #3b82f6' : '1px solid #d1d5db'

  return (
    <NodeViewWrapper>
      <div style={{ margin: '8px 0', display: 'inline-flex', alignItems: 'center', gap: '10px', borderRadius: '8px', border, backgroundColor: '#fafafa', padding: '8px 16px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#6b7280' }}>{'\u2693'}</div>
        <div>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#111', margin: 0 }}>{policyName}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span style={{ fontSize: '10px', color: '#6b7280' }}>v{policyVersion}</span>
            <span style={{ borderRadius: '10px', padding: '1px 6px', fontSize: '9px', fontWeight: 500, backgroundColor: sc.bg, color: sc.color }}>{policyStatus}</span>
          </div>
        </div>
        {policyId && <span style={{ fontSize: '9px', color: '#9ca3af' }}>{policyId.slice(0, 8)}</span>}
      </div>
    </NodeViewWrapper>
  )
}
