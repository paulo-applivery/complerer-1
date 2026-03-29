import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ── Types matching actual API responses ──────────────────────────────────────

interface Framework {
  id: string
  slug: string
  name: string
  description: string | null
  sourceOrg: string | null
  sourceUrl: string | null
  createdAt: string
}

interface FrameworkVersion {
  id: string
  frameworkId: string
  version: string
  status: string
  totalControls: number
  publishedAt: string | null
  createdAt: string
}

interface Adoption {
  id: string
  workspaceId: string
  frameworkVersionId: string
  adoptedAt: string
  adoptedBy: string
  reason: string | null
  effectiveFrom: string
  effectiveUntil: string | null
  frameworkName: string
  frameworkSlug: string
  frameworkVersion: string
}

interface Control {
  id: string
  frameworkVersionId: string
  controlId: string
  domain: string | null
  subdomain: string | null
  title: string
  requirementText: string
  guidance: string | null
  evidenceRequirements: string[]
  riskWeight: number
  implementationGroup: string | null
}

// ── Hooks ────────────────────────────────────────────────────────────────────

export function useFrameworks(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<{ frameworks: Framework[] }>({
    queryKey: ['frameworks', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/frameworks`),
    enabled: !!workspaceId,
  })

  return { frameworks: data?.frameworks ?? [], isLoading }
}

export function useFrameworkVersions(workspaceId: string | undefined, slug: string) {
  const { data, isLoading } = useQuery<{ versions: FrameworkVersion[] }>({
    queryKey: ['framework-versions', workspaceId, slug],
    queryFn: () => api.get(`/workspaces/${workspaceId}/frameworks/${slug}/versions`),
    enabled: !!workspaceId && !!slug,
  })

  return { versions: data?.versions ?? [], isLoading }
}

export function useAdoptions(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<{ adoptions: Adoption[] }>({
    queryKey: ['adoptions', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/adoptions?active=true`),
    enabled: !!workspaceId,
  })

  return { adoptions: data?.adoptions ?? [], isLoading }
}

interface UseControlsOptions {
  page?: number
  limit?: number
  domain?: string
}

export function useControls(
  workspaceId: string | undefined,
  slug: string,
  version: string,
  options?: UseControlsOptions,
) {
  const page = options?.page ?? 1
  const limit = options?.limit ?? 50
  const domain = options?.domain ?? ''

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(domain ? { domain } : {}),
  })

  const { data, isLoading } = useQuery<{ controls: Control[]; total: number }>({
    queryKey: ['controls', workspaceId, slug, version, page, limit, domain],
    queryFn: () =>
      api.get(`/workspaces/${workspaceId}/frameworks/${slug}/versions/${version}/controls?${params}`),
    enabled: !!workspaceId && !!slug && !!version,
  })

  return {
    controls: data?.controls ?? [],
    total: data?.total ?? 0,
    isLoading,
  }
}

export function useAdoptFramework(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { frameworkVersionId: string; reason?: string }) =>
      api.post(`/workspaces/${workspaceId}/adoptions`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adoptions', workspaceId] })
    },
  })
}

export function useUnadoptFramework(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (adoptionId: string) =>
      api.delete(`/workspaces/${workspaceId}/adoptions/${adoptionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adoptions', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['adopted-controls', workspaceId] })
    },
  })
}

// ── Control CRUD ────────────────────────────────────────────────────────────

export function useCreateControl(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { fvId: string; data: Partial<Control> & { controlId: string; title: string; requirementText: string } }) =>
      api.post(`/workspaces/${workspaceId}/framework-versions/${payload.fvId}/controls`, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] })
      queryClient.invalidateQueries({ queryKey: ['frameworks'] })
    },
  })
}

export function useUpdateControl(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { fvId: string; ctrlId: string; data: Partial<Control> }) =>
      api.put(`/workspaces/${workspaceId}/framework-versions/${payload.fvId}/controls/${payload.ctrlId}`, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] })
    },
  })
}

export function useDeleteControl(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { fvId: string; ctrlId: string }) =>
      api.delete(`/workspaces/${workspaceId}/framework-versions/${payload.fvId}/controls/${payload.ctrlId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] })
      queryClient.invalidateQueries({ queryKey: ['frameworks'] })
    },
  })
}

// ── CSV Import ──────────────────────────────────────────────────────────────

export function useImportFramework(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) =>
      api.upload(`/workspaces/${workspaceId}/frameworks/import`, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frameworks'] })
      queryClient.invalidateQueries({ queryKey: ['adoptions'] })
    },
  })
}
