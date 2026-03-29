import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { TimelineView } from './timeline-view.js'

export const TimelineExtension = Node.create({
  name: 'timeline',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      dataSource: { default: 'audit_activities' },
      events: { default: [] },
    }
  },

  parseHTML() { return [{ tag: 'div[data-timeline]' }] },
  renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes, { 'data-timeline': '' })] },
  addNodeView() { return ReactNodeViewRenderer(TimelineView) },
})
