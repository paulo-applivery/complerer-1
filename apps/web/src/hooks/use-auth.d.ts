interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
    isSuperAdmin?: boolean;
}
interface SendOtpResponse {
    success: boolean;
    message: string;
    devCode?: string;
}
interface VerifyOtpResponse {
    user?: User;
    status: 'authenticated' | 'needs_name' | 'joined' | 'pending_invitation' | 'workspace_created';
    workspaceId?: string;
    workspaceName?: string;
}
export declare function useAuth(): {
    user: User | null;
    workspaces: {
        id: string;
        name: string;
        slug: string;
        role: string;
    }[];
    isLoading: boolean;
    isAuthenticated: boolean;
    error: Error | null;
    sendOtp: (email: string) => Promise<SendOtpResponse>;
    verifyOtp: (email: string, code: string, name?: string) => Promise<VerifyOtpResponse>;
    logout: () => void;
};
export {};
//# sourceMappingURL=use-auth.d.ts.map