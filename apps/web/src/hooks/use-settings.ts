import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ── Types ───────────────────────────────────────────────────────────────────

interface Baseline {
  id: string
  templateId: string | null
  templateName: string | null
  name: string
  description: string | null
  category: 'access' | 'review' | 'authentication' | 'change_management'
  severity: 'critical' | 'high' | 'medium' | 'low'
  ruleConfig: Record<string, unknown> | null
  enabled: boolean
  createdAt: string
  updatedAt: string
}

interface BaselineViolation {
  id: string
  baselineId: string
  baselineName: string
  entityType: string
  entityId: string
  status: 'open' | 'resolved' | 'exempted'
  reason: string | null
  detectedAt: string
  resolvedAt: string | null
}

interface Risk {
  id: string
  title: string
  description: string | null
  asset: string | null
  threat: string | null
  vulnerability: string | null
  likelihood: number
  impact: number
  inherentRisk: number
  treatment: 'mitigate' | 'accept' | 'transfer' | 'avoid'
  status: 'open' | 'mitigated' | 'accepted' | 'closed'
  owner: string | null
  reviewDate: string | null
  controls: string[]
  createdAt: string
  updatedAt: string
}

interface Policy {
  id: string
  templateId: string | null
  templateTitle: string | null
  title: string
  description: string | null
  category: 'access' | 'security' | 'privacy' | 'hr' | 'incident'
  version: string
  status: 'draft' | 'active' | 'under_review' | 'archived'
  owner: string | null
  reviewCycleDays: number | null
  nextReviewDate: string | null
  controlsCount: number
  createdAt: string
  updatedAt: string
}

interface PolicyControl {
  id: string
  controlId: string
  controlCode: string
  controlTitle: string
  frameworkName: string
  linkedAt: string
}

interface Snapshot {
  id: string
  capturedAt: string
  controlsTotal: number
  controlsMet: number
  risksOpen: number
  violationsOpen: number
  score: number
}

// ── Baselines ───────────────────────────────────────────────────────────────

export function useBaselines(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<{ baselines: Baseline[] }>({
    queryKey: ['baselines', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/baselines`),
    enabled: !!workspaceId,
  })

  return { baselines: data?.baselines ?? [], isLoading }
}

export function useCreateBaseline(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      name: string
      description?: string
      category: string
      severity: string
      ruleConfig?: string
      enabled?: boolean
    }) => api.post(`/workspaces/${workspaceId}/baselines`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baselines', workspaceId] })
    },
  })
}

export function useUpdateBaseline(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; enabled?: boolean; name?: string; description?: string; category?: string; severity?: string; ruleType?: string; ruleConfig?: any }) =>
      api.patch(`/workspaces/${workspaceId}/baselines/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baselines', workspaceId] })
    },
  })
}

export function useDeleteBaseline(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/workspaces/${workspaceId}/baselines/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baselines', workspaceId] })
    },
  })
}

export function useBaselineLibrary(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<{ items: any[] }>({
    queryKey: ['baseline-library', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/baselines/library`),
    enabled: !!workspaceId,
  })
  return { library: data?.items ?? [], isLoading }
}

export function useAddFromBaselineLibrary(workspaceId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { libraryIds: string[] }) =>
      api.post(`/workspaces/${workspaceId}/baselines/from-library`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baselines', workspaceId] })
    },
  })
}

// ── Policy Library ─────────────────────────────────────────────────────────

export function usePolicyLibrary(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<{ items: any[] }>({
    queryKey: ['policy-library', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/policies/library`),
    enabled: !!workspaceId,
  })
  return { library: data?.items ?? [], isLoading }
}

export function useAddFromPolicyLibrary(workspaceId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { templateIds: string[] }) =>
      api.post(`/workspaces/${workspaceId}/policies/from-library`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies', workspaceId] })
    },
  })
}

// ── Baseline Violations ─────────────────────────────────────────────────────

interface UseBaselineViolationsOptions {
  status?: string
}

export function useBaselineViolations(
  workspaceId: string | undefined,
  options?: UseBaselineViolationsOptions,
) {
  const status = options?.status ?? 'open'
  const params = new URLSearchParams({ status })

  const { data, isLoading } = useQuery<{ violations: BaselineViolation[] }>({
    queryKey: ['baseline-violations', workspaceId, status],
    queryFn: () =>
      api.get(`/workspaces/${workspaceId}/baselines/violations?${params}`),
    enabled: !!workspaceId,
  })

  return { violations: data?.violations ?? [], isLoading }
}

export function useResolveViolation(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { violationId: string; reason?: string }) =>
      api.post(
        `/workspaces/${workspaceId}/baselines/violations/${payload.violationId}/resolve`,
        { reason: payload.reason },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baseline-violations', workspaceId] })
    },
  })
}

export function useExemptViolation(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { violationId: string; reason: string }) =>
      api.post(
        `/workspaces/${workspaceId}/baselines/violations/${payload.violationId}/exempt`,
        { reason: payload.reason },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baseline-violations', workspaceId] })
    },
  })
}

// ── Risks ───────────────────────────────────────────────────────────────────

export function useRisks(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<{ risks: Risk[] }>({
    queryKey: ['risks', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/risks`),
    enabled: !!workspaceId,
  })

  return { risks: data?.risks ?? [], isLoading }
}

export function useCreateRisk(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      title: string
      description?: string
      asset?: string
      threat?: string
      vulnerability?: string
      likelihood: number
      impact: number
      treatment: string
      owner?: string
      reviewDate?: string
    }) => api.post(`/workspaces/${workspaceId}/risks`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks', workspaceId] })
    },
  })
}

// ── Policies ────────────────────────────────────────────────────────────────

export function usePolicies(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<{ policies: Policy[] }>({
    queryKey: ['policies', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/policies`),
    enabled: !!workspaceId,
  })

  return { policies: data?.policies ?? [], isLoading }
}

export function useCreatePolicy(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      title: string
      description?: string
      category: string
      version?: string
      owner?: string
      reviewCycleDays?: number
    }) => api.post(`/workspaces/${workspaceId}/policies`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies', workspaceId] })
    },
  })
}

export function useLinkPolicyControl(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { policyId: string; controlId: string }) =>
      api.post(`/workspaces/${workspaceId}/policies/${payload.policyId}/controls`, {
        controlId: payload.controlId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['policy-controls', workspaceId] })
    },
  })
}

export function useUnlinkPolicyControl(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { policyId: string; linkId: string }) =>
      api.delete(`/workspaces/${workspaceId}/policies/${payload.policyId}/controls/${payload.linkId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['policy-controls', workspaceId] })
    },
  })
}

export function usePolicyControls(
  workspaceId: string | undefined,
  policyId: string | undefined,
) {
  const { data, isLoading } = useQuery<{ controls: PolicyControl[] }>({
    queryKey: ['policy-controls', workspaceId, policyId],
    queryFn: () =>
      api.get(`/workspaces/${workspaceId}/policies/${policyId}/controls`),
    enabled: !!workspaceId && !!policyId,
  })

  return { controls: data?.controls ?? [], isLoading }
}

// ── Snapshots ───────────────────────────────────────────────────────────────

export function useSnapshots(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<{ snapshots: Snapshot[] }>({
    queryKey: ['snapshots', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/snapshots`),
    enabled: !!workspaceId,
  })

  return { snapshots: data?.snapshots ?? [], isLoading }
}

export function useCaptureSnapshot(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post(`/workspaces/${workspaceId}/snapshots`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapshots', workspaceId] })
    },
  })
}
