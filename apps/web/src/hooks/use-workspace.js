import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
export function useWorkspace(workspaceId) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['workspace', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}`),
        staleTime: 10 * 60 * 1000,
        enabled: !!workspaceId,
    });
    return {
        workspace: data?.workspace ?? null,
        members: data?.members ?? [],
        role: data?.role ?? null,
        isLoading,
        error,
    };
}
// ── Invite Member ────────────────────────────────────────────────────────────
export function useInviteMember(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/invitations`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['direct-invitations', workspaceId] });
        },
    });
}
// ── Update Member Role ───────────────────────────────────────────────────────
export function useUpdateMemberRole(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ memberId, role }) => api.patch(`/workspaces/${workspaceId}/members/${memberId}`, { role }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
        },
    });
}
// ── Remove Member ────────────────────────────────────────────────────────────
export function useRemoveMember(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (memberId) => api.delete(`/workspaces/${workspaceId}/members/${memberId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
        },
    });
}
export function useDirectInvitations(workspaceId) {
    const { data, isLoading } = useQuery({
        queryKey: ['direct-invitations', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/invitations/direct`),
        enabled: !!workspaceId,
    });
    return {
        invitations: data?.invitations ?? [],
        isLoading,
    };
}
// ── Cancel Invitation ────────────────────────────────────────────────────────
export function useCancelInvitation(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (invitationId) => api.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['direct-invitations', workspaceId] });
        },
    });
}
// ── Feature Flags ───────────────────────────────────────────────────────────
export function useFeatureFlags(workspaceId) {
    const { data, isLoading } = useQuery({
        queryKey: ['features', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/features`),
        enabled: !!workspaceId,
        staleTime: 5 * 60 * 1000, // cache for 5 min
    });
    const isEnabled = (slug) => data?.features?.[slug] ?? true; // default to enabled if not loaded
    return { features: data?.features ?? {}, isEnabled, isLoading };
}
//# sourceMappingURL=use-workspace.js.map