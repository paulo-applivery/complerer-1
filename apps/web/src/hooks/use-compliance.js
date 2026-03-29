import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
// ── Systems ─────────────────────────────────────────────────────────────────
export function useSystemsList(workspaceId) {
    const { data, isLoading } = useQuery({
        queryKey: ['systems', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/systems`),
        enabled: !!workspaceId,
    });
    return { systems: data?.systems ?? [], isLoading };
}
export function useSystemLibrary(workspaceId) {
    const { data, isLoading } = useQuery({
        queryKey: ['system-library'],
        queryFn: () => api.get(`/workspaces/${workspaceId}/systems/library`),
        staleTime: 30 * 60 * 1000, // 30 min — library rarely changes
        enabled: !!workspaceId,
    });
    return { library: data?.systems ?? [], isLoading };
}
export function useAddFromLibrary(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/systems/from-library`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['systems', workspaceId] });
        },
    });
}
export function useEmployeeLibrary(workspaceId) {
    const { data, isLoading } = useQuery({
        queryKey: ['employee-library'],
        queryFn: () => api.get(`/workspaces/${workspaceId}/directory/library`),
        staleTime: 30 * 60 * 1000,
        enabled: !!workspaceId,
    });
    return { library: data?.employees ?? [], isLoading };
}
export function useAddFromEmployeeLibrary(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/directory/from-library`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['directory', workspaceId] });
        },
    });
}
export function useCreateSystem(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/systems`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['systems', workspaceId] });
        },
    });
}
export function useUpdateSystem(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ systemId, ...data }) => api.patch(`/workspaces/${workspaceId}/systems/${systemId}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['systems', workspaceId] });
        },
    });
}
export function useDirectoryUsers(workspaceId, options) {
    const status = options?.status ?? 'active';
    const search = options?.search ?? '';
    const params = new URLSearchParams({
        status,
        ...(search ? { search } : {}),
    });
    const { data, isLoading } = useQuery({
        queryKey: ['directory-users', workspaceId, status, search],
        queryFn: () => api.get(`/workspaces/${workspaceId}/directory?${params}`),
        enabled: !!workspaceId,
    });
    return { users: data?.users ?? [], isLoading };
}
export function useCreateDirectoryUser(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/directory`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['directory-users', workspaceId] });
        },
    });
}
export function useUpdateDirectoryUser(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, ...payload }) => api.put(`/workspaces/${workspaceId}/directory/${userId}`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['directory-users', workspaceId] });
        },
    });
}
export function useDeleteDirectoryUser(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (userId) => api.delete(`/workspaces/${workspaceId}/directory/${userId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['directory-users', workspaceId] });
        },
    });
}
export function useBulkImportDirectory(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/directory/bulk`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['directory-users', workspaceId] });
        },
    });
}
export function useAccessRecords(workspaceId, options) {
    const status = options?.status ?? 'active';
    const systemId = options?.systemId ?? '';
    const userId = options?.userId ?? '';
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 25;
    const params = new URLSearchParams({
        status,
        page: String(page),
        limit: String(limit),
        ...(systemId ? { systemId } : {}),
        ...(userId ? { userId } : {}),
    });
    const { data, isLoading } = useQuery({
        queryKey: ['access-records', workspaceId, status, systemId, userId, page, limit],
        queryFn: () => api.get(`/workspaces/${workspaceId}/access?${params}`),
        enabled: !!workspaceId,
    });
    return {
        records: data?.records ?? [],
        total: data?.total ?? 0,
        isLoading,
    };
}
export function useCreateAccess(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/access`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['access-records', workspaceId] });
        },
    });
}
export function useUpdateAccessRecord(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.put(`/workspaces/${workspaceId}/access/${payload.recordId}`, payload.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['access-records', workspaceId] });
        },
    });
}
export function useTransitionAccess(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/access/${payload.recordId}/transition`, {
            action: payload.action,
            reason: payload.reason,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['access-records', workspaceId] });
        },
    });
}
export function useRevokeAccess(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (accessId) => api.post(`/workspaces/${workspaceId}/access/${accessId}/revoke`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['access-records', workspaceId] });
        },
    });
}
export function useReviewAccess(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (accessId) => api.post(`/workspaces/${workspaceId}/access/${accessId}/review`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['access-records', workspaceId] });
        },
    });
}
// ── Custom Fields ───────────────────────────────────────────────────────────
export function useCustomFieldDefinitions(workspaceId, entityType) {
    const params = entityType ? `?entityType=${entityType}` : '';
    const { data, isLoading } = useQuery({
        queryKey: ['custom-fields', workspaceId, entityType],
        queryFn: () => api.get(`/workspaces/${workspaceId}/custom-fields${params}`),
        enabled: !!workspaceId,
    });
    return { fields: data?.fields ?? [], isLoading };
}
export function useCreateCustomField(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/custom-fields`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['custom-fields', workspaceId] });
        },
    });
}
export function useUpdateCustomField(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.patch(`/workspaces/${workspaceId}/custom-fields/${payload.fieldId}`, payload.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['custom-fields', workspaceId] });
        },
    });
}
export function useDeleteCustomField(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (fieldId) => api.delete(`/workspaces/${workspaceId}/custom-fields/${fieldId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['custom-fields', workspaceId] });
        },
    });
}
export function useCustomFieldValues(workspaceId, entityType, entityId) {
    const { data, isLoading } = useQuery({
        queryKey: ['custom-field-values', workspaceId, entityType, entityId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/custom-fields/values/${entityType}/${entityId}`),
        enabled: !!workspaceId && !!entityId,
    });
    return { values: data?.values ?? [], isLoading };
}
export function useSaveCustomFieldValues(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.put(`/workspaces/${workspaceId}/custom-fields/values/${payload.entityType}/${payload.entityId}`, { values: payload.values }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['custom-field-values', workspaceId] });
        },
    });
}
export function useWorkspaceSettings(workspaceId) {
    const { data, isLoading } = useQuery({
        queryKey: ['settings', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/settings`),
        enabled: !!workspaceId,
    });
    return { settings: data?.settings ?? [], isLoading };
}
export function useWorkspaceSetting(workspaceId, key) {
    const { settings, isLoading } = useWorkspaceSettings(workspaceId);
    const setting = settings.find((s) => s.key === key);
    return { value: setting?.value ?? null, isLoading };
}
export function useUpdateWorkspaceSetting(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.put(`/workspaces/${workspaceId}/settings`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings', workspaceId] });
        },
    });
}
export function useEvidence(workspaceId, options) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 25;
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });
    const { data, isLoading } = useQuery({
        queryKey: ['evidence', workspaceId, page, limit],
        queryFn: () => api.get(`/workspaces/${workspaceId}/evidence?${params}`),
        enabled: !!workspaceId,
    });
    return {
        evidence: data?.evidence ?? [],
        total: data?.total ?? 0,
        isLoading,
    };
}
export function useCreateEvidence(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/evidence`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['evidence', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['available-evidence', workspaceId] });
        },
    });
}
export function useLinkEvidence(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/evidence/${payload.evidenceId}/link`, {
            controlId: payload.controlId,
            frameworkVersionId: payload.frameworkVersionId,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['evidence', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['evidence-links', workspaceId] });
        },
    });
}
export function useEvidenceLinks(workspaceId, evidenceId) {
    const { data, isLoading } = useQuery({
        queryKey: ['evidence-links', workspaceId, evidenceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/evidence/${evidenceId}/links`),
        enabled: !!workspaceId && !!evidenceId,
    });
    return { links: data?.links ?? [], isLoading };
}
export function useUnlinkEvidence(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.delete(`/workspaces/${workspaceId}/evidence/${payload.evidenceId}/links/${payload.linkId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['evidence', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['evidence-links', workspaceId] });
        },
    });
}
export function useUpdateEvidence(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.put(`/workspaces/${workspaceId}/evidence/${payload.evidenceId}`, payload.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['evidence', workspaceId] });
        },
    });
}
// ── Baseline Controls (link baselines to framework controls) ────────────────
export function useBaselineControls(workspaceId, baselineId) {
    const { data, isLoading } = useQuery({
        queryKey: ['baseline-controls', workspaceId, baselineId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/baselines/${baselineId}/controls`),
        enabled: !!workspaceId && !!baselineId,
    });
    return { controls: data?.controls ?? [], isLoading };
}
export function useLinkBaselineControl(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ baselineId, controlId }) => api.post(`/workspaces/${workspaceId}/baselines/${baselineId}/controls`, { controlId }),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['baseline-controls', workspaceId, variables.baselineId] });
            queryClient.invalidateQueries({ queryKey: ['project-controls', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['project-stats', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['project-gaps', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['project-baselines', workspaceId] });
        },
    });
}
export function useUnlinkBaselineControl(workspaceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ baselineId, linkId }) => api.delete(`/workspaces/${workspaceId}/baselines/${baselineId}/controls/${linkId}`),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['baseline-controls', workspaceId, variables.baselineId] });
            queryClient.invalidateQueries({ queryKey: ['project-controls', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['project-stats', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['project-gaps', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['project-baselines', workspaceId] });
        },
    });
}
export function useComplianceEvents(workspaceId, options) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 25;
    const type = options?.type ?? '';
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(type ? { type } : {}),
    });
    const { data, isLoading } = useQuery({
        queryKey: ['compliance-events', workspaceId, page, limit, type],
        queryFn: () => api.get(`/workspaces/${workspaceId}/events?${params}`),
        enabled: !!workspaceId,
    });
    return {
        events: data?.events ?? [],
        total: data?.total ?? 0,
        isLoading,
    };
}
//# sourceMappingURL=use-compliance.js.map