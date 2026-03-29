import { z } from 'zod'

// ── Report Template ────────────────────────────────────────────────────────

export const reportTemplateSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  frameworkId: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  content: z.string(),
  variables: z.string(),
  sections: z.string(),
  isDefault: z.boolean(),
  isLibrary: z.boolean(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  frameworkId: z.string().optional(),
  content: z.string().optional(),
  variables: z.array(z.object({
    key: z.string(),
    type: z.enum(['text', 'date', 'number', 'user', 'list', 'evidence_table', 'control_matrix']),
    label: z.string(),
    required: z.boolean(),
  })).optional(),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    required: z.boolean(),
    aiPrompt: z.string().optional(),
    variables: z.array(z.string()).optional(),
  })).optional(),
})

export const updateTemplateSchema = createTemplateSchema.partial()

// ── Report ─────────────────────────────────────────────────────────────────

export const reportSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  templateId: z.string(),
  projectId: z.string().nullable(),
  name: z.string(),
  status: z.enum(['draft', 'review', 'approved', 'published']),
  content: z.string(),
  resolvedVariables: z.string(),
  auditPeriodStart: z.string().nullable(),
  auditPeriodEnd: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lockedAt: z.string().nullable(),
  lockedBy: z.string().nullable(),
})

export const createReportSchema = z.object({
  templateId: z.string(),
  projectId: z.string().optional(),
  name: z.string().min(1).max(200),
  auditPeriodStart: z.string().optional(),
  auditPeriodEnd: z.string().optional(),
})

export const updateReportSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
})

// ── Report Version ─────────────────────────────────────────────────────────

export const reportVersionSchema = z.object({
  id: z.string(),
  reportId: z.string(),
  version: z.number(),
  content: z.string(),
  changedBy: z.string(),
  changedAt: z.string(),
  changeType: z.string(),
  changeDescription: z.string().nullable(),
})

// ── Report Finding ─────────────────────────────────────────────────────────

export const reportFindingSchema = z.object({
  id: z.string(),
  reportId: z.string(),
  workspaceId: z.string(),
  controlId: z.string().nullable(),
  sectionId: z.string().nullable(),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'informational']),
  findingType: z.string(),
  title: z.string(),
  condition: z.string().nullable(),
  criteria: z.string().nullable(),
  cause: z.string().nullable(),
  effect: z.string().nullable(),
  recommendation: z.string().nullable(),
  managementResponse: z.string().nullable(),
  managementResponseBy: z.string().nullable(),
  managementResponseAt: z.string().nullable(),
  remediationDueDate: z.string().nullable(),
  remediationOwner: z.string().nullable(),
  status: z.enum(['open', 'acknowledged', 'remediation_planned', 'remediated', 'validated', 'closed', 'reopened']),
  isRepeat: z.boolean(),
  priorFindingId: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const createFindingSchema = z.object({
  controlId: z.string().optional(),
  sectionId: z.string().optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'informational']),
  findingType: z.string(),
  title: z.string().min(1).max(500),
  condition: z.string().optional(),
  criteria: z.string().optional(),
  cause: z.string().optional(),
  effect: z.string().optional(),
  recommendation: z.string().optional(),
})

export const updateFindingSchema = createFindingSchema.partial()

// ── Report Approval ────────────────────────────────────────────────────────

export const reportApprovalSchema = z.object({
  id: z.string(),
  reportId: z.string(),
  version: z.number(),
  role: z.string(),
  userId: z.string(),
  action: z.enum(['submitted', 'approved', 'rejected', 'published']),
  comment: z.string().nullable(),
  signedAt: z.string(),
})

// ── Report Export ──────────────────────────────────────────────────────────

export const reportExportSchema = z.object({
  id: z.string(),
  reportId: z.string(),
  version: z.number(),
  format: z.enum(['pdf']),
  r2Key: z.string(),
  fileSize: z.number().nullable(),
  generatedAt: z.string(),
  generatedBy: z.string(),
  contentHash: z.string().nullable(),
})
