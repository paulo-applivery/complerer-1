export declare function useReportTemplates(workspaceId: string | undefined): {
    templates: any[];
    isLoading: boolean;
};
export declare function useReportTemplateLibrary(workspaceId: string | undefined): {
    libraryTemplates: any[];
    isLoading: boolean;
};
export declare function useAdoptReportTemplates(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, string[], unknown>;
export declare function useCreateTemplate(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    name: string;
    description?: string;
    frameworkId?: string;
    content?: string;
    variables?: string;
    sections?: string;
}, unknown>;
export declare function useReports(workspaceId: string | undefined, filters?: {
    status?: string;
    projectId?: string;
}): {
    reports: any[];
    isLoading: boolean;
};
export declare function useReport(workspaceId: string | undefined, reportId: string | undefined): {
    report: any;
    isLoading: boolean;
};
export declare function useCreateReport(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    templateId: string;
    projectId?: string;
    name: string;
    auditPeriodStart?: string;
    auditPeriodEnd?: string;
    variables?: Record<string, string>;
}, unknown>;
export declare function useUpdateReport(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    reportId: string;
    name?: string;
    content?: string;
}, unknown>;
export declare function useDeleteReport(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export declare function useSubmitForReview(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    reportId: string;
    comment?: string;
}, unknown>;
export declare function useApproveReport(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    reportId: string;
    comment?: string;
}, unknown>;
export declare function useRejectReport(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    reportId: string;
    comment?: string;
}, unknown>;
export declare function usePublishReport(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export declare function useReportApprovals(workspaceId: string | undefined, reportId: string | undefined): {
    approvals: any[];
    isLoading: boolean;
};
export declare function useReportVersions(workspaceId: string | undefined, reportId: string | undefined): {
    versions: any[];
    isLoading: boolean;
};
export declare function useRevertReport(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    reportId: string;
    version: number;
}, unknown>;
export declare function useReportFindings(workspaceId: string | undefined, reportId: string | undefined): {
    findings: any[];
    isLoading: boolean;
};
export declare function useCreateFinding(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    reportId: string;
    severity: string;
    findingType: string;
    title: string;
    condition?: string;
    criteria?: string;
    cause?: string;
    effect?: string;
    recommendation?: string;
}, unknown>;
export declare function useUpdateFinding(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    [key: string]: any;
    reportId: string;
    findingId: string;
}, unknown>;
export declare function useUpdateFindingStatus(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    reportId: string;
    findingId: string;
    status: string;
}, unknown>;
export declare function useExportPDF(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export declare function useReportExports(workspaceId: string | undefined, reportId: string | undefined): {
    exports: any[];
    isLoading: boolean;
};
//# sourceMappingURL=use-reports.d.ts.map