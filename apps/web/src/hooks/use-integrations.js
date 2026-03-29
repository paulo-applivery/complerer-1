import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
// ── Hooks ───────────────────────────────────────────────────────────────────
export function useIntegrationCatalog(workspaceId) {
    const { data, isLoading } = useQuery({
        queryKey: ['integration-catalog', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/integrations/catalog`),
        enabled: !!workspaceId,
    });
    return { catalog: data?.catalog ?? [], isLoading };
}
export function useIntegrations(workspaceId) {
    const { data, isLoading } = useQuery({
        queryKey: ['integrations', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/integrations`),
        enabled: !!workspaceId,
    });
    return { integrations: data?.integrations ?? [], isLoading };
}
export function useConnectIntegration(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/integrations`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['integrations', workspaceId] });
        },
    });
}
export function useDisconnectIntegration(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (integrationId) => api.delete(`/workspaces/${workspaceId}/integrations/${integrationId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['integrations', workspaceId] });
        },
    });
}
export function useSyncIntegration(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (integrationId) => api.post(`/workspaces/${workspaceId}/integrations/${integrationId}/sync`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['integrations', workspaceId] });
        },
    });
}
export function useAnomalies(workspaceId, status) {
    const params = status ? `?status=${status}` : '';
    const { data, isLoading } = useQuery({
        queryKey: ['anomalies', workspaceId, status],
        queryFn: () => api.get(`/workspaces/${workspaceId}/integrations/anomalies${params}`),
        enabled: !!workspaceId,
    });
    return { anomalies: data?.anomalies ?? [], isLoading };
}
export function useResolveAnomaly(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ anomalyId, reason }) => api.post(`/workspaces/${workspaceId}/integrations/anomalies/${anomalyId}/resolve`, { reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['anomalies', workspaceId] });
        },
    });
}
export function useDismissAnomaly(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (anomalyId) => api.post(`/workspaces/${workspaceId}/integrations/anomalies/${anomalyId}/dismiss`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['anomalies', workspaceId] });
        },
    });
}
//# sourceMappingURL=use-integrations.js.map