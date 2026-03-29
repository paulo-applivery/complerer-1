import { useState } from 'react'
import type { Editor } from '@tiptap/core'

const VARIABLE_GROUPS = [
  {
    label: 'Organization',
    variables: [
      { key: 'org.name', label: 'Organization Name', type: 'text' as const },
      { key: 'org.address', label: 'Organization Address', type: 'text' as const },
    ],
  },
  {
    label: 'Audit',
    variables: [
      { key: 'audit.period_start', label: 'Audit Period Start', type: 'date' as const },
      { key: 'audit.period_end', label: 'Audit Period End', type: 'date' as const },
      { key: 'audit.scope', label: 'Audit Scope', type: 'text' as const },
      { key: 'audit.auditor', label: 'Auditor Name', type: 'text' as const },
      { key: 'audit.date', label: 'Audit Date', type: 'date' as const },
    ],
  },
  {
    label: 'Data Sources',
    variables: [
      { key: 'controls.summary', label: 'Control Testing Summary', type: 'control_matrix' as const },
      { key: 'evidence.list', label: 'Evidence Index', type: 'evidence_table' as const },
    ],
  },
]

export interface VariablePickerProps {
  editor: Editor | null
  onClose?: () => void
}

export function VariablePicker({ editor, onClose }: VariablePickerProps) {
  const [search, setSearch] = useState('')
  const q = search.toLowerCase()

  const filteredGroups = VARIABLE_GROUPS.map((group) => ({
    ...group,
    variables: group.variables.filter(
      (v) => v.label.toLowerCase().includes(q) || v.key.toLowerCase().includes(q)
    ),
  })).filter((g) => g.variables.length > 0)

  const insertVariable = (key: string, type: string) => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'variablePlaceholder',
        attrs: { variableKey: key, variableType: type, displayMode: 'placeholder' },
      })
      .run()
    onClose?.()
  }

  return (
    <div className="w-64 rounded-xl border border-zinc-800 bg-zinc-900 p-2 shadow-2xl">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
        placeholder="Search variables..."
        autoFocus
        className="mb-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-primary-400 focus:outline-none"
      />

      {filteredGroups.length === 0 ? (
        <p className="px-2 py-3 text-center text-xs text-zinc-500">No variables found</p>
      ) : (
        <div className="max-h-60 space-y-1 overflow-y-auto">
          {filteredGroups.map((group) => (
            <div key={group.label}>
              <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {group.label}
              </p>
              {group.variables.map((v) => (
                <button
                  key={v.key}
                  onClick={() => insertVariable(v.key, v.type)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-zinc-300 transition-colors hover:bg-zinc-800"
                >
                  <span>{v.label}</span>
                  <span className="rounded bg-zinc-800 px-1 py-px text-[9px] text-zinc-500">
                    {v.type}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
