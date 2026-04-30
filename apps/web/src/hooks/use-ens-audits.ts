import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type SystemCategory = 'BASICA' | 'MEDIA' | 'ALTA'
export type CitadLevel = 'BAJO' | 'MEDIO' | 'ALTO'
export type AuditStatus = 'planning' | 'fieldwork' | 'drafting' | 'reported' | 'closed'
export type Verdict = 'FAVORABLE' | 'FAVORABLE_CON_NO_CONFORMIDADES' | 'DESFAVORABLE'
export type Severity =
  | 'NO_CONFORMIDAD_MAYOR'
  | 'NO_CONFORMIDAD_MENOR'
  | 'OBSERVACION'
  | 'PUNTO_DE_MEJORA'
export type FindingStatus =
  | 'open'
  | 'in_remediation'
  | 'remediated'
  | 'validated'
  | 'accepted'
  | 'closed'

export interface EnsAudit {
  id: string
  project_id: string
  framework_version_id: string
  cycle_label: string
  audit_type: string
  scope_description: string | null
  system_category: SystemCategory
  is_aapp: number
  status: AuditStatus
  overall_verdict: Verdict | null
  pac_required: number
  fieldwork_started_at: string | null
  fieldwork_finished_at: string | null
  report_issued_at: string | null
  created_at: string
  updated_at: string
}

export interface CitadValuation {
  id: string
  audit_id: string
  service_name: string
  service_kind: 'service' | 'information'
  c_value: CitadLevel | null
  i_value: CitadLevel | null
  t_value: CitadLevel | null
  a_value: CitadLevel | null
  d_value: CitadLevel | null
  derived_category: SystemCategory
  justification: string | null
  valued_by: string | null
}

export interface AuditResult {
  id: string
  audit_id: string
  control_id: string
  code: string
  title: string
  control_type: string | null
  control_group: string | null
  applies: number
  applies_justification: string | null
  audited: number
  maturity_level: string | null
  required_maturity: string | null
  implementation_notes: string | null
  evidence_refs_json: string
  selected_reinforcements_json: string
}

export interface Finding {
  id: string
  audit_id: string
  audit_result_id: string | null
  control_id: string | null
  control_code: string | null
  control_title: string | null
  display_id: string
  global_finding_id: string
  severity: Severity
  exists_flag: number
  description: string
  recommendation: string | null
  pac_required: number
  status: FindingStatus
  raised_at: string
  closed_at: string | null
}

export interface QualityFlag {
  finding_id: string
  display_id: string
  severity: Severity
  exists_flag: number
  flag_severity_display_mismatch: number
  flag_exec_summary_missing_per_control_finding: number
  flag_existen_false_but_category_checked: number
}

// ── Audits ──────────────────────────────────────────────────

export function useEnsAudits(workspaceId: string | undefined, projectId?: string) {
  const qs = projectId ? `?projectId=${projectId}` : ''
  return useQuery<{ audits: EnsAudit[] }>({
    queryKey: ['ens-audits', workspaceId, projectId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/ens/audits${qs}`),
    enabled: !!workspaceId,
  })
}

export function useEnsAudit(workspaceId: string | undefined, auditId: string | undefined) {
  return useQuery<{ audit: EnsAudit }>({
    queryKey: ['ens-audit', workspaceId, auditId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/ens/audits/${auditId}`),
    enabled: !!workspaceId && !!auditId,
  })
}

export function useCreateEnsAudit(workspaceId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      projectId: string
      cycleLabel: string
      auditType?: 'inicial' | 'renovacion' | 'seguimiento' | 'interna'
      scopeDescription?: string
      systemCategory?: SystemCategory
      isAapp?: boolean
      auditorName?: string
      auditorFirm?: string
      auditorQualification?: string
      auditorIndependenceConfirmed?: boolean
    }) => api.post(`/workspaces/${workspaceId}/ens/audits`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ens-audits', workspaceId] })
    },
  })
}

export function useUpdateEnsAudit(workspaceId: string | undefined, auditId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.patch(`/workspaces/${workspaceId}/ens/audits/${auditId}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ens-audit', workspaceId, auditId] })
      qc.invalidateQueries({ queryKey: ['ens-audits', workspaceId] })
    },
  })
}

export function useComputeVerdict(workspaceId: string | undefined, auditId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api.post(`/workspaces/${workspaceId}/ens/audits/${auditId}/compute-verdict`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ens-audit', workspaceId, auditId] })
      qc.invalidateQueries({ queryKey: ['ens-audits', workspaceId] })
    },
  })
}

// ── CITAD ──────────────────────────────────────────────────

export function useCitad(workspaceId: string | undefined, auditId: string | undefined) {
  return useQuery<{ valuations: CitadValuation[] }>({
    queryKey: ['ens-citad', workspaceId, auditId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/ens/audits/${auditId}/citad`),
    enabled: !!workspaceId && !!auditId,
  })
}

export function useCreateCitad(workspaceId: string | undefined, auditId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      serviceName: string
      serviceKind: 'service' | 'information'
      cValue?: CitadLevel | null
      iValue?: CitadLevel | null
      tValue?: CitadLevel | null
      aValue?: CitadLevel | null
      dValue?: CitadLevel | null
      justification?: string
      valuedBy?: string
    }) => api.post(`/workspaces/${workspaceId}/ens/audits/${auditId}/citad`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ens-citad', workspaceId, auditId] })
      qc.invalidateQueries({ queryKey: ['ens-audit', workspaceId, auditId] })
    },
  })
}

export function useDeleteCitad(workspaceId: string | undefined, auditId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (valuationId: string) =>
      api.delete(`/workspaces/${workspaceId}/ens/audits/${auditId}/citad/${valuationId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ens-citad', workspaceId, auditId] })
      qc.invalidateQueries({ queryKey: ['ens-audit', workspaceId, auditId] })
    },
  })
}

// ── Results ────────────────────────────────────────────────

export function useAuditResults(workspaceId: string | undefined, auditId: string | undefined) {
  return useQuery<{ results: AuditResult[] }>({
    queryKey: ['ens-results', workspaceId, auditId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/ens/audits/${auditId}/results`),
    enabled: !!workspaceId && !!auditId,
  })
}

export function useUpsertAuditResult(
  workspaceId: string | undefined,
  auditId: string | undefined
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      controlId: string
      applies: boolean
      appliesJustification?: string
      audited: boolean
      maturityLevel?: 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | null
      implementationNotes?: string
      evidenceRefs?: string[]
      selectedReinforcements?: string[]
    }) => api.put(`/workspaces/${workspaceId}/ens/audits/${auditId}/results`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ens-results', workspaceId, auditId] })
    },
  })
}

// ── Findings ───────────────────────────────────────────────

export function useFindings(workspaceId: string | undefined, auditId: string | undefined) {
  return useQuery<{ findings: Finding[] }>({
    queryKey: ['ens-findings', workspaceId, auditId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/ens/audits/${auditId}/findings`),
    enabled: !!workspaceId && !!auditId,
  })
}

export function useCreateFinding(workspaceId: string | undefined, auditId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      controlId?: string | null
      severity: Severity
      description: string
      recommendation?: string
      existsFlag?: boolean
    }) => api.post(`/workspaces/${workspaceId}/ens/audits/${auditId}/findings`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ens-findings', workspaceId, auditId] })
      qc.invalidateQueries({ queryKey: ['ens-audit', workspaceId, auditId] })
    },
  })
}

export function useUpdateFinding(workspaceId: string | undefined, auditId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ findingId, ...payload }: { findingId: string; status?: FindingStatus; description?: string; recommendation?: string }) =>
      api.patch(`/workspaces/${workspaceId}/ens/audits/${auditId}/findings/${findingId}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ens-findings', workspaceId, auditId] })
    },
  })
}

export function useDeleteFinding(workspaceId: string | undefined, auditId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (findingId: string) =>
      api.delete(`/workspaces/${workspaceId}/ens/audits/${auditId}/findings/${findingId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ens-findings', workspaceId, auditId] })
      qc.invalidateQueries({ queryKey: ['ens-audit', workspaceId, auditId] })
    },
  })
}

// ── PAC ────────────────────────────────────────────────────

export function usePac(
  workspaceId: string | undefined,
  auditId: string | undefined,
  findingId: string | undefined
) {
  return useQuery<{ pac: Record<string, unknown> | null }>({
    queryKey: ['ens-pac', workspaceId, auditId, findingId],
    queryFn: () =>
      api.get(`/workspaces/${workspaceId}/ens/audits/${auditId}/findings/${findingId}/pac`),
    enabled: !!workspaceId && !!auditId && !!findingId,
  })
}

export function useUpsertPac(
  workspaceId: string | undefined,
  auditId: string | undefined,
  findingId: string | undefined
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.put(
        `/workspaces/${workspaceId}/ens/audits/${auditId}/findings/${findingId}/pac`,
        payload
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ens-pac', workspaceId, auditId, findingId] })
    },
  })
}

// ── Aspects (per audit-result checklist) ──────────────────

export interface AspectResult {
  id: string
  audit_result_id: string
  aspect_id: string
  checked: number
  evidence_note: string | null
}

export function useAspectResults(
  workspaceId: string | undefined,
  auditId: string | undefined,
  resultId: string | undefined
) {
  return useQuery<{ aspects: AspectResult[] }>({
    queryKey: ['ens-aspect-results', workspaceId, auditId, resultId],
    queryFn: () =>
      api.get(
        `/workspaces/${workspaceId}/ens/audits/${auditId}/results/${resultId}/aspects`
      ),
    enabled: !!workspaceId && !!auditId && !!resultId,
  })
}

export function useUpsertAspectResults(
  workspaceId: string | undefined,
  auditId: string | undefined,
  resultId: string | undefined
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (aspects: Array<{ aspectId: string; checked: boolean; evidenceNote?: string }>) =>
      api.put(
        `/workspaces/${workspaceId}/ens/audits/${auditId}/results/${resultId}/aspects`,
        { aspects }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ens-aspect-results', workspaceId, auditId, resultId] })
    },
  })
}

// ── Framework controls (for the ENS catalogue dropdown) ───

export interface EnsCatalogueControl {
  id: string
  controlId: string
  title: string
  controlType: string | null
  controlGroup: string | null
  applicability: Record<string, string> | null
  reinforcements: Array<{ id: string; description: string; mode: string; required_at: string[] }>
  evaluatedAspects: Array<{ id: string; question: string; reinforcement_ref: string | null }>
  aappOnly: boolean
}

export function useEnsCatalogue(workspaceId: string | undefined) {
  return useQuery<{ controls: EnsCatalogueControl[]; total: number }>({
    queryKey: ['ens-catalogue', workspaceId],
    queryFn: () =>
      api.get(
        `/workspaces/${workspaceId}/frameworks/ens/versions/RD%20311%2F2022/controls?limit=100`
      ),
    enabled: !!workspaceId,
    staleTime: 5 * 60_000,
  })
}

// ── Quality flags ──────────────────────────────────────────

export function useQualityFlags(
  workspaceId: string | undefined,
  auditId: string | undefined
) {
  return useQuery<{ flags: QualityFlag[] }>({
    queryKey: ['ens-quality-flags', workspaceId, auditId],
    queryFn: () =>
      api.get(`/workspaces/${workspaceId}/ens/audits/${auditId}/quality-flags`),
    enabled: !!workspaceId && !!auditId,
  })
}
