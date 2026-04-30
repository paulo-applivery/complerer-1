import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { AppType } from '../types.js'
import { generateId } from '../lib/id.js'
import { authMiddleware } from '../middleware/auth.js'
import { workspaceMiddleware, requireRole } from '../middleware/workspace.js'

/**
 * ENS audit-instance routes.
 *
 * An ENS audit cycle hangs off a compliance project and accumulates
 * CITAD valuations, per-control results, per-aspect checks, findings
 * and corrective-action packages (PAC). Mounted under
 * /api/workspaces/:workspaceId/ens.
 */
const ensRoutes = new Hono<AppType>()

ensRoutes.use('*', authMiddleware)
ensRoutes.use('*', workspaceMiddleware)

const SEVERITY_VALUES = [
  'NO_CONFORMIDAD_MAYOR',
  'NO_CONFORMIDAD_MENOR',
  'OBSERVACION',
  'PUNTO_DE_MEJORA',
] as const

const VERDICTS = [
  'FAVORABLE',
  'FAVORABLE_CON_NO_CONFORMIDADES',
  'DESFAVORABLE',
] as const

const CITAD_LEVEL = ['BAJO', 'MEDIO', 'ALTO'] as const
const CATEGORY = ['BASICA', 'MEDIA', 'ALTA'] as const

function deriveCategory(values: Array<string | null | undefined>): string {
  const order: Record<string, number> = { BAJO: 0, MEDIO: 1, ALTO: 2 }
  let max = -1
  for (const v of values) {
    if (v && v in order && order[v] > max) max = order[v]
  }
  if (max < 0) return 'BASICA'
  return ['BASICA', 'MEDIA', 'ALTA'][max]
}

function requiredMaturityFor(category: string): string {
  if (category === 'ALTA') return 'L4'
  if (category === 'MEDIA') return 'L3'
  return 'L2'
}

// ── Audits ──────────────────────────────────────────────────

const createAuditSchema = z.object({
  projectId: z.string().min(1),
  cycleLabel: z.string().min(1),
  auditType: z.enum(['inicial', 'renovacion', 'seguimiento', 'interna']).default('inicial'),
  scopeDescription: z.string().optional(),
  systemCategory: z.enum(CATEGORY).default('BASICA'),
  isAapp: z.boolean().default(false),
  auditorName: z.string().optional(),
  auditorFirm: z.string().optional(),
  auditorQualification: z.string().optional(),
  auditorIndependenceConfirmed: z.boolean().default(false),
})

ensRoutes.post(
  '/ens/audits',
  requireRole('admin'),
  zValidator('json', createAuditSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()

    const project = await c.env.DB.prepare(
      'SELECT id, framework_version_id FROM compliance_projects WHERE id = ? AND workspace_id = ?'
    )
      .bind(body.projectId, workspaceId)
      .first<{ id: string; framework_version_id: string }>()

    if (!project) return c.json({ error: 'Project not found' }, 404)

    const id = generateId()
    await c.env.DB.prepare(
      `INSERT INTO ens_audits (
         id, workspace_id, project_id, framework_version_id, cycle_label, audit_type,
         scope_description, system_category, is_aapp, auditor_name, auditor_firm,
         auditor_qualification, auditor_independence_confirmed, status, created_by, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'planning', ?, ?, ?)`
    )
      .bind(
        id, workspaceId, body.projectId, project.framework_version_id, body.cycleLabel,
        body.auditType, body.scopeDescription ?? null, body.systemCategory,
        body.isAapp ? 1 : 0, body.auditorName ?? null, body.auditorFirm ?? null,
        body.auditorQualification ?? null, body.auditorIndependenceConfirmed ? 1 : 0,
        userId, now, now
      )
      .run()

    return c.json({ audit: { id, status: 'planning', createdAt: now } }, 201)
  }
)

ensRoutes.get('/ens/audits', async (c) => {
  const workspaceId = c.get('workspaceId')
  const projectId = c.req.query('projectId')

  let sql = `SELECT id, project_id, framework_version_id, cycle_label, audit_type,
                    scope_description, system_category, is_aapp, status, overall_verdict,
                    pac_required, fieldwork_started_at, fieldwork_finished_at,
                    report_issued_at, created_at, updated_at
             FROM ens_audits
             WHERE workspace_id = ?`
  const bindings: unknown[] = [workspaceId]

  if (projectId) {
    sql += ' AND project_id = ?'
    bindings.push(projectId)
  }

  sql += ' ORDER BY created_at DESC'

  const { results } = await c.env.DB.prepare(sql).bind(...bindings).all()
  return c.json({ audits: results })
})

ensRoutes.get('/ens/audits/:auditId', async (c) => {
  const workspaceId = c.get('workspaceId')
  const auditId = c.req.param('auditId')

  const audit = await c.env.DB.prepare(
    'SELECT * FROM ens_audits WHERE id = ? AND workspace_id = ?'
  )
    .bind(auditId, workspaceId)
    .first()

  if (!audit) return c.json({ error: 'Audit not found' }, 404)
  return c.json({ audit })
})

const updateAuditSchema = z.object({
  cycleLabel: z.string().optional(),
  auditType: z.enum(['inicial', 'renovacion', 'seguimiento', 'interna']).optional(),
  scopeDescription: z.string().optional(),
  systemCategory: z.enum(CATEGORY).optional(),
  isAapp: z.boolean().optional(),
  auditorName: z.string().optional(),
  auditorFirm: z.string().optional(),
  auditorQualification: z.string().optional(),
  auditorIndependenceConfirmed: z.boolean().optional(),
  fieldworkStartedAt: z.string().optional(),
  fieldworkFinishedAt: z.string().optional(),
  reportIssuedAt: z.string().optional(),
  status: z.enum(['planning', 'fieldwork', 'drafting', 'reported', 'closed']).optional(),
  overallVerdict: z.enum(VERDICTS).nullable().optional(),
  verdictReasoning: z.string().optional(),
})

ensRoutes.patch(
  '/ens/audits/:auditId',
  requireRole('admin'),
  zValidator('json', updateAuditSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const auditId = c.req.param('auditId')
    const body = c.req.valid('json')

    const audit = await c.env.DB.prepare(
      'SELECT id FROM ens_audits WHERE id = ? AND workspace_id = ?'
    )
      .bind(auditId, workspaceId)
      .first()
    if (!audit) return c.json({ error: 'Audit not found' }, 404)

    const sets: string[] = []
    const bindings: unknown[] = []
    const map: Array<[keyof typeof body, string, (v: any) => unknown]> = [
      ['cycleLabel', 'cycle_label', (v) => v],
      ['auditType', 'audit_type', (v) => v],
      ['scopeDescription', 'scope_description', (v) => v],
      ['systemCategory', 'system_category', (v) => v],
      ['isAapp', 'is_aapp', (v) => (v ? 1 : 0)],
      ['auditorName', 'auditor_name', (v) => v],
      ['auditorFirm', 'auditor_firm', (v) => v],
      ['auditorQualification', 'auditor_qualification', (v) => v],
      ['auditorIndependenceConfirmed', 'auditor_independence_confirmed', (v) => (v ? 1 : 0)],
      ['fieldworkStartedAt', 'fieldwork_started_at', (v) => v],
      ['fieldworkFinishedAt', 'fieldwork_finished_at', (v) => v],
      ['reportIssuedAt', 'report_issued_at', (v) => v],
      ['status', 'status', (v) => v],
      ['overallVerdict', 'overall_verdict', (v) => v],
      ['verdictReasoning', 'verdict_reasoning', (v) => v],
    ]
    for (const [key, col, conv] of map) {
      if (body[key] !== undefined) {
        sets.push(`${col} = ?`)
        bindings.push(conv(body[key]))
      }
    }
    if (sets.length === 0) return c.json({ error: 'No fields to update' }, 400)

    sets.push("updated_at = ?")
    bindings.push(new Date().toISOString())
    bindings.push(auditId)

    await c.env.DB.prepare(`UPDATE ens_audits SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...bindings)
      .run()

    return c.json({ success: true })
  }
)

ensRoutes.delete('/ens/audits/:auditId', requireRole('admin'), async (c) => {
  const workspaceId = c.get('workspaceId')
  const auditId = c.req.param('auditId')
  const audit = await c.env.DB.prepare(
    'SELECT id FROM ens_audits WHERE id = ? AND workspace_id = ?'
  )
    .bind(auditId, workspaceId)
    .first()
  if (!audit) return c.json({ error: 'Audit not found' }, 404)

  await c.env.DB.prepare('DELETE FROM ens_audits WHERE id = ?').bind(auditId).run()
  return c.json({ success: true })
})

// ── CITAD valuations ────────────────────────────────────────

const citadSchema = z.object({
  serviceName: z.string().min(1),
  serviceKind: z.enum(['service', 'information']),
  cValue: z.enum(CITAD_LEVEL).nullable().optional(),
  iValue: z.enum(CITAD_LEVEL).nullable().optional(),
  tValue: z.enum(CITAD_LEVEL).nullable().optional(),
  aValue: z.enum(CITAD_LEVEL).nullable().optional(),
  dValue: z.enum(CITAD_LEVEL).nullable().optional(),
  justification: z.string().optional(),
  valuedBy: z.string().optional(),
})

async function recalcSystemCategory(db: D1Database, auditId: string) {
  const { results } = await db
    .prepare(
      `SELECT c_value, i_value, t_value, a_value, d_value FROM ens_citad_valuations WHERE audit_id = ?`
    )
    .bind(auditId)
    .all<{
      c_value: string | null
      i_value: string | null
      t_value: string | null
      a_value: string | null
      d_value: string | null
    }>()
  const all: Array<string | null> = []
  for (const row of results) {
    all.push(row.c_value, row.i_value, row.t_value, row.a_value, row.d_value)
  }
  const category = deriveCategory(all)
  await db
    .prepare('UPDATE ens_audits SET system_category = ?, updated_at = ? WHERE id = ?')
    .bind(category, new Date().toISOString(), auditId)
    .run()
  return category
}

ensRoutes.post(
  '/ens/audits/:auditId/citad',
  requireRole('admin'),
  zValidator('json', citadSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const auditId = c.req.param('auditId')
    const body = c.req.valid('json')

    const audit = await c.env.DB.prepare(
      'SELECT id FROM ens_audits WHERE id = ? AND workspace_id = ?'
    )
      .bind(auditId, workspaceId)
      .first()
    if (!audit) return c.json({ error: 'Audit not found' }, 404)

    const id = generateId()
    const now = new Date().toISOString()
    const derived = deriveCategory([body.cValue, body.iValue, body.tValue, body.aValue, body.dValue])

    await c.env.DB.prepare(
      `INSERT INTO ens_citad_valuations (
         id, audit_id, service_name, service_kind, c_value, i_value, t_value, a_value, d_value,
         derived_category, justification, valued_by, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id, auditId, body.serviceName, body.serviceKind,
        body.cValue ?? null, body.iValue ?? null, body.tValue ?? null,
        body.aValue ?? null, body.dValue ?? null,
        derived, body.justification ?? null, body.valuedBy ?? null, now, now
      )
      .run()

    const newCategory = await recalcSystemCategory(c.env.DB, auditId)
    return c.json({ valuation: { id, derivedCategory: derived }, systemCategory: newCategory }, 201)
  }
)

ensRoutes.get('/ens/audits/:auditId/citad', async (c) => {
  const workspaceId = c.get('workspaceId')
  const auditId = c.req.param('auditId')

  const audit = await c.env.DB.prepare(
    'SELECT id FROM ens_audits WHERE id = ? AND workspace_id = ?'
  )
    .bind(auditId, workspaceId)
    .first()
  if (!audit) return c.json({ error: 'Audit not found' }, 404)

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM ens_citad_valuations WHERE audit_id = ? ORDER BY created_at ASC'
  )
    .bind(auditId)
    .all()

  return c.json({ valuations: results })
})

ensRoutes.delete(
  '/ens/audits/:auditId/citad/:valuationId',
  requireRole('admin'),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const auditId = c.req.param('auditId')
    const valuationId = c.req.param('valuationId')

    const audit = await c.env.DB.prepare(
      'SELECT id FROM ens_audits WHERE id = ? AND workspace_id = ?'
    )
      .bind(auditId, workspaceId)
      .first()
    if (!audit) return c.json({ error: 'Audit not found' }, 404)

    await c.env.DB.prepare(
      'DELETE FROM ens_citad_valuations WHERE id = ? AND audit_id = ?'
    )
      .bind(valuationId, auditId)
      .run()

    const newCategory = await recalcSystemCategory(c.env.DB, auditId)
    return c.json({ success: true, systemCategory: newCategory })
  }
)

// ── Audit results (per control) ─────────────────────────────

const upsertResultSchema = z.object({
  controlId: z.string().min(1),
  applies: z.boolean().default(true),
  appliesJustification: z.string().optional(),
  audited: z.boolean().default(false),
  maturityLevel: z.enum(['L0', 'L1', 'L2', 'L3', 'L4', 'L5']).nullable().optional(),
  implementationNotes: z.string().optional(),
  evidenceRefs: z.array(z.string()).optional(),
  selectedReinforcements: z.array(z.string()).optional(),
})

ensRoutes.put(
  '/ens/audits/:auditId/results',
  requireRole('admin'),
  zValidator('json', upsertResultSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const auditId = c.req.param('auditId')
    const body = c.req.valid('json')

    const audit = await c.env.DB.prepare(
      'SELECT id, system_category FROM ens_audits WHERE id = ? AND workspace_id = ?'
    )
      .bind(auditId, workspaceId)
      .first<{ id: string; system_category: string }>()
    if (!audit) return c.json({ error: 'Audit not found' }, 404)

    if (!body.applies && !body.appliesJustification) {
      return c.json(
        { error: 'appliesJustification is required when applies=false (SoA exclusion needs justification)' },
        400
      )
    }

    const ctrl = await c.env.DB.prepare(
      'SELECT id FROM versioned_controls WHERE id = ?'
    )
      .bind(body.controlId)
      .first<{ id: string }>()
    if (!ctrl) return c.json({ error: 'Control not found' }, 404)

    const existing = await c.env.DB.prepare(
      'SELECT id FROM ens_audit_results WHERE audit_id = ? AND control_id = ?'
    )
      .bind(auditId, body.controlId)
      .first<{ id: string }>()

    const now = new Date().toISOString()
    const required = requiredMaturityFor(audit.system_category)
    const evidenceRefsJson = JSON.stringify(body.evidenceRefs ?? [])
    const reinfJson = JSON.stringify(body.selectedReinforcements ?? [])

    if (existing) {
      await c.env.DB.prepare(
        `UPDATE ens_audit_results SET
           applies = ?, applies_justification = ?, audited = ?,
           maturity_level = ?, required_maturity = ?,
           implementation_notes = ?, evidence_refs_json = ?,
           selected_reinforcements_json = ?, updated_at = ?
         WHERE id = ?`
      )
        .bind(
          body.applies ? 1 : 0,
          body.appliesJustification ?? null,
          body.audited ? 1 : 0,
          body.maturityLevel ?? null,
          required,
          body.implementationNotes ?? null,
          evidenceRefsJson,
          reinfJson,
          now,
          existing.id
        )
        .run()
      return c.json({ result: { id: existing.id, updated: true } })
    }

    const id = generateId()
    await c.env.DB.prepare(
      `INSERT INTO ens_audit_results (
         id, audit_id, control_id, applies, applies_justification, audited,
         maturity_level, required_maturity, implementation_notes,
         evidence_refs_json, selected_reinforcements_json, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id, auditId, body.controlId,
        body.applies ? 1 : 0,
        body.appliesJustification ?? null,
        body.audited ? 1 : 0,
        body.maturityLevel ?? null,
        required,
        body.implementationNotes ?? null,
        evidenceRefsJson,
        reinfJson,
        now, now
      )
      .run()
    return c.json({ result: { id, created: true } }, 201)
  }
)

ensRoutes.get('/ens/audits/:auditId/results', async (c) => {
  const workspaceId = c.get('workspaceId')
  const auditId = c.req.param('auditId')

  const audit = await c.env.DB.prepare(
    'SELECT id FROM ens_audits WHERE id = ? AND workspace_id = ?'
  )
    .bind(auditId, workspaceId)
    .first()
  if (!audit) return c.json({ error: 'Audit not found' }, 404)

  const { results } = await c.env.DB.prepare(
    `SELECT ar.*, vc.control_id as code, vc.title, vc.control_type, vc.control_group
     FROM ens_audit_results ar
     JOIN versioned_controls vc ON vc.id = ar.control_id
     WHERE ar.audit_id = ?
     ORDER BY vc.control_group ASC, vc.control_id ASC`
  )
    .bind(auditId)
    .all()

  return c.json({ results })
})

// ── Aspect results ──────────────────────────────────────────

const aspectResultsSchema = z.object({
  aspects: z.array(
    z.object({
      aspectId: z.string().min(1),
      checked: z.boolean(),
      evidenceNote: z.string().optional(),
    })
  ),
})

ensRoutes.put(
  '/ens/audits/:auditId/results/:resultId/aspects',
  requireRole('admin'),
  zValidator('json', aspectResultsSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const auditId = c.req.param('auditId')
    const resultId = c.req.param('resultId')
    const body = c.req.valid('json')

    const result = await c.env.DB.prepare(
      `SELECT ar.id FROM ens_audit_results ar
       JOIN ens_audits a ON a.id = ar.audit_id
       WHERE ar.id = ? AND ar.audit_id = ? AND a.workspace_id = ?`
    )
      .bind(resultId, auditId, workspaceId)
      .first()
    if (!result) return c.json({ error: 'Audit result not found' }, 404)

    const now = new Date().toISOString()
    const stmts = body.aspects.map((aspect) =>
      c.env.DB.prepare(
        `INSERT INTO ens_aspect_results (id, audit_result_id, aspect_id, checked, evidence_note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(audit_result_id, aspect_id) DO UPDATE SET
           checked = excluded.checked,
           evidence_note = excluded.evidence_note,
           updated_at = excluded.updated_at`
      ).bind(
        generateId(), resultId, aspect.aspectId,
        aspect.checked ? 1 : 0, aspect.evidenceNote ?? null, now, now
      )
    )
    if (stmts.length > 0) await c.env.DB.batch(stmts)

    return c.json({ success: true, count: stmts.length })
  }
)

ensRoutes.get('/ens/audits/:auditId/results/:resultId/aspects', async (c) => {
  const workspaceId = c.get('workspaceId')
  const auditId = c.req.param('auditId')
  const resultId = c.req.param('resultId')

  const result = await c.env.DB.prepare(
    `SELECT ar.id FROM ens_audit_results ar
     JOIN ens_audits a ON a.id = ar.audit_id
     WHERE ar.id = ? AND ar.audit_id = ? AND a.workspace_id = ?`
  )
    .bind(resultId, auditId, workspaceId)
    .first()
  if (!result) return c.json({ error: 'Audit result not found' }, 404)

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM ens_aspect_results WHERE audit_result_id = ? ORDER BY aspect_id ASC'
  )
    .bind(resultId)
    .all()

  return c.json({ aspects: results })
})

// ── Findings ────────────────────────────────────────────────

const findingSchema = z.object({
  controlId: z.string().nullable().optional(),
  auditResultId: z.string().nullable().optional(),
  severity: z.enum(SEVERITY_VALUES),
  existsFlag: z.boolean().default(true),
  description: z.string().min(1),
  recommendation: z.string().optional(),
  surfacesInExecutiveSummary: z.boolean().optional(),
})

function defaultDisplayPrefix(severity: string): 'NC' | 'OBS' | 'PM' {
  if (severity === 'NO_CONFORMIDAD_MAYOR' || severity === 'NO_CONFORMIDAD_MENOR') return 'NC'
  if (severity === 'OBSERVACION') return 'OBS'
  return 'PM'
}

function defaultPacRequired(severity: string): boolean {
  return severity !== 'PUNTO_DE_MEJORA'
}

function defaultSurfaceFlag(severity: string): boolean {
  return severity !== 'PUNTO_DE_MEJORA'
}

ensRoutes.post(
  '/ens/audits/:auditId/findings',
  requireRole('admin'),
  zValidator('json', findingSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const auditId = c.req.param('auditId')
    const body = c.req.valid('json')

    const audit = await c.env.DB.prepare(
      `SELECT id, next_finding_seq_nc, next_finding_seq_obs, next_finding_seq_pm
       FROM ens_audits WHERE id = ? AND workspace_id = ?`
    )
      .bind(auditId, workspaceId)
      .first<{
        id: string
        next_finding_seq_nc: number
        next_finding_seq_obs: number
        next_finding_seq_pm: number
      }>()
    if (!audit) return c.json({ error: 'Audit not found' }, 404)

    const prefix = defaultDisplayPrefix(body.severity)
    let seq: number
    let nextNc = audit.next_finding_seq_nc
    let nextObs = audit.next_finding_seq_obs
    let nextPm = audit.next_finding_seq_pm
    if (prefix === 'NC') {
      seq = nextNc
      nextNc += 1
    } else if (prefix === 'OBS') {
      seq = nextObs
      nextObs += 1
    } else {
      seq = nextPm
      nextPm += 1
    }
    const displayId = `${prefix}${seq}`

    const id = generateId()
    const globalId = generateId()
    const now = new Date().toISOString()
    const pacRequired = defaultPacRequired(body.severity)
    const surfacesFlag = body.surfacesInExecutiveSummary ?? defaultSurfaceFlag(body.severity)

    await c.env.DB.prepare(
      `INSERT INTO ens_findings (
         id, audit_id, audit_result_id, control_id, display_id, global_finding_id,
         severity, exists_flag, description, recommendation, pac_required, status,
         surfaces_in_executive_summary, raised_at, created_by, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?)`
    )
      .bind(
        id, auditId, body.auditResultId ?? null, body.controlId ?? null,
        displayId, globalId, body.severity, body.existsFlag ? 1 : 0,
        body.description, body.recommendation ?? null, pacRequired ? 1 : 0,
        surfacesFlag ? 1 : 0, now, userId, now, now
      )
      .run()

    await c.env.DB.prepare(
      `UPDATE ens_audits SET
         next_finding_seq_nc = ?, next_finding_seq_obs = ?, next_finding_seq_pm = ?,
         pac_required = CASE WHEN ? = 1 THEN 1 ELSE pac_required END,
         updated_at = ?
       WHERE id = ?`
    )
      .bind(nextNc, nextObs, nextPm, pacRequired ? 1 : 0, now, auditId)
      .run()

    return c.json({ finding: { id, displayId, globalFindingId: globalId, pacRequired } }, 201)
  }
)

ensRoutes.get('/ens/audits/:auditId/findings', async (c) => {
  const workspaceId = c.get('workspaceId')
  const auditId = c.req.param('auditId')

  const audit = await c.env.DB.prepare(
    'SELECT id FROM ens_audits WHERE id = ? AND workspace_id = ?'
  )
    .bind(auditId, workspaceId)
    .first()
  if (!audit) return c.json({ error: 'Audit not found' }, 404)

  const { results } = await c.env.DB.prepare(
    `SELECT f.*, vc.control_id as control_code, vc.title as control_title
     FROM ens_findings f
     LEFT JOIN versioned_controls vc ON vc.id = f.control_id
     WHERE f.audit_id = ?
     ORDER BY
       CASE f.severity
         WHEN 'NO_CONFORMIDAD_MAYOR' THEN 0
         WHEN 'NO_CONFORMIDAD_MENOR' THEN 1
         WHEN 'OBSERVACION' THEN 2
         WHEN 'PUNTO_DE_MEJORA' THEN 3
         ELSE 4 END,
       f.display_id ASC`
  )
    .bind(auditId)
    .all()

  return c.json({ findings: results })
})

const updateFindingSchema = z.object({
  description: z.string().optional(),
  recommendation: z.string().optional(),
  status: z.enum(['open', 'in_remediation', 'remediated', 'validated', 'accepted', 'closed']).optional(),
  severity: z.enum(SEVERITY_VALUES).optional(),
  existsFlag: z.boolean().optional(),
  surfacesInExecutiveSummary: z.boolean().optional(),
})

ensRoutes.patch(
  '/ens/audits/:auditId/findings/:findingId',
  requireRole('admin'),
  zValidator('json', updateFindingSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const auditId = c.req.param('auditId')
    const findingId = c.req.param('findingId')
    const body = c.req.valid('json')

    const finding = await c.env.DB.prepare(
      `SELECT f.id FROM ens_findings f
       JOIN ens_audits a ON a.id = f.audit_id
       WHERE f.id = ? AND f.audit_id = ? AND a.workspace_id = ?`
    )
      .bind(findingId, auditId, workspaceId)
      .first()
    if (!finding) return c.json({ error: 'Finding not found' }, 404)

    const sets: string[] = []
    const bindings: unknown[] = []
    if (body.description !== undefined) { sets.push('description = ?'); bindings.push(body.description) }
    if (body.recommendation !== undefined) { sets.push('recommendation = ?'); bindings.push(body.recommendation) }
    if (body.status !== undefined) {
      sets.push('status = ?')
      bindings.push(body.status)
      if (body.status === 'closed' || body.status === 'validated') {
        sets.push('closed_at = ?'); bindings.push(new Date().toISOString())
      }
    }
    if (body.severity !== undefined) { sets.push('severity = ?'); bindings.push(body.severity) }
    if (body.existsFlag !== undefined) { sets.push('exists_flag = ?'); bindings.push(body.existsFlag ? 1 : 0) }
    if (body.surfacesInExecutiveSummary !== undefined) {
      sets.push('surfaces_in_executive_summary = ?')
      bindings.push(body.surfacesInExecutiveSummary ? 1 : 0)
    }
    if (sets.length === 0) return c.json({ error: 'No fields to update' }, 400)

    sets.push('updated_at = ?')
    bindings.push(new Date().toISOString())
    bindings.push(findingId)

    await c.env.DB.prepare(`UPDATE ens_findings SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...bindings)
      .run()
    return c.json({ success: true })
  }
)

ensRoutes.delete(
  '/ens/audits/:auditId/findings/:findingId',
  requireRole('admin'),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const auditId = c.req.param('auditId')
    const findingId = c.req.param('findingId')

    const finding = await c.env.DB.prepare(
      `SELECT f.id FROM ens_findings f
       JOIN ens_audits a ON a.id = f.audit_id
       WHERE f.id = ? AND f.audit_id = ? AND a.workspace_id = ?`
    )
      .bind(findingId, auditId, workspaceId)
      .first()
    if (!finding) return c.json({ error: 'Finding not found' }, 404)

    await c.env.DB.prepare('DELETE FROM ens_findings WHERE id = ?').bind(findingId).run()
    return c.json({ success: true })
  }
)

// ── PAC ─────────────────────────────────────────────────────

const pacSchema = z.object({
  analysis: z.string().optional(),
  proposedRemediation: z.string().optional(),
  executionEvidence: z.string().optional(),
  effectivenessCheck: z.string().optional(),
  responsibleParty: z.string().optional(),
  dueDate: z.string().optional(),
  completedAt: z.string().nullable().optional(),
  validatedAt: z.string().nullable().optional(),
  validatedBy: z.string().optional(),
  status: z.enum(['proposed', 'in_progress', 'completed', 'validated', 'rejected']).optional(),
})

ensRoutes.put(
  '/ens/audits/:auditId/findings/:findingId/pac',
  requireRole('admin'),
  zValidator('json', pacSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const auditId = c.req.param('auditId')
    const findingId = c.req.param('findingId')
    const body = c.req.valid('json')

    const finding = await c.env.DB.prepare(
      `SELECT f.id FROM ens_findings f
       JOIN ens_audits a ON a.id = f.audit_id
       WHERE f.id = ? AND f.audit_id = ? AND a.workspace_id = ?`
    )
      .bind(findingId, auditId, workspaceId)
      .first()
    if (!finding) return c.json({ error: 'Finding not found' }, 404)

    const existing = await c.env.DB.prepare(
      'SELECT id FROM ens_pac WHERE finding_id = ?'
    )
      .bind(findingId)
      .first<{ id: string }>()

    const now = new Date().toISOString()

    if (existing) {
      await c.env.DB.prepare(
        `UPDATE ens_pac SET
           analysis = ?, proposed_remediation = ?, execution_evidence = ?,
           effectiveness_check = ?, responsible_party = ?, due_date = ?,
           completed_at = ?, validated_at = ?, validated_by = ?,
           status = COALESCE(?, status), updated_at = ?
         WHERE id = ?`
      )
        .bind(
          body.analysis ?? null, body.proposedRemediation ?? null,
          body.executionEvidence ?? null, body.effectivenessCheck ?? null,
          body.responsibleParty ?? null, body.dueDate ?? null,
          body.completedAt ?? null, body.validatedAt ?? null,
          body.validatedBy ?? null, body.status ?? null, now, existing.id
        )
        .run()
      return c.json({ pac: { id: existing.id, updated: true } })
    }

    const id = generateId()
    await c.env.DB.prepare(
      `INSERT INTO ens_pac (
         id, finding_id, analysis, proposed_remediation, execution_evidence,
         effectiveness_check, responsible_party, due_date, completed_at,
         validated_at, validated_by, status, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id, findingId, body.analysis ?? null, body.proposedRemediation ?? null,
        body.executionEvidence ?? null, body.effectivenessCheck ?? null,
        body.responsibleParty ?? null, body.dueDate ?? null,
        body.completedAt ?? null, body.validatedAt ?? null,
        body.validatedBy ?? null, body.status ?? 'proposed', now, now
      )
      .run()
    return c.json({ pac: { id, created: true } }, 201)
  }
)

ensRoutes.get('/ens/audits/:auditId/findings/:findingId/pac', async (c) => {
  const workspaceId = c.get('workspaceId')
  const auditId = c.req.param('auditId')
  const findingId = c.req.param('findingId')

  const finding = await c.env.DB.prepare(
    `SELECT f.id FROM ens_findings f
     JOIN ens_audits a ON a.id = f.audit_id
     WHERE f.id = ? AND f.audit_id = ? AND a.workspace_id = ?`
  )
    .bind(findingId, auditId, workspaceId)
    .first()
  if (!finding) return c.json({ error: 'Finding not found' }, 404)

  const pac = await c.env.DB.prepare(
    'SELECT * FROM ens_pac WHERE finding_id = ?'
  )
    .bind(findingId)
    .first()

  return c.json({ pac })
})

// ── Data-quality flags ──────────────────────────────────────

ensRoutes.get('/ens/audits/:auditId/quality-flags', async (c) => {
  const workspaceId = c.get('workspaceId')
  const auditId = c.req.param('auditId')

  const audit = await c.env.DB.prepare(
    'SELECT id FROM ens_audits WHERE id = ? AND workspace_id = ?'
  )
    .bind(auditId, workspaceId)
    .first()
  if (!audit) return c.json({ error: 'Audit not found' }, 404)

  const { results } = await c.env.DB.prepare(
    `SELECT finding_id, display_id, severity, exists_flag,
            flag_severity_display_mismatch,
            flag_exec_summary_missing_per_control_finding,
            flag_existen_false_but_category_checked
     FROM ens_finding_quality_flags
     WHERE audit_id = ?
       AND (flag_severity_display_mismatch = 1
            OR flag_exec_summary_missing_per_control_finding = 1
            OR flag_existen_false_but_category_checked = 1)`
  )
    .bind(auditId)
    .all()

  return c.json({ flags: results })
})

// ── Verdict computation helper ──────────────────────────────

ensRoutes.post('/ens/audits/:auditId/compute-verdict', requireRole('admin'), async (c) => {
  const workspaceId = c.get('workspaceId')
  const auditId = c.req.param('auditId')

  const audit = await c.env.DB.prepare(
    'SELECT id FROM ens_audits WHERE id = ? AND workspace_id = ?'
  )
    .bind(auditId, workspaceId)
    .first()
  if (!audit) return c.json({ error: 'Audit not found' }, 404)

  const counts = await c.env.DB.prepare(
    `SELECT
       SUM(CASE WHEN severity = 'NO_CONFORMIDAD_MAYOR' AND status NOT IN ('closed','validated','accepted') THEN 1 ELSE 0 END) AS open_major,
       SUM(CASE WHEN severity = 'NO_CONFORMIDAD_MENOR' AND status NOT IN ('closed','validated','accepted') THEN 1 ELSE 0 END) AS open_minor,
       SUM(CASE WHEN severity IN ('NO_CONFORMIDAD_MAYOR','NO_CONFORMIDAD_MENOR','OBSERVACION') THEN 1 ELSE 0 END) AS any_nc_or_obs
     FROM ens_findings WHERE audit_id = ?`
  )
    .bind(auditId)
    .first<{ open_major: number; open_minor: number; any_nc_or_obs: number }>()

  const openMajor = counts?.open_major ?? 0
  const openMinor = counts?.open_minor ?? 0
  const anyFinding = counts?.any_nc_or_obs ?? 0

  let verdict: (typeof VERDICTS)[number]
  if (openMajor > 0) verdict = 'DESFAVORABLE'
  else if (anyFinding > 0) verdict = 'FAVORABLE_CON_NO_CONFORMIDADES'
  else verdict = 'FAVORABLE'

  await c.env.DB.prepare(
    `UPDATE ens_audits SET overall_verdict = ?, pac_required = ?, updated_at = ? WHERE id = ?`
  )
    .bind(
      verdict,
      verdict !== 'FAVORABLE' ? 1 : 0,
      new Date().toISOString(),
      auditId
    )
    .run()

  return c.json({ verdict, openMajor, openMinor })
})

export { ensRoutes }
