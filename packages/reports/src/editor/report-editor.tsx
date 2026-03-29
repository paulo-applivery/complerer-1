import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import type { JSONContent, Editor } from '@tiptap/core'
import { useEffect, useRef, useCallback } from 'react'
import { VariablePlaceholderExtension } from './blocks/variable-placeholder.js'
import { EvidenceTableExtension } from './blocks/evidence-table.js'
import { FindingCardExtension } from './blocks/finding-card.js'
import { ControlMatrixExtension } from './blocks/control-matrix.js'
import { RiskHeatmapExtension } from './blocks/risk-heatmap.js'
import { ChartExtension } from './blocks/chart.js'
import { TimelineExtension } from './blocks/timeline.js'
import { EvidenceGalleryExtension } from './blocks/evidence-gallery.js'
import { PolicyReferenceExtension } from './blocks/policy-reference.js'
import { SlashMenuExtension } from './slash-menu.js'

export interface ReportEditorProps {
  content?: JSONContent | null
  mode?: 'template' | 'report'
  placeholder?: string
  onUpdate?: (json: JSONContent) => void
  onSelectionUpdate?: (editor: Editor) => void
  editable?: boolean
}

export function ReportEditor({
  content,
  mode = 'report',
  placeholder = 'Start writing your report, or type / for commands...',
  onUpdate,
  onSelectionUpdate,
  editable = true,
}: ReportEditorProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleUpdate = useCallback(
    ({ editor }: { editor: Editor }) => {
      if (!onUpdate) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onUpdate(editor.getJSON())
      }, 2000)
    },
    [onUpdate]
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Typography,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
      VariablePlaceholderExtension.configure({ mode }),
      EvidenceTableExtension,
      FindingCardExtension,
      ControlMatrixExtension,
      RiskHeatmapExtension,
      ChartExtension,
      TimelineExtension,
      EvidenceGalleryExtension,
      PolicyReferenceExtension,
      SlashMenuExtension,
    ],
    content: content || undefined,
    editable,
    onUpdate: handleUpdate,
    onSelectionUpdate: ({ editor }) => {
      onSelectionUpdate?.(editor)
    },
  })

  // Sync editable prop
  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable)
    }
  }, [editor, editable])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  if (!editor) return null

  return (
    <div className="report-editor flex-1 min-w-0 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
      {/* A4 page simulation */}
      <div className="mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none bg-white text-zinc-900 shadow-2xl shadow-black/20 rounded-sm px-[25mm] py-[20mm] min-h-[297mm] focus-within:shadow-black/30 transition-shadow [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[257mm] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-zinc-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_h1]:text-zinc-900 [&_.ProseMirror_h2]:text-zinc-800 [&_.ProseMirror_h3]:text-zinc-700 [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_th]:bg-zinc-100 [&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-zinc-300 [&_.ProseMirror_th]:px-3 [&_.ProseMirror_th]:py-1.5 [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-zinc-300 [&_.ProseMirror_td]:px-3 [&_.ProseMirror_td]:py-1.5 [&_.ProseMirror_hr]:border-zinc-300 [&_.ProseMirror_blockquote]:border-l-zinc-300 [&_.ProseMirror_code]:bg-zinc-100 [&_.ProseMirror_a]:text-blue-600"
        />
      </div>
    </div>
  )
}

export { type Editor } from '@tiptap/core'
export { type JSONContent } from '@tiptap/core'
