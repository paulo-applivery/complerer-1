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
  response: string
  conversationId: string
  toolUses?: ToolUse[]
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

export function useChatMessages(
  workspaceId: string | undefined,
  conversationId: string | undefined,
) {
  const { data, isLoading } = useQuery<{ messages: ChatMessage[] }>({
    queryKey: ['chat-messages', workspaceId, conversationId],
    queryFn: () =>
      api.get(
        `/workspaces/${workspaceId}/chat/conversations/${conversationId}/messages`,
      ),
    enabled: !!workspaceId && !!conversationId,
  })

  return { messages: data?.messages ?? [], isLoading }
}

// ── Send Message ────────────────────────────────────────────────────────────

export function useSendMessage(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { conversationId?: string; message: string }) =>
      api.post<SendMessageResponse>(`/workspaces/${workspaceId}/chat`, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', workspaceId] })
      if (variables.conversationId) {
        queryClient.invalidateQueries({
          queryKey: ['chat-messages', workspaceId, variables.conversationId],
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
