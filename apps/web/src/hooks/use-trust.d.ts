interface TrustProfile {
    id: string;
    workspace_id: string;
    slug: string;
    company_name: string;
    enabled: number;
    show_frameworks: number;
    show_posture_score: number;
    show_evidence_freshness: number;
    show_last_snapshot: number;
    show_control_count: number;
    badge_style: string;
    created_at: string;
    updated_at: string;
}
interface TrustBreakdown {
    frameworkCoverage: number;
    evidenceFreshness: number;
    violationRatio: number;
    reviewCompleteness: number;
    snapshotRecency: number;
}
interface TrustStats {
    frameworksActive: number;
    controlsSatisfied: number;
    controlsTotal: number;
    evidenceFreshness: number;
    openViolations: number;
}
export declare function useTrustScore(workspaceId: string | undefined): {
    profile: TrustProfile | null;
    score: number;
    grade: string;
    breakdown: TrustBreakdown;
    stats: TrustStats;
    isLoading: boolean;
};
export declare function useUpdateTrustProfile(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    slug: string;
    companyName: string;
    enabled?: boolean;
    showFrameworks?: boolean;
    showPostureScore?: boolean;
    showEvidenceFreshness?: boolean;
    showLastSnapshot?: boolean;
    showControlCount?: boolean;
    badgeStyle?: string;
}, unknown>;
export {};
//# sourceMappingURL=use-trust.d.ts.map