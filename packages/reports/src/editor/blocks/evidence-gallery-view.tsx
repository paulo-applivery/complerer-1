import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

export function EvidenceGalleryView({ node, selected }: NodeViewProps) {
  const ids = (node.attrs.evidenceIds || []) as string[]
  const layout = node.attrs.layout || 'grid'
  const isEmpty = ids.length === 0
  const border = selected ? '2px solid #3b82f6' : '1px solid #d1d5db'

  return (
    <NodeViewWrapper>
      <div style={{ margin: '12px 0', borderRadius: '8px', border, backgroundColor: '#fafafa', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', padding: '8px 16px', backgroundColor: '#f3f4f6' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>Evidence Gallery</span>
          <span style={{ borderRadius: '4px', backgroundColor: '#e5e7eb', padding: '1px 6px', fontSize: '10px', color: '#6b7280' }}>{layout}</span>
        </div>
        {isEmpty ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#9ca3af' }}>{'\u25A3'}</div>
            <p style={{ marginTop: '12px', fontSize: '11px', color: '#6b7280' }}>No evidence selected</p>
            <p style={{ marginTop: '4px', fontSize: '10px', color: '#9ca3af' }}>Configure evidence IDs in the properties panel</p>
          </div>
        ) : (
          <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: layout === 'grid' ? 'repeat(3, 1fr)' : '1fr', gap: '12px' }}>
            {ids.map((id, i) => (
              <div key={i} style={{ borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: '#fff', padding: '8px' }}>
                <div style={{ aspectRatio: '16/9', borderRadius: '4px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#9ca3af' }}>Preview</div>
                {node.attrs.showMetadata && <p style={{ marginTop: '6px', fontSize: '10px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{id}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}
