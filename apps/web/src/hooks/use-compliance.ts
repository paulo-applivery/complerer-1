import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ── Types ───────────────────────────────────────────────────────────────────

export type AccessStatus = 'requested' | 'approved' | 'active' | 'pending_review' | 'suspended' | 'expired' | 'revoked'

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
  title: string | null
  status: 'active' | 'inactive' | 'terminated' | 'on_leave'
  employmentStatus: 'active' | 'inactive' | 'terminated' | 'on_leave'
  createdAt: string
}

export interface AccessRecord {
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
  status: AccessStatus
  lastReviewedAt: string | null
  revokedAt: string | null
  updatedAt: string | null
  updatedBy: string | null
  licenseType: string | null
  costPerPeriod: number | null
  costCurrency: string | null
  costFrequency: string | null
}

export interface CustomFieldDefinition {
  id: string
  workspaceId: string
  entityType: 'person' | 'system' | 'access_record'
  fieldName: string
  fieldLabel: string
  fieldType: 'text' | 'number' | 'select' | 'date' | 'boolean'
  fieldOptions: string[] | null
  displayOrder: number
  required: boolean
  createdAt: string
  updatedAt: string
}

export interface CustomFieldValue {
  fieldId: string
  fieldName: string
  fieldLabel: string
  fieldType: string
  value: string | null
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

// ── System Library ──────────────────────────────────────────────────────────

interface LibrarySystem {
  id: string
  name: string
  category: string
  description: string | null
  vendor: string | null
  website: string | null
  default_classification: string
  default_sensitivity: string
  icon_hint: string | null
}

export function useSystemLibrary(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<{ systems: LibrarySystem[] }>({
    queryKey: ['system-library'],
    queryFn: () => api.get(`/workspaces/${workspaceId}/systems/library`),
    staleTime: 30 * 60 * 1000, // 30 min — library rarely changes
    enabled: !!workspaceId,
  })

  return { library: data?.systems ?? [], isLoading }
}

export function useAddFromLibrary(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { libraryIds: string[]; environment?: string }) =>
      api.post(`/workspaces/${workspaceId}/systems/from-library`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systems', workspaceId] })
    },
  })
}

export function useEmployeeLibrary(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<{ employees: any[] }>({
    queryKey: ['employee-library'],
    queryFn: () => api.get(`/workspaces/${workspaceId}/directory/library`),
    staleTime: 30 * 60 * 1000,
    enabled: !!workspaceId,
  })
  return { library: data?.employees ?? [], isLoading }
}

export function useAddFromEmployeeLibrary(workspaceId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { libraryIds: string[] }) =>
      api.post(`/workspaces/${workspaceId}/directory/from-library`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory', workspaceId] })
    },
  })
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

export function useUpdateSystem(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ systemId, ...data }: {
      systemId: string
      name?: string
      classification?: string
      sensitivity?: string
      environment?: string
      mfaRequired?: boolean
      owner?: string
      description?: string
    }) => api.patch(`/workspaces/${workspaceId}/systems/${systemId}`, data),
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
      title?: string
    }) => api.post(`/workspaces/${workspaceId}/directory`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory-users', workspaceId] })
    },
  })
}

export function useUpdateDirectoryUser(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, ...payload }: {
      userId: string
      name?: string
      email?: string
      department?: string
      title?: string
      employmentStatus?: string
    }) => api.put(`/workspaces/${workspaceId}/directory/${userId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory-users', workspaceId] })
    },
  })
}

export function useDeleteDirectoryUser(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => api.delete(`/workspaces/${workspaceId}/directory/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory-users', workspaceId] })
    },
  })
}

export function useBulkImportDirectory(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      users: Array<{
        name: string
        email: string
        department?: string
        title?: string
        employmentStatus?: string
        customFields?: Record<string, string>
      }>
    }) => api.post(`/workspaces/${workspaceId}/directory/bulk`, payload),
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
      status?: AccessStatus
      licenseType?: string
      costPerPeriod?: number
      costCurrency?: string
      costFrequency?: string
      customFields?: Record<string, string>
    }) => api.post(`/workspaces/${workspaceId}/access`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-records', workspaceId] })
    },
  })
}

export function useUpdateAccessRecord(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      recordId: string
      data: {
        role?: string
        accessType?: string
        approvedBy?: string | null
        ticketRef?: string
        status?: string
        licenseType?: string | null
        costPerPeriod?: number | null
        costCurrency?: string
        costFrequency?: string | null
        customFields?: Record<string, string | null>
      }
    }) => api.put(`/workspaces/${workspaceId}/access/${payload.recordId}`, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-records', workspaceId] })
    },
  })
}

export function useTransitionAccess(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      recordId: string
      action: 'approve' | 'activate' | 'suspend' | 'request_review' | 'expire' | 'revoke'
      reason?: string
    }) =>
      api.post(`/workspaces/${workspaceId}/access/${payload.recordId}/transition`, {
        action: payload.action,
        reason: payload.reason,
      }),
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

// ── Custom Fields ───────────────────────────────────────────────────────────

export function useCustomFieldDefinitions(
  workspaceId: string | undefined,
  entityType?: string,
) {
  const params = entityType ? `?entityType=${entityType}` : ''

  const { data, isLoading } = useQuery<{ fields: CustomFieldDefinition[] }>({
    queryKey: ['custom-fields', workspaceId, entityType],
    queryFn: () => api.get(`/workspaces/${workspaceId}/custom-fields${params}`),
    enabled: !!workspaceId,
  })

  return { fields: data?.fields ?? [], isLoading }
}

export function useCreateCustomField(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      entityType: 'person' | 'system' | 'access_record'
      fieldName: string
      fieldLabel: string
      fieldType: 'text' | 'number' | 'select' | 'date' | 'boolean'
      fieldOptions?: string[]
      displayOrder?: number
      required?: boolean
    }) => api.post(`/workspaces/${workspaceId}/custom-fields`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields', workspaceId] })
    },
  })
}

export function useUpdateCustomField(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      fieldId: string
      data: {
        fieldLabel?: string
        fieldOptions?: string[]
        displayOrder?: number
        required?: boolean
      }
    }) =>
      api.patch(`/workspaces/${workspaceId}/custom-fields/${payload.fieldId}`, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields', workspaceId] })
    },
  })
}

export function useDeleteCustomField(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (fieldId: string) =>
      api.delete(`/workspaces/${workspaceId}/custom-fields/${fieldId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields', workspaceId] })
    },
  })
}

export function useCustomFieldValues(
  workspaceId: string | undefined,
  entityType: string,
  entityId: string | undefined,
) {
  const { data, isLoading } = useQuery<{ values: CustomFieldValue[] }>({
    queryKey: ['custom-field-values', workspaceId, entityType, entityId],
    queryFn: () =>
      api.get(`/workspaces/${workspaceId}/custom-fields/values/${entityType}/${entityId}`),
    enabled: !!workspaceId && !!entityId,
  })

  return { values: data?.values ?? [], isLoading }
}

export function useSaveCustomFieldValues(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      entityType: string
      entityId: string
      values: Record<string, string | null>
    }) =>
      api.put(
        `/workspaces/${workspaceId}/custom-fields/values/${payload.entityType}/${payload.entityId}`,
        { values: payload.values },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-field-values', workspaceId] })
    },
  })
}

// ── Workspace Settings ──────────────────────────────────────────────────────

interface Setting {
  key: string
  value: string
  updatedBy: string | null
  updatedAt: string
}

export function useWorkspaceSettings(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<{ settings: Setting[] }>({
    queryKey: ['settings', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/settings`),
    enabled: !!workspaceId,
  })

  return { settings: data?.settings ?? [], isLoading }
}

export function useWorkspaceSetting(workspaceId: string | undefined, key: string) {
  const { settings, isLoading } = useWorkspaceSettings(workspaceId)
  const setting = settings.find((s) => s.key === key)
  return { value: setting?.value ?? null, isLoading }
}

export function useUpdateWorkspaceSetting(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { key: string; value: string }) =>
      api.put(`/workspaces/${workspaceId}/settings`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', workspaceId] })
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
      queryClient.invalidateQueries({ queryKey: ['available-evidence', workspaceId] })
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

// ── Baseline Controls (link baselines to framework controls) ────────────────

export function useBaselineControls(workspaceId: string | undefined, baselineId: string | undefined) {
  const { data, isLoading } = useQuery<{ controls: any[] }>({
    queryKey: ['baseline-controls', workspaceId, baselineId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/baselines/${baselineId}/controls`),
    enabled: !!workspaceId && !!baselineId,
  })
  return { controls: data?.controls ?? [], isLoading }
}

export function useLinkBaselineControl(workspaceId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ baselineId, controlId }: { baselineId: string; controlId: string }) =>
      api.post(`/workspaces/${workspaceId}/baselines/${baselineId}/controls`, { controlId }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['baseline-controls', workspaceId, variables.baselineId] })
      queryClient.invalidateQueries({ queryKey: ['project-controls', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['project-stats', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['project-gaps', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['project-baselines', workspaceId] })
    },
  })
}

export function useUnlinkBaselineControl(workspaceId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ baselineId, linkId }: { baselineId: string; linkId: string }) =>
      api.delete(`/workspaces/${workspaceId}/baselines/${baselineId}/controls/${linkId}`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['baseline-controls', workspaceId, variables.baselineId] })
      queryClient.invalidateQueries({ queryKey: ['project-controls', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['project-stats', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['project-gaps', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['project-baselines', workspaceId] })
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
