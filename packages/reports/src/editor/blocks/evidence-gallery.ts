import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { EvidenceGalleryView } from './evidence-gallery-view.js'

export const EvidenceGalleryExtension = Node.create({
  name: 'evidenceGallery',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      evidenceIds: { default: [] },
      layout: { default: 'grid' },
      showMetadata: { default: true },
    }
  },

  parseHTML() { return [{ tag: 'div[data-evidence-gallery]' }] },
  renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes, { 'data-evidence-gallery': '' })] },
  addNodeView() { return ReactNodeViewRenderer(EvidenceGalleryView) },
})
