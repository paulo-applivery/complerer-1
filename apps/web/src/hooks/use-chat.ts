import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ── Types ───────────────────────────────────────────────────────────────────

export interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface ToolUse {
  name: string
  input: Record<string, unknown>
  output?: unknown
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolUses?: ToolUse[]
  createdAt: string
}

interface SendMessageResponse {
  conversationId: string
  message: RawChatMessage
}

// ── Conversations ───────────────────────────────────────────────────────────

export function useConversations(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<{ conversations: Conversation[] }>({
    queryKey: ['conversations', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/chat/conversations`),
    enabled: !!workspaceId,
  })

  return { conversations: data?.conversations ?? [], isLoading }
}

// ── Messages ────────────────────────────────────────────────────────────────

interface RawChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: Array<{ name: string; input: Record<string, unknown>; id?: string }>
  toolResults?: Array<{ tool_use_id?: string; content?: string }>
  toolUses?: ToolUse[]
  createdAt: string
}

/** Merge separate toolCalls + toolResults into unified toolUses */
function mapToolUses(msg: RawChatMessage): ChatMessage {
  if (msg.toolUses) return msg as ChatMessage

  if (!msg.toolCalls || msg.toolCalls.length === 0) {
    return { id: msg.id, role: msg.role, content: msg.content, createdAt: msg.createdAt }
  }

  const resultMap = new Map<string, string>()
  if (msg.toolResults) {
    for (const r of msg.toolResults) {
      if (r.tool_use_id && r.content) resultMap.set(r.tool_use_id, r.content)
    }
  }

  const toolUses: ToolUse[] = msg.toolCalls.map((tc) => ({
    name: tc.name,
    input: tc.input,
    output: tc.id ? resultMap.get(tc.id) : undefined,
  }))

  return { id: msg.id, role: msg.role, content: msg.content, toolUses, createdAt: msg.createdAt }
}

export function useChatMessages(
  workspaceId: string | undefined,
  conversationId: string | undefined,
) {
  const { data, isLoading } = useQuery<{ messages: RawChatMessage[] }>({
    queryKey: ['chat-messages', workspaceId, conversationId],
    queryFn: () =>
      api.get(
        `/workspaces/${workspaceId}/chat/conversations/${conversationId}/messages`,
      ),
    enabled: !!workspaceId && !!conversationId,
  })

  const messages = (data?.messages ?? []).map(mapToolUses)
  return { messages, isLoading }
}

// ── Send Message ────────────────────────────────────────────────────────────

export function useSendMessage(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { conversationId?: string; message: string }) =>
      api.post<SendMessageResponse>(`/workspaces/${workspaceId}/chat`, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', workspaceId] })
      const convId = variables.conversationId || data.conversationId
      if (convId) {
        queryClient.invalidateQueries({
          queryKey: ['chat-messages', workspaceId, convId],
        })
      }
    },
  })
}

// ── Delete Conversation ─────────────────────────────────────────────────────

export function useDeleteConversation(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversationId: string) =>
      api.delete(`/workspaces/${workspaceId}/chat/conversations/${conversationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', workspaceId] })
    },
  })
}
