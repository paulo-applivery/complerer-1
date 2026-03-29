import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

const COLORS = [
  ['#1b5e20', '#2e7d32', '#f57f17', '#e65100', '#b71c1c'],
  ['#2e7d32', '#43a047', '#f9a825', '#ef6c00', '#c62828'],
  ['#43a047', '#f9a825', '#ef6c00', '#c62828', '#b71c1c'],
  ['#f9a825', '#ef6c00', '#c62828', '#b71c1c', '#880e4f'],
  ['#ef6c00', '#c62828', '#b71c1c', '#880e4f', '#4a148c'],
]

export function RiskHeatmapView({ node, selected }: NodeViewProps) {
  const scale = node.attrs.likelihoodScale || 5
  const labels = ['Very Low', 'Low', 'Medium', 'High', 'Very High']

  return (
    <NodeViewWrapper>
      <div className={`my-3 rounded-xl border bg-zinc-900 transition-colors ${selected ? 'border-primary-400/40 ring-1 ring-primary-400/20' : 'border-zinc-800'}`}>
        <div className="border-b border-zinc-800 px-4 py-2.5">
          <span className="text-sm">Risk Heatmap</span>
        </div>
        <div className="p-4">
          <div className="flex items-end gap-2">
            <div className="flex flex-col items-center gap-0.5 text-[9px] text-zinc-500">
              <span className="writing-mode-vertical -rotate-90 mb-8">Likelihood</span>
            </div>
            <div className="flex-1">
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${scale}, 1fr)` }}>
                {Array.from({ length: scale * scale }, (_, i) => {
                  const row = Math.floor(i / scale)
                  const col = i % scale
                  const invertedRow = scale - 1 - row
                  return (
                    <div
                      key={i}
                      className="aspect-square rounded-sm flex items-center justify-center text-[9px] text-white/70"
                      style={{ backgroundColor: COLORS[invertedRow]?.[col] || '#333' }}
                    >
                      0
                    </div>
                  )
                })}
              </div>
              <div className="mt-1 flex justify-between text-[9px] text-zinc-500">
                {labels.slice(0, scale).map(l => <span key={l}>{l}</span>)}
              </div>
              <p className="mt-1 text-center text-[9px] text-zinc-500">Impact</p>
            </div>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}
