interface InvitationRequest {
    id: string;
    email: string;
    name: string;
    status: string;
    createdAt: string;
    reviewedBy: string | null;
    reviewedAt: string | null;
}
interface InvitationsResponse {
    invitations: InvitationRequest[];
}
export declare function useInvitations(workspaceId: string | undefined): import("@tanstack/react-query").UseQueryResult<InvitationsResponse, Error>;
export declare function useApproveInvitation(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export declare function useRejectInvitation(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export {};
//# sourceMappingURL=use-invitations.d.ts.map