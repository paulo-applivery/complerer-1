import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ── Types ──────────────────────────────────────────────────────────────────

export interface GapControl {
  controlId: string
  domain: string | null
  title: string
  status: 'compliant' | 'auto_satisfied' | 'partial' | 'gap'
  satisfiedBy: { controlId: string; relationship: string; confidence?: number }[]
  evidenceCount: number
}

export interface GapAnalysisSummary {
  totalControls: number
  compliant: number
  autoSatisfied: number
  partial: number
  gap: number
  coveragePercent: number
}

export interface GapAnalysisResult {
  summary: GapAnalysisSummary
  controls: GapControl[]
}

interface Crosswalk {
  id: string
  sourceControlId: string
  targetControlId: string
  relationship: string
  confidence: number
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useGapAnalysis(
  workspaceId: string | undefined,
  sourceFramework: string,
  targetFramework: string,
) {
  const { data, isLoading } = useQuery<{ gapAnalysis: GapAnalysisResult }>({
    queryKey: ['gap-analysis', workspaceId, sourceFramework, targetFramework],
    queryFn: () =>
      api.get(
        `/workspaces/${workspaceId}/gap-analysis?sourceFramework=${encodeURIComponent(sourceFramework)}&targetFramework=${encodeURIComponent(targetFramework)}`,
      ),
    enabled: !!workspaceId && !!sourceFramework && !!targetFramework,
  })

  return { gapAnalysis: data?.gapAnalysis ?? null, isLoading }
}

export function useCrosswalks(
  workspaceId: string | undefined,
  controlId: string,
) {
  const { data, isLoading } = useQuery<{ crosswalks: Crosswalk[] }>({
    queryKey: ['crosswalks', workspaceId, controlId],
    queryFn: () =>
      api.get(`/workspaces/${workspaceId}/controls/${controlId}/crosswalks`),
    enabled: !!workspaceId && !!controlId,
  })

  return { crosswalks: data?.crosswalks ?? [], isLoading }
}
