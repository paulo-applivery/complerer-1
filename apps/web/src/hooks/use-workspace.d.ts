interface WorkspaceDetail {
    id: string;
    name: string;
    slug: string;
}
export interface Member {
    id: string;
    userId: string;
    email: string;
    name: string;
    role: string;
    joinedAt?: string;
}
export declare function useWorkspace(workspaceId: string | undefined): {
    workspace: WorkspaceDetail | null;
    members: Member[];
    role: string | null;
    isLoading: boolean;
    error: Error | null;
};
export declare function useInviteMember(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    email: string;
    role: string;
}, unknown>;
export declare function useUpdateMemberRole(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    memberId: string;
    role: string;
}, unknown>;
export declare function useRemoveMember(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
interface DirectInvitation {
    id: string;
    email: string;
    role: string;
    invitedBy: string;
    status: string;
    expiresAt: string;
    createdAt: string;
}
export declare function useDirectInvitations(workspaceId: string | undefined): {
    invitations: DirectInvitation[];
    isLoading: boolean;
};
export declare function useCancelInvitation(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export declare function useFeatureFlags(workspaceId: string | undefined): {
    features: Record<string, boolean>;
    isEnabled: (slug: string) => boolean;
    isLoading: boolean;
};
export {};
//# sourceMappingURL=use-workspace.d.ts.map