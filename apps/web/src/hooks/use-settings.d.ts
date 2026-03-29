interface Baseline {
    id: string;
    templateId: string | null;
    templateName: string | null;
    name: string;
    description: string | null;
    category: 'access' | 'review' | 'authentication' | 'change_management';
    severity: 'critical' | 'high' | 'medium' | 'low';
    ruleConfig: Record<string, unknown> | null;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}
interface BaselineViolation {
    id: string;
    baselineId: string;
    baselineName: string;
    entityType: string;
    entityId: string;
    status: 'open' | 'resolved' | 'exempted';
    reason: string | null;
    detectedAt: string;
    resolvedAt: string | null;
}
interface Risk {
    id: string;
    title: string;
    description: string | null;
    asset: string | null;
    threat: string | null;
    vulnerability: string | null;
    likelihood: number;
    impact: number;
    inherentRisk: number;
    treatment: 'mitigate' | 'accept' | 'transfer' | 'avoid';
    status: 'open' | 'mitigated' | 'accepted' | 'closed';
    owner: string | null;
    reviewDate: string | null;
    controls: string[];
    createdAt: string;
    updatedAt: string;
}
interface Policy {
    id: string;
    templateId: string | null;
    templateTitle: string | null;
    title: string;
    description: string | null;
    category: 'access' | 'security' | 'privacy' | 'hr' | 'incident';
    version: string;
    status: 'draft' | 'active' | 'under_review' | 'archived';
    owner: string | null;
    reviewCycleDays: number | null;
    nextReviewDate: string | null;
    controlsCount: number;
    createdAt: string;
    updatedAt: string;
}
interface PolicyControl {
    id: string;
    controlId: string;
    controlCode: string;
    controlTitle: string;
    frameworkName: string;
    linkedAt: string;
}
interface Snapshot {
    id: string;
    capturedAt: string;
    controlsTotal: number;
    controlsMet: number;
    risksOpen: number;
    violationsOpen: number;
    score: number;
}
export declare function useBaselines(workspaceId: string | undefined): {
    baselines: Baseline[];
    isLoading: boolean;
};
export declare function useCreateBaseline(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    name: string;
    description?: string;
    category: string;
    severity: string;
    ruleConfig?: string;
    enabled?: boolean;
}, unknown>;
export declare function useUpdateBaseline(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    id: string;
    enabled?: boolean;
    name?: string;
    description?: string;
    category?: string;
    severity?: string;
    ruleType?: string;
    ruleConfig?: any;
}, unknown>;
export declare function useDeleteBaseline(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export declare function useBaselineLibrary(workspaceId: string | undefined): {
    library: any[];
    isLoading: boolean;
};
export declare function useAddFromBaselineLibrary(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    libraryIds: string[];
}, unknown>;
export declare function usePolicyLibrary(workspaceId: string | undefined): {
    library: any[];
    isLoading: boolean;
};
export declare function useAddFromPolicyLibrary(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    templateIds: string[];
}, unknown>;
interface UseBaselineViolationsOptions {
    status?: string;
}
export declare function useBaselineViolations(workspaceId: string | undefined, options?: UseBaselineViolationsOptions): {
    violations: BaselineViolation[];
    isLoading: boolean;
};
export declare function useResolveViolation(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    violationId: string;
    reason?: string;
}, unknown>;
export declare function useExemptViolation(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    violationId: string;
    reason: string;
}, unknown>;
export declare function useRisks(workspaceId: string | undefined): {
    risks: Risk[];
    isLoading: boolean;
};
export declare function useCreateRisk(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    title: string;
    description?: string;
    asset?: string;
    threat?: string;
    vulnerability?: string;
    likelihood: number;
    impact: number;
    treatment: string;
    owner?: string;
    reviewDate?: string;
}, unknown>;
export declare function usePolicies(workspaceId: string | undefined): {
    policies: Policy[];
    isLoading: boolean;
};
export declare function useCreatePolicy(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    title: string;
    description?: string;
    category: string;
    version?: string;
    owner?: string;
    reviewCycleDays?: number;
}, unknown>;
export declare function useUpdatePolicy(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    policyId: string;
    title?: string;
    description?: string;
    category?: string;
    version?: string;
    status?: string;
    ownerEmail?: string;
    contentText?: string;
    reviewCycleDays?: number;
    approvedBy?: string;
}, unknown>;
export declare function useDeletePolicy(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export declare function useLinkPolicyControl(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    policyId: string;
    controlId: string;
}, unknown>;
export declare function useUnlinkPolicyControl(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    policyId: string;
    linkId: string;
}, unknown>;
export declare function usePolicyControls(workspaceId: string | undefined, policyId: string | undefined): {
    controls: PolicyControl[];
    isLoading: boolean;
};
export declare function useSnapshots(workspaceId: string | undefined): {
    snapshots: Snapshot[];
    isLoading: boolean;
};
export declare function useCaptureSnapshot(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, void, unknown>;
export {};
//# sourceMappingURL=use-settings.d.ts.map