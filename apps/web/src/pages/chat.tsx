import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams } from '@tanstack/react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Message01Icon,
  ArrowUp01Icon,
  PlusSignIcon,
  Shield01Icon,
  Clock01Icon,
  Link01Icon,
  Search01Icon,
  CheckmarkCircle01Icon,
  Alert02Icon,
  ArrowRight01Icon,
  Delete01Icon,
} from '@hugeicons/core-free-icons'
import {
  useConversations,
  useChatMessages,
  useSendMessage,
  useDeleteConversation,
} from '@/hooks/use-chat'
import type { ToolUse } from '@/hooks/use-chat'

// ── Rich Markdown Renderer ──────────────────────────────────────────────────

function RichContent({ content }: { content: string }) {
  // Detect structured content patterns
  const blocks = parseContentBlocks(content)

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'table':
            return <TableWidget key={i} data={block.data ?? []} />
          case 'code':
            return <CodeBlock key={i} code={block.content} lang={block.lang} />
          case 'cards':
            return <CardsWidget key={i} cards={block.items ?? []} />
          case 'list':
            return <ListWidget key={i} items={block.items ?? []} ordered={block.ordered} />
          case 'heading':
            return <h3 key={i} className="text-base font-semibold text-zinc-100">{block.content}</h3>
          default:
            return (
              <p
                key={i}
                className="text-sm leading-relaxed text-zinc-300"
                dangerouslySetInnerHTML={{ __html: inlineMarkdown(block.content) }}
              />
            )
        }
      })}
    </div>
  )
}

interface ContentBlock {
  type: 'text' | 'table' | 'code' | 'cards' | 'list' | 'heading'
  content: string
  data?: string[][]
  items?: string[]
  ordered?: boolean
  lang?: string
}

function parseContentBlocks(text: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  const lines = text.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Heading: ## or ###
    if (/^#{1,3}\s/.test(line)) {
      blocks.push({ type: 'heading', content: line.replace(/^#+\s*/, '') })
      i++
      continue
    }

    // Code block: ```
    if (line.trim().startsWith('```')) {
      const lang = line.trim().replace('```', '').trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      blocks.push({ type: 'code', content: codeLines.join('\n'), lang })
      i++ // skip closing ```
      continue
    }

    // Table: | header | header |
    if (line.includes('|') && line.trim().startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].includes('|')) {
        // Skip separator lines like |---|---|
        if (!/^\|[\s-:|]+\|$/.test(lines[i].trim())) {
          tableLines.push(lines[i])
        }
        i++
      }
      const data = tableLines.map((l) =>
        l.split('|').filter(Boolean).map((cell) => cell.trim())
      )
      if (data.length > 0) {
        blocks.push({ type: 'table', content: '', data })
      }
      continue
    }

    // Ordered list: 1. item
    if (/^\d+\.\s/.test(line.trim())) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s*/, ''))
        i++
      }
      // If items have bold labels like "**Label**: desc", render as cards
      if (items.length >= 3 && items.every((it) => it.includes('**'))) {
        blocks.push({ type: 'cards', content: '', items })
      } else {
        blocks.push({ type: 'list', content: '', items, ordered: true })
      }
      continue
    }

    // Unordered list: - item
    if (/^[-*]\s/.test(line.trim())) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s*/, ''))
        i++
      }
      blocks.push({ type: 'list', content: '', items, ordered: false })
      continue
    }

    // Regular text
    if (line.trim()) {
      blocks.push({ type: 'text', content: line })
    }
    i++
  }

  return blocks
}

function inlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-zinc-100">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="rounded-md bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-primary-400">$1</code>')
}

// ── Widgets ─────────────────────────────────────────────────────────────────

function TableWidget({ data }: { data: string[][] }) {
  if (data.length === 0) return null
  const headers = data[0]
  const rows = data.slice(1)

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-zinc-800/80">
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {rows.map((row, ri) => (
              <tr key={ri} className="transition-colors hover:bg-zinc-800/30">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-2.5 text-zinc-300" dangerouslySetInnerHTML={{ __html: inlineMarkdown(cell) }} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      {lang && (
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
          <span className="text-xs text-zinc-500">{lang}</span>
          <button
            onClick={handleCopy}
            className="text-xs text-zinc-500 opacity-0 transition-opacity hover:text-zinc-300 group-hover:opacity-100"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-zinc-300">
        <code>{code}</code>
      </pre>
      {!lang && (
        <button
          onClick={handleCopy}
          className="absolute right-2 top-2 rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-500 opacity-0 transition-opacity hover:text-zinc-300 group-hover:opacity-100"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      )}
    </div>
  )
}

function CardsWidget({ cards }: { cards: string[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((card, i) => {
        const boldMatch = card.match(/\*\*(.*?)\*\*/)
        const title = boldMatch ? boldMatch[1] : `Item ${i + 1}`
        const desc = boldMatch ? card.replace(/\*\*.*?\*\*:?\s*/, '') : card

        return (
          <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4 transition-colors hover:border-zinc-700">
            <p className="text-sm font-semibold text-zinc-100">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400" dangerouslySetInnerHTML={{ __html: inlineMarkdown(desc) }} />
          </div>
        )
      })}
    </div>
  )
}

function ListWidget({ items, ordered }: { items: string[]; ordered?: boolean }) {
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <Tag className={`space-y-1.5 pl-5 ${ordered ? 'list-decimal' : 'list-disc'}`}>
      {items.map((item, i) => (
        <li key={i} className="text-sm text-zinc-300 marker:text-zinc-600" dangerouslySetInnerHTML={{ __html: inlineMarkdown(item) }} />
      ))}
    </Tag>
  )
}

// ── Thinking Animation ──────────────────────────────────────────────────────

function ThinkingIndicator() {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400/20 to-primary-400/5">
        <img src="/icon-color.svg" alt="" className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-3 pt-2">
        <div className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400/60" style={{ animationDelay: '0ms', animationDuration: '1.2s' }} />
          <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400/60" style={{ animationDelay: '200ms', animationDuration: '1.2s' }} />
          <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400/60" style={{ animationDelay: '400ms', animationDuration: '1.2s' }} />
        </div>
        <span className="text-xs text-zinc-500">Analyzing your compliance data...</span>
      </div>
    </div>
  )
}

// ── Tool Card ──────────────────────────────────────────────────────────────

const TOOL_ICONS: Record<string, typeof Search01Icon> = {
  search_controls: Search01Icon,
  search_evidence: Search01Icon,
  search_access: Search01Icon,
  link_evidence: Link01Icon,
  check_compliance: CheckmarkCircle01Icon,
  assess_risk: Alert02Icon,
}

const TOOL_LABELS: Record<string, string> = {
  search_controls: 'Searching controls',
  search_evidence: 'Searching evidence',
  search_access: 'Searching access records',
  link_evidence: 'Linking evidence',
  check_compliance: 'Checking compliance',
  assess_risk: 'Assessing risk',
}

function ToolCard({ tool }: { tool: ToolUse }) {
  const [expanded, setExpanded] = useState(false)
  const icon = TOOL_ICONS[tool.name] ?? Link01Icon
  const label = TOOL_LABELS[tool.name] ?? tool.name

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
      <button
        type="button"
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-zinc-800/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary-400/10">
          <HugeiconsIcon icon={icon} size={10} className="text-primary-400" />
        </div>
        <span className="font-medium text-zinc-400">{label}</span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={10}
          className={`ml-auto text-zinc-600 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>
      {expanded && (
        <div className="border-t border-zinc-800 px-3 py-2.5 text-xs">
          {tool.input && (
            <div className="mb-2">
              <p className="mb-1 font-medium text-zinc-500">Input</p>
              <pre className="overflow-x-auto rounded-md bg-zinc-950 p-2 text-zinc-500">
                {JSON.stringify(tool.input, null, 2)}
              </pre>
            </div>
          )}
          {tool.output != null && (
            <div>
              <p className="mb-1 font-medium text-zinc-500">Output</p>
              <pre className="max-h-32 overflow-auto rounded-md bg-zinc-950 p-2 text-zinc-500">
                {typeof tool.output === 'string' ? tool.output : JSON.stringify(tool.output as Record<string, unknown>, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then
  if (diffMs < 0) return 'just now'
  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

const SUGGESTED_PROMPTS = [
  { text: 'What evidence do I need for SOC 2?', icon: Search01Icon },
  { text: 'Show me all access records', icon: Shield01Icon },
  { text: 'What are our compliance gaps?', icon: Alert02Icon },
  { text: 'Register a new access grant', icon: CheckmarkCircle01Icon },
]

// ── Chat Page ───────────────────────────────────────────────────────────────

export function ChatPage() {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const workspaceId = params.workspaceId

  const [activeConversationId, setActiveConversationId] = useState<string | undefined>()
  const [inputValue, setInputValue] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { conversations, isLoading: convosLoading } = useConversations(workspaceId)
  const { messages, isLoading: messagesLoading } = useChatMessages(workspaceId, activeConversationId)
  const sendMessage = useSendMessage(workspaceId)
  const deleteConversation = useDeleteConversation(workspaceId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sendMessage.isPending])

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }, [])

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim()
    if (!trimmed || sendMessage.isPending) return
    sendMessage.mutate(
      { conversationId: activeConversationId, message: trimmed },
      {
        onSuccess: (data) => {
          if (!activeConversationId && data.conversationId) {
            setActiveConversationId(data.conversationId)
          }
        },
      },
    )
    setInputValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [inputValue, activeConversationId, sendMessage])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const handleNewChat = useCallback(() => {
    setActiveConversationId(undefined)
    setInputValue('')
  }, [])

  const handleDelete = useCallback(
    (convId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      deleteConversation.mutate(convId, {
        onSuccess: () => {
          if (activeConversationId === convId) setActiveConversationId(undefined)
        },
      })
    },
    [activeConversationId, deleteConversation],
  )

  const hasMessages = messages.length > 0
  const showWelcome = !activeConversationId && !hasMessages && !sendMessage.isPending

  return (
    <div className="-m-4 flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="flex w-60 shrink-0 flex-col border-r border-zinc-800/50 bg-zinc-900/50">
          <div className="p-3">
            <button
              type="button"
              onClick={handleNewChat}
              className="flex w-full items-center gap-2 rounded-xl border border-zinc-700/50 px-3 py-2.5 text-sm text-zinc-300 transition-all hover:border-zinc-600 hover:bg-zinc-800/50"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={14} />
              New conversation
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {convosLoading ? (
              <div className="space-y-1 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-800/50" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <HugeiconsIcon icon={Message01Icon} size={20} className="text-zinc-700" />
                <p className="text-xs text-zinc-600">No conversations</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {conversations.map((conv) => (
                  <div key={conv.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => setActiveConversationId(conv.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        activeConversationId === conv.id
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-300'
                      }`}
                    >
                      <span className="truncate flex-1">{conv.title}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(conv.id, e)}
                      className="absolute right-1.5 top-1.5 hidden rounded-md p-1 text-zinc-600 hover:bg-zinc-700 hover:text-zinc-400 group-hover:block"
                    >
                      <HugeiconsIcon icon={Delete01Icon} size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main Chat ─────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-zinc-950">
        {/* Toggle sidebar */}
        <div className="flex items-center border-b border-zinc-800/30 px-4 py-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="2" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <line x1="5.5" y1="2" x2="5.5" y2="14" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          {activeConversationId && (
            <p className="ml-3 truncate text-sm text-zinc-500">
              {conversations.find((c) => c.id === activeConversationId)?.title}
            </p>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messagesLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-primary-400" />
            </div>
          ) : showWelcome ? (
            <div className="flex h-full flex-col items-center justify-center px-4">
              <div className="mb-8 flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400/20 to-primary-400/5 shadow-lg shadow-primary-400/5">
                  <img src="/icon-color.svg" alt="Complirer" className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-zinc-100">Compliance Assistant</h2>
                  <p className="mt-1 text-sm text-zinc-500">Ask anything about your compliance posture</p>
                </div>
              </div>
              <div className="grid w-full max-w-2xl grid-cols-2 gap-3">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.text}
                    type="button"
                    onClick={() => { setInputValue(prompt.text); textareaRef.current?.focus() }}
                    className="group flex items-start gap-3 rounded-2xl border border-zinc-800 p-4 text-left transition-all hover:border-zinc-700 hover:bg-zinc-900/50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-800 transition-colors group-hover:bg-primary-400/10">
                      <HugeiconsIcon icon={prompt.icon} size={14} className="text-zinc-500 group-hover:text-primary-400" />
                    </div>
                    <span className="text-sm text-zinc-400 group-hover:text-zinc-300">{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl px-4 py-6">
              <div className="space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id}>
                    {msg.role === 'user' ? (
                      /* User message */
                      <div className="flex justify-end">
                        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary-400/10 px-4 py-3">
                          <p className="text-sm text-zinc-200">{msg.content}</p>
                        </div>
                      </div>
                    ) : (
                      /* Assistant message */
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400/20 to-primary-400/5">
                          <img src="/icon-color.svg" alt="" className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <RichContent content={msg.content} />

                          {/* Tool uses */}
                          {msg.toolUses && msg.toolUses.length > 0 && (
                            <div className="space-y-1.5">
                              {msg.toolUses.map((tool, idx) => (
                                <ToolCard key={`${msg.id}-tool-${idx}`} tool={tool} />
                              ))}
                            </div>
                          )}

                          <p className="text-[10px] text-zinc-600">{relativeTime(msg.createdAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {sendMessage.isPending && <ThinkingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* ── Input ──────────────────────────────────────────────── */}
        <div className="px-4 pb-4 pt-2">
          <div className="mx-auto max-w-3xl">
            <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg shadow-black/20 transition-colors focus-within:border-zinc-700">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask about compliance, evidence, access..."
                rows={1}
                disabled={sendMessage.isPending}
                className="w-full resize-none bg-transparent px-4 pb-3 pt-3.5 pr-14 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputValue.trim() || sendMessage.isPending}
                className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-primary-400 text-zinc-950 transition-all hover:bg-primary-300 disabled:bg-zinc-800 disabled:text-zinc-600"
              >
                <HugeiconsIcon icon={ArrowUp01Icon} size={16} />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-zinc-700">
              AI can make mistakes. Verify compliance data with your auditor.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
