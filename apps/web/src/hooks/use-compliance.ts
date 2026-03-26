import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ── Types ───────────────────────────────────────────────────────────────────

interface System {
  id: string
  name: string
  classification: 'critical' | 'standard' | 'low'
  sensitivity: string | null
  environment: string | null
  mfaRequired: boolean
  owner: string | null
  createdAt: string
}

interface DirectoryUser {
  id: string
  name: string
  email: string
  department: string | null
  status: 'active' | 'inactive' | 'terminated'
  createdAt: string
}

interface AccessRecord {
  id: string
  userId: string
  userName: string
  userEmail: string
  systemId: string
  systemName: string
  role: string
  accessType: string | null
  grantedAt: string
  approvedBy: string | null
  ticketRef: string | null
  riskScore: number
  status: 'active' | 'revoked'
  lastReviewedAt: string | null
  revokedAt: string | null
}

interface Evidence {
  id: string
  title: string
  description: string | null
  source: string | null
  fileName: string | null
  capturedAt: string
  expiresAt: string | null
  linksCount: number
  createdAt: string
  updatedAt: string | null
  updatedBy: string | null
  updatedByName: string | null
  uploadedByName: string | null
}

interface EvidenceLink {
  id: string
  evidenceId: string
  controlId: string
  controlTitle: string
  controlCode: string
  frameworkName: string
  linkType: string
  confidence: number | null
  createdAt: string
}

interface ComplianceEvent {
  id: string
  type: string
  description: string
  entityType: string
  entityId: string
  createdAt: string
  createdBy: string
}

// ── Systems ─────────────────────────────────────────────────────────────────

export function useSystemsList(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<{ systems: System[] }>({
    queryKey: ['systems', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/systems`),
    enabled: !!workspaceId,
  })

  return { systems: data?.systems ?? [], isLoading }
}

export function useCreateSystem(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      name: string
      classification: string
      sensitivity?: string
      environment?: string
      mfaRequired?: boolean
      owner?: string
    }) => api.post(`/workspaces/${workspaceId}/systems`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systems', workspaceId] })
    },
  })
}

// ── Directory Users ─────────────────────────────────────────────────────────

interface UseDirectoryUsersOptions {
  status?: string
  search?: string
}

export function useDirectoryUsers(
  workspaceId: string | undefined,
  options?: UseDirectoryUsersOptions,
) {
  const status = options?.status ?? 'active'
  const search = options?.search ?? ''

  const params = new URLSearchParams({
    status,
    ...(search ? { search } : {}),
  })

  const { data, isLoading } = useQuery<{ users: DirectoryUser[] }>({
    queryKey: ['directory-users', workspaceId, status, search],
    queryFn: () => api.get(`/workspaces/${workspaceId}/directory?${params}`),
    enabled: !!workspaceId,
  })

  return { users: data?.users ?? [], isLoading }
}

export function useCreateDirectoryUser(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      name: string
      email: string
      department?: string
    }) => api.post(`/workspaces/${workspaceId}/directory`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory-users', workspaceId] })
    },
  })
}

// ── Access Records ──────────────────────────────────────────────────────────

interface UseAccessRecordsOptions {
  status?: string
  systemId?: string
  userId?: string
  page?: number
  limit?: number
}

export function useAccessRecords(
  workspaceId: string | undefined,
  options?: UseAccessRecordsOptions,
) {
  const status = options?.status ?? 'active'
  const systemId = options?.systemId ?? ''
  const userId = options?.userId ?? ''
  const page = options?.page ?? 1
  const limit = options?.limit ?? 25

  const params = new URLSearchParams({
    status,
    page: String(page),
    limit: String(limit),
    ...(systemId ? { systemId } : {}),
    ...(userId ? { userId } : {}),
  })

  const { data, isLoading } = useQuery<{ records: AccessRecord[]; total: number }>({
    queryKey: ['access-records', workspaceId, status, systemId, userId, page, limit],
    queryFn: () => api.get(`/workspaces/${workspaceId}/access?${params}`),
    enabled: !!workspaceId,
  })

  return {
    records: data?.records ?? [],
    total: data?.total ?? 0,
    isLoading,
  }
}

export function useCreateAccess(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      userId: string
      systemId: string
      role: string
      approvedBy?: string
      ticketRef?: string
    }) => api.post(`/workspaces/${workspaceId}/access`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-records', workspaceId] })
    },
  })
}

export function useRevokeAccess(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (accessId: string) =>
      api.post(`/workspaces/${workspaceId}/access/${accessId}/revoke`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-records', workspaceId] })
    },
  })
}

export function useReviewAccess(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (accessId: string) =>
      api.post(`/workspaces/${workspaceId}/access/${accessId}/review`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-records', workspaceId] })
    },
  })
}

// ── Evidence ────────────────────────────────────────────────────────────────

interface UseEvidenceOptions {
  page?: number
  limit?: number
}

export function useEvidence(
  workspaceId: string | undefined,
  options?: UseEvidenceOptions,
) {
  const page = options?.page ?? 1
  const limit = options?.limit ?? 25

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })

  const { data, isLoading } = useQuery<{ evidence: Evidence[]; total: number }>({
    queryKey: ['evidence', workspaceId, page, limit],
    queryFn: () => api.get(`/workspaces/${workspaceId}/evidence?${params}`),
    enabled: !!workspaceId,
  })

  return {
    evidence: data?.evidence ?? [],
    total: data?.total ?? 0,
    isLoading,
  }
}

export function useCreateEvidence(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      title: string
      description?: string
      source?: string
      fileName?: string
      expiresAt?: string
    }) => api.post(`/workspaces/${workspaceId}/evidence`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence', workspaceId] })
    },
  })
}

export function useLinkEvidence(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { evidenceId: string; controlId: string; frameworkVersionId: string }) =>
      api.post(`/workspaces/${workspaceId}/evidence/${payload.evidenceId}/link`, {
        controlId: payload.controlId,
        frameworkVersionId: payload.frameworkVersionId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['evidence-links', workspaceId] })
    },
  })
}

export function useEvidenceLinks(
  workspaceId: string | undefined,
  evidenceId: string | undefined,
) {
  const { data, isLoading } = useQuery<{ links: EvidenceLink[] }>({
    queryKey: ['evidence-links', workspaceId, evidenceId],
    queryFn: () =>
      api.get(`/workspaces/${workspaceId}/evidence/${evidenceId}/links`),
    enabled: !!workspaceId && !!evidenceId,
  })

  return { links: data?.links ?? [], isLoading }
}

export function useUnlinkEvidence(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { evidenceId: string; linkId: string }) =>
      api.delete(`/workspaces/${workspaceId}/evidence/${payload.evidenceId}/links/${payload.linkId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['evidence-links', workspaceId] })
    },
  })
}

export function useUpdateEvidence(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { evidenceId: string; data: { title?: string; description?: string; source?: string; expiresAt?: string | null; fileName?: string; fileSize?: number; mimeType?: string } }) =>
      api.put(`/workspaces/${workspaceId}/evidence/${payload.evidenceId}`, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence', workspaceId] })
    },
  })
}

// ── Compliance Events ───────────────────────────────────────────────────────

interface UseComplianceEventsOptions {
  page?: number
  limit?: number
  type?: string
}

export function useComplianceEvents(
  workspaceId: string | undefined,
  options?: UseComplianceEventsOptions,
) {
  const page = options?.page ?? 1
  const limit = options?.limit ?? 25
  const type = options?.type ?? ''

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(type ? { type } : {}),
  })

  const { data, isLoading } = useQuery<{ events: ComplianceEvent[]; total: number }>({
    queryKey: ['compliance-events', workspaceId, page, limit, type],
    queryFn: () => api.get(`/workspaces/${workspaceId}/events?${params}`),
    enabled: !!workspaceId,
  })

  return {
    events: data?.events ?? [],
    total: data?.total ?? 0,
    isLoading,
  }
}
