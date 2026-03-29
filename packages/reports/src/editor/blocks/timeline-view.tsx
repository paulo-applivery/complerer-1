import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

const SAMPLE_EVENTS = [
  { date: 'Week 1-2', label: 'Planning & Scoping', status: 'done' },
  { date: 'Week 3-6', label: 'Evidence Collection', status: 'done' },
  { date: 'Week 7-8', label: 'Control Testing', status: 'active' },
  { date: 'Week 9-10', label: 'Report Drafting', status: 'pending' },
  { date: 'Week 11-12', label: 'Review & Sign-off', status: 'pending' },
]

const DOT_COLORS: Record<string, string> = { done: '#22c55e', active: '#3b82f6', pending: '#d1d5db' }

export function TimelineView({ node, selected }: NodeViewProps) {
  const events = (node.attrs.events?.length > 0) ? node.attrs.events : SAMPLE_EVENTS
  const border = selected ? '2px solid #3b82f6' : '1px solid #d1d5db'

  return (
    <NodeViewWrapper>
      <div style={{ margin: '12px 0', borderRadius: '8px', border, backgroundColor: '#fafafa', overflow: 'hidden' }}>
        <div style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 16px', backgroundColor: '#f3f4f6' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>Audit Timeline</span>
        </div>
        <div style={{ padding: '16px 16px 16px 28px' }}>
          <div style={{ position: 'relative', borderLeft: '2px solid #d1d5db', paddingLeft: '20px' }}>
            {events.map((event: any, i: number) => (
              <div key={i} style={{ position: 'relative', marginBottom: i < events.length - 1 ? '16px' : 0 }}>
                <div style={{ position: 'absolute', left: '-27px', width: '12px', height: '12px', borderRadius: '50%', border: '2px solid ' + (DOT_COLORS[event.status] || '#d1d5db'), backgroundColor: event.status === 'pending' ? '#fff' : (DOT_COLORS[event.status] || '#d1d5db') }} />
                <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0 }}>{event.date}</p>
                <p style={{ fontSize: '11px', color: event.status === 'pending' ? '#9ca3af' : '#111', margin: '2px 0 0' }}>{event.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}
