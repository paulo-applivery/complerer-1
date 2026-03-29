import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface WorkspaceDetail {
  id: string
  name: string
  slug: string
}

export interface Member {
  id: string
  userId: string
  email: string
  name: string
  role: string
  joinedAt?: string
}

interface WorkspaceResponse {
  workspace: WorkspaceDetail
  members: Member[]
  role: string
}

export function useWorkspace(workspaceId: string | undefined) {
  const { data, isLoading, error } = useQuery<WorkspaceResponse>({
    queryKey: ['workspace', workspaceId],
    queryFn: () => api.get<WorkspaceResponse>(`/workspaces/${workspaceId}`),
    staleTime: 10 * 60 * 1000,
    enabled: !!workspaceId,
  })

  return {
    workspace: data?.workspace ?? null,
    members: data?.members ?? [],
    role: data?.role ?? null,
    isLoading,
    error,
  }
}

// ── Invite Member ────────────────────────────────────────────────────────────

export function useInviteMember(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { email: string; role: string }) =>
      api.post(`/workspaces/${workspaceId}/invitations`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direct-invitations', workspaceId] })
    },
  })
}

// ── Update Member Role ───────────────────────────────────────────────────────

export function useUpdateMemberRole(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      api.patch(`/workspaces/${workspaceId}/members/${memberId}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] })
    },
  })
}

// ── Remove Member ────────────────────────────────────────────────────────────

export function useRemoveMember(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (memberId: string) =>
      api.delete(`/workspaces/${workspaceId}/members/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] })
    },
  })
}

// ── Direct Invitations ───────────────────────────────────────────────────────

interface DirectInvitation {
  id: string
  email: string
  role: string
  invitedBy: string
  status: string
  expiresAt: string
  createdAt: string
}

export function useDirectInvitations(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<{ invitations: DirectInvitation[] }>({
    queryKey: ['direct-invitations', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/invitations/direct`),
    enabled: !!workspaceId,
  })

  return {
    invitations: data?.invitations ?? [],
    isLoading,
  }
}

// ── Cancel Invitation ────────────────────────────────────────────────────────

export function useCancelInvitation(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) =>
      api.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direct-invitations', workspaceId] })
    },
  })
}

// ── Feature Flags ───────────────────────────────────────────────────────────

export function useFeatureFlags(workspaceId: string | undefined) {
  const { data, isLoading } = useQuery<{ features: Record<string, boolean> }>({
    queryKey: ['features', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/features`),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // cache for 5 min
  })

  const isEnabled = (slug: string) => data?.features?.[slug] ?? true // default to enabled if not loaded

  return { features: data?.features ?? {}, isEnabled, isLoading }
}
