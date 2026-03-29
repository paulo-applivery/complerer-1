import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ControlMatrixView } from './control-matrix-view.js'

export const ControlMatrixExtension = Node.create({
  name: 'controlMatrix',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      frameworkId: { default: null },
      sectionScope: { default: null },
      columns: { default: ['criteria', 'control', 'test_procedure', 'result', 'exceptions'] },
    }
  },

  parseHTML() { return [{ tag: 'div[data-control-matrix]' }] },
  renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes, { 'data-control-matrix': '' })] },
  addNodeView() { return ReactNodeViewRenderer(ControlMatrixView) },
})
