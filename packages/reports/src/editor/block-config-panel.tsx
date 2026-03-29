import { useState, useEffect } from 'react'
import type { Editor } from '@tiptap/core'

export interface BlockConfigPanelProps {
  editor: Editor | null
}

interface SelectedBlock {
  type: string
  attrs: Record<string, any>
  pos: number
}

function getSelectedBlock(editor: Editor): SelectedBlock | null {
  const { selection } = editor.state
  const node = (selection as any).node || editor.state.doc.nodeAt(selection.from)
  if (!node) return null

  const customTypes = ['evidenceTable', 'findingCard', 'variablePlaceholder']
  if (!customTypes.includes(node.type.name)) return null

  return {
    type: node.type.name,
    attrs: { ...node.attrs },
    pos: selection.from,
  }
}

function updateBlockAttrs(editor: Editor, pos: number, attrs: Record<string, any>) {
  const { tr } = editor.state
  tr.setNodeMarkup(pos, undefined, attrs)
  editor.view.dispatch(tr)
}

// Shared field input helpers
const selectClass = 'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-100 focus:border-primary-400 focus:outline-none'
const inputClass = selectClass
const textareaClass = selectClass + ' resize-none'
const labelClass = 'mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500'

function SelectField({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <select value={value} onChange={(e) => onChange((e.target as HTMLSelectElement).value)} className={selectClass}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function TextField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input type="text" value={value} onChange={(e) => onChange((e.target as HTMLInputElement).value)} placeholder={placeholder} className={inputClass} />
    </div>
  )
}

function NumberField({ label, value, onChange, min, max }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(parseInt((e.target as HTMLInputElement).value) || 0)} min={min} max={max} className={inputClass} />
    </div>
  )
}

function TextareaField({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <textarea value={value} onChange={(e) => onChange((e.target as HTMLTextAreaElement).value)} rows={2} className={textareaClass} />
    </div>
  )
}

// ── Evidence Table Config ──────────────────────────────────────────────────

function EvidenceTableConfig({ attrs, onUpdate }: { attrs: Record<string, any>; onUpdate: (a: Record<string, any>) => void }) {
  const allColumns = ['name', 'type', 'status', 'date', 'source', 'controls']
  const columns = attrs.columns as string[]

  return (
    <div className="space-y-4">
      <SelectField label="Filter Status" value={attrs.filterStatus} onChange={(v) => onUpdate({ ...attrs, filterStatus: v })} options={[
        { value: 'all', label: 'All' }, { value: 'collected', label: 'Collected' }, { value: 'pending', label: 'Pending' }, { value: 'expired', label: 'Expired' }, { value: 'missing', label: 'Missing' },
      ]} />
      <NumberField label="Max Rows" value={attrs.maxRows} onChange={(v) => onUpdate({ ...attrs, maxRows: v })} min={1} max={500} />
      <div>
        <label className={labelClass}>Columns</label>
        <div className="space-y-1.5">
          {allColumns.map((col) => (
            <label key={col} className="flex items-center gap-2 text-xs text-zinc-300">
              <input type="checkbox" checked={columns.includes(col)} onChange={(e) => {
                const checked = (e.target as HTMLInputElement).checked
                const next = checked ? [...columns, col] : columns.filter((c) => c !== col)
                onUpdate({ ...attrs, columns: next })
              }} className="rounded border-zinc-600 bg-zinc-800 text-primary-400 focus:ring-primary-400/20" />
              {col.charAt(0).toUpperCase() + col.slice(1)}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Finding Card Config ────────────────────────────────────────────────────

function FindingCardConfig({ attrs, onUpdate }: { attrs: Record<string, any>; onUpdate: (a: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <SelectField label="Severity" value={attrs.severity} onChange={(v) => onUpdate({ ...attrs, severity: v })} options={[
        { value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }, { value: 'informational', label: 'Informational' },
      ]} />
      <TextField label="Title" value={attrs.title} onChange={(v) => onUpdate({ ...attrs, title: v })} />
      {(['condition', 'criteria', 'cause', 'effect', 'recommendation'] as const).map((field) => (
        <TextareaField key={field} label={field.charAt(0).toUpperCase() + field.slice(1)} value={attrs[field] || ''} onChange={(v) => onUpdate({ ...attrs, [field]: v })} />
      ))}
      <SelectField label="Mode" value={attrs.mode} onChange={(v) => onUpdate({ ...attrs, mode: v })} options={[
        { value: 'inline', label: 'Inline (data in block)' }, { value: 'linked', label: 'Linked (from findings table)' },
      ]} />
      {attrs.mode === 'linked' && (
        <TextField label="Finding ID" value={attrs.findingId || ''} onChange={(v) => onUpdate({ ...attrs, findingId: v })} placeholder="Enter finding ID" />
      )}
    </div>
  )
}

// ── Variable Placeholder Config ────────────────────────────────────────────

function VariablePlaceholderConfig({ attrs, onUpdate }: { attrs: Record<string, any>; onUpdate: (a: Record<string, any>) => void }) {
  const variables = [
    { key: 'org.name', label: 'Organization Name', type: 'text' },
    { key: 'org.address', label: 'Organization Address', type: 'text' },
    { key: 'audit.period_start', label: 'Audit Period Start', type: 'date' },
    { key: 'audit.period_end', label: 'Audit Period End', type: 'date' },
    { key: 'audit.scope', label: 'Audit Scope', type: 'text' },
    { key: 'audit.auditor', label: 'Auditor Name', type: 'text' },
    { key: 'audit.date', label: 'Audit Date', type: 'date' },
  ]

  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Variable</label>
        <select value={attrs.variableKey} onChange={(e) => {
          const val = (e.target as HTMLSelectElement).value
          const v = variables.find((v) => v.key === val)
          onUpdate({ ...attrs, variableKey: val, variableType: v?.type || 'text' })
        }} className={selectClass}>
          {variables.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
        </select>
      </div>
      <SelectField label="Display Mode" value={attrs.displayMode} onChange={(v) => onUpdate({ ...attrs, displayMode: v })} options={[
        { value: 'placeholder', label: 'Placeholder (shows variable name)' }, { value: 'resolved', label: 'Resolved (shows value)' },
      ]} />
    </div>
  )
}

// ── Main Panel ─────────────────────────────────────────────────────────────

const BLOCK_TITLES: Record<string, string> = {
  evidenceTable: 'Evidence Table',
  findingCard: 'Finding Card',
  variablePlaceholder: 'Variable',
}

export function BlockConfigPanel({ editor }: BlockConfigPanelProps) {
  const [block, setBlock] = useState<SelectedBlock | null>(null)

  useEffect(() => {
    if (!editor) return
    const update = () => setBlock(getSelectedBlock(editor))
    update()
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
    }
  }, [editor])

  if (!block) {
    return (
      <div className="w-64 shrink-0">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Properties</p>
        <p className="text-xs text-zinc-600">Select a data block to edit its properties.</p>
      </div>
    )
  }

  const handleUpdate = (newAttrs: Record<string, any>) => {
    if (!editor) return
    updateBlockAttrs(editor, block.pos, newAttrs)
    setBlock({ ...block, attrs: newAttrs })
  }

  return (
    <div className="w-64 shrink-0">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {BLOCK_TITLES[block.type] || 'Properties'}
      </p>
      {block.type === 'evidenceTable' && <EvidenceTableConfig attrs={block.attrs} onUpdate={handleUpdate} />}
      {block.type === 'findingCard' && <FindingCardConfig attrs={block.attrs} onUpdate={handleUpdate} />}
      {block.type === 'variablePlaceholder' && <VariablePlaceholderConfig attrs={block.attrs} onUpdate={handleUpdate} />}
    </div>
  )
}
