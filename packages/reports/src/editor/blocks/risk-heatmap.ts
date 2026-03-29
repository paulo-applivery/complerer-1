import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { RiskHeatmapView } from './risk-heatmap-view.js'

export const RiskHeatmapExtension = Node.create({
  name: 'riskHeatmap',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      riskSource: { default: 'project' },
      likelihoodScale: { default: 5 },
      impactScale: { default: 5 },
    }
  },

  parseHTML() { return [{ tag: 'div[data-risk-heatmap]' }] },
  renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes, { 'data-risk-heatmap': '' })] },
  addNodeView() { return ReactNodeViewRenderer(RiskHeatmapView) },
})
