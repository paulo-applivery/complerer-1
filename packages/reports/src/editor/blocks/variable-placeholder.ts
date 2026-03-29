import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { VariablePlaceholderView } from './variable-placeholder-view.js'

export interface VariablePlaceholderOptions {
  mode: 'template' | 'report'
}

export const VariablePlaceholderExtension = Node.create<VariablePlaceholderOptions>({
  name: 'variablePlaceholder',
  group: 'inline',
  inline: true,
  atom: true,

  addOptions() {
    return { mode: 'template' }
  },

  addAttributes() {
    return {
      variableKey: { default: '' },
      variableType: { default: 'text' },
      displayMode: { default: 'placeholder' },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-variable]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-variable': '' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(VariablePlaceholderView)
  },
})
