import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { FindingCardView } from './finding-card-view.js'

export const FindingCardExtension = Node.create({
  name: 'findingCard',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      findingId: { default: null },
      mode: { default: 'inline' },       // 'inline' | 'linked'
      severity: { default: 'medium' },
      title: { default: 'Untitled Finding' },
      condition: { default: '' },
      criteria: { default: '' },
      cause: { default: '' },
      effect: { default: '' },
      recommendation: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-finding-card]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-finding-card': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FindingCardView)
  },
})
