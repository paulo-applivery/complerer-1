import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Playbook {
  id: string
  control_id: string
  framework_version_id: string
  title: string
  summary: string
  contributor_count: number
  avg_audit_pass_rate: number | null
  estimated_effort_hours: number
  difficulty_rating: number
  source: string
  last_updated_at: string
  created_at: string
}

export interface EvidencePattern {
  id: string
  playbook_id: string
  evidence_type: string
  evidence_source_tool: string | null
  usage_percentage: number
  auditor_acceptance_rate: number
  collection_frequency: string
  automation_available: number
  effort_minutes: number
  created_at: string
}

export interface PlaybookTip {
  id: string
  playbook_id: string
  tip_type: string
  content: string
  source_segment: string
  upvotes: number
  status: string
  created_at: string
}

interface PlaybookResponse {
  playbook: Playbook
  evidencePatterns: EvidencePattern[]
  tips: PlaybookTip[]
}

export function usePlaybook(workspaceId: string | undefined, controlId: string | undefined) {
  const { data, isLoading, error } = useQuery<PlaybookResponse>({
    queryKey: ['playbook', workspaceId, controlId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/playbooks/${controlId}`),
    enabled: !!workspaceId && !!controlId,
  })

  return {
    playbook: data?.playbook ?? null,
    evidencePatterns: data?.evidencePatterns ?? [],
    tips: data?.tips ?? [],
    isLoading,
    error,
  }
}

interface ControlItem {
  id: string
  control_id: string
  title: string
  requirement_text: string
  framework_version_id: string
  framework_name?: string
}

export function useAdoptedControls(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<{ controls: ControlItem[] }>({
    queryKey: ['adopted-controls', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/controls`),
    enabled: !!workspaceId,
  })

  return {
    controls: data?.controls ?? [],
    isLoading,
  }
}
