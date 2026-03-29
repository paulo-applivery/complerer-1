export type AccessStatus = 'requested' | 'approved' | 'active' | 'pending_review' | 'suspended' | 'expired' | 'revoked';
interface System {
    id: string;
    name: string;
    classification: 'critical' | 'standard' | 'low';
    sensitivity: string | null;
    environment: string | null;
    mfaRequired: boolean;
    owner: string | null;
    createdAt: string;
}
interface DirectoryUser {
    id: string;
    name: string;
    email: string;
    department: string | null;
    title: string | null;
    status: 'active' | 'inactive' | 'terminated' | 'on_leave';
    employmentStatus: 'active' | 'inactive' | 'terminated' | 'on_leave';
    createdAt: string;
}
export interface AccessRecord {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    systemId: string;
    systemName: string;
    role: string;
    accessType: string | null;
    grantedAt: string;
    approvedBy: string | null;
    ticketRef: string | null;
    riskScore: number;
    status: AccessStatus;
    lastReviewedAt: string | null;
    revokedAt: string | null;
    updatedAt: string | null;
    updatedBy: string | null;
    licenseType: string | null;
    costPerPeriod: number | null;
    costCurrency: string | null;
    costFrequency: string | null;
}
export interface CustomFieldDefinition {
    id: string;
    workspaceId: string;
    entityType: 'person' | 'system' | 'access_record';
    fieldName: string;
    fieldLabel: string;
    fieldType: 'text' | 'number' | 'select' | 'date' | 'boolean';
    fieldOptions: string[] | null;
    displayOrder: number;
    required: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface CustomFieldValue {
    fieldId: string;
    fieldName: string;
    fieldLabel: string;
    fieldType: string;
    value: string | null;
}
interface Evidence {
    id: string;
    title: string;
    description: string | null;
    source: string | null;
    fileName: string | null;
    capturedAt: string;
    expiresAt: string | null;
    linksCount: number;
    createdAt: string;
    updatedAt: string | null;
    updatedBy: string | null;
    updatedByName: string | null;
    uploadedByName: string | null;
}
interface EvidenceLink {
    id: string;
    evidenceId: string;
    controlId: string;
    controlTitle: string;
    controlCode: string;
    frameworkName: string;
    linkType: string;
    confidence: number | null;
    createdAt: string;
}
interface ComplianceEvent {
    id: string;
    type: string;
    description: string;
    entityType: string;
    entityId: string;
    createdAt: string;
    createdBy: string;
}
export declare function useSystemsList(workspaceId: string | undefined): {
    systems: System[];
    isLoading: boolean;
};
interface LibrarySystem {
    id: string;
    name: string;
    category: string;
    description: string | null;
    vendor: string | null;
    website: string | null;
    default_classification: string;
    default_sensitivity: string;
    icon_hint: string | null;
}
export declare function useSystemLibrary(workspaceId: string | undefined): {
    library: LibrarySystem[];
    isLoading: boolean;
};
export declare function useAddFromLibrary(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    libraryIds: string[];
    environment?: string;
}, unknown>;
export declare function useEmployeeLibrary(workspaceId: string | undefined): {
    library: any[];
    isLoading: boolean;
};
export declare function useAddFromEmployeeLibrary(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    libraryIds: string[];
}, unknown>;
export declare function useCreateSystem(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    name: string;
    classification: string;
    sensitivity?: string;
    environment?: string;
    mfaRequired?: boolean;
    owner?: string;
}, unknown>;
export declare function useUpdateSystem(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    systemId: string;
    name?: string;
    classification?: string;
    sensitivity?: string;
    environment?: string;
    mfaRequired?: boolean;
    owner?: string;
    description?: string;
}, unknown>;
interface UseDirectoryUsersOptions {
    status?: string;
    search?: string;
}
export declare function useDirectoryUsers(workspaceId: string | undefined, options?: UseDirectoryUsersOptions): {
    users: DirectoryUser[];
    isLoading: boolean;
};
export declare function useCreateDirectoryUser(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    name: string;
    email: string;
    department?: string;
    title?: string;
}, unknown>;
export declare function useUpdateDirectoryUser(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    userId: string;
    name?: string;
    email?: string;
    department?: string;
    title?: string;
    employmentStatus?: string;
}, unknown>;
export declare function useDeleteDirectoryUser(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export declare function useBulkImportDirectory(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    users: Array<{
        name: string;
        email: string;
        department?: string;
        title?: string;
        employmentStatus?: string;
        customFields?: Record<string, string>;
    }>;
}, unknown>;
interface UseAccessRecordsOptions {
    status?: string;
    systemId?: string;
    userId?: string;
    page?: number;
    limit?: number;
}
export declare function useAccessRecords(workspaceId: string | undefined, options?: UseAccessRecordsOptions): {
    records: AccessRecord[];
    total: number;
    isLoading: boolean;
};
export declare function useCreateAccess(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    userId: string;
    systemId: string;
    role: string;
    approvedBy?: string;
    ticketRef?: string;
    status?: AccessStatus;
    licenseType?: string;
    costPerPeriod?: number;
    costCurrency?: string;
    costFrequency?: string;
    customFields?: Record<string, string>;
}, unknown>;
export declare function useUpdateAccessRecord(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    recordId: string;
    data: {
        role?: string;
        accessType?: string;
        approvedBy?: string | null;
        ticketRef?: string;
        status?: string;
        licenseType?: string | null;
        costPerPeriod?: number | null;
        costCurrency?: string;
        costFrequency?: string | null;
        customFields?: Record<string, string | null>;
    };
}, unknown>;
export declare function useTransitionAccess(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    recordId: string;
    action: "approve" | "activate" | "suspend" | "request_review" | "expire" | "revoke";
    reason?: string;
}, unknown>;
export declare function useRevokeAccess(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export declare function useReviewAccess(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export declare function useCustomFieldDefinitions(workspaceId: string | undefined, entityType?: string): {
    fields: CustomFieldDefinition[];
    isLoading: boolean;
};
export declare function useCreateCustomField(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    entityType: "person" | "system" | "access_record";
    fieldName: string;
    fieldLabel: string;
    fieldType: "text" | "number" | "select" | "date" | "boolean";
    fieldOptions?: string[];
    displayOrder?: number;
    required?: boolean;
}, unknown>;
export declare function useUpdateCustomField(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    fieldId: string;
    data: {
        fieldLabel?: string;
        fieldOptions?: string[];
        displayOrder?: number;
        required?: boolean;
    };
}, unknown>;
export declare function useDeleteCustomField(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export declare function useCustomFieldValues(workspaceId: string | undefined, entityType: string, entityId: string | undefined): {
    values: CustomFieldValue[];
    isLoading: boolean;
};
export declare function useSaveCustomFieldValues(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    entityType: string;
    entityId: string;
    values: Record<string, string | null>;
}, unknown>;
interface Setting {
    key: string;
    value: string;
    updatedBy: string | null;
    updatedAt: string;
}
export declare function useWorkspaceSettings(workspaceId: string | undefined): {
    settings: Setting[];
    isLoading: boolean;
};
export declare function useWorkspaceSetting(workspaceId: string | undefined, key: string): {
    value: string | null;
    isLoading: boolean;
};
export declare function useUpdateWorkspaceSetting(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    key: string;
    value: string;
}, unknown>;
interface UseEvidenceOptions {
    page?: number;
    limit?: number;
}
export declare function useEvidence(workspaceId: string | undefined, options?: UseEvidenceOptions): {
    evidence: Evidence[];
    total: number;
    isLoading: boolean;
};
export declare function useCreateEvidence(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    title: string;
    description?: string;
    source?: string;
    fileName?: string;
    expiresAt?: string;
}, unknown>;
export declare function useLinkEvidence(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    evidenceId: string;
    controlId: string;
    frameworkVersionId: string;
}, unknown>;
export declare function useEvidenceLinks(workspaceId: string | undefined, evidenceId: string | undefined): {
    links: EvidenceLink[];
    isLoading: boolean;
};
export declare function useUnlinkEvidence(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    evidenceId: string;
    linkId: string;
}, unknown>;
export declare function useUpdateEvidence(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    evidenceId: string;
    data: {
        title?: string;
        description?: string;
        source?: string;
        expiresAt?: string | null;
        fileName?: string;
        fileSize?: number;
        mimeType?: string;
    };
}, unknown>;
export declare function useBaselineControls(workspaceId: string | undefined, baselineId: string | undefined): {
    controls: any[];
    isLoading: boolean;
};
export declare function useLinkBaselineControl(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    baselineId: string;
    controlId: string;
}, unknown>;
export declare function useUnlinkBaselineControl(workspaceId: string | undefined): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    baselineId: string;
    linkId: string;
}, unknown>;
interface UseComplianceEventsOptions {
    page?: number;
    limit?: number;
    type?: string;
}
export declare function useComplianceEvents(workspaceId: string | undefined, options?: UseComplianceEventsOptions): {
    events: ComplianceEvent[];
    total: number;
    isLoading: boolean;
};
export {};
//# sourceMappingURL=use-compliance.d.ts.map