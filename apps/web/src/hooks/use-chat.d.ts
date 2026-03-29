export interface Conversation {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
}
export interface ToolUse {
    name: string;
    input: Record<string, unknown>;
    output?: unknown;
}
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    toolUses?: ToolUse[];
    createdAt: string;
}
interface SendMessageResponse {
    conversationId: string;
    message: RawChatMessage;
}
export declare function useConversations(workspaceId: string | undefined): {
    conversations: Conversation[];
    isLoading: boolean;
};
interface RawChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    toolCalls?: Array<{
        name: string;
        input: Record<string, unknown>;
        id?: string;
    }>;
    toolResults?: Array<{
        tool_use_id?: string;
        content?: string;
    }>;
    toolUses?: ToolUse[];
    createdAt: string;
}
export declare function useChatMessages(workspaceId: string | undefined, conversationId: string | undefined): {
    messages: ChatMessage[];
    isLoading: boolean;
};
export declare function useSendMessage(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<SendMessageResponse, Error, {
    conversationId?: string;
    message: string;
}, unknown>;
export declare function useDeleteConversation(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export {};
//# sourceMappingURL=use-chat.d.ts.map