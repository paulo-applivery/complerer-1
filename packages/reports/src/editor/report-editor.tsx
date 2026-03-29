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
    <div className="report-editor flex-1 min-w-0 overflow-y-auto bg-zinc-800/50 rounded-lg p-8" style={{ maxHeight: 'calc(100vh - 200px)' }}>
      {/* A4 page */}
      <div
        className="mx-auto rounded-sm shadow-2xl shadow-black/30"
        style={{
          width: '210mm',
          minHeight: '297mm',
          backgroundColor: '#ffffff',
          color: '#111111',
          padding: '20mm 25mm',
        }}
      >
        <EditorContent
          editor={editor}
          style={{ color: '#111111' }}
          className="report-a4-content"
        />
        <style>{`
          .report-a4-content .ProseMirror {
            outline: none;
            min-height: 257mm;
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.7;
            color: #111111;
          }
          .report-a4-content .ProseMirror h1 {
            font-size: 22pt;
            font-weight: 700;
            color: #111111;
            margin-top: 0;
            margin-bottom: 0.5em;
            border-bottom: 2px solid #333;
            padding-bottom: 0.3em;
          }
          .report-a4-content .ProseMirror h2 {
            font-size: 15pt;
            font-weight: 600;
            color: #222222;
            margin-top: 1.5em;
            margin-bottom: 0.4em;
          }
          .report-a4-content .ProseMirror h3 {
            font-size: 12pt;
            font-weight: 600;
            color: #333333;
            margin-top: 1.2em;
            margin-bottom: 0.3em;
          }
          .report-a4-content .ProseMirror p {
            margin: 0.4em 0;
            text-align: justify;
            color: #111111;
          }
          .report-a4-content .ProseMirror table {
            width: 100%;
            border-collapse: collapse;
            margin: 1em 0;
            font-size: 10pt;
          }
          .report-a4-content .ProseMirror th {
            background-color: #f3f4f6;
            border: 1px solid #d1d5db;
            padding: 6px 10px;
            text-align: left;
            font-weight: 600;
            color: #111111;
          }
          .report-a4-content .ProseMirror td {
            border: 1px solid #d1d5db;
            padding: 6px 10px;
            color: #111111;
          }
          .report-a4-content .ProseMirror hr {
            border: none;
            border-top: 1px solid #d1d5db;
            margin: 1.5em 0;
          }
          .report-a4-content .ProseMirror blockquote {
            border-left: 3px solid #d1d5db;
            padding-left: 1em;
            margin-left: 0;
            color: #444444;
            font-style: italic;
          }
          .report-a4-content .ProseMirror code {
            background: #f3f4f6;
            padding: 2px 4px;
            border-radius: 3px;
            font-size: 10pt;
            color: #111111;
          }
          .report-a4-content .ProseMirror pre {
            background: #f3f4f6;
            padding: 1em;
            border-radius: 4px;
            overflow-x: auto;
            color: #111111;
          }
          .report-a4-content .ProseMirror ul,
          .report-a4-content .ProseMirror ol {
            padding-left: 1.5em;
            color: #111111;
          }
          .report-a4-content .ProseMirror a {
            color: #1d4ed8;
            text-decoration: underline;
          }
          .report-a4-content .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
            color: #9ca3af;
          }
        `}</style>
      </div>
    </div>
  )
}

export { type Editor } from '@tiptap/core'
export { type JSONContent } from '@tiptap/core'
