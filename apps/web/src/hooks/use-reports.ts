import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ── Template Hooks ─────────────────────────────────────────────────────────

export function useReportTemplates(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ['report-templates', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/reports/templates`),
    enabled: !!workspaceId,
  })
  return { templates: data?.data ?? [], isLoading }
}

export function useReportTemplateLibrary(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ['report-template-library', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/reports/templates/library`),
    enabled: !!workspaceId,
  })
  return { libraryTemplates: data?.data ?? [], isLoading }
}

export function useAdoptReportTemplates(workspaceId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (templateIds: string[]) =>
      api.post(`/workspaces/${workspaceId}/reports/templates/from-library`, { templateIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['report-templates', workspaceId] })
    },
  })
}

export function useCreateTemplate(workspaceId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; description?: string; frameworkId?: string; content?: string; variables?: string; sections?: string }) =>
      api.post(`/workspaces/${workspaceId}/reports/templates`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['report-templates', workspaceId] })
    },
  })
}

// ── Report Hooks ───────────────────────────────────────────────────────────

export function useReports(workspaceId: string | undefined, filters?: { status?: string; projectId?: string }) {
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.projectId) params.set('projectId', filters.projectId)
  const qs = params.toString()

  const { data, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ['reports', workspaceId, filters],
    queryFn: () => api.get(`/workspaces/${workspaceId}/reports${qs ? `?${qs}` : ''}`),
    enabled: !!workspaceId,
  })
  return { reports: data?.data ?? [], isLoading }
}

export function useReport(workspaceId: string | undefined, reportId: string | undefined) {
  const { data, isLoading } = useQuery<any>({
    queryKey: ['report', workspaceId, reportId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/reports/${reportId}`),
    enabled: !!workspaceId && !!reportId,
  })
  return { report: data ?? null, isLoading }
}

export function useCreateReport(workspaceId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { templateId: string; projectId?: string; name: string; auditPeriodStart?: string; auditPeriodEnd?: string; variables?: Record<string, string> }) =>
      api.post(`/workspaces/${workspaceId}/reports`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports', workspaceId] })
    },
  })
}

export function useUpdateReport(workspaceId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reportId, ...payload }: { reportId: string; name?: string; content?: string }) =>
      api.put(`/workspaces/${workspaceId}/reports/${reportId}`, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['report', workspaceId, variables.reportId] })
      qc.invalidateQueries({ queryKey: ['reports', workspaceId] })
    },
  })
}

export function useDeleteReport(workspaceId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reportId: string) =>
      api.delete(`/workspaces/${workspaceId}/reports/${reportId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports', workspaceId] })
    },
  })
}

// ── Status & Workflow Hooks ────────────────────────────────────────────────

export function useSubmitForReview(workspaceId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reportId, comment }: { reportId: string; comment?: string }) =>
      api.post(`/workspaces/${workspaceId}/reports/${reportId}/submit-review`, { comment }),
    onSuccess: (_data, { reportId }) => {
      qc.invalidateQueries({ queryKey: ['report', workspaceId, reportId] })
      qc.invalidateQueries({ queryKey: ['reports', workspaceId] })
    },
  })
}

export function useApproveReport(workspaceId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reportId, comment }: { reportId: string; comment?: string }) =>
      api.post(`/workspaces/${workspaceId}/reports/${reportId}/approve`, { comment }),
    onSuccess: (_data, { reportId }) => {
      qc.invalidateQueries({ queryKey: ['report', workspaceId, reportId] })
      qc.invalidateQueries({ queryKey: ['reports', workspaceId] })
    },
  })
}

export function useRejectReport(workspaceId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reportId, comment }: { reportId: string; comment?: string }) =>
      api.post(`/workspaces/${workspaceId}/reports/${reportId}/reject`, { comment }),
    onSuccess: (_data, { reportId }) => {
      qc.invalidateQueries({ queryKey: ['report', workspaceId, reportId] })
      qc.invalidateQueries({ queryKey: ['reports', workspaceId] })
    },
  })
}

export function usePublishReport(workspaceId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reportId: string) =>
      api.post(`/workspaces/${workspaceId}/reports/${reportId}/publish`),
    onSuccess: (_data, reportId) => {
      qc.invalidateQueries({ queryKey: ['report', workspaceId, reportId] })
      qc.invalidateQueries({ queryKey: ['reports', workspaceId] })
    },
  })
}

export function useReportApprovals(workspaceId: string | undefined, reportId: string | undefined) {
  const { data, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ['report-approvals', workspaceId, reportId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/reports/${reportId}/approvals`),
    enabled: !!workspaceId && !!reportId,
  })
  return { approvals: data?.data ?? [], isLoading }
}

// ── Version Hooks ──────────────────────────────────────────────────────────

export function useReportVersions(workspaceId: string | undefined, reportId: string | undefined) {
  const { data, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ['report-versions', workspaceId, reportId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/reports/${reportId}/versions`),
    enabled: !!workspaceId && !!reportId,
  })
  return { versions: data?.data ?? [], isLoading }
}

export function useRevertReport(workspaceId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reportId, version }: { reportId: string; version: number }) =>
      api.post(`/workspaces/${workspaceId}/reports/${reportId}/revert/${version}`),
    onSuccess: (_data, { reportId }) => {
      qc.invalidateQueries({ queryKey: ['report', workspaceId, reportId] })
      qc.invalidateQueries({ queryKey: ['report-versions', workspaceId, reportId] })
    },
  })
}

// ── Findings Hooks ─────────────────────────────────────────────────────────

export function useReportFindings(workspaceId: string | undefined, reportId: string | undefined) {
  const { data, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ['report-findings', workspaceId, reportId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/reports/${reportId}/findings`),
    enabled: !!workspaceId && !!reportId,
  })
  return { findings: data?.data ?? [], isLoading }
}

export function useCreateFinding(workspaceId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reportId, ...payload }: { reportId: string; severity: string; findingType: string; title: string; condition?: string; criteria?: string; cause?: string; effect?: string; recommendation?: string }) =>
      api.post(`/workspaces/${workspaceId}/reports/${reportId}/findings`, payload),
    onSuccess: (_data, { reportId }) => {
      qc.invalidateQueries({ queryKey: ['report-findings', workspaceId, reportId] })
    },
  })
}

export function useUpdateFinding(workspaceId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reportId, findingId, ...payload }: { reportId: string; findingId: string; [key: string]: any }) =>
      api.put(`/workspaces/${workspaceId}/reports/${reportId}/findings/${findingId}`, payload),
    onSuccess: (_data, { reportId }) => {
      qc.invalidateQueries({ queryKey: ['report-findings', workspaceId, reportId] })
    },
  })
}

export function useUpdateFindingStatus(workspaceId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reportId, findingId, status }: { reportId: string; findingId: string; status: string }) =>
      api.patch(`/workspaces/${workspaceId}/reports/${reportId}/findings/${findingId}/status`, { status }),
    onSuccess: (_data, { reportId }) => {
      qc.invalidateQueries({ queryKey: ['report-findings', workspaceId, reportId] })
    },
  })
}

// ── Export Hooks ────────────────────────────────────────────────────────────

export function useExportPDF(workspaceId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reportId: string) =>
      api.post(`/workspaces/${workspaceId}/reports/${reportId}/export/pdf`),
    onSuccess: (_data, reportId) => {
      qc.invalidateQueries({ queryKey: ['report-exports', workspaceId, reportId] })
    },
  })
}

export function useReportExports(workspaceId: string | undefined, reportId: string | undefined) {
  const { data, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ['report-exports', workspaceId, reportId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/reports/${reportId}/exports`),
    enabled: !!workspaceId && !!reportId,
  })
  return { exports: data?.data ?? [], isLoading }
}
