import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface WorkspaceDetail {
  id: string
  name: string
  slug: string
}

interface Member {
  id: string
  userId: string
  email: string
  name: string
  role: string
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
