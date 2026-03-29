import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ChartView } from './chart-view.js'

export const ChartExtension = Node.create({
  name: 'chart',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      chartType: { default: 'bar' },
      dataSource: { default: 'control_status' },
      title: { default: 'Chart' },
      data: { default: null },
    }
  },

  parseHTML() { return [{ tag: 'div[data-chart]' }] },
  renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes, { 'data-chart': '' })] },
  addNodeView() { return ReactNodeViewRenderer(ChartView) },
})
