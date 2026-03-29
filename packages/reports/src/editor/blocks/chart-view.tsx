import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

const DATA_SOURCES: Record<string, string> = {
  control_status: 'Control Status Distribution', evidence_timeline: 'Evidence Collection Timeline',
  findings_severity: 'Findings by Severity', framework_coverage: 'Framework Coverage', risk_trend: 'Risk Trend Over Time',
}

export function ChartView({ node, selected }: NodeViewProps) {
  const { chartType, dataSource, title } = node.attrs
  const border = selected ? '2px solid #3b82f6' : '1px solid #d1d5db'

  return (
    <NodeViewWrapper>
      <div style={{ margin: '12px 0', borderRadius: '8px', border, backgroundColor: '#fafafa', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', padding: '8px 16px', backgroundColor: '#f3f4f6' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>{title || 'Chart'}</span>
          <span style={{ borderRadius: '4px', backgroundColor: '#e5e7eb', padding: '1px 6px', fontSize: '10px', color: '#6b7280' }}>{chartType}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#9ca3af' }}>{'\u2593'}</div>
          <p style={{ marginTop: '12px', fontSize: '11px', color: '#374151' }}>{DATA_SOURCES[dataSource] || dataSource}</p>
          <p style={{ marginTop: '4px', fontSize: '10px', color: '#9ca3af' }}>Chart renders with data from compliance project</p>
        </div>
      </div>
    </NodeViewWrapper>
  )
}
