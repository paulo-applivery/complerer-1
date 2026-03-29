import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

const COLUMN_LABELS: Record<string, string> = {
  name: 'Evidence', type: 'Type', status: 'Status', date: 'Collected', source: 'Source', controls: 'Linked Controls',
}

export function EvidenceTableView({ node, selected }: NodeViewProps) {
  const { columns, filterStatus, controlIds } = node.attrs
  const cols = columns as string[]
  const isEmpty = !controlIds || (controlIds as string[]).length === 0
  const border = selected ? '2px solid #3b82f6' : '1px solid #d1d5db'

  return (
    <NodeViewWrapper>
      <div style={{ margin: '12px 0', borderRadius: '8px', border, backgroundColor: '#fafafa', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', padding: '8px 16px', backgroundColor: '#f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>Evidence Table</span>
            {filterStatus !== 'all' && (
              <span style={{ borderRadius: '10px', backgroundColor: '#e5e7eb', padding: '1px 8px', fontSize: '10px', color: '#6b7280' }}>{filterStatus}</span>
            )}
          </div>
          <span style={{ fontSize: '10px', color: '#9ca3af' }}>
            {isEmpty ? 'No controls selected' : `${(controlIds as string[]).length} controls`}
          </span>
        </div>

        {isEmpty ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#9ca3af' }}>{'\u2637'}</div>
            <p style={{ marginTop: '12px', fontSize: '11px', color: '#6b7280' }}>No evidence to display</p>
            <p style={{ marginTop: '4px', fontSize: '10px', color: '#9ca3af' }}>Configure controls in the properties panel</p>
          </div>
        ) : (
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{cols.map(c => <th key={c} style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{COLUMN_LABELS[c] || c}</th>)}</tr>
            </thead>
            <tbody>
              {[1, 2].map(i => (
                <tr key={i}>{cols.map(c => <td key={c} style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6' }}><div style={{ height: '12px', width: '80px', borderRadius: '4px', backgroundColor: '#e5e7eb' }} /></td>)}</tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </NodeViewWrapper>
  )
}
