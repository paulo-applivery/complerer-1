import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useCustomFieldDefinitions } from '@/hooks/use-compliance';
export function CustomFieldsForm({ workspaceId, entityType, values, onChange }) {
    const { fields, isLoading } = useCustomFieldDefinitions(workspaceId, entityType);
    if (isLoading || fields.length === 0)
        return null;
    const handleChange = (fieldId, value) => {
        onChange({ ...values, [fieldId]: value });
    };
    return (_jsx(_Fragment, { children: fields.map((field) => (_jsxs("div", { children: [_jsxs("label", { className: "mb-1 block text-xs text-zinc-400", children: [field.fieldLabel, field.required && ' *'] }), _jsx(FieldInput, { field: field, value: values[field.id] ?? '', onChange: (v) => handleChange(field.id, v) })] }, field.id))) }));
}
function FieldInput({ field, value, onChange, }) {
    const baseClass = 'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none';
    switch (field.fieldType) {
        case 'text':
            return (_jsx("input", { type: "text", value: value, onChange: (e) => onChange(e.target.value), className: baseClass, placeholder: field.fieldLabel }));
        case 'number':
            return (_jsx("input", { type: "number", value: value, onChange: (e) => onChange(e.target.value), className: baseClass, placeholder: "0" }));
        case 'date':
            return (_jsx("input", { type: "date", value: value, onChange: (e) => onChange(e.target.value), className: baseClass }));
        case 'select':
            return (_jsxs("select", { value: value, onChange: (e) => onChange(e.target.value), className: `${baseClass} appearance-none`, children: [_jsx("option", { value: "", children: "Select..." }), (field.fieldOptions ?? []).map((opt) => (_jsx("option", { value: opt, children: opt }, opt)))] }));
        case 'boolean':
            return (_jsxs("label", { className: "flex items-center gap-2 py-2 text-sm text-zinc-300", children: [_jsx("input", { type: "checkbox", checked: value === 'true', onChange: (e) => onChange(String(e.target.checked)), className: "rounded border-zinc-600 bg-zinc-800 text-primary-400 focus:ring-primary-400" }), field.fieldLabel] }));
        default:
            return (_jsx("input", { type: "text", value: value, onChange: (e) => onChange(e.target.value), className: baseClass }));
    }
}
//# sourceMappingURL=custom-fields-form.js.map