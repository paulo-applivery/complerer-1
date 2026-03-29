import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
export function useProjects(workspaceId) {
    const { data, isLoading } = useQuery({
        queryKey: ['projects', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/projects`),
        enabled: !!workspaceId,
    });
    return { projects: data?.projects ?? [], isLoading };
}
export function useProject(workspaceId, projectId) {
    const { data, isLoading } = useQuery({
        queryKey: ['project', workspaceId, projectId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/projects/${projectId}`),
        enabled: !!workspaceId && !!projectId,
    });
    return { project: data?.project ?? null, isLoading };
}
export function useProjectStats(workspaceId, projectId) {
    const { data, isLoading } = useQuery({
        queryKey: ['project-stats', workspaceId, projectId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/projects/${projectId}/stats`),
        enabled: !!workspaceId && !!projectId,
    });
    return { stats: data?.stats ?? null, isLoading };
}
export function useCreateProject(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/projects`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
        },
    });
}
export function useUpdateProject(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, ...payload }) => api.put(`/workspaces/${workspaceId}/projects/${projectId}`, payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['project', workspaceId, variables.projectId] });
        },
    });
}
export function useDeleteProject(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (projectId) => api.delete(`/workspaces/${workspaceId}/projects/${projectId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
        },
    });
}
export function useProjectControls(workspaceId, projectId, options) {
    const params = new URLSearchParams();
    if (options?.domain)
        params.set('domain', options.domain);
    if (options?.search)
        params.set('search', options.search);
    const qs = params.toString();
    const { data, isLoading } = useQuery({
        queryKey: ['project-controls', workspaceId, projectId, options?.domain, options?.search],
        queryFn: () => api.get(`/workspaces/${workspaceId}/projects/${projectId}/controls${qs ? '?' + qs : ''}`),
        enabled: !!workspaceId && !!projectId,
    });
    return { controls: data?.controls ?? [], domains: data?.domains ?? [], isLoading };
}
export function useProjectEvidence(workspaceId, projectId) {
    const { data, isLoading } = useQuery({
        queryKey: ['project-evidence', workspaceId, projectId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/projects/${projectId}/evidence`),
        enabled: !!workspaceId && !!projectId,
    });
    return { evidence: data?.evidence ?? [], isLoading };
}
export function useLinkProjectEvidence(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, evidenceId, controlId, notes }) => api.post(`/workspaces/${workspaceId}/projects/${projectId}/evidence`, { evidenceId, controlId: controlId || undefined, notes }),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['project-evidence', workspaceId, variables.projectId] });
            queryClient.invalidateQueries({ queryKey: ['project-controls', workspaceId, variables.projectId] });
            queryClient.invalidateQueries({ queryKey: ['project-stats', workspaceId, variables.projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
        },
    });
}
export function useUnlinkProjectEvidence(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, linkId }) => api.delete(`/workspaces/${workspaceId}/projects/${projectId}/evidence/${linkId}`),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['project-evidence', workspaceId, variables.projectId] });
            queryClient.invalidateQueries({ queryKey: ['project-controls', workspaceId, variables.projectId] });
            queryClient.invalidateQueries({ queryKey: ['project-stats', workspaceId, variables.projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
        },
    });
}
export function useProjectPolicies(workspaceId, projectId) {
    const { data, isLoading } = useQuery({
        queryKey: ['project-policies', workspaceId, projectId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/projects/${projectId}/policies`),
        enabled: !!workspaceId && !!projectId,
    });
    return { policies: data?.policies ?? [], isLoading };
}
export function useProjectBaselines(workspaceId, projectId) {
    const { data, isLoading } = useQuery({
        queryKey: ['project-baselines', workspaceId, projectId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/projects/${projectId}/baselines`),
        enabled: !!workspaceId && !!projectId,
    });
    return { baselines: data?.baselines ?? [], isLoading };
}
export function useProjectGaps(workspaceId, projectId) {
    const { data, isLoading } = useQuery({
        queryKey: ['project-gaps', workspaceId, projectId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/projects/${projectId}/gaps`),
        enabled: !!workspaceId && !!projectId,
    });
    return { gaps: data?.gaps ?? [], isLoading };
}
export function useProjectRisks(workspaceId, projectId) {
    const { data, isLoading } = useQuery({
        queryKey: ['project-risks', workspaceId, projectId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/projects/${projectId}/risks`),
        enabled: !!workspaceId && !!projectId,
    });
    return { risks: data?.risks ?? [], isLoading };
}
export function useCreateAndLinkEvidence(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, ...payload }) => api.post(`/workspaces/${workspaceId}/projects/${projectId}/create-and-link`, payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['project-evidence', workspaceId, variables.projectId] });
            queryClient.invalidateQueries({ queryKey: ['project-controls', workspaceId, variables.projectId] });
            queryClient.invalidateQueries({ queryKey: ['project-stats', workspaceId, variables.projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['available-evidence', workspaceId, variables.projectId] });
        },
    });
}
export function useAvailableEvidence(workspaceId, projectId) {
    const { data, isLoading } = useQuery({
        queryKey: ['available-evidence', workspaceId, projectId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/projects/${projectId}/available-evidence`),
        enabled: !!workspaceId && !!projectId,
        staleTime: 0,
    });
    return { evidence: data?.evidence ?? [], isLoading };
}
//# sourceMappingURL=use-projects.js.map