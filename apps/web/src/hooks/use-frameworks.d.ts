interface Framework {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    sourceOrg: string | null;
    sourceUrl: string | null;
    createdAt: string;
}
interface FrameworkVersion {
    id: string;
    frameworkId: string;
    version: string;
    status: string;
    totalControls: number;
    publishedAt: string | null;
    createdAt: string;
}
interface Adoption {
    id: string;
    workspaceId: string;
    frameworkVersionId: string;
    adoptedAt: string;
    adoptedBy: string;
    reason: string | null;
    effectiveFrom: string;
    effectiveUntil: string | null;
    frameworkName: string;
    frameworkSlug: string;
    frameworkVersion: string;
}
interface Control {
    id: string;
    frameworkVersionId: string;
    controlId: string;
    domain: string | null;
    subdomain: string | null;
    title: string;
    requirementText: string;
    guidance: string | null;
    evidenceRequirements: string[];
    riskWeight: number;
    implementationGroup: string | null;
}
export declare function useFrameworks(workspaceId: string | undefined): {
    frameworks: Framework[];
    isLoading: boolean;
};
export declare function useFrameworkVersions(workspaceId: string | undefined, slug: string): {
    versions: FrameworkVersion[];
    isLoading: boolean;
};
export declare function useAdoptions(workspaceId: string | undefined): {
    adoptions: Adoption[];
    isLoading: boolean;
};
interface UseControlsOptions {
    page?: number;
    limit?: number;
    domain?: string;
}
export declare function useControls(workspaceId: string | undefined, slug: string, version: string, options?: UseControlsOptions): {
    controls: Control[];
    total: number;
    isLoading: boolean;
};
export declare function useAdoptFramework(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    frameworkVersionId: string;
    reason?: string;
}, unknown>;
export declare function useUnadoptFramework(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export declare function useCreateControl(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    fvId: string;
    data: Partial<Control> & {
        controlId: string;
        title: string;
        requirementText: string;
    };
}, unknown>;
export declare function useUpdateControl(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    fvId: string;
    ctrlId: string;
    data: Partial<Control>;
}, unknown>;
export declare function useDeleteControl(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    fvId: string;
    ctrlId: string;
}, unknown>;
export declare function useImportFramework(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, FormData, unknown>;
export {};
//# sourceMappingURL=use-frameworks.d.ts.map