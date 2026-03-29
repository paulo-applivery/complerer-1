import { useState, useEffect, useCallback } from 'react'
import type { Editor } from '@tiptap/core'

interface HeadingItem {
  id: string
  level: number
  text: string
  pos: number
}

export interface SectionOutlineProps {
  editor: Editor | null
}

export function SectionOutline({ editor }: SectionOutlineProps) {
  const [headings, setHeadings] = useState<HeadingItem[]>([])
  const [activePos, setActivePos] = useState<number | null>(null)

  const extractHeadings = useCallback(() => {
    if (!editor) return
    const items: HeadingItem[] = []
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        items.push({
          id: `heading-${pos}`,
          level: node.attrs.level as number,
          text: node.textContent || 'Untitled',
          pos,
        })
      }
    })
    setHeadings(items)
  }, [editor])

  // Extract headings on content change
  useEffect(() => {
    if (!editor) return
    extractHeadings()
    editor.on('update', extractHeadings)
    return () => { editor.off('update', extractHeadings) }
  }, [editor, extractHeadings])

  // Track active heading based on cursor position
  useEffect(() => {
    if (!editor) return
    const updateActive = () => {
      const { from } = editor.state.selection
      let closest: HeadingItem | null = null
      for (const h of headings) {
        if (h.pos <= from) closest = h
      }
      setActivePos(closest?.pos ?? null)
    }
    updateActive()
    editor.on('selectionUpdate', updateActive)
    return () => { editor.off('selectionUpdate', updateActive) }
  }, [editor, headings])

  const scrollToHeading = (pos: number) => {
    if (!editor) return
    editor.chain().focus().setTextSelection(pos + 1).run()
    // Scroll the editor to show the heading
    const domNode = editor.view.domAtPos(pos + 1)
    if (domNode.node instanceof HTMLElement) {
      domNode.node.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else if (domNode.node.parentElement) {
      domNode.node.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  if (headings.length === 0) {
    return (
      <div className="w-56 shrink-0">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Outline
        </p>
        <p className="text-xs text-zinc-600">
          Add headings to your document to see the outline here.
        </p>
      </div>
    )
  }

  return (
    <div className="w-56 shrink-0">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Outline
      </p>
      <nav className="space-y-0.5">
        {headings.map((h) => (
          <button
            key={h.id}
            onClick={() => scrollToHeading(h.pos)}
            className={`block w-full truncate rounded-md px-2 py-1 text-left text-xs transition-colors ${
              activePos === h.pos
                ? 'bg-zinc-800 text-zinc-100 font-medium'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
            style={{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }}
            title={h.text}
          >
            {h.text}
          </button>
        ))}
      </nav>
    </div>
  )
}
