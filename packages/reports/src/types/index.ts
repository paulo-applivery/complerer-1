import { z } from 'zod'
import {
  reportTemplateSchema,
  reportSchema,
  reportVersionSchema,
  reportFindingSchema,
  reportApprovalSchema,
  reportExportSchema,
} from '../validators/index.js'

// ── Core Types ─────────────────────────────────────────────────────────────

export type ReportTemplate = z.infer<typeof reportTemplateSchema>
export type Report = z.infer<typeof reportSchema>
export type ReportVersion = z.infer<typeof reportVersionSchema>
export type ReportFinding = z.infer<typeof reportFindingSchema>
export type ReportApproval = z.infer<typeof reportApprovalSchema>
export type ReportExport = z.infer<typeof reportExportSchema>

// ── Enums ──────────────────────────────────────────────────────────────────

export const REPORT_STATUSES = ['draft', 'review', 'approved', 'published'] as const
export type ReportStatus = (typeof REPORT_STATUSES)[number]

export const FINDING_SEVERITIES = ['critical', 'high', 'medium', 'low', 'informational'] as const
export type FindingSeverity = (typeof FINDING_SEVERITIES)[number]

export const FINDING_STATUSES = ['open', 'acknowledged', 'remediation_planned', 'remediated', 'validated', 'closed', 'reopened'] as const
export type FindingStatus = (typeof FINDING_STATUSES)[number]

export const FINDING_TYPES = ['deficiency', 'significant_deficiency', 'material_weakness', 'major_nonconformity', 'minor_nonconformity', 'observation', 'opportunity'] as const
export type FindingType = (typeof FINDING_TYPES)[number]

export const APPROVAL_ACTIONS = ['submitted', 'approved', 'rejected', 'published'] as const
export type ApprovalAction = (typeof APPROVAL_ACTIONS)[number]

export const EXPORT_FORMATS = ['pdf'] as const
export type ExportFormat = (typeof EXPORT_FORMATS)[number]

// ── Variable Types ─────────────────────────────────────────────────────────

export const VARIABLE_TYPES = ['text', 'date', 'number', 'user', 'list', 'evidence_table', 'control_matrix'] as const
export type VariableType = (typeof VARIABLE_TYPES)[number]

export interface TemplateVariable {
  key: string
  type: VariableType
  label: string
  required: boolean
  dataSource?: {
    entity: string
    query: Record<string, string>
  }
}

export interface TemplateSection {
  id: string
  title: string
  required: boolean
  aiPrompt?: string
  variables?: string[]
}

// ── Phase 1 & 8: Editor Block Types ───────────────────────────────────────

export const BLOCK_TYPES = [
  'variablePlaceholder',
  'evidenceTable',
  'findingCard',
  'controlMatrix',
  'riskHeatmap',
  'chart',
  'timeline',
  'evidenceGallery',
  'policyReference',
] as const
export type BlockType = (typeof BLOCK_TYPES)[number]

export const CHART_TYPES = ['bar', 'pie', 'donut', 'radar', 'stacked_bar', 'line'] as const
export type ChartType = (typeof CHART_TYPES)[number]

// ── Phase 4: AI Drafting ──────────────────────────────────────────────────

export const AI_ACTIONS = ['draft_section', 'executive_summary', 'finding_narrative', 'gap_analysis', 'recommendation', 'evidence_sufficiency'] as const
export type AIAction = (typeof AI_ACTIONS)[number]

// ── Phase 9: Sharing & Comparison ─────────────────────────────────────────

export const SHARE_ROLES = ['viewer', 'commenter', 'editor'] as const
export type ShareRole = (typeof SHARE_ROLES)[number]

export interface ReportShare {
  reportId: string
  token: string
  role: ShareRole
  expiresAt: string | null
  createdBy: string
  createdAt: string
}
