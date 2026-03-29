import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
// ── Template Hooks ─────────────────────────────────────────────────────────
export function useReportTemplates(workspaceId) {
    const { data, isLoading } = useQuery({
        queryKey: ['report-templates', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/reports/templates`),
        enabled: !!workspaceId,
    });
    return { templates: data?.data ?? [], isLoading };
}
export function useReportTemplateLibrary(workspaceId) {
    const { data, isLoading } = useQuery({
        queryKey: ['report-template-library', workspaceId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/reports/templates/library`),
        enabled: !!workspaceId,
    });
    return { libraryTemplates: data?.data ?? [], isLoading };
}
export function useAdoptReportTemplates(workspaceId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (templateIds) => api.post(`/workspaces/${workspaceId}/reports/templates/from-library`, { templateIds }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['report-templates', workspaceId] });
        },
    });
}
export function useCreateTemplate(workspaceId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/reports/templates`, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['report-templates', workspaceId] });
        },
    });
}
// ── Report Hooks ───────────────────────────────────────────────────────────
export function useReports(workspaceId, filters) {
    const params = new URLSearchParams();
    if (filters?.status)
        params.set('status', filters.status);
    if (filters?.projectId)
        params.set('projectId', filters.projectId);
    const qs = params.toString();
    const { data, isLoading } = useQuery({
        queryKey: ['reports', workspaceId, filters],
        queryFn: () => api.get(`/workspaces/${workspaceId}/reports${qs ? `?${qs}` : ''}`),
        enabled: !!workspaceId,
    });
    return { reports: data?.data ?? [], isLoading };
}
export function useReport(workspaceId, reportId) {
    const { data, isLoading } = useQuery({
        queryKey: ['report', workspaceId, reportId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/reports/${reportId}`),
        enabled: !!workspaceId && !!reportId,
    });
    return { report: data ?? null, isLoading };
}
export function useCreateReport(workspaceId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/workspaces/${workspaceId}/reports`, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['reports', workspaceId] });
        },
    });
}
export function useUpdateReport(workspaceId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ reportId, ...payload }) => api.put(`/workspaces/${workspaceId}/reports/${reportId}`, payload),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: ['report', workspaceId, variables.reportId] });
            qc.invalidateQueries({ queryKey: ['reports', workspaceId] });
        },
    });
}
export function useDeleteReport(workspaceId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (reportId) => api.delete(`/workspaces/${workspaceId}/reports/${reportId}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['reports', workspaceId] });
        },
    });
}
// ── Status & Workflow Hooks ────────────────────────────────────────────────
export function useSubmitForReview(workspaceId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ reportId, comment }) => api.post(`/workspaces/${workspaceId}/reports/${reportId}/submit-review`, { comment }),
        onSuccess: (_data, { reportId }) => {
            qc.invalidateQueries({ queryKey: ['report', workspaceId, reportId] });
            qc.invalidateQueries({ queryKey: ['reports', workspaceId] });
        },
    });
}
export function useApproveReport(workspaceId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ reportId, comment }) => api.post(`/workspaces/${workspaceId}/reports/${reportId}/approve`, { comment }),
        onSuccess: (_data, { reportId }) => {
            qc.invalidateQueries({ queryKey: ['report', workspaceId, reportId] });
            qc.invalidateQueries({ queryKey: ['reports', workspaceId] });
        },
    });
}
export function useRejectReport(workspaceId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ reportId, comment }) => api.post(`/workspaces/${workspaceId}/reports/${reportId}/reject`, { comment }),
        onSuccess: (_data, { reportId }) => {
            qc.invalidateQueries({ queryKey: ['report', workspaceId, reportId] });
            qc.invalidateQueries({ queryKey: ['reports', workspaceId] });
        },
    });
}
export function usePublishReport(workspaceId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (reportId) => api.post(`/workspaces/${workspaceId}/reports/${reportId}/publish`),
        onSuccess: (_data, reportId) => {
            qc.invalidateQueries({ queryKey: ['report', workspaceId, reportId] });
            qc.invalidateQueries({ queryKey: ['reports', workspaceId] });
        },
    });
}
export function useReportApprovals(workspaceId, reportId) {
    const { data, isLoading } = useQuery({
        queryKey: ['report-approvals', workspaceId, reportId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/reports/${reportId}/approvals`),
        enabled: !!workspaceId && !!reportId,
    });
    return { approvals: data?.data ?? [], isLoading };
}
// ── Version Hooks ──────────────────────────────────────────────────────────
export function useReportVersions(workspaceId, reportId) {
    const { data, isLoading } = useQuery({
        queryKey: ['report-versions', workspaceId, reportId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/reports/${reportId}/versions`),
        enabled: !!workspaceId && !!reportId,
    });
    return { versions: data?.data ?? [], isLoading };
}
export function useRevertReport(workspaceId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ reportId, version }) => api.post(`/workspaces/${workspaceId}/reports/${reportId}/revert/${version}`),
        onSuccess: (_data, { reportId }) => {
            qc.invalidateQueries({ queryKey: ['report', workspaceId, reportId] });
            qc.invalidateQueries({ queryKey: ['report-versions', workspaceId, reportId] });
        },
    });
}
// ── Findings Hooks ─────────────────────────────────────────────────────────
export function useReportFindings(workspaceId, reportId) {
    const { data, isLoading } = useQuery({
        queryKey: ['report-findings', workspaceId, reportId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/reports/${reportId}/findings`),
        enabled: !!workspaceId && !!reportId,
    });
    return { findings: data?.data ?? [], isLoading };
}
export function useCreateFinding(workspaceId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ reportId, ...payload }) => api.post(`/workspaces/${workspaceId}/reports/${reportId}/findings`, payload),
        onSuccess: (_data, { reportId }) => {
            qc.invalidateQueries({ queryKey: ['report-findings', workspaceId, reportId] });
        },
    });
}
export function useUpdateFinding(workspaceId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ reportId, findingId, ...payload }) => api.put(`/workspaces/${workspaceId}/reports/${reportId}/findings/${findingId}`, payload),
        onSuccess: (_data, { reportId }) => {
            qc.invalidateQueries({ queryKey: ['report-findings', workspaceId, reportId] });
        },
    });
}
export function useUpdateFindingStatus(workspaceId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ reportId, findingId, status }) => api.patch(`/workspaces/${workspaceId}/reports/${reportId}/findings/${findingId}/status`, { status }),
        onSuccess: (_data, { reportId }) => {
            qc.invalidateQueries({ queryKey: ['report-findings', workspaceId, reportId] });
        },
    });
}
// ── Export Hooks ────────────────────────────────────────────────────────────
export function useExportPDF(workspaceId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (reportId) => api.post(`/workspaces/${workspaceId}/reports/${reportId}/export/pdf`),
        onSuccess: (_data, reportId) => {
            qc.invalidateQueries({ queryKey: ['report-exports', workspaceId, reportId] });
        },
    });
}
export function useReportExports(workspaceId, reportId) {
    const { data, isLoading } = useQuery({
        queryKey: ['report-exports', workspaceId, reportId],
        queryFn: () => api.get(`/workspaces/${workspaceId}/reports/${reportId}/exports`),
        enabled: !!workspaceId && !!reportId,
    });
    return { exports: data?.data ?? [], isLoading };
}
//# sourceMappingURL=use-reports.js.map