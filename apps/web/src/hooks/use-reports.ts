import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Report, ReportTemplate } from '@complerer/reports'

// ── Queries ────────────────────────────────────────────────────────────────

export function useReports(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<{ data: Report[] }>({
    queryKey: ['reports', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/reports`),
    enabled: !!workspaceId,
  })
  return { reports: data?.data ?? [], isLoading }
}

export function useReport(workspaceId: string | undefined, reportId: string | undefined) {
  const { data, isLoading } = useQuery<Report>({
    queryKey: ['report', workspaceId, reportId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/reports/${reportId}`),
    enabled: !!workspaceId && !!reportId,
  })
  return { report: data ?? null, isLoading }
}

export function useReportTemplates(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<{ data: ReportTemplate[] }>({
    queryKey: ['report-templates', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/reports/templates`),
    enabled: !!workspaceId,
  })
  return { templates: data?.data ?? [], isLoading }
}

// ── Mutations ──────────────────────────────────────────────────────────────

export function useCreateReport(workspaceId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { templateId: string; projectId?: string; name: string; auditPeriodStart?: string; auditPeriodEnd?: string }) =>
      api.post(`/workspaces/${workspaceId}/reports`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', workspaceId] })
    },
  })
}

export function useUpdateReport(workspaceId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reportId, ...payload }: { reportId: string; name?: string; content?: string }) =>
      api.put(`/workspaces/${workspaceId}/reports/${reportId}`, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['report', workspaceId, variables.reportId] })
      queryClient.invalidateQueries({ queryKey: ['reports', workspaceId] })
    },
  })
}

export function useDeleteReport(workspaceId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reportId: string) =>
      api.delete(`/workspaces/${workspaceId}/reports/${reportId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', workspaceId] })
    },
  })
}
