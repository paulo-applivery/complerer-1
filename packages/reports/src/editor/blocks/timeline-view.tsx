import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

const SAMPLE_EVENTS = [
  { date: 'Week 1-2', label: 'Planning & Scoping', status: 'done' },
  { date: 'Week 3-6', label: 'Evidence Collection', status: 'done' },
  { date: 'Week 7-8', label: 'Control Testing', status: 'active' },
  { date: 'Week 9-10', label: 'Report Drafting', status: 'pending' },
  { date: 'Week 11-12', label: 'Review & Sign-off', status: 'pending' },
]

export function TimelineView({ node, selected }: NodeViewProps) {
  const events = (node.attrs.events?.length > 0) ? node.attrs.events : SAMPLE_EVENTS

  return (
    <NodeViewWrapper>
      <div className={`my-3 rounded-xl border bg-zinc-900 transition-colors ${selected ? 'border-primary-400/40 ring-1 ring-primary-400/20' : 'border-zinc-800'}`}>
        <div className="border-b border-zinc-800 px-4 py-2.5">
          <span className="text-sm">Audit Timeline</span>
        </div>
        <div className="p-4">
          <div className="relative ml-3 border-l border-zinc-700 pl-6 space-y-4">
            {events.map((event: any, i: number) => (
              <div key={i} className="relative">
                <div className={`absolute -left-[31px] h-3 w-3 rounded-full border-2 ${
                  event.status === 'done' ? 'border-emerald-400 bg-emerald-400'
                  : event.status === 'active' ? 'border-primary-400 bg-primary-400'
                  : 'border-zinc-600 bg-zinc-800'
                }`} />
                <p className="text-[10px] text-zinc-500">{event.date}</p>
                <p className={`text-xs ${event.status === 'pending' ? 'text-zinc-500' : 'text-zinc-200'}`}>{event.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}
