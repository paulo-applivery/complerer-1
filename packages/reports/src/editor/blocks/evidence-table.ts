import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { EvidenceTableView } from './evidence-table-view.js'

export const EvidenceTableExtension = Node.create({
  name: 'evidenceTable',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      controlIds: { default: [] },
      frameworkId: { default: null },
      columns: { default: ['name', 'type', 'status', 'date'] },
      filterStatus: { default: 'all' },
      maxRows: { default: 50 },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-evidence-table]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-evidence-table': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(EvidenceTableView)
  },
})
