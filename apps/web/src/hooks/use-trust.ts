import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ── Types ───────────────────────────────────────────────────────────────────

interface TrustProfile {
  id: string
  workspace_id: string
  slug: string
  company_name: string
  enabled: number
  show_frameworks: number
  show_posture_score: number
  show_evidence_freshness: number
  show_last_snapshot: number
  show_control_count: number
  badge_style: string
  created_at: string
  updated_at: string
}

interface TrustBreakdown {
  frameworkCoverage: number
  evidenceFreshness: number
  violationRatio: number
  reviewCompleteness: number
  snapshotRecency: number
}

interface TrustStats {
  frameworksActive: number
  controlsSatisfied: number
  controlsTotal: number
  evidenceFreshness: number
  openViolations: number
}

interface TrustScoreResponse {
  profile: TrustProfile | null
  score: number
  grade: string
  breakdown: TrustBreakdown
  stats: TrustStats
}

// ── Hooks ───────────────────────────────────────────────────────────────────

export function useTrustScore(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<TrustScoreResponse>({
    queryKey: ['trust-score', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/trust`),
    enabled: !!workspaceId,
  })

  return {
    profile: data?.profile ?? null,
    score: data?.score ?? 0,
    grade: data?.grade ?? 'D',
    breakdown: data?.breakdown ?? {
      frameworkCoverage: 0,
      evidenceFreshness: 0,
      violationRatio: 0,
      reviewCompleteness: 0,
      snapshotRecency: 0,
    },
    stats: data?.stats ?? {
      frameworksActive: 0,
      controlsSatisfied: 0,
      controlsTotal: 0,
      evidenceFreshness: 0,
      openViolations: 0,
    },
    isLoading,
  }
}

export function useUpdateTrustProfile(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      slug: string
      companyName: string
      enabled?: boolean
      showFrameworks?: boolean
      showPostureScore?: boolean
      showEvidenceFreshness?: boolean
      showLastSnapshot?: boolean
      showControlCount?: boolean
      badgeStyle?: string
    }) => api.post(`/workspaces/${workspaceId}/trust`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trust-score', workspaceId] })
    },
  })
}
