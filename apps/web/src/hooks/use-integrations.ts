import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ── Types ───────────────────────────────────────────────────────────────────

export interface CatalogEntry {
  type: string
  name: string
  category: string
  description: string
  icon: string
}

export interface Integration {
  id: string
  workspace_id: string
  type: string
  name: string
  status: 'connected' | 'disconnected' | 'syncing' | 'error'
  config: string
  credentials_ref: string | null
  last_sync_at: string | null
  last_sync_status: string | null
  last_sync_error: string | null
  sync_interval_minutes: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface SyncLog {
  id: string
  workspace_id: string
  integration_id: string
  sync_type: string
  status: string
  records_pulled: number
  records_created: number
  records_updated: number
  anomalies_detected: number
  error_message: string | null
  started_at: string
  completed_at: string | null
}

export interface Anomaly {
  id: string
  workspace_id: string
  integration_id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  detail: string
  entity_type: string | null
  entity_id: string | null
  status: 'open' | 'resolved' | 'dismissed'
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  integration_name?: string
  integration_type?: string
}

// ── Hooks ───────────────────────────────────────────────────────────────────

export function useIntegrationCatalog(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<{ catalog: CatalogEntry[] }>({
    queryKey: ['integration-catalog', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/integrations/catalog`),
    enabled: !!workspaceId,
  })

  return { catalog: data?.catalog ?? [], isLoading }
}

export function useIntegrations(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<{ integrations: Integration[] }>({
    queryKey: ['integrations', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/integrations`),
    enabled: !!workspaceId,
  })

  return { integrations: data?.integrations ?? [], isLoading }
}

export function useConnectIntegration(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { type: string; name?: string; config?: Record<string, unknown> }) =>
      api.post(`/workspaces/${workspaceId}/integrations`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', workspaceId] })
    },
  })
}

export function useDisconnectIntegration(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (integrationId: string) =>
      api.delete(`/workspaces/${workspaceId}/integrations/${integrationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', workspaceId] })
    },
  })
}

export function useSyncIntegration(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (integrationId: string) =>
      api.post(`/workspaces/${workspaceId}/integrations/${integrationId}/sync`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', workspaceId] })
    },
  })
}

export function useAnomalies(workspaceId: string | undefined, status?: string) {
  const params = status ? `?status=${status}` : ''
  const { data, isLoading } = useQuery<{ anomalies: Anomaly[] }>({
    queryKey: ['anomalies', workspaceId, status],
    queryFn: () => api.get(`/workspaces/${workspaceId}/integrations/anomalies${params}`),
    enabled: !!workspaceId,
  })

  return { anomalies: data?.anomalies ?? [], isLoading }
}

export function useResolveAnomaly(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ anomalyId, reason }: { anomalyId: string; reason?: string }) =>
      api.post(`/workspaces/${workspaceId}/integrations/anomalies/${anomalyId}/resolve`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies', workspaceId] })
    },
  })
}

export function useDismissAnomaly(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (anomalyId: string) =>
      api.post(`/workspaces/${workspaceId}/integrations/anomalies/${anomalyId}/dismiss`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies', workspaceId] })
    },
  })
}
