// API-only entry point — no React/JSX dependencies
// Use this from apps/api to avoid JSX conflicts with Hono

// Types
export type {
  ReportTemplate,
  Report,
  ReportVersion,
  ReportFinding,
  ReportApproval,
  ReportExport,
  ReportStatus,
  FindingSeverity,
  FindingStatus,
  FindingType,
  ApprovalAction,
  ExportFormat,
  VariableType,
  TemplateVariable,
  TemplateSection,
  BlockType,
  ChartType,
  AIAction,
  ShareRole,
  ReportShare,
} from './types/index.js'

export {
  REPORT_STATUSES,
  FINDING_SEVERITIES,
  FINDING_STATUSES,
  FINDING_TYPES,
  APPROVAL_ACTIONS,
  EXPORT_FORMATS,
  VARIABLE_TYPES,
  BLOCK_TYPES,
  CHART_TYPES,
  AI_ACTIONS,
  SHARE_ROLES,
} from './types/index.js'

// Validators
export {
  reportTemplateSchema,
  createTemplateSchema,
  updateTemplateSchema,
  reportSchema,
  createReportSchema,
  updateReportSchema,
  reportVersionSchema,
  reportFindingSchema,
  createFindingSchema,
  updateFindingSchema,
  reportApprovalSchema,
  reportExportSchema,
} from './validators/index.js'

// API
export { createReportsAPI } from './api/index.js'
