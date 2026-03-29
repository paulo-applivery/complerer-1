export interface GapControl {
    controlId: string;
    domain: string | null;
    title: string;
    status: 'compliant' | 'auto_satisfied' | 'partial' | 'gap';
    satisfiedBy: {
        controlId: string;
        relationship: string;
        confidence?: number;
    }[];
    evidenceCount: number;
}
export interface GapAnalysisSummary {
    totalControls: number;
    compliant: number;
    autoSatisfied: number;
    partial: number;
    gap: number;
    coveragePercent: number;
}
export interface GapAnalysisResult {
    summary: GapAnalysisSummary;
    controls: GapControl[];
}
interface Crosswalk {
    id: string;
    sourceControlId: string;
    targetControlId: string;
    relationship: string;
    confidence: number;
}
export declare function useGapAnalysis(workspaceId: string | undefined, sourceFramework: string, targetFramework: string): {
    gapAnalysis: GapAnalysisResult | null;
    isLoading: boolean;
};
export declare function useCrosswalks(workspaceId: string | undefined, controlId: string): {
    crosswalks: Crosswalk[];
    isLoading: boolean;
};
export {};
//# sourceMappingURL=use-gap-analysis.d.ts.map