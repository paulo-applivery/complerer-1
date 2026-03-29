import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
// ── Baselines ───────────────────────────────────────────────────────────────
export function useBaselines(workspaceId) {
    const { data, isLoading } = useQuery({
        queryKey: ['baselines', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/baselines`),
        enabled: !!workspaceId,
    });
    return { baselines: data?.baselines ?? [], isLoading };
}
export function useCreateBaseline(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/baselines`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['baselines', workspaceId] });
        },
    });
}
export function useUpdateBaseline(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...payload }) => api.patch(`/workspaces/${workspaceId}/baselines/${id}`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['baselines', workspaceId] });
        },
    });
}
export function useDeleteBaseline(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/workspaces/${workspaceId}/baselines/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['baselines', workspaceId] });
        },
    });
}
export function useBaselineLibrary(workspaceId) {
    const { data, isLoading } = useQuery({
        queryKey: ['baseline-library', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/baselines/library`),
        enabled: !!workspaceId,
    });
    return { library: data?.items ?? [], isLoading };
}
export function useAddFromBaselineLibrary(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/baselines/from-library`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['baselines', workspaceId] });
        },
    });
}
// ── Policy Library ─────────────────────────────────────────────────────────
export function usePolicyLibrary(workspaceId) {
    const { data, isLoading } = useQuery({
        queryKey: ['policy-library', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/policies/library`),
        enabled: !!workspaceId,
    });
    return { library: data?.items ?? [], isLoading };
}
export function useAddFromPolicyLibrary(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/policies/from-library`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policies', workspaceId] });
        },
    });
}
export function useBaselineViolations(workspaceId, options) {
    const status = options?.status ?? 'open';
    const params = new URLSearchParams({ status });
    const { data, isLoading } = useQuery({
        queryKey: ['baseline-violations', workspaceId, status],
        queryFn: () => api.get(`/workspaces/${workspaceId}/baselines/violations?${params}`),
        enabled: !!workspaceId,
    });
    return { violations: data?.violations ?? [], isLoading };
}
export function useResolveViolation(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/baselines/violations/${payload.violationId}/resolve`, { reason: payload.reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['baseline-violations', workspaceId] });
        },
    });
}
export function useExemptViolation(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/baselines/violations/${payload.violationId}/exempt`, { reason: payload.reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['baseline-violations', workspaceId] });
        },
    });
}
// ── Risks ───────────────────────────────────────────────────────────────────
export function useRisks(workspaceId) {
    const { data, isLoading } = useQuery({
        queryKey: ['risks', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/risks`),
        enabled: !!workspaceId,
    });
    return { risks: data?.risks ?? [], isLoading };
}
export function useCreateRisk(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/risks`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['risks', workspaceId] });
        },
    });
}
// ── Policies ────────────────────────────────────────────────────────────────
export function usePolicies(workspaceId) {
    const { data, isLoading } = useQuery({
        queryKey: ['policies', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/policies`),
        enabled: !!workspaceId,
    });
    return { policies: data?.policies ?? [], isLoading };
}
export function useCreatePolicy(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/policies`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policies', workspaceId] });
        },
    });
}
export function useUpdatePolicy(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => {
            const { policyId, ...data } = payload;
            return api.patch(`/workspaces/${workspaceId}/policies/${policyId}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policies', workspaceId] });
        },
    });
}
export function useDeletePolicy(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (policyId) => api.delete(`/workspaces/${workspaceId}/policies/${policyId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policies', workspaceId] });
        },
    });
}
export function useLinkPolicyControl(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/policies/${payload.policyId}/controls`, {
            controlId: payload.controlId,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policies', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['policy-controls', workspaceId] });
        },
    });
}
export function useUnlinkPolicyControl(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.delete(`/workspaces/${workspaceId}/policies/${payload.policyId}/controls/${payload.linkId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policies', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['policy-controls', workspaceId] });
        },
    });
}
export function usePolicyControls(workspaceId, policyId) {
    const { data, isLoading } = useQuery({
        queryKey: ['policy-controls', workspaceId, policyId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/policies/${policyId}/controls`),
        enabled: !!workspaceId && !!policyId,
    });
    return { controls: data?.controls ?? [], isLoading };
}
// ── Snapshots ───────────────────────────────────────────────────────────────
export function useSnapshots(workspaceId) {
    const { data, isLoading } = useQuery({
        queryKey: ['snapshots', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/snapshots`),
        enabled: !!workspaceId,
    });
    return { snapshots: data?.snapshots ?? [], isLoading };
}
export function useCaptureSnapshot(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => api.post(`/workspaces/${workspaceId}/snapshots`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['snapshots', workspaceId] });
        },
    });
}
//# sourceMappingURL=use-settings.js.map