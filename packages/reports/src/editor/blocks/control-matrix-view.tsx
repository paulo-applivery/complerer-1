import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

const RESULT_STYLES: Record<string, { bg: string; text: string }> = {
  pass: { bg: 'bg-emerald-400/10', text: 'text-emerald-400' },
  fail: { bg: 'bg-red-400/10', text: 'text-red-400' },
  partial: { bg: 'bg-amber-400/10', text: 'text-amber-400' },
  not_tested: { bg: 'bg-zinc-700', text: 'text-zinc-400' },
}

const COL_LABELS: Record<string, string> = {
  criteria: 'Criteria', control: 'Control Description', test_procedure: 'Test Procedure',
  result: 'Result', exceptions: 'Exceptions',
}

export function ControlMatrixView({ node, selected }: NodeViewProps) {
  const cols = (node.attrs.columns || []) as string[]
  return (
    <NodeViewWrapper>
      <div className={`my-3 rounded-xl border bg-zinc-900 transition-colors ${selected ? 'border-primary-400/40 ring-1 ring-primary-400/20' : 'border-zinc-800'}`}>
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
          <span className="text-sm">Control Testing Matrix</span>
          {node.attrs.sectionScope && <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">{node.attrs.sectionScope}</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-zinc-800">{cols.map(c => <th key={c} className="px-4 py-2 text-left font-medium text-zinc-400">{COL_LABELS[c] || c}</th>)}</tr></thead>
            <tbody>
              {[1, 2, 3].map(i => (
                <tr key={i} className="border-b border-zinc-800/50">
                  {cols.map(c => <td key={c} className="px-4 py-2"><div className="h-3 w-20 animate-pulse rounded bg-zinc-800" /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 text-center text-[10px] text-zinc-600">Data loads from compliance project controls</div>
      </div>
    </NodeViewWrapper>
  )
}
