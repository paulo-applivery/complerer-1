import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
export function useAuth() {
    const queryClient = useQueryClient();
    const { data, isLoading, error } = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: () => api.get('/auth/me'),
        retry: false,
        staleTime: 10 * 60 * 1000, // 10 min — auth rarely changes
        gcTime: 30 * 60 * 1000,
        enabled: !!localStorage.getItem('userId'),
    });
    const sendOtp = async (email) => {
        return api.post('/auth/send-otp', { email });
    };
    const verifyOtp = async (email, code, name) => {
        const result = await api.post('/auth/verify-otp', {
            email,
            code,
            name,
        });
        if (result.user) {
            localStorage.setItem('userId', result.user.id);
            await queryClient.invalidateQueries({ queryKey: ['auth'] });
        }
        return result;
    };
    const logout = () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('workspaceId');
        queryClient.clear();
    };
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
    };
}
//# sourceMappingURL=use-auth.js.map