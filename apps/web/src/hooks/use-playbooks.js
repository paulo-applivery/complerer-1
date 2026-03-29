import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
export function usePlaybook(workspaceId, controlId) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['playbook', workspaceId, controlId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/playbooks/${controlId}`),
        enabled: !!workspaceId && !!controlId,
    });
    return {
        playbook: data?.playbook ?? null,
        evidencePatterns: data?.evidencePatterns ?? [],
        tips: data?.tips ?? [],
        isLoading,
        error,
    };
}
export function useAdoptedControls(workspaceId) {
    const { data, isLoading } = useQuery({
        queryKey: ['adopted-controls', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/controls`),
        enabled: !!workspaceId,
    });
    return {
        controls: data?.controls ?? [],
        isLoading,
    };
}
//# sourceMappingURL=use-playbooks.js.map