import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
  isSuperAdmin?: boolean
}

interface Membership {
  workspaceId: string
  workspaceName: string
  workspaceSlug: string
  role: string
}

interface AuthResponse {
  user: User
  memberships: Membership[]
}

interface SendOtpResponse {
  success: boolean
  message: string
  devCode?: string
}

interface VerifyOtpResponse {
  user?: User
  status: 'authenticated' | 'needs_name' | 'joined' | 'pending_invitation' | 'workspace_created'
  workspaceId?: string
  workspaceName?: string
}

export function useAuth() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<AuthResponse>({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get<AuthResponse>('/auth/me'),
    retry: false,
    staleTime: 10 * 60 * 1000,   // 10 min — auth rarely changes
    gcTime: 30 * 60 * 1000,
    enabled: !!localStorage.getItem('userId'),
  })

  const sendOtp = async (email: string): Promise<SendOtpResponse> => {
    return api.post<SendOtpResponse>('/auth/send-otp', { email })
  }

  const verifyOtp = async (
    email: string,
    code: string,
    name?: string
  ): Promise<VerifyOtpResponse> => {
    const result = await api.post<VerifyOtpResponse>('/auth/verify-otp', {
      email,
      code,
      name,
    })
    if (result.user) {
      localStorage.setItem('userId', result.user.id)
      await queryClient.invalidateQueries({ queryKey: ['auth'] })
    }
    return result
  }

  const logout = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('workspaceId')
    queryClient.clear()
  }

  return {
    user: data?.user ?? null,
    workspaces: (data?.memberships ?? []).map((m) => ({
      id: m.workspaceId,
      name: m.workspaceName,
      slug: m.workspaceSlug,
      role: m.role,
    })),
    isLoading,
    isAuthenticated: !!data?.user,
    error,
    sendOtp,
    verifyOtp,
    logout,
  }
}
