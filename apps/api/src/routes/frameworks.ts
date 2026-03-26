import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { AppType } from '../types.js'
import { generateId } from '../lib/id.js'
import { emitEvent } from '../lib/events.js'
import { workspaceMiddleware, requireRole } from '../middleware/workspace.js'
import { authMiddleware } from '../middleware/auth.js'

/**
 * Framework routes — mounted at /api/workspaces/:workspaceId
 * Handles frameworks, controls, and adoptions under the workspace scope.
 */
const frameworkRoutes = new Hono<AppType>()

// All routes require authentication + workspace membership
frameworkRoutes.use('*', authMiddleware)
frameworkRoutes.use('*', workspaceMiddleware)

// ─── Frameworks ──────────────────────────────────────────────────────

/**
 * GET /api/workspaces/:workspaceId/frameworks
 * List all frameworks.
 */
frameworkRoutes.get('/frameworks', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, slug, name, description, source_org, source_url, created_at
     FROM frameworks
     ORDER BY name ASC`
  ).all<{
    id: string
    slug: string
    name: string
    description: string | null
    source_org: string | null
    source_url: string | null
    created_at: string
  }>()

  return c.json({
    frameworks: results.map((f) => ({
      id: f.id,
      slug: f.slug,
      name: f.name,
      description: f.description,
      sourceOrg: f.source_org,
      sourceUrl: f.source_url,
      createdAt: f.created_at,
    })),
  })
})

/**
 * GET /api/workspaces/:workspaceId/frameworks/:slug/versions
 * List all versions of a framework.
 */
frameworkRoutes.get('/frameworks/:slug/versions', async (c) => {
  const slug = c.req.param('slug')

  const framework = await c.env.DB.prepare(
    'SELECT id FROM frameworks WHERE slug = ?'
  )
    .bind(slug)
    .first<{ id: string }>()

  if (!framework) {
    return c.json({ error: 'Framework not found' }, 404)
  }

  const { results } = await c.env.DB.prepare(
    `SELECT id, framework_id, version, status, total_controls, published_at,
            changelog, source_url, checksum, previous_version_id, created_at
     FROM framework_versions
     WHERE framework_id = ?
     ORDER BY created_at DESC`
  )
    .bind(framework.id)
    .all<{
      id: string
      framework_id: string
      version: string
      status: string
      total_controls: number
      published_at: string | null
      changelog: string | null
      source_url: string | null
      checksum: string | null
      previous_version_id: string | null
      created_at: string
    }>()

  return c.json({
    versions: results.map((v) => ({
      id: v.id,
      frameworkId: v.framework_id,
      version: v.version,
      status: v.status,
      totalControls: v.total_controls,
      publishedAt: v.published_at,
      changelog: v.changelog,
      sourceUrl: v.source_url,
      checksum: v.checksum,
      previousVersionId: v.previous_version_id,
      createdAt: v.created_at,
    })),
  })
})

/**
 * GET /api/workspaces/:workspaceId/frameworks/:slug/versions/:version/controls
 * List controls for a specific framework version.
 * Supports ?domain= filter and ?page=1&limit=50 pagination.
 */
frameworkRoutes.get(
  '/frameworks/:slug/versions/:version/controls',
  async (c) => {
    const slug = c.req.param('slug')
    const version = c.req.param('version')
    const domain = c.req.query('domain')
    const page = Math.max(1, parseInt(c.req.query('page') || '1', 10))
    const limit = Math.min(
      100,
      Math.max(1, parseInt(c.req.query('limit') || '50', 10))
    )
    const offset = (page - 1) * limit

    // Find the framework version
    const fv = await c.env.DB.prepare(
      `SELECT fv.id FROM framework_versions fv
       JOIN frameworks f ON f.id = fv.framework_id
       WHERE f.slug = ? AND fv.version = ?`
    )
      .bind(slug, version)
      .first<{ id: string }>()

    if (!fv) {
      return c.json({ error: 'Framework version not found' }, 404)
    }

    // Build queries with optional domain filter
    let countSql =
      'SELECT COUNT(*) as total FROM versioned_controls WHERE framework_version_id = ?'
    let dataSql = `SELECT id, framework_version_id, control_id, domain, subdomain, title,
                          requirement_text, guidance, evidence_requirements, risk_weight,
                          implementation_group, supersedes, deprecated, deprecation_note, created_at
                   FROM versioned_controls
                   WHERE framework_version_id = ?`

    const bindings: unknown[] = [fv.id]

    if (domain) {
      countSql += ' AND domain = ?'
      dataSql += ' AND domain = ?'
      bindings.push(domain)
    }

    dataSql += ' ORDER BY control_id ASC LIMIT ? OFFSET ?'

    const countResult = await c.env.DB.prepare(countSql)
      .bind(...bindings)
      .first<{ total: number }>()

    const { results } = await c.env.DB.prepare(dataSql)
      .bind(...bindings, limit, offset)
      .all<{
        id: string
        framework_version_id: string
        control_id: string
        domain: string | null
        subdomain: string | null
        title: string
        requirement_text: string
        guidance: string | null
        evidence_requirements: string
        risk_weight: number
        implementation_group: string | null
        supersedes: string | null
        deprecated: number
        deprecation_note: string | null
        created_at: string
      }>()

    return c.json({
      controls: results.map((ctrl) => ({
        id: ctrl.id,
        frameworkVersionId: ctrl.framework_version_id,
        controlId: ctrl.control_id,
        domain: ctrl.domain,
        subdomain: ctrl.subdomain,
        title: ctrl.title,
        requirementText: ctrl.requirement_text,
        guidance: ctrl.guidance,
        evidenceRequirements: JSON.parse(ctrl.evidence_requirements),
        riskWeight: ctrl.risk_weight,
        implementationGroup: ctrl.implementation_group,
        supersedes: ctrl.supersedes,
        deprecated: Boolean(ctrl.deprecated),
        deprecationNote: ctrl.deprecation_note,
        createdAt: ctrl.created_at,
      })),
      total: countResult?.total ?? 0,
      page,
      limit,
    })
  }
)

// ─── Controls ────────────────────────────────────────────────────────

/**
 * GET /api/workspaces/:workspaceId/controls/:controlId
 * Get a single control by its ULID id.
 */
frameworkRoutes.get('/controls/:controlId', async (c) => {
  const controlId = c.req.param('controlId')

  const ctrl = await c.env.DB.prepare(
    `SELECT id, framework_version_id, control_id, domain, subdomain, title,
            requirement_text, guidance, evidence_requirements, risk_weight,
            implementation_group, supersedes, deprecated, deprecation_note, created_at
     FROM versioned_controls
     WHERE id = ?`
  )
    .bind(controlId)
    .first<{
      id: string
      framework_version_id: string
      control_id: string
      domain: string | null
      subdomain: string | null
      title: string
      requirement_text: string
      guidance: string | null
      evidence_requirements: string
      risk_weight: number
      implementation_group: string | null
      supersedes: string | null
      deprecated: number
      deprecation_note: string | null
      created_at: string
    }>()

  if (!ctrl) {
    return c.json({ error: 'Control not found' }, 404)
  }

  return c.json({
    control: {
      id: ctrl.id,
      frameworkVersionId: ctrl.framework_version_id,
      controlId: ctrl.control_id,
      domain: ctrl.domain,
      subdomain: ctrl.subdomain,
      title: ctrl.title,
      requirementText: ctrl.requirement_text,
      guidance: ctrl.guidance,
      evidenceRequirements: JSON.parse(ctrl.evidence_requirements),
      riskWeight: ctrl.risk_weight,
      implementationGroup: ctrl.implementation_group,
      supersedes: ctrl.supersedes,
      deprecated: Boolean(ctrl.deprecated),
      deprecationNote: ctrl.deprecation_note,
      createdAt: ctrl.created_at,
    },
  })
})

// ─── Adoptions ───────────────────────────────────────────────────────

/**
 * GET /api/workspaces/:workspaceId/adoptions
 * List workspace's framework adoptions.
 * Supports ?active=true to only show active adoptions.
 */
frameworkRoutes.get('/adoptions', async (c) => {
  const workspaceId = c.get('workspaceId')
  const activeOnly = c.req.query('active') === 'true'

  let sql = `SELECT wa.id, wa.workspace_id, wa.framework_version_id, wa.adopted_at,
                    wa.adopted_by, wa.reason, wa.effective_from, wa.effective_until,
                    wa.superseded_by, wa.auto_update_minor, wa.created_at,
                    f.name as framework_name, f.slug as framework_slug,
                    fv.version as framework_version
             FROM workspace_adoptions wa
             JOIN framework_versions fv ON fv.id = wa.framework_version_id
             JOIN frameworks f ON f.id = fv.framework_id
             WHERE wa.workspace_id = ?`

  if (activeOnly) {
    sql += ` AND (wa.effective_until IS NULL OR wa.effective_until > datetime('now'))`
  }

  sql += ' ORDER BY wa.adopted_at DESC'

  const { results } = await c.env.DB.prepare(sql)
    .bind(workspaceId)
    .all<{
      id: string
      workspace_id: string
      framework_version_id: string
      adopted_at: string
      adopted_by: string
      reason: string | null
      effective_from: string
      effective_until: string | null
      superseded_by: string | null
      auto_update_minor: number
      created_at: string
      framework_name: string
      framework_slug: string
      framework_version: string
    }>()

  return c.json({
    adoptions: results.map((a) => ({
      id: a.id,
      workspaceId: a.workspace_id,
      frameworkVersionId: a.framework_version_id,
      adoptedAt: a.adopted_at,
      adoptedBy: a.adopted_by,
      reason: a.reason,
      effectiveFrom: a.effective_from,
      effectiveUntil: a.effective_until,
      supersededBy: a.superseded_by,
      autoUpdateMinor: Boolean(a.auto_update_minor),
      createdAt: a.created_at,
      frameworkName: a.framework_name,
      frameworkSlug: a.framework_slug,
      frameworkVersion: a.framework_version,
    })),
  })
})

const adoptFrameworkSchema = z.object({
  frameworkVersionId: z.string().min(1),
  reason: z.string().optional(),
})

/**
 * POST /api/workspaces/:workspaceId/adoptions
 * Adopt a framework version. Requires admin+ role.
 */
frameworkRoutes.post(
  '/adoptions',
  requireRole('admin'),
  zValidator('json', adoptFrameworkSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const { frameworkVersionId, reason } = c.req.valid('json')
    const now = new Date().toISOString()

    // Verify framework version exists
    const fv = await c.env.DB.prepare(
      'SELECT id FROM framework_versions WHERE id = ?'
    )
      .bind(frameworkVersionId)
      .first<{ id: string }>()

    if (!fv) {
      return c.json({ error: 'Framework version not found' }, 404)
    }

    // Check for existing active adoption of the same framework version
    const existing = await c.env.DB.prepare(
      `SELECT id FROM workspace_adoptions
       WHERE workspace_id = ? AND framework_version_id = ?
       AND (effective_until IS NULL OR effective_until > datetime('now'))`
    )
      .bind(workspaceId, frameworkVersionId)
      .first()

    if (existing) {
      return c.json(
        { error: 'This framework version is already actively adopted' },
        409
      )
    }

    const adoptionId = generateId()

    await c.env.DB.prepare(
      `INSERT INTO workspace_adoptions (id, workspace_id, framework_version_id, adopted_at, adopted_by, reason, effective_from, effective_until, auto_update_minor, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 0, ?)`
    )
      .bind(adoptionId, workspaceId, frameworkVersionId, now, userId, reason ?? null, now, now)
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'framework.adopted',
      entityType: 'workspace_adoption',
      entityId: adoptionId,
      data: { frameworkVersionId, reason },
      actorId: userId,
    })

    return c.json(
      {
        adoption: {
          id: adoptionId,
          workspaceId,
          frameworkVersionId,
          adoptedAt: now,
          adoptedBy: userId,
          reason: reason ?? null,
          effectiveFrom: now,
          effectiveUntil: null,
          supersededBy: null,
          autoUpdateMinor: false,
          createdAt: now,
        },
      },
      201
    )
  }
)

// ─── Control CRUD ───────────────────────────────────────────────────

const createControlSchema = z.object({
  controlId: z.string().min(1),
  domain: z.string().optional(),
  subdomain: z.string().optional(),
  title: z.string().min(1),
  requirementText: z.string().min(1),
  guidance: z.string().optional(),
  evidenceRequirements: z.array(z.string()).optional(),
  riskWeight: z.number().min(0).max(1).optional(),
  implementationGroup: z.string().optional(),
})

/**
 * POST /api/workspaces/:workspaceId/framework-versions/:fvId/controls
 * Create a new control in a framework version. Requires admin+.
 */
frameworkRoutes.post(
  '/framework-versions/:fvId/controls',
  requireRole('admin'),
  zValidator('json', createControlSchema),
  async (c) => {
    const fvId = c.req.param('fvId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()

    // Verify framework version exists
    const fv = await c.env.DB.prepare('SELECT id FROM framework_versions WHERE id = ?')
      .bind(fvId).first<{ id: string }>()
    if (!fv) return c.json({ error: 'Framework version not found' }, 404)

    // Check duplicate control_id
    const existing = await c.env.DB.prepare(
      'SELECT id FROM versioned_controls WHERE framework_version_id = ? AND control_id = ?'
    ).bind(fvId, body.controlId).first()
    if (existing) return c.json({ error: `Control ${body.controlId} already exists` }, 409)

    const id = generateId()
    await c.env.DB.prepare(
      `INSERT INTO versioned_controls (id, framework_version_id, control_id, domain, subdomain, title, requirement_text, guidance, evidence_requirements, risk_weight, implementation_group, deprecated, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`
    ).bind(
      id, fvId, body.controlId, body.domain ?? null, body.subdomain ?? null,
      body.title, body.requirementText, body.guidance ?? null,
      JSON.stringify(body.evidenceRequirements ?? []),
      body.riskWeight ?? 0.5, body.implementationGroup ?? null, now
    ).run()

    // Update total_controls
    await c.env.DB.prepare(
      'UPDATE framework_versions SET total_controls = (SELECT COUNT(*) FROM versioned_controls WHERE framework_version_id = ?) WHERE id = ?'
    ).bind(fvId, fvId).run()

    return c.json({ control: { id, ...body, createdAt: now } }, 201)
  }
)

const updateControlSchema = z.object({
  controlId: z.string().min(1).optional(),
  domain: z.string().optional(),
  subdomain: z.string().optional(),
  title: z.string().min(1).optional(),
  requirementText: z.string().min(1).optional(),
  guidance: z.string().optional(),
  evidenceRequirements: z.array(z.string()).optional(),
  riskWeight: z.number().min(0).max(1).optional(),
  implementationGroup: z.string().optional(),
})

/**
 * PUT /api/workspaces/:workspaceId/framework-versions/:fvId/controls/:ctrlId
 * Update a control. Requires admin+.
 */
frameworkRoutes.put(
  '/framework-versions/:fvId/controls/:ctrlId',
  requireRole('admin'),
  zValidator('json', updateControlSchema),
  async (c) => {
    const fvId = c.req.param('fvId')
    const ctrlId = c.req.param('ctrlId')
    const body = c.req.valid('json')

    const ctrl = await c.env.DB.prepare(
      'SELECT id FROM versioned_controls WHERE id = ? AND framework_version_id = ?'
    ).bind(ctrlId, fvId).first()
    if (!ctrl) return c.json({ error: 'Control not found' }, 404)

    const sets: string[] = []
    const bindings: unknown[] = []

    if (body.controlId !== undefined) { sets.push('control_id = ?'); bindings.push(body.controlId) }
    if (body.domain !== undefined) { sets.push('domain = ?'); bindings.push(body.domain) }
    if (body.subdomain !== undefined) { sets.push('subdomain = ?'); bindings.push(body.subdomain) }
    if (body.title !== undefined) { sets.push('title = ?'); bindings.push(body.title) }
    if (body.requirementText !== undefined) { sets.push('requirement_text = ?'); bindings.push(body.requirementText) }
    if (body.guidance !== undefined) { sets.push('guidance = ?'); bindings.push(body.guidance) }
    if (body.evidenceRequirements !== undefined) { sets.push('evidence_requirements = ?'); bindings.push(JSON.stringify(body.evidenceRequirements)) }
    if (body.riskWeight !== undefined) { sets.push('risk_weight = ?'); bindings.push(body.riskWeight) }
    if (body.implementationGroup !== undefined) { sets.push('implementation_group = ?'); bindings.push(body.implementationGroup) }

    if (sets.length === 0) return c.json({ error: 'No fields to update' }, 400)

    bindings.push(ctrlId)
    await c.env.DB.prepare(`UPDATE versioned_controls SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...bindings).run()

    return c.json({ success: true })
  }
)

/**
 * DELETE /api/workspaces/:workspaceId/framework-versions/:fvId/controls/:ctrlId
 * Delete a control. Requires admin+.
 */
frameworkRoutes.delete(
  '/framework-versions/:fvId/controls/:ctrlId',
  requireRole('admin'),
  async (c) => {
    const fvId = c.req.param('fvId')
    const ctrlId = c.req.param('ctrlId')

    const ctrl = await c.env.DB.prepare(
      'SELECT id FROM versioned_controls WHERE id = ? AND framework_version_id = ?'
    ).bind(ctrlId, fvId).first()
    if (!ctrl) return c.json({ error: 'Control not found' }, 404)

    await c.env.DB.prepare('DELETE FROM versioned_controls WHERE id = ?').bind(ctrlId).run()

    // Update total_controls
    await c.env.DB.prepare(
      'UPDATE framework_versions SET total_controls = (SELECT COUNT(*) FROM versioned_controls WHERE framework_version_id = ?) WHERE id = ?'
    ).bind(fvId, fvId).run()

    return c.json({ success: true })
  }
)

// ─── CSV Import ─────────────────────────────────────────────────────

/**
 * Simple CSV parser that handles quoted fields.
 */
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0])
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h.trim().toLowerCase()] = (values[idx] ?? '').trim() })
    rows.push(row)
  }
  return rows
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else { inQuotes = !inQuotes }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

/**
 * GET /api/workspaces/:workspaceId/frameworks/csv-template
 * Download a CSV template for framework import.
 */
frameworkRoutes.get('/frameworks/csv-template', async (c) => {
  const csv = [
    'control_id,domain,subdomain,title,requirement_text,guidance,evidence_requirements,risk_weight,implementation_group',
    '"1.1","Access Control","Authentication","Enforce MFA for all users","All users must authenticate with multi-factor authentication.","Use TOTP or hardware keys.","MFA enrollment report;MFA policy screenshot","0.8","IG1"',
    '"1.2","Access Control","Authorization","Implement least privilege","Users should only have access necessary for their role.","Review access quarterly.","Access review report;Role matrix","0.7","IG1"',
  ].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="framework-template.csv"',
    },
  })
})

/**
 * POST /api/workspaces/:workspaceId/frameworks/import
 * Import a framework from CSV. Accepts multipart/form-data with:
 *   - file: CSV file
 *   - name: Framework name
 *   - slug: Framework slug
 *   - version: Version string
 *   - description: (optional)
 *   - sourceOrg: (optional)
 */
frameworkRoutes.post(
  '/frameworks/import',
  requireRole('admin'),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const now = new Date().toISOString()

    const formData = await c.req.formData()
    const file = formData.get('file') as File | null
    const name = formData.get('name') as string | null
    const slug = formData.get('slug') as string | null
    const version = formData.get('version') as string | null
    const description = formData.get('description') as string | null
    const sourceOrg = formData.get('sourceOrg') as string | null

    if (!file || !name || !slug || !version) {
      return c.json({ error: 'file, name, slug, and version are required' }, 400)
    }

    const csvText = await file.text()
    const rows = parseCSV(csvText)

    if (rows.length === 0) {
      return c.json({ error: 'CSV file is empty or has no data rows' }, 400)
    }

    // Validate required columns
    const requiredCols = ['control_id', 'title', 'requirement_text']
    const firstRow = rows[0]
    for (const col of requiredCols) {
      if (!(col in firstRow)) {
        return c.json({ error: `Missing required column: ${col}` }, 400)
      }
    }

    // Upsert framework
    const frameworkId = generateId()
    await c.env.DB.prepare(
      `INSERT INTO frameworks (id, slug, name, description, source_org, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET name = excluded.name, description = excluded.description`
    ).bind(frameworkId, slug, name, description, sourceOrg, now).run()

    // Get the actual framework id (might be existing)
    const fw = await c.env.DB.prepare('SELECT id FROM frameworks WHERE slug = ?')
      .bind(slug).first<{ id: string }>()
    const actualFwId = fw!.id

    // Create framework version
    const fvId = generateId()
    await c.env.DB.prepare(
      `INSERT INTO framework_versions (id, framework_id, version, status, total_controls, published_at, created_at)
       VALUES (?, ?, ?, 'current', ?, ?, ?)`
    ).bind(fvId, actualFwId, version, rows.length, now, now).run()

    // Insert controls in batches of 25
    const batchSize = 25
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize)
      const stmts = batch.map(row => {
        const evidenceReqs = row.evidence_requirements
          ? row.evidence_requirements.split(';').map(s => s.trim()).filter(Boolean)
          : []

        return c.env.DB.prepare(
          `INSERT INTO versioned_controls (id, framework_version_id, control_id, domain, subdomain, title, requirement_text, guidance, evidence_requirements, risk_weight, implementation_group, deprecated, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`
        ).bind(
          generateId(), fvId,
          row.control_id, row.domain || null, row.subdomain || null,
          row.title, row.requirement_text, row.guidance || null,
          JSON.stringify(evidenceReqs),
          parseFloat(row.risk_weight || '0.5'),
          row.implementation_group || null, now
        )
      })
      await c.env.DB.batch(stmts)
    }

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'framework.imported',
      entityType: 'framework_version',
      entityId: fvId,
      data: { name, slug, version, controlCount: rows.length },
      actorId: userId,
    })

    return c.json({
      framework: { id: actualFwId, slug, name },
      version: { id: fvId, version, totalControls: rows.length },
    }, 201)
  }
)

// ─── Crosswalks ─────────────────────────────────────────────────────

/**
 * GET /api/workspaces/:workspaceId/controls/:controlId/crosswalks
 * List all crosswalk mappings for a control (both as source and target).
 * Joins with versioned_controls and frameworks to provide full context.
 */
frameworkRoutes.get('/controls/:controlId/crosswalks', async (c) => {
  const controlId = c.req.param('controlId')

  // Verify control exists
  const ctrl = await c.env.DB.prepare(
    'SELECT id FROM versioned_controls WHERE id = ?'
  )
    .bind(controlId)
    .first()

  if (!ctrl) {
    return c.json({ error: 'Control not found' }, 404)
  }

  // Find crosswalks where this control is the source
  const { results: asSource } = await c.env.DB.prepare(
    `SELECT cw.id, cw.mapping_type, cw.confidence, cw.notes, cw.created_at,
            vc.id as target_id, vc.control_id as target_control_id,
            vc.title as target_title, vc.domain as target_domain,
            f.name as target_framework_name, f.slug as target_framework_slug,
            fv.version as target_framework_version
     FROM control_crosswalks cw
     JOIN versioned_controls vc ON vc.id = cw.target_control_id
     JOIN framework_versions fv ON fv.id = vc.framework_version_id
     JOIN frameworks f ON f.id = fv.framework_id
     WHERE cw.source_control_id = ?
     ORDER BY f.name ASC, vc.control_id ASC`
  )
    .bind(controlId)
    .all<{
      id: string
      mapping_type: string
      confidence: number
      notes: string | null
      created_at: string
      target_id: string
      target_control_id: string
      target_title: string
      target_domain: string | null
      target_framework_name: string
      target_framework_slug: string
      target_framework_version: string
    }>()

  // Find crosswalks where this control is the target
  const { results: asTarget } = await c.env.DB.prepare(
    `SELECT cw.id, cw.mapping_type, cw.confidence, cw.notes, cw.created_at,
            vc.id as source_id, vc.control_id as source_control_id,
            vc.title as source_title, vc.domain as source_domain,
            f.name as source_framework_name, f.slug as source_framework_slug,
            fv.version as source_framework_version
     FROM control_crosswalks cw
     JOIN versioned_controls vc ON vc.id = cw.source_control_id
     JOIN framework_versions fv ON fv.id = vc.framework_version_id
     JOIN frameworks f ON f.id = fv.framework_id
     WHERE cw.target_control_id = ?
     ORDER BY f.name ASC, vc.control_id ASC`
  )
    .bind(controlId)
    .all<{
      id: string
      mapping_type: string
      confidence: number
      notes: string | null
      created_at: string
      source_id: string
      source_control_id: string
      source_title: string
      source_domain: string | null
      source_framework_name: string
      source_framework_slug: string
      source_framework_version: string
    }>()

  return c.json({
    crosswalks: {
      asSource: asSource.map((r) => ({
        id: r.id,
        mappingType: r.mapping_type,
        confidence: r.confidence,
        notes: r.notes,
        createdAt: r.created_at,
        targetControlId: r.target_control_id,
        targetControlUlid: r.target_id,
        targetTitle: r.target_title,
        targetDomain: r.target_domain,
        targetFrameworkName: r.target_framework_name,
        targetFrameworkSlug: r.target_framework_slug,
        targetFrameworkVersion: r.target_framework_version,
      })),
      asTarget: asTarget.map((r) => ({
        id: r.id,
        mappingType: r.mapping_type,
        confidence: r.confidence,
        notes: r.notes,
        createdAt: r.created_at,
        sourceControlId: r.source_control_id,
        sourceControlUlid: r.source_id,
        sourceTitle: r.source_title,
        sourceDomain: r.source_domain,
        sourceFrameworkName: r.source_framework_name,
        sourceFrameworkSlug: r.source_framework_slug,
        sourceFrameworkVersion: r.source_framework_version,
      })),
    },
  })
})

// ─── Gap Analysis ───────────────────────────────────────────────────

/**
 * GET /api/workspaces/:workspaceId/gap-analysis
 * Cross-framework gap analysis engine.
 * Query params: ?sourceFramework=soc2&targetFramework=iso27001
 *
 * For each target control, determines status:
 *   - compliant: workspace has a direct evidence_link for this target control
 *   - auto_satisfied: a crosswalk-linked source control has evidence
 *   - partial: a partial crosswalk-linked source control has evidence
 *   - gap: no evidence coverage at all
 */
frameworkRoutes.get('/gap-analysis', async (c) => {
  const workspaceId = c.get('workspaceId')
  const sourceSlug = c.req.query('sourceFramework')
  const targetSlug = c.req.query('targetFramework')

  if (!sourceSlug || !targetSlug) {
    return c.json(
      { error: 'Both sourceFramework and targetFramework query params are required' },
      400
    )
  }

  const db = c.env.DB

  // 1. Get the workspace's active adoption for the source framework
  const sourceAdoption = await db
    .prepare(
      `SELECT wa.framework_version_id, f.name as framework_name, fv.version as framework_version
       FROM workspace_adoptions wa
       JOIN framework_versions fv ON fv.id = wa.framework_version_id
       JOIN frameworks f ON f.id = fv.framework_id
       WHERE wa.workspace_id = ? AND f.slug = ?
       AND (wa.effective_until IS NULL OR wa.effective_until > datetime('now'))
       ORDER BY wa.adopted_at DESC
       LIMIT 1`
    )
    .bind(workspaceId, sourceSlug)
    .first<{
      framework_version_id: string
      framework_name: string
      framework_version: string
    }>()

  if (!sourceAdoption) {
    return c.json(
      { error: `No active adoption found for source framework: ${sourceSlug}` },
      404
    )
  }

  // 2. Get the target framework version (latest 'current')
  const targetVersion = await db
    .prepare(
      `SELECT fv.id, f.name as framework_name, fv.version as framework_version,
              fv.total_controls
       FROM framework_versions fv
       JOIN frameworks f ON f.id = fv.framework_id
       WHERE f.slug = ? AND fv.status = 'current'
       ORDER BY fv.created_at DESC
       LIMIT 1`
    )
    .bind(targetSlug)
    .first<{
      id: string
      framework_name: string
      framework_version: string
      total_controls: number
    }>()

  if (!targetVersion) {
    return c.json(
      { error: `No current version found for target framework: ${targetSlug}` },
      404
    )
  }

  // 3. Get all source controls (from the adopted version)
  const { results: sourceControls } = await db
    .prepare(
      'SELECT id, control_id FROM versioned_controls WHERE framework_version_id = ?'
    )
    .bind(sourceAdoption.framework_version_id)
    .all<{ id: string; control_id: string }>()

  const sourceControlIds = sourceControls.map((sc) => sc.id)

  // 4. Get all target controls
  const { results: targetControls } = await db
    .prepare(
      `SELECT id, control_id, title, domain
       FROM versioned_controls
       WHERE framework_version_id = ?
       ORDER BY control_id ASC`
    )
    .bind(targetVersion.id)
    .all<{
      id: string
      control_id: string
      title: string
      domain: string | null
    }>()

  // 5. Get all evidence_links for this workspace (source + target controls)
  const { results: evidenceLinks } = await db
    .prepare(
      'SELECT control_id, COUNT(*) as count FROM evidence_links WHERE workspace_id = ? GROUP BY control_id'
    )
    .bind(workspaceId)
    .all<{ control_id: string; count: number }>()

  const evidenceByControl = new Map(
    evidenceLinks.map((el) => [el.control_id, el.count])
  )

  // 6. Get all crosswalks from source controls to target controls
  //    We need crosswalks where source is in our source controls
  //    and target is in our target controls
  const { results: crosswalks } = await db
    .prepare(
      `SELECT cw.source_control_id, cw.target_control_id, cw.mapping_type, cw.confidence,
              src_vc.control_id as source_control_human_id
       FROM control_crosswalks cw
       JOIN versioned_controls src_vc ON src_vc.id = cw.source_control_id
       WHERE cw.source_control_id IN (
         SELECT id FROM versioned_controls WHERE framework_version_id = ?
       )
       AND cw.target_control_id IN (
         SELECT id FROM versioned_controls WHERE framework_version_id = ?
       )`
    )
    .bind(sourceAdoption.framework_version_id, targetVersion.id)
    .all<{
      source_control_id: string
      target_control_id: string
      mapping_type: string
      confidence: number
      source_control_human_id: string
    }>()

  // Build a map: target control ULID -> list of crosswalk entries
  const crosswalksByTarget = new Map<
    string,
    Array<{
      sourceControlId: string
      sourceControlHumanId: string
      mappingType: string
      confidence: number
    }>
  >()

  for (const cw of crosswalks) {
    const list = crosswalksByTarget.get(cw.target_control_id) ?? []
    list.push({
      sourceControlId: cw.source_control_id,
      sourceControlHumanId: cw.source_control_human_id,
      mappingType: cw.mapping_type,
      confidence: cw.confidence,
    })
    crosswalksByTarget.set(cw.target_control_id, list)
  }

  // 7. Classify each target control
  let compliantCount = 0
  let autoSatisfiedCount = 0
  let partialCount = 0
  let gapCount = 0
  let notApplicableCount = 0

  const controlResults: Array<{
    controlId: string
    title: string
    domain: string | null
    status: string
    satisfiedBy: Array<{
      controlId: string
      framework: string
      mappingType: string
      confidence: number
    }>
    evidenceCount: number
  }> = []

  for (const tc of targetControls) {
    const directEvidence = evidenceByControl.get(tc.id) ?? 0
    const mappings = crosswalksByTarget.get(tc.id) ?? []

    let status: string
    const satisfiedBy: Array<{
      controlId: string
      framework: string
      mappingType: string
      confidence: number
    }> = []

    if (directEvidence > 0) {
      // Direct evidence exists for this target control
      status = 'compliant'
      compliantCount++
    } else if (mappings.length > 0) {
      // Check if any mapped source control has evidence
      const equivalentWithEvidence = mappings.filter(
        (m) =>
          m.mappingType === 'equivalent' &&
          (evidenceByControl.get(m.sourceControlId) ?? 0) > 0
      )
      const partialWithEvidence = mappings.filter(
        (m) =>
          m.mappingType === 'partial' &&
          (evidenceByControl.get(m.sourceControlId) ?? 0) > 0
      )

      if (equivalentWithEvidence.length > 0) {
        status = 'auto_satisfied'
        autoSatisfiedCount++
        for (const m of equivalentWithEvidence) {
          satisfiedBy.push({
            controlId: m.sourceControlHumanId,
            framework: sourceAdoption.framework_name,
            mappingType: m.mappingType,
            confidence: m.confidence,
          })
        }
      } else if (partialWithEvidence.length > 0) {
        status = 'partial'
        partialCount++
        for (const m of partialWithEvidence) {
          satisfiedBy.push({
            controlId: m.sourceControlHumanId,
            framework: sourceAdoption.framework_name,
            mappingType: m.mappingType,
            confidence: m.confidence,
          })
        }
      } else {
        status = 'gap'
        gapCount++
      }
    } else {
      status = 'gap'
      gapCount++
    }

    controlResults.push({
      controlId: tc.control_id,
      title: tc.title,
      domain: tc.domain,
      status,
      satisfiedBy,
      evidenceCount: directEvidence,
    })
  }

  const total = targetControls.length
  const coveredCount = compliantCount + autoSatisfiedCount + partialCount
  const coveragePercent =
    total > 0
      ? Math.round((coveredCount / total) * 1000) / 10
      : 0

  // Get source total controls
  const sourceTotal = sourceControls.length

  return c.json({
    gapAnalysis: {
      sourceFramework: {
        name: sourceAdoption.framework_name,
        version: sourceAdoption.framework_version,
        totalControls: sourceTotal,
      },
      targetFramework: {
        name: targetVersion.framework_name,
        version: targetVersion.framework_version,
        totalControls: targetVersion.total_controls,
      },
      summary: {
        total,
        compliant: compliantCount,
        autoSatisfied: autoSatisfiedCount,
        partial: partialCount,
        gap: gapCount,
        notApplicable: notApplicableCount,
        coveragePercent,
      },
      controls: controlResults,
    },
  })
})

export { frameworkRoutes }
