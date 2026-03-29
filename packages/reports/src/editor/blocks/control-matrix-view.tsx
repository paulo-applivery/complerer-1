import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

const COL_LABELS: Record<string, string> = {
  criteria: 'Criteria', control: 'Control Description', test_procedure: 'Test Procedure', result: 'Result', exceptions: 'Exceptions',
}

export function ControlMatrixView({ node, selected }: NodeViewProps) {
  const cols = (node.attrs.columns || []) as string[]
  const border = selected ? '2px solid #3b82f6' : '1px solid #d1d5db'

  return (
    <NodeViewWrapper>
      <div style={{ margin: '12px 0', borderRadius: '8px', border, backgroundColor: '#fafafa', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', padding: '8px 16px', backgroundColor: '#f3f4f6' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>Control Testing Matrix</span>
          {node.attrs.sectionScope && <span style={{ borderRadius: '10px', backgroundColor: '#e5e7eb', padding: '1px 8px', fontSize: '10px', color: '#6b7280' }}>{node.attrs.sectionScope}</span>}
        </div>
        <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{cols.map(c => <th key={c} style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>{COL_LABELS[c] || c}</th>)}</tr>
          </thead>
          <tbody>
            {[1, 2, 3].map(i => (
              <tr key={i}>{cols.map(c => <td key={c} style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6' }}><div style={{ height: '12px', width: '80px', borderRadius: '4px', backgroundColor: '#e5e7eb' }} /></td>)}</tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '8px', textAlign: 'center', fontSize: '10px', color: '#9ca3af' }}>Data loads from compliance project controls</div>
      </div>
    </NodeViewWrapper>
  )
}
