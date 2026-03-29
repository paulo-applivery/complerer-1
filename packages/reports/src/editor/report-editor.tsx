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
    <div className="report-editor flex-1 min-w-0">
      <EditorContent
        editor={editor}
        className="prose prose-invert prose-sm max-w-none rounded-lg border border-zinc-700 bg-zinc-800/50 px-6 py-4 min-h-[500px] focus-within:border-zinc-600 transition-colors [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[480px] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-zinc-600 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none"
      />
    </div>
  )
}

export { type Editor } from '@tiptap/core'
export { type JSONContent } from '@tiptap/core'
