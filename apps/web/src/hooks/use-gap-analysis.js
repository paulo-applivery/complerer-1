import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
// ── Hooks ──────────────────────────────────────────────────────────────────
export function useGapAnalysis(workspaceId, sourceFramework, targetFramework) {
    const { data, isLoading } = useQuery({
        queryKey: ['gap-analysis', workspaceId, sourceFramework, targetFramework],
        queryFn: () => api.get(`/workspaces/${workspaceId}/gap-analysis?sourceFramework=${encodeURIComponent(sourceFramework)}&targetFramework=${encodeURIComponent(targetFramework)}`),
        enabled: !!workspaceId && !!sourceFramework && !!targetFramework,
    });
    return { gapAnalysis: data?.gapAnalysis ?? null, isLoading };
}
export function useCrosswalks(workspaceId, controlId) {
    const { data, isLoading } = useQuery({
        queryKey: ['crosswalks', workspaceId, controlId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/controls/${controlId}/crosswalks`),
        enabled: !!workspaceId && !!controlId,
    });
    return { crosswalks: data?.crosswalks ?? [], isLoading };
}
//# sourceMappingURL=use-gap-analysis.js.map