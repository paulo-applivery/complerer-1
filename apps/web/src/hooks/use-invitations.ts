import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface InvitationRequest {
  id: string
  email: string
  name: string
  status: string
  createdAt: string
  reviewedBy: string | null
  reviewedAt: string | null
}

interface InvitationsResponse {
  invitations: InvitationRequest[]
}

export function useInvitations(workspaceId: string | undefined) {
  return useQuery<InvitationsResponse>({
    queryKey: ['invitations', workspaceId],
    queryFn: () =>
      api.get<InvitationsResponse>(
        `/auth/workspaces/${workspaceId}/invitations`
      ),
    enabled: !!workspaceId,
  })
}

export function useApproveInvitation(workspaceId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) =>
      api.post(
        `/auth/workspaces/${workspaceId}/invitations/${requestId}/approve`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['invitations', workspaceId],
      })
      queryClient.invalidateQueries({
        queryKey: ['workspace', workspaceId],
      })
    },
  })
}

export function useRejectInvitation(workspaceId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) =>
      api.post(
        `/auth/workspaces/${workspaceId}/invitations/${requestId}/reject`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['invitations', workspaceId],
      })
    },
  })
}
