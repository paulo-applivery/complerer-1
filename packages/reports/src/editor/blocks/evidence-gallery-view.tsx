import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

export function EvidenceGalleryView({ node, selected }: NodeViewProps) {
  const ids = (node.attrs.evidenceIds || []) as string[]
  const layout = node.attrs.layout || 'grid'
  const isEmpty = ids.length === 0

  return (
    <NodeViewWrapper>
      <div className={`my-3 rounded-xl border bg-zinc-900 transition-colors ${selected ? 'border-primary-400/40 ring-1 ring-primary-400/20' : 'border-zinc-800'}`}>
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
          <span className="text-sm">Evidence Gallery</span>
          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">{layout}</span>
        </div>
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-lg text-zinc-600">{'\u25A3'}</div>
            <p className="mt-3 text-xs text-zinc-500">No evidence selected</p>
            <p className="mt-1 text-[10px] text-zinc-600">Configure evidence IDs in the properties panel</p>
          </div>
        ) : (
          <div className={`p-4 ${layout === 'grid' ? 'grid grid-cols-3 gap-3' : 'space-y-2'}`}>
            {ids.map((id, i) => (
              <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
                <div className="aspect-video rounded bg-zinc-700 flex items-center justify-center text-zinc-500 text-xs">Preview</div>
                {node.attrs.showMetadata && <p className="mt-2 truncate text-[10px] text-zinc-500">{id}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}
