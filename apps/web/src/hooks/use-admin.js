import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
// ─── Super Admin Check ─────────────────────────────────────────────────────
export function useIsSuperAdmin() {
    const { user } = useAuth();
    return user?.isSuperAdmin === true;
}
// ─── Providers ──────────────────────────────────────────────────────────────
export function useAdminProviders(category) {
    const params = category ? `?category=${category}` : '';
    return useQuery({
        queryKey: ['admin', 'providers', category],
        queryFn: () => api.get(`/admin/providers${params}`),
    });
}
export function useAdminProvider(id) {
    return useQuery({
        queryKey: ['admin', 'providers', id],
        queryFn: () => api.get(`/admin/providers/${id}`),
        enabled: !!id,
    });
}
export function useUpdateProvider() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }) => api.put(`/admin/providers/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] });
        },
    });
}
export function useCreateProvider() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/admin/providers', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] });
        },
    });
}
export function useDeleteProvider() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/admin/providers/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] });
        },
    });
}
export function useUpdateProviderConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ providerId, ...data }) => api.put(`/admin/providers/${providerId}/configs`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] });
        },
    });
}
export function useDeleteProviderConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ providerId, key }) => api.delete(`/admin/providers/${providerId}/configs/${key}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] });
        },
    });
}
// ─── Feature Flags ──────────────────────────────────────────────────────────
export function useAdminFeatureFlags() {
    return useQuery({
        queryKey: ['admin', 'feature-flags'],
        queryFn: () => api.get('/admin/feature-flags'),
    });
}
export function useCreateFeatureFlag() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/admin/feature-flags', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
        },
    });
}
export function useUpdateFeatureFlag() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }) => api.put(`/admin/feature-flags/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
        },
    });
}
export function useDeleteFeatureFlag() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/admin/feature-flags/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
        },
    });
}
// ─── Email Templates ────────────────────────────────────────────────────────
export function useAdminEmailTemplates(category) {
    const params = category ? `?category=${category}` : '';
    return useQuery({
        queryKey: ['admin', 'email-templates', category],
        queryFn: () => api.get(`/admin/email-templates${params}`),
    });
}
export function useAdminEmailTemplate(id) {
    return useQuery({
        queryKey: ['admin', 'email-templates', 'detail', id],
        queryFn: () => api.get(`/admin/email-templates/${id}`),
        enabled: !!id,
    });
}
export function useUpdateEmailTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }) => api.put(`/admin/email-templates/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'email-templates'] });
        },
    });
}
export function useCreateEmailTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/admin/email-templates', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'email-templates'] });
        },
    });
}
export function useDeleteEmailTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/admin/email-templates/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'email-templates'] });
        },
    });
}
export function usePreviewEmailTemplate() {
    return useMutation({
        mutationFn: (id) => api.post(`/admin/email-templates/${id}/preview`),
    });
}
export function useSendTestEmail() {
    return useMutation({
        mutationFn: ({ id, to }) => api.post(`/admin/email-templates/${id}/send-test`, { to }),
    });
}
// ─── Workspaces ─────────────────────────────────────────────────────────────
export function useAdminWorkspaces() {
    return useQuery({
        queryKey: ['admin', 'workspaces'],
        queryFn: () => api.get('/admin/workspaces'),
    });
}
export function useAdminStats() {
    return useQuery({
        queryKey: ['admin', 'stats'],
        queryFn: () => api.get('/admin/stats'),
    });
}
export function useAdminMembers() {
    return useQuery({
        queryKey: ['admin', 'members'],
        queryFn: () => api.get('/admin/members'),
    });
}
export function usePromoteMember() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (userId) => api.post(`/admin/members/${userId}/promote`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'members'] }),
    });
}
export function useDemoteMember() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (userId) => api.post(`/admin/members/${userId}/demote`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'members'] }),
    });
}
//# sourceMappingURL=use-admin.js.map