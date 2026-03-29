import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-400/10 text-emerald-400',
  draft: 'bg-zinc-700 text-zinc-400',
  archived: 'bg-zinc-700 text-zinc-500',
}

export function PolicyReferenceView({ node, selected }: NodeViewProps) {
  const { policyName, policyVersion, policyStatus, policyId } = node.attrs
  const statusClass = STATUS_STYLES[policyStatus] || STATUS_STYLES.draft

  return (
    <NodeViewWrapper>
      <div className={`my-2 inline-flex items-center gap-3 rounded-xl border bg-zinc-900 px-4 py-2.5 transition-colors ${selected ? 'border-primary-400/40 ring-1 ring-primary-400/20' : 'border-zinc-800'}`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-sm">{'\u2693'}</div>
        <div>
          <p className="text-xs font-medium text-zinc-100">{policyName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-zinc-500">v{policyVersion}</span>
            <span className={`rounded-full px-1.5 py-px text-[9px] font-medium ${statusClass}`}>{policyStatus}</span>
          </div>
        </div>
        {policyId && <span className="text-[9px] text-zinc-600">{policyId.slice(0, 8)}</span>}
      </div>
    </NodeViewWrapper>
  )
}
