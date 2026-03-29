interface CustomFieldsFormProps {
    workspaceId: string | undefined;
    entityType: 'person' | 'system' | 'access_record';
    values: Record<string, string>;
    onChange: (values: Record<string, string>) => void;
}
export declare function CustomFieldsForm({ workspaceId, entityType, values, onChange }: CustomFieldsFormProps): import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=custom-fields-form.d.ts.map