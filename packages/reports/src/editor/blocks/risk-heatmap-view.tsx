import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

const COLORS = [
  ['#4caf50', '#66bb6a', '#ffeb3b', '#ff9800', '#f44336'],
  ['#66bb6a', '#8bc34a', '#ffc107', '#ff5722', '#e53935'],
  ['#8bc34a', '#ffc107', '#ff5722', '#e53935', '#c62828'],
  ['#ffc107', '#ff5722', '#e53935', '#c62828', '#b71c1c'],
  ['#ff5722', '#e53935', '#c62828', '#b71c1c', '#880e4f'],
]

export function RiskHeatmapView({ node, selected }: NodeViewProps) {
  const scale = node.attrs.likelihoodScale || 5
  const labels = ['Very Low', 'Low', 'Medium', 'High', 'Very High']
  const border = selected ? '2px solid #3b82f6' : '1px solid #d1d5db'

  return (
    <NodeViewWrapper>
      <div style={{ margin: '12px 0', borderRadius: '8px', border, backgroundColor: '#fafafa', overflow: 'hidden' }}>
        <div style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 16px', backgroundColor: '#f3f4f6' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>Risk Heatmap</span>
        </div>
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'end', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '9px', color: '#6b7280', writingMode: 'vertical-rl', transform: 'rotate(180deg)', marginBottom: '24px' }}>Likelihood</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${scale}, 1fr)`, gap: '3px' }}>
                {Array.from({ length: scale * scale }, (_, i) => {
                  const row = Math.floor(i / scale)
                  const col = i % scale
                  const invertedRow = scale - 1 - row
                  return (
                    <div key={i} style={{ aspectRatio: '1', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'rgba(255,255,255,0.8)', backgroundColor: COLORS[invertedRow]?.[col] || '#ccc' }}>0</div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '9px', color: '#6b7280' }}>
                {labels.slice(0, scale).map(l => <span key={l}>{l}</span>)}
              </div>
              <p style={{ marginTop: '4px', textAlign: 'center', fontSize: '9px', color: '#6b7280' }}>Impact</p>
            </div>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}
