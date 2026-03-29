import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
export function useInvitations(workspaceId) {
    return useQuery({
        queryKey: ['invitations', workspaceId],
        queryFn: () => api.get(`/auth/workspaces/${workspaceId}/invitations`),
        enabled: !!workspaceId,
    });
}
export function useApproveInvitation(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (requestId) => api.post(`/auth/workspaces/${workspaceId}/invitations/${requestId}/approve`),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['invitations', workspaceId],
            });
            queryClient.invalidateQueries({
                queryKey: ['workspace', workspaceId],
            });
        },
    });
}
export function useRejectInvitation(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (requestId) => api.post(`/auth/workspaces/${workspaceId}/invitations/${requestId}/reject`),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['invitations', workspaceId],
            });
        },
    });
}
//# sourceMappingURL=use-invitations.js.map