import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

const CHART_ICONS: Record<string, string> = {
  bar: '\u2593', pie: '\u25CE', donut: '\u25C9', radar: '\u25C7', line: '\u2571', stacked_bar: '\u2588',
}

const DATA_SOURCES: Record<string, string> = {
  control_status: 'Control Status Distribution',
  evidence_timeline: 'Evidence Collection Timeline',
  findings_severity: 'Findings by Severity',
  framework_coverage: 'Framework Coverage',
  risk_trend: 'Risk Trend Over Time',
}

export function ChartView({ node, selected }: NodeViewProps) {
  const { chartType, dataSource, title } = node.attrs
  return (
    <NodeViewWrapper>
      <div className={`my-3 rounded-xl border bg-zinc-900 transition-colors ${selected ? 'border-primary-400/40 ring-1 ring-primary-400/20' : 'border-zinc-800'}`}>
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
          <span className="text-sm">{title || 'Chart'}</span>
          <div className="flex items-center gap-2">
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">{chartType}</span>
            <span className="text-lg">{CHART_ICONS[chartType] || '\u2593'}</span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-zinc-800 text-2xl text-zinc-500">
            {CHART_ICONS[chartType] || '\u2593'}
          </div>
          <p className="mt-3 text-xs text-zinc-400">{DATA_SOURCES[dataSource] || dataSource}</p>
          <p className="mt-1 text-[10px] text-zinc-600">Chart renders with data from compliance project</p>
        </div>
      </div>
    </NodeViewWrapper>
  )
}
