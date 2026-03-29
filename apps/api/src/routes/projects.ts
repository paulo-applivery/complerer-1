import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { generateId } from '../lib/id.js'
import { emitEvent } from '../lib/events.js'
import type { AppType } from '../types.js'

const projectRoutes = new Hono<AppType>()

// ── List Projects ──────────────────────────────────────────────────────

projectRoutes.get('/projects', async (c) => {
  const workspaceId = c.get('workspaceId')

  const { results } = await c.env.DB.prepare(
    `SELECT cp.*,
       f.name as framework_name, f.slug as framework_slug,
       fv.version as framework_version,
       (SELECT COUNT(*) FROM versioned_controls vc WHERE vc.framework_version_id = cp.framework_version_id) as controls_total,
       (SELECT COUNT(DISTINCT pe.control_id) FROM project_evidence pe WHERE pe.project_id = cp.id) as controls_covered,
       (SELECT COUNT(*) FROM project_evidence pe2 WHERE pe2.project_id = cp.id) as evidence_count
     FROM compliance_projects cp
     JOIN frameworks f ON f.id = cp.framework_id
     JOIN framework_versions fv ON fv.id = cp.framework_version_id
     WHERE cp.workspace_id = ?
     ORDER BY cp.created_at DESC`
  ).bind(workspaceId).all()

  return c.json({
    projects: (results ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      frameworkId: p.framework_id,
      frameworkName: p.framework_name,
      frameworkSlug: p.framework_slug,
      frameworkVersion: p.framework_version,
      frameworkVersionId: p.framework_version_id,
      status: p.status,
      auditorName: p.auditor_name,
      auditorFirm: p.auditor_firm,
      auditPeriodStart: p.audit_period_start,
      auditPeriodEnd: p.audit_period_end,
      targetCompletionDate: p.target_completion_date,
      controlsTotal: p.controls_total ?? 0,
      controlsCovered: p.controls_covered ?? 0,
      evidenceCount: p.evidence_count ?? 0,
      createdBy: p.created_by,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    })),
  })
})

// ── Create Project ─────────────────────────────────────────────────────

const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  frameworkId: z.string().min(1),
  frameworkVersionId: z.string().min(1),
  auditorName: z.string().max(200).optional(),
  auditorFirm: z.string().max(200).optional(),
  auditPeriodStart: z.string().optional(),
  auditPeriodEnd: z.string().optional(),
  targetCompletionDate: z.string().optional(),
})

projectRoutes.post('/projects', zValidator('json', createProjectSchema), async (c) => {
  const workspaceId = c.get('workspaceId')
  const userId = c.get('userId')
  const data = c.req.valid('json')
  const now = new Date().toISOString()

  // Validate framework version belongs to framework
  const fv = await c.env.DB.prepare(
    'SELECT id FROM framework_versions WHERE id = ? AND framework_id = ?'
  ).bind(data.frameworkVersionId, data.frameworkId).first()

  if (!fv) {
    return c.json({ error: 'Framework version not found' }, 400)
  }

  // Auto-adopt framework if not already adopted
  const existing = await c.env.DB.prepare(
    `SELECT id FROM workspace_adoptions
     WHERE workspace_id = ? AND framework_version_id = ?
     AND (effective_until IS NULL OR effective_until > datetime('now'))`
  ).bind(workspaceId, data.frameworkVersionId).first()

  if (!existing) {
    const adoptionId = generateId()
    await c.env.DB.prepare(
      `INSERT INTO workspace_adoptions (id, workspace_id, framework_version_id, adopted_at, adopted_by, effective_from, auto_update_minor)
       VALUES (?, ?, ?, ?, ?, ?, 0)`
    ).bind(adoptionId, workspaceId, data.frameworkVersionId, now, userId, now).run()
  }

  // Create project
  const id = generateId()
  await c.env.DB.prepare(
    `INSERT INTO compliance_projects (id, workspace_id, name, description, framework_id, framework_version_id, status, auditor_name, auditor_firm, audit_period_start, audit_period_end, target_completion_date, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'planning', ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, workspaceId, data.name, data.description ?? null,
    data.frameworkId, data.frameworkVersionId,
    data.auditorName ?? null, data.auditorFirm ?? null,
    data.auditPeriodStart ?? null, data.auditPeriodEnd ?? null,
    data.targetCompletionDate ?? null,
    userId, now, now
  ).run()

  // Auto-import existing evidence_links that match this framework version into project_evidence
  const { results: existingLinks } = await c.env.DB.prepare(
    `SELECT el.id as link_id, el.evidence_id, el.control_id, el.link_type, el.linked_at, el.linked_by
     FROM evidence_links el
     JOIN versioned_controls vc ON vc.id = el.control_id
     WHERE el.workspace_id = ? AND vc.framework_version_id = ?`
  ).bind(workspaceId, data.frameworkVersionId).all()

  let autoLinked = 0
  for (const link of (existingLinks ?? [])) {
    const peId = generateId()
    try {
      await c.env.DB.prepare(
        `INSERT INTO project_evidence (id, project_id, evidence_id, control_id, linked_at, linked_by, link_type, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Auto-imported from existing evidence links')`
      ).bind(
        peId, id, (link as any).evidence_id, (link as any).control_id,
        now, userId, (link as any).link_type ?? 'auto'
      ).run()
      autoLinked++
    } catch (_) { /* skip duplicates */ }
  }

  await emitEvent(c.env.DB, {
    workspaceId,
    eventType: 'project.created',
    entityType: 'project',
    entityId: id,
    data: { name: data.name, framework: data.frameworkId, autoLinkedEvidence: autoLinked },
    actorId: userId,
  })

  return c.json({ project: { id, name: data.name, status: 'planning', autoLinkedEvidence: autoLinked } }, 201)
})

// ── Get Project Detail ─────────────────────────────────────────────────

projectRoutes.get('/projects/:projectId', async (c) => {
  const workspaceId = c.get('workspaceId')
  const projectId = c.req.param('projectId')

  const p = await c.env.DB.prepare(
    `SELECT cp.*,
       f.name as framework_name, f.slug as framework_slug,
       fv.version as framework_version,
       (SELECT COUNT(*) FROM versioned_controls vc WHERE vc.framework_version_id = cp.framework_version_id) as controls_total,
       (SELECT COUNT(DISTINCT pe.control_id) FROM project_evidence pe WHERE pe.project_id = cp.id) as controls_covered,
       (SELECT COUNT(*) FROM project_evidence pe2 WHERE pe2.project_id = cp.id) as evidence_count
     FROM compliance_projects cp
     JOIN frameworks f ON f.id = cp.framework_id
     JOIN framework_versions fv ON fv.id = cp.framework_version_id
     WHERE cp.id = ? AND cp.workspace_id = ?`
  ).bind(projectId, workspaceId).first()

  if (!p) return c.json({ error: 'Project not found' }, 404)

  return c.json({
    project: {
      id: (p as any).id,
      name: (p as any).name,
      description: (p as any).description,
      frameworkId: (p as any).framework_id,
      frameworkName: (p as any).framework_name,
      frameworkSlug: (p as any).framework_slug,
      frameworkVersion: (p as any).framework_version,
      frameworkVersionId: (p as any).framework_version_id,
      status: (p as any).status,
      auditorName: (p as any).auditor_name,
      auditorFirm: (p as any).auditor_firm,
      auditPeriodStart: (p as any).audit_period_start,
      auditPeriodEnd: (p as any).audit_period_end,
      targetCompletionDate: (p as any).target_completion_date,
      controlsTotal: (p as any).controls_total ?? 0,
      controlsCovered: (p as any).controls_covered ?? 0,
      evidenceCount: (p as any).evidence_count ?? 0,
      createdBy: (p as any).created_by,
      createdAt: (p as any).created_at,
      updatedAt: (p as any).updated_at,
    },
  })
})

// ── Update Project ─────────────────────────────────────────────────────

const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['planning', 'in_progress', 'audit_ready', 'in_audit', 'completed', 'archived']).optional(),
  auditorName: z.string().max(200).optional(),
  auditorFirm: z.string().max(200).optional(),
  auditPeriodStart: z.string().optional(),
  auditPeriodEnd: z.string().optional(),
  targetCompletionDate: z.string().optional(),
})

projectRoutes.put('/projects/:projectId', zValidator('json', updateProjectSchema), async (c) => {
  const workspaceId = c.get('workspaceId')
  const projectId = c.req.param('projectId')
  const data = c.req.valid('json')
  const now = new Date().toISOString()

  const existing = await c.env.DB.prepare(
    'SELECT id FROM compliance_projects WHERE id = ? AND workspace_id = ?'
  ).bind(projectId, workspaceId).first()

  if (!existing) return c.json({ error: 'Project not found' }, 404)

  const sets: string[] = ['updated_at = ?']
  const vals: any[] = [now]

  const fieldMap: Record<string, string> = {
    name: 'name', description: 'description', status: 'status',
    auditorName: 'auditor_name', auditorFirm: 'auditor_firm',
    auditPeriodStart: 'audit_period_start', auditPeriodEnd: 'audit_period_end',
    targetCompletionDate: 'target_completion_date',
  }

  for (const [key, col] of Object.entries(fieldMap)) {
    if ((data as any)[key] !== undefined) {
      sets.push(`${col} = ?`)
      vals.push((data as any)[key])
    }
  }

  vals.push(projectId, workspaceId)
  await c.env.DB.prepare(
    `UPDATE compliance_projects SET ${sets.join(', ')} WHERE id = ? AND workspace_id = ?`
  ).bind(...vals).run()

  return c.json({ ok: true })
})

// ── Delete Project ─────────────────────────────────────────────────────

projectRoutes.delete('/projects/:projectId', async (c) => {
  const workspaceId = c.get('workspaceId')
  const userId = c.get('userId')
  const projectId = c.req.param('projectId')

  const existing = await c.env.DB.prepare(
    'SELECT id, name FROM compliance_projects WHERE id = ? AND workspace_id = ?'
  ).bind(projectId, workspaceId).first()

  if (!existing) return c.json({ error: 'Project not found' }, 404)

  // Cascade handled by ON DELETE CASCADE, but explicit for D1 compatibility
  await c.env.DB.prepare('DELETE FROM project_evidence WHERE project_id = ?').bind(projectId).run()
  await c.env.DB.prepare('DELETE FROM project_milestones WHERE project_id = ?').bind(projectId).run()
  await c.env.DB.prepare('DELETE FROM compliance_projects WHERE id = ? AND workspace_id = ?').bind(projectId, workspaceId).run()

  await emitEvent(c.env.DB, {
    workspaceId,
    eventType: 'project.deleted',
    entityType: 'project',
    entityId: projectId,
    data: { name: (existing as any).name },
    actorId: userId,
  })

  return c.json({ ok: true })
})

// ── Project Stats ──────────────────────────────────────────────────────

projectRoutes.get('/projects/:projectId/stats', async (c) => {
  const workspaceId = c.get('workspaceId')
  const projectId = c.req.param('projectId')

  const project = await c.env.DB.prepare(
    'SELECT framework_version_id FROM compliance_projects WHERE id = ? AND workspace_id = ?'
  ).bind(projectId, workspaceId).first<{ framework_version_id: string }>()

  if (!project) return c.json({ error: 'Project not found' }, 404)

  const totalResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as cnt FROM versioned_controls WHERE framework_version_id = ?'
  ).bind(project.framework_version_id).first<{ cnt: number }>()

  const evidenceResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as cnt FROM project_evidence WHERE project_id = ?'
  ).bind(projectId).first<{ cnt: number }>()

  const baselineCoveredResult = await c.env.DB.prepare(
    `SELECT COUNT(DISTINCT bc.control_id) as cnt
     FROM baseline_controls bc
     JOIN versioned_controls vc ON vc.id = bc.control_id
     WHERE bc.workspace_id = ? AND vc.framework_version_id = ?`
  ).bind(workspaceId, project.framework_version_id).first<{ cnt: number }>()

  const totalCoveredResult = await c.env.DB.prepare(
    `SELECT COUNT(DISTINCT id) as cnt FROM (
       SELECT vc.id FROM versioned_controls vc
       WHERE vc.framework_version_id = ?
       AND (
         EXISTS (SELECT 1 FROM project_evidence pe WHERE pe.project_id = ? AND pe.control_id = vc.id)
         OR EXISTS (SELECT 1 FROM baseline_controls bc WHERE bc.control_id = vc.id AND bc.workspace_id = ?)
       )
     )`
  ).bind(project.framework_version_id, projectId, workspaceId).first<{ cnt: number }>()

  const total = totalResult?.cnt ?? 0
  const covered = totalCoveredResult?.cnt ?? 0
  const evidence = evidenceResult?.cnt ?? 0
  const baselineCovered = baselineCoveredResult?.cnt ?? 0

  return c.json({
    stats: {
      controlsTotal: total,
      controlsCovered: covered,
      evidenceLinked: evidence,
      baselineCovered,
      coveragePercent: total > 0 ? Math.round((covered / total) * 1000) / 10 : 0,
    },
  })
})

// ── Project Controls (with coverage status) ────────────────────────────

projectRoutes.get('/projects/:projectId/controls', async (c) => {
  const workspaceId = c.get('workspaceId')
  const projectId = c.req.param('projectId')
  const domain = c.req.query('domain') ?? ''
  const search = c.req.query('search') ?? ''

  const project = await c.env.DB.prepare(
    'SELECT framework_version_id FROM compliance_projects WHERE id = ? AND workspace_id = ?'
  ).bind(projectId, workspaceId).first<{ framework_version_id: string }>()

  if (!project) return c.json({ error: 'Project not found' }, 404)

  // Get all controls for this framework version
  let sql = `SELECT vc.id, vc.control_id, vc.domain, vc.subdomain, vc.title, vc.requirement_text, vc.risk_weight,
       (SELECT COUNT(*) FROM project_evidence pe WHERE pe.project_id = ? AND pe.control_id = vc.id) as evidence_count,
       (SELECT COUNT(*) FROM policy_controls pc WHERE pc.control_id = vc.id AND pc.workspace_id = ?) as policy_count,
       (SELECT COUNT(*) FROM baseline_controls bc WHERE bc.control_id = vc.id AND bc.workspace_id = ?) as baseline_count
     FROM versioned_controls vc
     WHERE vc.framework_version_id = ?`
  const bindings: any[] = [projectId, workspaceId, workspaceId, project.framework_version_id]

  if (domain) {
    sql += ' AND vc.domain = ?'
    bindings.push(domain)
  }
  if (search) {
    sql += ' AND (vc.control_id LIKE ? OR vc.title LIKE ?)'
    bindings.push(`%${search}%`, `%${search}%`)
  }

  sql += ' ORDER BY vc.control_id ASC'

  const { results } = await c.env.DB.prepare(sql).bind(...bindings).all()

  // Get unique domains for filter
  const { results: domainResults } = await c.env.DB.prepare(
    'SELECT DISTINCT domain FROM versioned_controls WHERE framework_version_id = ? AND domain IS NOT NULL ORDER BY domain'
  ).bind(project.framework_version_id).all()

  return c.json({
    controls: (results ?? []).map((vc: any) => ({
      id: vc.id,
      controlId: vc.control_id,
      domain: vc.domain,
      subdomain: vc.subdomain,
      title: vc.title,
      requirementText: vc.requirement_text,
      riskWeight: vc.risk_weight,
      evidenceCount: vc.evidence_count ?? 0,
      policyCount: vc.policy_count ?? 0,
      baselineCount: vc.baseline_count ?? 0,
      status: (vc.evidence_count > 0 || vc.baseline_count > 0) ? 'covered' : 'gap',
    })),
    domains: (domainResults ?? []).map((d: any) => d.domain),
  })
})

// ── Project Evidence (list linked evidence) ────────────────────────────

projectRoutes.get('/projects/:projectId/evidence', async (c) => {
  const workspaceId = c.get('workspaceId')
  const projectId = c.req.param('projectId')

  const project = await c.env.DB.prepare(
    'SELECT id FROM compliance_projects WHERE id = ? AND workspace_id = ?'
  ).bind(projectId, workspaceId).first()

  if (!project) return c.json({ error: 'Project not found' }, 404)

  const { results } = await c.env.DB.prepare(
    `SELECT pe.id as link_id, pe.control_id, pe.linked_at, pe.link_type, pe.notes,
       e.id as evidence_id, e.title as evidence_title, e.source, e.file_name, e.captured_at, e.expires_at,
       vc.control_id as control_code, vc.title as control_title, vc.domain
     FROM project_evidence pe
     JOIN evidence e ON e.id = pe.evidence_id
     LEFT JOIN versioned_controls vc ON vc.id = pe.control_id
     WHERE pe.project_id = ?
     ORDER BY vc.control_id ASC, pe.linked_at DESC`
  ).bind(projectId).all()

  return c.json({
    evidence: (results ?? []).map((r: any) => ({
      linkId: r.link_id,
      evidenceId: r.evidence_id,
      evidenceTitle: r.evidence_title,
      source: r.source,
      fileName: r.file_name,
      capturedAt: r.captured_at,
      expiresAt: r.expires_at,
      controlId: r.control_id,
      controlCode: r.control_code,
      controlTitle: r.control_title,
      domain: r.domain,
      linkedAt: r.linked_at,
      linkType: r.link_type,
      notes: r.notes,
    })),
  })
})

// ── Link evidence to project control ───────────────────────────────────

const linkEvidenceSchema = z.object({
  evidenceId: z.string().min(1),
  controlId: z.string().optional(),
  notes: z.string().optional(),
})

projectRoutes.post('/projects/:projectId/evidence', zValidator('json', linkEvidenceSchema), async (c) => {
  const workspaceId = c.get('workspaceId')
  const userId = c.get('userId')
  const projectId = c.req.param('projectId')
  const data = c.req.valid('json')
  const now = new Date().toISOString()

  // Validate project
  const project = await c.env.DB.prepare(
    'SELECT framework_version_id FROM compliance_projects WHERE id = ? AND workspace_id = ?'
  ).bind(projectId, workspaceId).first<{ framework_version_id: string }>()
  if (!project) return c.json({ error: 'Project not found' }, 404)

  // Validate evidence belongs to workspace
  const evidence = await c.env.DB.prepare(
    'SELECT id FROM evidence WHERE id = ? AND workspace_id = ?'
  ).bind(data.evidenceId, workspaceId).first()
  if (!evidence) return c.json({ error: 'Evidence not found' }, 404)

  // Validate control if provided
  if (data.controlId) {
    const control = await c.env.DB.prepare(
      'SELECT id FROM versioned_controls WHERE id = ? AND framework_version_id = ?'
    ).bind(data.controlId, project.framework_version_id).first()
    if (!control) return c.json({ error: 'Control not in this project\'s framework' }, 400)
  }

  // Auto-import existing evidence_links that match this project's framework version
  const { results: existingLinks } = await c.env.DB.prepare(
    `SELECT el.evidence_id, el.control_id, el.link_type
     FROM evidence_links el
     JOIN versioned_controls vc ON vc.id = el.control_id
     WHERE el.workspace_id = ? AND el.evidence_id = ? AND vc.framework_version_id = ?`
  ).bind(workspaceId, data.evidenceId, project.framework_version_id).all()

  // Collect all control IDs to insert (from existing links + the explicitly selected one)
  const controlsToLink = new Set<string>()
  for (const link of (existingLinks ?? [])) {
    controlsToLink.add((link as any).control_id)
  }
  if (data.controlId) {
    controlsToLink.add(data.controlId)
  }

  let created = 0
  if (controlsToLink.size > 0) {
    for (const ctrlId of controlsToLink) {
      const peId = generateId()
      try {
        await c.env.DB.prepare(
          `INSERT INTO project_evidence (id, project_id, evidence_id, control_id, linked_at, linked_by, link_type, notes)
           VALUES (?, ?, ?, ?, ?, ?, 'manual', ?)`
        ).bind(peId, projectId, data.evidenceId, ctrlId, now, userId, data.notes ?? null).run()
        created++
      } catch (_) { /* skip duplicates */ }
    }
  } else {
    // No controls at all — just add evidence to project without control
    const peId = generateId()
    try {
      await c.env.DB.prepare(
        `INSERT INTO project_evidence (id, project_id, evidence_id, control_id, linked_at, linked_by, link_type, notes)
         VALUES (?, ?, ?, NULL, ?, ?, 'manual', ?)`
      ).bind(peId, projectId, data.evidenceId, now, userId, data.notes ?? null).run()
      created++
    } catch (_) { /* skip duplicates */ }
  }

  return c.json({ created, controlsLinked: controlsToLink.size }, 201)
})

// ── Available evidence for linking ──────────────────────────────────────

projectRoutes.get('/projects/:projectId/available-evidence', async (c) => {
  const workspaceId = c.get('workspaceId')
  const projectId = c.req.param('projectId')

  const project = await c.env.DB.prepare(
    'SELECT id FROM compliance_projects WHERE id = ? AND workspace_id = ?'
  ).bind(projectId, workspaceId).first()
  if (!project) return c.json({ error: 'Project not found' }, 404)

  // Get all workspace evidence
  const { results } = await c.env.DB.prepare(
    `SELECT id, title, source, file_name, captured_at, expires_at
     FROM evidence
     WHERE workspace_id = ?
     ORDER BY captured_at DESC`
  ).bind(workspaceId).all()

  return c.json({
    evidence: (results ?? []).map((e: any) => ({
      id: e.id,
      title: e.title,
      source: e.source,
      fileName: e.file_name,
      capturedAt: e.captured_at,
      expiresAt: e.expires_at,
    })),
  })
})

// ── Create evidence AND link to project control in one call ─────────────

const createAndLinkSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  source: z.string().default('manual'),
  capturedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  controlId: z.string().optional(),
})

projectRoutes.post('/projects/:projectId/create-and-link', zValidator('json', createAndLinkSchema), async (c) => {
  const workspaceId = c.get('workspaceId')
  const userId = c.get('userId')
  const projectId = c.req.param('projectId')
  const data = c.req.valid('json')
  const now = new Date().toISOString()

  // Validate project
  const project = await c.env.DB.prepare(
    'SELECT framework_version_id FROM compliance_projects WHERE id = ? AND workspace_id = ?'
  ).bind(projectId, workspaceId).first<{ framework_version_id: string }>()
  if (!project) return c.json({ error: 'Project not found' }, 404)

  // Validate control if provided
  if (data.controlId) {
    const control = await c.env.DB.prepare(
      'SELECT id FROM versioned_controls WHERE id = ? AND framework_version_id = ?'
    ).bind(data.controlId, project.framework_version_id).first()
    if (!control) return c.json({ error: 'Control not in this project\'s framework' }, 400)
  }

  // 1. Create evidence
  const evidenceId = generateId()
  await c.env.DB.prepare(
    `INSERT INTO evidence (id, workspace_id, title, description, source, captured_at, expires_at, uploaded_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    evidenceId, workspaceId, data.title, data.description ?? null,
    data.source ?? 'manual', data.capturedAt ?? now, data.expiresAt ?? null,
    userId, now
  ).run()

  // 2. Link to project control (only if controlId provided)
  let linkId: string | null = null
  if (data.controlId) {
    linkId = generateId()
    await c.env.DB.prepare(
      `INSERT INTO project_evidence (id, project_id, evidence_id, control_id, linked_at, linked_by, link_type)
       VALUES (?, ?, ?, ?, ?, ?, 'manual')`
    ).bind(linkId, projectId, evidenceId, data.controlId, now, userId).run()

    // 3. Also create the workspace-level evidence_link for consistency
    const elId = generateId()
    try {
      await c.env.DB.prepare(
        `INSERT INTO evidence_links (id, workspace_id, evidence_id, control_id, link_type, linked_at, linked_by, link_note)
         VALUES (?, ?, ?, ?, 'manual', ?, ?, 'Created from project')`
      ).bind(elId, workspaceId, evidenceId, data.controlId, now, userId).run()
    } catch (_) { /* optional, skip if constraint fails */ }
  }

  await emitEvent(c.env.DB, {
    workspaceId,
    eventType: data.controlId ? 'evidence.created_and_linked' : 'evidence.created',
    entityType: 'evidence',
    entityId: evidenceId,
    data: { title: data.title, projectId, controlId: data.controlId ?? null },
    actorId: userId,
  })

  return c.json({ evidenceId, linkId }, 201)
})

// ── Unlink evidence from project control ───────────────────────────────

projectRoutes.delete('/projects/:projectId/evidence/:linkId', async (c) => {
  const workspaceId = c.get('workspaceId')
  const projectId = c.req.param('projectId')
  const linkId = c.req.param('linkId')

  // Validate project ownership
  const project = await c.env.DB.prepare(
    'SELECT id FROM compliance_projects WHERE id = ? AND workspace_id = ?'
  ).bind(projectId, workspaceId).first()
  if (!project) return c.json({ error: 'Project not found' }, 404)

  await c.env.DB.prepare(
    'DELETE FROM project_evidence WHERE id = ? AND project_id = ?'
  ).bind(linkId, projectId).run()

  return c.json({ ok: true })
})

// ── Project Policies (workspace policies that cover this project's controls) ─

projectRoutes.get('/projects/:projectId/policies', async (c) => {
  const workspaceId = c.get('workspaceId')
  const projectId = c.req.param('projectId')

  const project = await c.env.DB.prepare(
    'SELECT framework_version_id FROM compliance_projects WHERE id = ? AND workspace_id = ?'
  ).bind(projectId, workspaceId).first<{ framework_version_id: string }>()
  if (!project) return c.json({ error: 'Project not found' }, 404)

  // Find policies that have controls linked to this project's framework version
  const { results } = await c.env.DB.prepare(
    `SELECT DISTINCT p.id, p.title, p.category, p.status, p.version, p.owner_email,
       (SELECT COUNT(*) FROM policy_controls pc2
        JOIN versioned_controls vc2 ON vc2.id = pc2.control_id
        WHERE pc2.policy_id = p.id AND pc2.workspace_id = ? AND vc2.framework_version_id = ?) as controls_covered
     FROM policies p
     JOIN policy_controls pc ON pc.policy_id = p.id AND pc.workspace_id = ?
     JOIN versioned_controls vc ON vc.id = pc.control_id AND vc.framework_version_id = ?
     WHERE p.workspace_id = ?
     ORDER BY p.title`
  ).bind(workspaceId, project.framework_version_id, workspaceId, project.framework_version_id, workspaceId).all()

  return c.json({
    policies: (results ?? []).map((p: any) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      status: p.status,
      version: p.version,
      owner: p.owner_email,
      controlsCovered: p.controls_covered ?? 0,
    })),
  })
})

// ── Project Baselines (workspace baselines relevant to project) ────────

projectRoutes.get('/projects/:projectId/baselines', async (c) => {
  const workspaceId = c.get('workspaceId')
  const projectId = c.req.param('projectId')

  const project = await c.env.DB.prepare(
    'SELECT framework_version_id FROM compliance_projects WHERE id = ? AND workspace_id = ?'
  ).bind(projectId, workspaceId).first<{ framework_version_id: string }>()
  if (!project) return c.json({ error: 'Project not found' }, 404)

  // Get all enabled baselines + count violations + count linked controls for this framework
  const { results } = await c.env.DB.prepare(
    `SELECT b.id, b.name, b.description, b.category, b.severity, b.enabled, b.rule_type,
       (SELECT COUNT(*) FROM baseline_violations bv WHERE bv.baseline_id = b.id AND bv.workspace_id = ? AND bv.status = 'open') as open_violations,
       (SELECT COUNT(*) FROM baseline_controls bc2
        JOIN versioned_controls vc ON vc.id = bc2.control_id
        WHERE bc2.baseline_id = b.id AND bc2.workspace_id = ? AND vc.framework_version_id = ?) as controls_linked
     FROM baselines b
     WHERE b.workspace_id = ? AND b.enabled = 1
     ORDER BY b.severity DESC, b.name`
  ).bind(workspaceId, workspaceId, project.framework_version_id, workspaceId).all()

  return c.json({
    baselines: (results ?? []).map((b: any) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      category: b.category,
      severity: b.severity,
      enabled: !!b.enabled,
      ruleType: b.rule_type,
      openViolations: b.open_violations ?? 0,
      controlsLinked: b.controls_linked ?? 0,
    })),
  })
})

// ── Project Gaps (controls without evidence) ───────────────────────────

projectRoutes.get('/projects/:projectId/gaps', async (c) => {
  const workspaceId = c.get('workspaceId')
  const projectId = c.req.param('projectId')

  const project = await c.env.DB.prepare(
    'SELECT framework_version_id FROM compliance_projects WHERE id = ? AND workspace_id = ?'
  ).bind(projectId, workspaceId).first<{ framework_version_id: string }>()
  if (!project) return c.json({ error: 'Project not found' }, 404)

  // Controls with NO evidence and NO baseline coverage = gaps
  const { results } = await c.env.DB.prepare(
    `SELECT vc.id, vc.control_id, vc.domain, vc.title, vc.requirement_text, vc.risk_weight
     FROM versioned_controls vc
     WHERE vc.framework_version_id = ?
       AND NOT EXISTS (
         SELECT 1 FROM project_evidence pe WHERE pe.project_id = ? AND pe.control_id = vc.id
       )
       AND NOT EXISTS (
         SELECT 1 FROM baseline_controls bc WHERE bc.control_id = vc.id AND bc.workspace_id = ?
       )
     ORDER BY vc.risk_weight DESC, vc.control_id ASC`
  ).bind(project.framework_version_id, projectId, workspaceId).all()

  return c.json({
    gaps: (results ?? []).map((vc: any) => ({
      id: vc.id,
      controlId: vc.control_id,
      domain: vc.domain,
      title: vc.title,
      requirementText: vc.requirement_text,
      riskWeight: vc.risk_weight,
    })),
  })
})

// ── Project Risks (workspace risks) ────────────────────────────────────

projectRoutes.get('/projects/:projectId/risks', async (c) => {
  const workspaceId = c.get('workspaceId')
  const projectId = c.req.param('projectId')

  const project = await c.env.DB.prepare(
    'SELECT id FROM compliance_projects WHERE id = ? AND workspace_id = ?'
  ).bind(projectId, workspaceId).first()
  if (!project) return c.json({ error: 'Project not found' }, 404)

  const { results } = await c.env.DB.prepare(
    `SELECT id, title, description, asset, threat, likelihood, impact,
       inherent_risk, residual_risk, treatment, status, risk_owner, review_date
     FROM risk_entries
     WHERE workspace_id = ? AND status != 'closed'
     ORDER BY inherent_risk DESC, title ASC`
  ).bind(workspaceId).all()

  return c.json({
    risks: (results ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      asset: r.asset,
      threat: r.threat,
      likelihood: r.likelihood,
      impact: r.impact,
      inherentRisk: r.inherent_risk,
      residualRisk: r.residual_risk,
      treatment: r.treatment,
      status: r.status,
      owner: r.risk_owner,
      reviewDate: r.review_date,
    })),
  })
})

export { projectRoutes }
