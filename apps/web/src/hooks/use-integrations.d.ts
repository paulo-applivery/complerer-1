export interface CatalogEntry {
    type: string;
    name: string;
    category: string;
    description: string;
    icon: string;
}
export interface Integration {
    id: string;
    workspace_id: string;
    type: string;
    name: string;
    status: 'connected' | 'disconnected' | 'syncing' | 'error';
    config: string;
    credentials_ref: string | null;
    last_sync_at: string | null;
    last_sync_status: string | null;
    last_sync_error: string | null;
    sync_interval_minutes: number;
    created_by: string;
    created_at: string;
    updated_at: string;
}
export interface SyncLog {
    id: string;
    workspace_id: string;
    integration_id: string;
    sync_type: string;
    status: string;
    records_pulled: number;
    records_created: number;
    records_updated: number;
    anomalies_detected: number;
    error_message: string | null;
    started_at: string;
    completed_at: string | null;
}
export interface Anomaly {
    id: string;
    workspace_id: string;
    integration_id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    detail: string;
    entity_type: string | null;
    entity_id: string | null;
    status: 'open' | 'resolved' | 'dismissed';
    resolved_by: string | null;
    resolved_at: string | null;
    created_at: string;
    integration_name?: string;
    integration_type?: string;
}
export declare function useIntegrationCatalog(workspaceId: string | undefined): {
    catalog: CatalogEntry[];
    isLoading: boolean;
};
export declare function useIntegrations(workspaceId: string | undefined): {
    integrations: Integration[];
    isLoading: boolean;
};
export declare function useConnectIntegration(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    type: string;
    name?: string;
    config?: Record<string, unknown>;
}, unknown>;
export declare function useDisconnectIntegration(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export declare function useSyncIntegration(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export declare function useAnomalies(workspaceId: string | undefined, status?: string): {
    anomalies: Anomaly[];
    isLoading: boolean;
};
export declare function useResolveAnomaly(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    anomalyId: string;
    reason?: string;
}, unknown>;
export declare function useDismissAnomaly(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
//# sourceMappingURL=use-integrations.d.ts.map