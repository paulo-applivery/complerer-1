import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
// ── Hooks ────────────────────────────────────────────────────────────────────
export function useFrameworks(workspaceId) {
    const { data, isLoading } = useQuery({
        queryKey: ['frameworks', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/frameworks`),
        enabled: !!workspaceId,
    });
    return { frameworks: data?.frameworks ?? [], isLoading };
}
export function useFrameworkVersions(workspaceId, slug) {
    const { data, isLoading } = useQuery({
        queryKey: ['framework-versions', workspaceId, slug],
        queryFn: () => api.get(`/workspaces/${workspaceId}/frameworks/${slug}/versions`),
        enabled: !!workspaceId && !!slug,
    });
    return { versions: data?.versions ?? [], isLoading };
}
export function useAdoptions(workspaceId) {
    const { data, isLoading } = useQuery({
        queryKey: ['adoptions', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/adoptions?active=true`),
        enabled: !!workspaceId,
    });
    return { adoptions: data?.adoptions ?? [], isLoading };
}
export function useControls(workspaceId, slug, version, options) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 50;
    const domain = options?.domain ?? '';
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(domain ? { domain } : {}),
    });
    const { data, isLoading } = useQuery({
        queryKey: ['controls', workspaceId, slug, version, page, limit, domain],
        queryFn: () => api.get(`/workspaces/${workspaceId}/frameworks/${slug}/versions/${version}/controls?${params}`),
        enabled: !!workspaceId && !!slug && !!version,
    });
    return {
        controls: data?.controls ?? [],
        total: data?.total ?? 0,
        isLoading,
    };
}
export function useAdoptFramework(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/adoptions`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adoptions', workspaceId] });
        },
    });
}
export function useUnadoptFramework(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (adoptionId) => api.delete(`/workspaces/${workspaceId}/adoptions/${adoptionId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adoptions', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['adopted-controls', workspaceId] });
        },
    });
}
// ── Control CRUD ────────────────────────────────────────────────────────────
export function useCreateControl(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/framework-versions/${payload.fvId}/controls`, payload.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['controls'] });
            queryClient.invalidateQueries({ queryKey: ['frameworks'] });
        },
    });
}
export function useUpdateControl(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.put(`/workspaces/${workspaceId}/framework-versions/${payload.fvId}/controls/${payload.ctrlId}`, payload.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['controls'] });
        },
    });
}
export function useDeleteControl(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.delete(`/workspaces/${workspaceId}/framework-versions/${payload.fvId}/controls/${payload.ctrlId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['controls'] });
            queryClient.invalidateQueries({ queryKey: ['frameworks'] });
        },
    });
}
// ── CSV Import ──────────────────────────────────────────────────────────────
export function useImportFramework(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (formData) => api.upload(`/workspaces/${workspaceId}/frameworks/import`, formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['frameworks'] });
            queryClient.invalidateQueries({ queryKey: ['adoptions'] });
        },
    });
}
//# sourceMappingURL=use-frameworks.js.map