import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Project {
  id: string
  name: string
  description: string | null
  frameworkId: string
  frameworkName: string
  frameworkSlug: string
  frameworkVersion: string
  frameworkVersionId: string
  status: string
  auditorName: string | null
  auditorFirm: string | null
  auditPeriodStart: string | null
  auditPeriodEnd: string | null
  targetCompletionDate: string | null
  controlsTotal: number
  controlsCovered: number
  evidenceCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface ProjectStats {
  controlsTotal: number
  controlsCovered: number
  evidenceLinked: number
  coveragePercent: number
}

export function useProjects(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<{ projects: Project[] }>({
    queryKey: ['projects', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/projects`),
    enabled: !!workspaceId,
  })
  return { projects: data?.projects ?? [], isLoading }
}

export function useProject(workspaceId: string | undefined, projectId: string | undefined) {
  const { data, isLoading } = useQuery<{ project: Project }>({
    queryKey: ['project', workspaceId, projectId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/projects/${projectId}`),
    enabled: !!workspaceId && !!projectId,
  })
  return { project: data?.project ?? null, isLoading }
}

export function useProjectStats(workspaceId: string | undefined, projectId: string | undefined) {
  const { data, isLoading } = useQuery<{ stats: ProjectStats }>({
    queryKey: ['project-stats', workspaceId, projectId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/projects/${projectId}/stats`),
    enabled: !!workspaceId && !!projectId,
  })
  return { stats: data?.stats ?? null, isLoading }
}

export function useCreateProject(workspaceId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      name: string
      description?: string
      frameworkId: string
      frameworkVersionId: string
      auditorName?: string
      auditorFirm?: string
      auditPeriodStart?: string
      auditPeriodEnd?: string
      targetCompletionDate?: string
    }) => api.post(`/workspaces/${workspaceId}/projects`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })
    },
  })
}

export function useUpdateProject(workspaceId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, ...payload }: {
      projectId: string
      name?: string
      description?: string
      status?: string
      auditorName?: string
      auditorFirm?: string
      auditPeriodStart?: string
      auditPeriodEnd?: string
      targetCompletionDate?: string
    }) => api.put(`/workspaces/${workspaceId}/projects/${projectId}`, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['project', workspaceId, variables.projectId] })
    },
  })
}

export function useDeleteProject(workspaceId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) => api.delete(`/workspaces/${workspaceId}/projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })
    },
  })
}

export function useProjectControls(workspaceId: string | undefined, projectId: string | undefined, options?: { domain?: string; search?: string }) {
  const params = new URLSearchParams()
  if (options?.domain) params.set('domain', options.domain)
  if (options?.search) params.set('search', options.search)
  const qs = params.toString()

  const { data, isLoading } = useQuery<{ controls: any[]; domains: string[] }>({
    queryKey: ['project-controls', workspaceId, projectId, options?.domain, options?.search],
    queryFn: () => api.get(`/workspaces/${workspaceId}/projects/${projectId}/controls${qs ? '?' + qs : ''}`),
    enabled: !!workspaceId && !!projectId,
  })
  return { controls: data?.controls ?? [], domains: data?.domains ?? [], isLoading }
}

export function useProjectEvidence(workspaceId: string | undefined, projectId: string | undefined) {
  const { data, isLoading } = useQuery<{ evidence: any[] }>({
    queryKey: ['project-evidence', workspaceId, projectId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/projects/${projectId}/evidence`),
    enabled: !!workspaceId && !!projectId,
  })
  return { evidence: data?.evidence ?? [], isLoading }
}

export function useLinkProjectEvidence(workspaceId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, evidenceId, controlId, notes }: { projectId: string; evidenceId: string; controlId?: string; notes?: string }) =>
      api.post(`/workspaces/${workspaceId}/projects/${projectId}/evidence`, { evidenceId, controlId: controlId || undefined, notes }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-evidence', workspaceId, variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['project-controls', workspaceId, variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['project-stats', workspaceId, variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })
    },
  })
}

export function useUnlinkProjectEvidence(workspaceId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, linkId }: { projectId: string; linkId: string }) =>
      api.delete(`/workspaces/${workspaceId}/projects/${projectId}/evidence/${linkId}`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-evidence', workspaceId, variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['project-controls', workspaceId, variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['project-stats', workspaceId, variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })
    },
  })
}

export function useProjectPolicies(workspaceId: string | undefined, projectId: string | undefined) {
  const { data, isLoading } = useQuery<{ policies: any[] }>({
    queryKey: ['project-policies', workspaceId, projectId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/projects/${projectId}/policies`),
    enabled: !!workspaceId && !!projectId,
  })
  return { policies: data?.policies ?? [], isLoading }
}

export function useProjectBaselines(workspaceId: string | undefined, projectId: string | undefined) {
  const { data, isLoading } = useQuery<{ baselines: any[] }>({
    queryKey: ['project-baselines', workspaceId, projectId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/projects/${projectId}/baselines`),
    enabled: !!workspaceId && !!projectId,
  })
  return { baselines: data?.baselines ?? [], isLoading }
}

export function useProjectGaps(workspaceId: string | undefined, projectId: string | undefined) {
  const { data, isLoading } = useQuery<{ gaps: any[] }>({
    queryKey: ['project-gaps', workspaceId, projectId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/projects/${projectId}/gaps`),
    enabled: !!workspaceId && !!projectId,
  })
  return { gaps: data?.gaps ?? [], isLoading }
}

export function useProjectRisks(workspaceId: string | undefined, projectId: string | undefined) {
  const { data, isLoading } = useQuery<{ risks: any[] }>({
    queryKey: ['project-risks', workspaceId, projectId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/projects/${projectId}/risks`),
    enabled: !!workspaceId && !!projectId,
  })
  return { risks: data?.risks ?? [], isLoading }
}

export function useCreateAndLinkEvidence(workspaceId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, ...payload }: {
      projectId: string
      title: string
      description?: string
      source?: string
      capturedAt?: string
      expiresAt?: string
      controlId?: string
    }) => api.post(`/workspaces/${workspaceId}/projects/${projectId}/create-and-link`, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-evidence', workspaceId, variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['project-controls', workspaceId, variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['project-stats', workspaceId, variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['available-evidence', workspaceId, variables.projectId] })
    },
  })
}

export function useAvailableEvidence(workspaceId: string | undefined, projectId: string | undefined) {
  const { data, isLoading } = useQuery<{ evidence: any[] }>({
    queryKey: ['available-evidence', workspaceId, projectId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/projects/${projectId}/available-evidence`),
    enabled: !!workspaceId && !!projectId,
    staleTime: 0,
  })
  return { evidence: data?.evidence ?? [], isLoading }
}
