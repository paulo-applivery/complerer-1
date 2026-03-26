import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Provider {
  id: string
  category: string
  slug: string
  name: string
  description: string | null
  configSchema: string | null
  enabled: boolean
  createdAt: string
  updatedAt: string
}

interface ProviderConfig {
  id: string
  key: string
  value: string
  isSecret: boolean
  createdAt: string
  updatedAt: string
}

interface FeatureFlag {
  id: string
  slug: string
  name: string
  description: string | null
  enabled: boolean
  rolloutPercentage: number
  targetWorkspaces: string[] | null
  createdAt: string
  updatedAt: string
}

interface EmailTemplate {
  id: string
  slug: string
  name: string
  subject: string
  bodyHtml?: string
  bodyText?: string | null
  variables: string[]
  category: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

interface AdminWorkspace {
  id: string
  name: string
  slug: string
  plan: string
  createdAt: string
  updatedAt: string
  memberCount: number
  frameworkCount: number
  evidenceCount: number
  eventCount: number
  systemCount: number
}

interface AdminStats {
  totalWorkspaces: number
  totalUsers: number
  totalEvidence: number
  totalControls: number
}

// ─── Super Admin Check ─────────────────────────────────────────────────────

export function useIsSuperAdmin() {
  const { user } = useAuth()
  return user?.isSuperAdmin === true
}

// ─── Providers ──────────────────────────────────────────────────────────────

export function useAdminProviders(category?: string) {
  const params = category ? `?category=${category}` : ''
  return useQuery<{ providers: Provider[] }>({
    queryKey: ['admin', 'providers', category],
    queryFn: () => api.get(`/admin/providers${params}`),
  })
}

export function useAdminProvider(id: string | null) {
  return useQuery<{ provider: Provider; configs: ProviderConfig[] }>({
    queryKey: ['admin', 'providers', id],
    queryFn: () => api.get(`/admin/providers/${id}`),
    enabled: !!id,
  })
}

export function useUpdateProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string; enabled?: boolean }) =>
      api.put(`/admin/providers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] })
    },
  })
}

export function useCreateProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { category: string; slug: string; name: string; description?: string; enabled?: boolean }) =>
      api.post('/admin/providers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] })
    },
  })
}

export function useDeleteProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/providers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] })
    },
  })
}

export function useUpdateProviderConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ providerId, ...data }: { providerId: string; key: string; value: string; isSecret?: boolean }) =>
      api.put(`/admin/providers/${providerId}/configs`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] })
    },
  })
}

export function useDeleteProviderConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ providerId, key }: { providerId: string; key: string }) =>
      api.delete(`/admin/providers/${providerId}/configs/${key}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] })
    },
  })
}

// ─── Feature Flags ──────────────────────────────────────────────────────────

export function useAdminFeatureFlags() {
  return useQuery<{ featureFlags: FeatureFlag[] }>({
    queryKey: ['admin', 'feature-flags'],
    queryFn: () => api.get('/admin/feature-flags'),
  })
}

export function useCreateFeatureFlag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { slug: string; name: string; description?: string; enabled?: boolean; rolloutPercentage?: number; targetWorkspaces?: string[] }) =>
      api.post('/admin/feature-flags', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] })
    },
  })
}

export function useUpdateFeatureFlag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string; enabled?: boolean; rolloutPercentage?: number; targetWorkspaces?: string[] | null }) =>
      api.put(`/admin/feature-flags/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] })
    },
  })
}

export function useDeleteFeatureFlag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/feature-flags/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] })
    },
  })
}

// ─── Email Templates ────────────────────────────────────────────────────────

export function useAdminEmailTemplates(category?: string) {
  const params = category ? `?category=${category}` : ''
  return useQuery<{ emailTemplates: EmailTemplate[] }>({
    queryKey: ['admin', 'email-templates', category],
    queryFn: () => api.get(`/admin/email-templates${params}`),
  })
}

export function useAdminEmailTemplate(id: string | null) {
  return useQuery<{ template: EmailTemplate }>({
    queryKey: ['admin', 'email-templates', 'detail', id],
    queryFn: () => api.get(`/admin/email-templates/${id}`),
    enabled: !!id,
  })
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; subject?: string; bodyHtml?: string; bodyText?: string; variables?: string[]; category?: string; enabled?: boolean }) =>
      api.put(`/admin/email-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'email-templates'] })
    },
  })
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { slug: string; name: string; subject: string; bodyHtml: string; bodyText?: string; variables?: string[]; category: string; enabled?: boolean }) =>
      api.post('/admin/email-templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'email-templates'] })
    },
  })
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/email-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'email-templates'] })
    },
  })
}

export function usePreviewEmailTemplate() {
  return useMutation<{ html: string }, Error, string>({
    mutationFn: (id: string) => api.post(`/admin/email-templates/${id}/preview`),
  })
}

// ─── Workspaces ─────────────────────────────────────────────────────────────

export function useAdminWorkspaces() {
  return useQuery<{ workspaces: AdminWorkspace[] }>({
    queryKey: ['admin', 'workspaces'],
    queryFn: () => api.get('/admin/workspaces'),
  })
}

export function useAdminStats() {
  return useQuery<{ stats: AdminStats }>({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get('/admin/stats'),
  })
}
