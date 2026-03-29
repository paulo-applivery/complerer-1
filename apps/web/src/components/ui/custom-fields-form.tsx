import { useCustomFieldDefinitions, type CustomFieldDefinition } from '@/hooks/use-compliance'

interface CustomFieldsFormProps {
  workspaceId: string | undefined
  entityType: 'person' | 'system' | 'access_record'
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
}

export function CustomFieldsForm({ workspaceId, entityType, values, onChange }: CustomFieldsFormProps) {
  const { fields, isLoading } = useCustomFieldDefinitions(workspaceId, entityType)

  if (isLoading || fields.length === 0) return null

  const handleChange = (fieldId: string, value: string) => {
    onChange({ ...values, [fieldId]: value })
  }

  return (
    <>
      {fields.map((field) => (
        <div key={field.id}>
          <label className="mb-1 block text-xs text-zinc-400">
            {field.fieldLabel}
            {field.required && ' *'}
          </label>
          <FieldInput field={field} value={values[field.id] ?? ''} onChange={(v) => handleChange(field.id, v)} />
        </div>
      ))}
    </>
  )
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: CustomFieldDefinition
  value: string
  onChange: (value: string) => void
}) {
  const baseClass =
    'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-400 focus:outline-none'

  switch (field.fieldType) {
    case 'text':
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
          placeholder={field.fieldLabel}
        />
      )

    case 'number':
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
          placeholder="0"
        />
      )

    case 'date':
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        />
      )

    case 'select':
      return (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseClass} appearance-none`}
        >
          <option value="">Select...</option>
          {(field.fieldOptions ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )

    case 'boolean':
      return (
        <label className="flex items-center gap-2 py-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={value === 'true'}
            onChange={(e) => onChange(String(e.target.checked))}
            className="rounded border-zinc-600 bg-zinc-800 text-primary-400 focus:ring-primary-400"
          />
          {field.fieldLabel}
        </label>
      )

    default:
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        />
      )
  }
}
