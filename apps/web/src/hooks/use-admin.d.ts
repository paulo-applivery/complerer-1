interface Provider {
    id: string;
    category: string;
    slug: string;
    name: string;
    description: string | null;
    configSchema: string | null;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}
interface ProviderConfig {
    id: string;
    key: string;
    value: string;
    isSecret: boolean;
    createdAt: string;
    updatedAt: string;
}
interface FeatureFlag {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    enabled: boolean;
    rolloutPercentage: number;
    targetWorkspaces: string[] | null;
    createdAt: string;
    updatedAt: string;
}
interface EmailTemplate {
    id: string;
    slug: string;
    name: string;
    subject: string;
    bodyHtml?: string;
    bodyText?: string | null;
    variables: string[];
    category: string;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}
interface AdminWorkspace {
    id: string;
    name: string;
    slug: string;
    plan: string;
    createdAt: string;
    updatedAt: string;
    memberCount: number;
    frameworkCount: number;
    evidenceCount: number;
    eventCount: number;
    systemCount: number;
}
interface AdminStats {
    totalWorkspaces: number;
    totalUsers: number;
    totalEvidence: number;
    totalControls: number;
}
export declare function useIsSuperAdmin(): boolean;
export declare function useAdminProviders(category?: string): import("@tanstack/react-query").UseQueryResult<{
    providers: Provider[];
}, Error>;
export declare function useAdminProvider(id: string | null): import("@tanstack/react-query").UseQueryResult<{
    provider: Provider;
    configs: ProviderConfig[];
}, Error>;
export declare function useUpdateProvider(): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    id: string;
    name?: string;
    description?: string;
    enabled?: boolean;
}, unknown>;
export declare function useCreateProvider(): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    category: string;
    slug: string;
    name: string;
    description?: string;
    enabled?: boolean;
}, unknown>;
export declare function useDeleteProvider(): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export declare function useUpdateProviderConfig(): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    providerId: string;
    key: string;
    value: string;
    isSecret?: boolean;
}, unknown>;
export declare function useDeleteProviderConfig(): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    providerId: string;
    key: string;
}, unknown>;
export declare function useAdminFeatureFlags(): import("@tanstack/react-query").UseQueryResult<{
    featureFlags: FeatureFlag[];
}, Error>;
export declare function useCreateFeatureFlag(): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    slug: string;
    name: string;
    description?: string;
    enabled?: boolean;
    rolloutPercentage?: number;
    targetWorkspaces?: string[];
}, unknown>;
export declare function useUpdateFeatureFlag(): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    id: string;
    name?: string;
    description?: string;
    enabled?: boolean;
    rolloutPercentage?: number;
    targetWorkspaces?: string[] | null;
}, unknown>;
export declare function useDeleteFeatureFlag(): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export declare function useAdminEmailTemplates(category?: string): import("@tanstack/react-query").UseQueryResult<{
    emailTemplates: EmailTemplate[];
}, Error>;
export declare function useAdminEmailTemplate(id: string | null): import("@tanstack/react-query").UseQueryResult<{
    template: EmailTemplate;
}, Error>;
export declare function useUpdateEmailTemplate(): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    id: string;
    name?: string;
    subject?: string;
    bodyHtml?: string;
    bodyText?: string;
    variables?: string[];
    category?: string;
    enabled?: boolean;
}, unknown>;
export declare function useCreateEmailTemplate(): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    slug: string;
    name: string;
    subject: string;
    bodyHtml: string;
    bodyText?: string;
    variables?: string[];
    category: string;
    enabled?: boolean;
}, unknown>;
export declare function useDeleteEmailTemplate(): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export declare function usePreviewEmailTemplate(): import("@tanstack/react-query").UseMutationResult<{
    html: string;
}, Error, string, unknown>;
export declare function useSendTestEmail(): import("@tanstack/react-query").UseMutationResult<{
    success: boolean;
    message: string;
    subject?: string;
}, Error, {
    id: string;
    to: string;
}, unknown>;
export declare function useAdminWorkspaces(): import("@tanstack/react-query").UseQueryResult<{
    workspaces: AdminWorkspace[];
}, Error>;
export declare function useAdminStats(): import("@tanstack/react-query").UseQueryResult<{
    stats: AdminStats;
}, Error>;
interface AdminMember {
    id: string;
    email: string;
    name: string;
    isSuperAdmin: boolean;
    lastLoginAt: string | null;
    createdAt: string;
}
export declare function useAdminMembers(): import("@tanstack/react-query").UseQueryResult<{
    members: AdminMember[];
}, Error>;
export declare function usePromoteMember(): import("@tanstack/react-query").UseMutationResult<{
    success: boolean;
    message: string;
}, Error, string, unknown>;
export declare function useDemoteMember(): import("@tanstack/react-query").UseMutationResult<{
    success: boolean;
    message: string;
}, Error, string, unknown>;
export {};
//# sourceMappingURL=use-admin.d.ts.map