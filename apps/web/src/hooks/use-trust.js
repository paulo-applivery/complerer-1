import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
// ── Hooks ───────────────────────────────────────────────────────────────────
export function useTrustScore(workspaceId) {
    const { data, isLoading } = useQuery({
        queryKey: ['trust-score', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/trust`),
        enabled: !!workspaceId,
    });
    return {
        profile: data?.profile ?? null,
        score: data?.score ?? 0,
        grade: data?.grade ?? 'D',
        breakdown: data?.breakdown ?? {
            frameworkCoverage: 0,
            evidenceFreshness: 0,
            violationRatio: 0,
            reviewCompleteness: 0,
            snapshotRecency: 0,
        },
        stats: data?.stats ?? {
            frameworksActive: 0,
            controlsSatisfied: 0,
            controlsTotal: 0,
            evidenceFreshness: 0,
            openViolations: 0,
        },
        isLoading,
    };
}
export function useUpdateTrustProfile(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/trust`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trust-score', workspaceId] });
        },
    });
}
//# sourceMappingURL=use-trust.js.map