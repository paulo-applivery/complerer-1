export interface Project {
    id: string;
    name: string;
    description: string | null;
    frameworkId: string;
    frameworkName: string;
    frameworkSlug: string;
    frameworkVersion: string;
    frameworkVersionId: string;
    status: string;
    auditorName: string | null;
    auditorFirm: string | null;
    auditPeriodStart: string | null;
    auditPeriodEnd: string | null;
    targetCompletionDate: string | null;
    controlsTotal: number;
    controlsCovered: number;
    evidenceCount: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}
interface ProjectStats {
    controlsTotal: number;
    controlsCovered: number;
    evidenceLinked: number;
    coveragePercent: number;
}
export declare function useProjects(workspaceId: string | undefined): {
    projects: Project[];
    isLoading: boolean;
};
export declare function useProject(workspaceId: string | undefined, projectId: string | undefined): {
    project: Project | null;
    isLoading: boolean;
};
export declare function useProjectStats(workspaceId: string | undefined, projectId: string | undefined): {
    stats: ProjectStats | null;
    isLoading: boolean;
};
export declare function useCreateProject(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    name: string;
    description?: string;
    frameworkId: string;
    frameworkVersionId: string;
    auditorName?: string;
    auditorFirm?: string;
    auditPeriodStart?: string;
    auditPeriodEnd?: string;
    targetCompletionDate?: string;
}, unknown>;
export declare function useUpdateProject(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    projectId: string;
    name?: string;
    description?: string;
    status?: string;
    auditorName?: string;
    auditorFirm?: string;
    auditPeriodStart?: string;
    auditPeriodEnd?: string;
    targetCompletionDate?: string;
}, unknown>;
export declare function useDeleteProject(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export declare function useProjectControls(workspaceId: string | undefined, projectId: string | undefined, options?: {
    domain?: string;
    search?: string;
}): {
    controls: any[];
    domains: string[];
    isLoading: boolean;
};
export declare function useProjectEvidence(workspaceId: string | undefined, projectId: string | undefined): {
    evidence: any[];
    isLoading: boolean;
};
export declare function useLinkProjectEvidence(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    projectId: string;
    evidenceId: string;
    controlId?: string;
    notes?: string;
}, unknown>;
export declare function useUnlinkProjectEvidence(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    projectId: string;
    linkId: string;
}, unknown>;
export declare function useProjectPolicies(workspaceId: string | undefined, projectId: string | undefined): {
    policies: any[];
    isLoading: boolean;
};
export declare function useProjectBaselines(workspaceId: string | undefined, projectId: string | undefined): {
    baselines: any[];
    isLoading: boolean;
};
export declare function useProjectGaps(workspaceId: string | undefined, projectId: string | undefined): {
    gaps: any[];
    isLoading: boolean;
};
export declare function useProjectRisks(workspaceId: string | undefined, projectId: string | undefined): {
    risks: any[];
    isLoading: boolean;
};
export declare function useCreateAndLinkEvidence(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    projectId: string;
    title: string;
    description?: string;
    source?: string;
    capturedAt?: string;
    expiresAt?: string;
    controlId?: string;
}, unknown>;
export declare function useAvailableEvidence(workspaceId: string | undefined, projectId: string | undefined): {
    evidence: any[];
    isLoading: boolean;
};
export {};
//# sourceMappingURL=use-projects.d.ts.map