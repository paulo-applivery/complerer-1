import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { createRoot } from 'react-dom/client'
import type { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion'

// ── Menu Item Definitions ──────────────────────────────────────────────────

export interface SlashMenuItem {
  id: string
  label: string
  description: string
  category: string
  icon: string
  action: (editor: any) => void
}

const SLASH_ITEMS: SlashMenuItem[] = [
  // Text
  { id: 'h1', label: 'Heading 1', description: 'Large section heading', category: 'Text', icon: 'H1',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run() },
  { id: 'h2', label: 'Heading 2', description: 'Medium section heading', category: 'Text', icon: 'H2',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run() },
  { id: 'h3', label: 'Heading 3', description: 'Small section heading', category: 'Text', icon: 'H3',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run() },
  { id: 'bullet', label: 'Bullet List', description: 'Unordered list', category: 'Text', icon: '\u2022',
    action: (editor) => editor.chain().focus().toggleBulletList().run() },
  { id: 'numbered', label: 'Numbered List', description: 'Ordered list', category: 'Text', icon: '1.',
    action: (editor) => editor.chain().focus().toggleOrderedList().run() },
  { id: 'quote', label: 'Quote', description: 'Block quotation', category: 'Text', icon: '\u201C',
    action: (editor) => editor.chain().focus().toggleBlockquote().run() },
  { id: 'divider', label: 'Divider', description: 'Horizontal rule', category: 'Text', icon: '\u2014',
    action: (editor) => editor.chain().focus().setHorizontalRule().run() },
  { id: 'code', label: 'Code Block', description: 'Code snippet', category: 'Text', icon: '</>',
    action: (editor) => editor.chain().focus().toggleCodeBlock().run() },
  { id: 'table', label: 'Table', description: 'Insert a table', category: 'Text', icon: '\u25A6',
    action: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },

  // Data Blocks
  { id: 'evidence-table', label: 'Evidence Table', description: 'Display linked evidence', category: 'Data Blocks', icon: '\u2637',
    action: (editor) => editor.chain().focus().insertContent({ type: 'evidenceTable', attrs: { controlIds: [], columns: ['name', 'type', 'status', 'date'], filterStatus: 'all', maxRows: 50 } }).run() },
  { id: 'finding-card', label: 'Finding Card', description: 'Structured audit finding', category: 'Data Blocks', icon: '\u26A0',
    action: (editor) => editor.chain().focus().insertContent({ type: 'findingCard', attrs: { mode: 'inline', severity: 'medium', title: 'New Finding' } }).run() },
  { id: 'control-matrix', label: 'Control Matrix', description: 'Control testing results', category: 'Data Blocks', icon: '\u2611',
    action: (editor) => {} /* Phase 8 */ },
  { id: 'risk-heatmap', label: 'Risk Heatmap', description: 'Risk likelihood vs impact', category: 'Data Blocks', icon: '\u2588',
    action: (editor) => {} /* Phase 8 */ },
  { id: 'chart', label: 'Chart', description: 'Visual data chart', category: 'Data Blocks', icon: '\u2593',
    action: (editor) => {} /* Phase 8 */ },

  // References
  { id: 'variable', label: 'Variable', description: 'Insert template variable', category: 'References', icon: '{ }',
    action: (editor) => editor.chain().focus().insertContent({ type: 'variablePlaceholder', attrs: { variableKey: 'org.name', variableType: 'text', displayMode: 'placeholder' } }).run() },
  { id: 'policy-ref', label: 'Policy Reference', description: 'Link to a policy', category: 'References', icon: '\u2693',
    action: (editor) => {} /* Phase 8 */ },
  { id: 'evidence-gallery', label: 'Evidence Gallery', description: 'Evidence image grid', category: 'References', icon: '\u25A3',
    action: (editor) => {} /* Phase 8 */ },

  // AI
  { id: 'ai-draft', label: 'Draft Section', description: 'AI-generate section content', category: 'AI', icon: '\u2728',
    action: (editor) => {} /* Phase 4 */ },
  { id: 'ai-summarize', label: 'Summarize', description: 'AI summary of content', category: 'AI', icon: '\u2727',
    action: (editor) => {} /* Phase 4 */ },
  { id: 'ai-recommend', label: 'Generate Recommendation', description: 'AI remediation advice', category: 'AI', icon: '\u2726',
    action: (editor) => {} /* Phase 4 */ },
]

// ── Slash Menu Component ───────────────────────────────────────────────────

interface SlashMenuListProps {
  items: SlashMenuItem[]
  command: (item: SlashMenuItem) => void
}

interface SlashMenuListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

const SlashMenuList = forwardRef<SlashMenuListRef, SlashMenuListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    useEffect(() => {
      const el = scrollRef.current?.querySelector(`[data-index="${selectedIndex}"]`)
      el?.scrollIntoView({ block: 'nearest' })
    }, [selectedIndex])

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index]
        if (item) command(item)
      },
      [items, command]
    )

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: SuggestionKeyDownProps) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i <= 0 ? items.length - 1 : i - 1))
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i >= items.length - 1 ? 0 : i + 1))
          return true
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex)
          return true
        }
        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 shadow-2xl">
          <p className="text-xs text-zinc-500">No matching commands</p>
        </div>
      )
    }

    // Group items by category
    const groups: Record<string, SlashMenuItem[]> = {}
    for (const item of items) {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    }

    let flatIndex = 0

    return (
      <div
        ref={scrollRef}
        className="max-h-80 w-72 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl"
      >
        {Object.entries(groups).map(([category, categoryItems]) => (
          <div key={category}>
            <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {category}
            </p>
            {categoryItems.map((item) => {
              const idx = flatIndex++
              return (
                <button
                  key={item.id}
                  data-index={idx}
                  onClick={() => selectItem(idx)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
                    idx === selectedIndex
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-300 hover:bg-zinc-800/50'
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-xs">
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{item.label}</p>
                    <p className="truncate text-[10px] text-zinc-500">{item.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    )
  }
)
SlashMenuList.displayName = 'SlashMenuList'

// ── TipTap Suggestion Extension ────────────────────────────────────────────

export const SlashMenuExtension = Extension.create({
  name: 'slashMenu',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        items: ({ query }: { query: string }) => {
          const q = query.toLowerCase()
          return SLASH_ITEMS.filter(
            (item) =>
              item.label.toLowerCase().includes(q) ||
              item.description.toLowerCase().includes(q) ||
              item.category.toLowerCase().includes(q)
          )
        },
        render: () => {
          let container: HTMLDivElement | null = null
          let root: any = null
          let componentRef: SlashMenuListRef | null = null

          return {
            onStart: (props: SuggestionProps) => {
              container = document.createElement('div')
              container.style.position = 'absolute'
              container.style.zIndex = '50'

              const rect = props.clientRect?.()
              if (rect && container) {
                container.style.left = `${rect.left}px`
                container.style.top = `${rect.bottom + 4}px`
              }

              document.body.appendChild(container)
              root = createRoot(container)
              root.render(
                <SlashMenuList
                  ref={(ref: SlashMenuListRef | null) => { componentRef = ref }}
                  items={props.items as SlashMenuItem[]}
                  command={(item: SlashMenuItem) => {
                    item.action(props.editor)
                    props.editor.commands.deleteRange(props.range)
                  }}
                />
              )
            },

            onUpdate: (props: SuggestionProps) => {
              const rect = props.clientRect?.()
              if (rect && container) {
                container.style.left = `${rect.left}px`
                container.style.top = `${rect.bottom + 4}px`
              }

              root?.render(
                <SlashMenuList
                  ref={(ref: SlashMenuListRef | null) => { componentRef = ref }}
                  items={props.items as SlashMenuItem[]}
                  command={(item: SlashMenuItem) => {
                    item.action(props.editor)
                    props.editor.commands.deleteRange(props.range)
                  }}
                />
              )
            },

            onKeyDown: (props: SuggestionKeyDownProps) => {
              if (props.event.key === 'Escape') {
                root?.unmount()
                container?.remove()
                container = null
                return true
              }
              return componentRef?.onKeyDown(props) ?? false
            },

            onExit: () => {
              root?.unmount()
              container?.remove()
              container = null
            },
          }
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
