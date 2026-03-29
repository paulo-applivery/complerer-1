import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { PolicyReferenceView } from './policy-reference-view.js'

export const PolicyReferenceExtension = Node.create({
  name: 'policyReference',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      policyId: { default: null },
      policyName: { default: 'Policy' },
      policyVersion: { default: '1.0' },
      policyStatus: { default: 'active' },
    }
  },

  parseHTML() { return [{ tag: 'div[data-policy-reference]' }] },
  renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes, { 'data-policy-reference': '' })] },
  addNodeView() { return ReactNodeViewRenderer(PolicyReferenceView) },
})
