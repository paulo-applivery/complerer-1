import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
// ── Conversations ───────────────────────────────────────────────────────────
export function useConversations(workspaceId) {
    const { data, isLoading } = useQuery({
        queryKey: ['conversations', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/chat/conversations`),
        enabled: !!workspaceId,
    });
    return { conversations: data?.conversations ?? [], isLoading };
}
/** Merge separate toolCalls + toolResults into unified toolUses */
function mapToolUses(msg) {
    if (msg.toolUses)
        return msg;
    if (!msg.toolCalls || msg.toolCalls.length === 0) {
        return { id: msg.id, role: msg.role, content: msg.content, createdAt: msg.createdAt };
    }
    const resultMap = new Map();
    if (msg.toolResults) {
        for (const r of msg.toolResults) {
            if (r.tool_use_id && r.content)
                resultMap.set(r.tool_use_id, r.content);
        }
    }
    const toolUses = msg.toolCalls.map((tc) => ({
        name: tc.name,
        input: tc.input,
        output: tc.id ? resultMap.get(tc.id) : undefined,
    }));
    return { id: msg.id, role: msg.role, content: msg.content, toolUses, createdAt: msg.createdAt };
}
export function useChatMessages(workspaceId, conversationId) {
    const { data, isLoading } = useQuery({
        queryKey: ['chat-messages', workspaceId, conversationId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/chat/conversations/${conversationId}/messages`),
        enabled: !!workspaceId && !!conversationId,
    });
    const messages = (data?.messages ?? []).map(mapToolUses);
    return { messages, isLoading };
}
// ── Send Message ────────────────────────────────────────────────────────────
export function useSendMessage(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/chat`, payload),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['conversations', workspaceId] });
            const convId = variables.conversationId || data.conversationId;
            if (convId) {
                queryClient.invalidateQueries({
                    queryKey: ['chat-messages', workspaceId, convId],
                });
            }
        },
    });
}
// ── Delete Conversation ─────────────────────────────────────────────────────
export function useDeleteConversation(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (conversationId) => api.delete(`/workspaces/${workspaceId}/chat/conversations/${conversationId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations', workspaceId] });
        },
    });
}
//# sourceMappingURL=use-chat.js.map