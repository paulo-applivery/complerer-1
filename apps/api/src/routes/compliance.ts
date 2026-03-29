import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { AppType } from '../types.js'
import { generateId } from '../lib/id.js'
import { emitEvent } from '../lib/events.js'
import { workspaceMiddleware, requireRole } from '../middleware/workspace.js'
import { authMiddleware } from '../middleware/auth.js'

/**
 * Compliance routes — mounted at /api/workspaces/:workspaceId
 * Handles systems, directory users, access records, evidence, and compliance events.
 */
const complianceRoutes = new Hono<AppType>()

// All routes require authentication + workspace membership
complianceRoutes.use('*', authMiddleware)
complianceRoutes.use('*', workspaceMiddleware)

// ─── Risk Score Computation ──────────────────────────────────────────

function computeRiskScore(
  system: { classification: string; data_sensitivity: string; mfa_required: number },
  accessRole: string,
  approvedBy: string | null
): number {
  const sensitivity =
    ({ high: 1.0, medium: 0.6, low: 0.3 } as Record<string, number>)[system.data_sensitivity] ?? 0.5
  const privilege =
    ({ admin: 1.0, write: 0.7, read: 0.3 } as Record<string, number>)[accessRole] ?? 0.5
  const mfa = !system.mfa_required && system.classification === 'critical' ? 1.0 : 0.0
  const approval = approvedBy ? 0.0 : 1.0
  return Math.round((sensitivity * 0.3 + privilege * 0.25 + mfa * 0.15 + approval * 0.1) * 100) / 100
}

// ─── Systems ─────────────────────────────────────────────────────────

/**
 * GET /systems
 * List systems for workspace. Sortable by name.
 */
complianceRoutes.get('/systems', async (c) => {
  const workspaceId = c.get('workspaceId')

  const { results } = await c.env.DB.prepare(
    `SELECT s.id, s.workspace_id, s.template_id,
            COALESCE(s.name, sl.name) AS name,
            COALESCE(s.description, sl.description) AS description,
            COALESCE(s.classification, sl.default_classification) AS classification,
            COALESCE(s.data_sensitivity, sl.default_sensitivity) AS data_sensitivity,
            s.owner_email, s.mfa_required, s.environment, s.integration_ref,
            s.created_at, s.updated_at,
            sl.name AS template_name
     FROM systems s
     LEFT JOIN system_library sl ON s.template_id = sl.id
     WHERE s.workspace_id = ?
     ORDER BY COALESCE(s.name, sl.name) ASC`
  )
    .bind(workspaceId)
    .all<{
      id: string
      workspace_id: string
      template_id: string | null
      name: string
      description: string | null
      classification: string
      data_sensitivity: string
      owner_email: string | null
      mfa_required: number
      environment: string
      integration_ref: string | null
      created_at: string
      updated_at: string
      template_name: string | null
    }>()

  return c.json({
    systems: results.map((s) => ({
      id: s.id,
      workspaceId: s.workspace_id,
      templateId: s.template_id,
      name: s.name,
      description: s.description,
      classification: s.classification,
      dataSensitivity: s.data_sensitivity,
      ownerEmail: s.owner_email,
      mfaRequired: Boolean(s.mfa_required),
      environment: s.environment,
      integrationRef: s.integration_ref,
      templateName: s.template_name,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    })),
  })
})

/**
 * GET /systems/library
 * List all systems in the global library, grouped by category.
 */
complianceRoutes.get('/systems/library', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, name, category, description, vendor, website,
            default_classification, default_sensitivity, icon_hint
     FROM system_library
     ORDER BY category, name`
  )
    .bind()
    .all()

  return c.json({ systems: results })
})

/**
 * POST /systems/from-library
 * Add one or more systems from the library to the workspace.
 */
const addFromLibrarySchema = z.object({
  libraryIds: z.array(z.string()).min(1).max(50),
  environment: z.string().optional(),
})

complianceRoutes.post(
  '/systems/from-library',
  requireRole('member'),
  zValidator('json', addFromLibrarySchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const { libraryIds, environment } = c.req.valid('json')
    const now = new Date().toISOString()

    // Fetch library items
    const placeholders = libraryIds.map(() => '?').join(',')
    const { results: libItems } = await c.env.DB.prepare(
      `SELECT * FROM system_library WHERE id IN (${placeholders})`
    )
      .bind(...libraryIds)
      .all<{
        id: string
        name: string
        category: string
        description: string | null
        vendor: string | null
        website: string | null
        default_classification: string
        default_sensitivity: string
      }>()

    // Check which names already exist in workspace
    const { results: existing } = await c.env.DB.prepare(
      'SELECT name FROM systems WHERE workspace_id = ?'
    )
      .bind(workspaceId)
      .all<{ name: string }>()

    const existingNames = new Set(existing.map((e) => e.name.toLowerCase()))

    // Check which templates are already referenced
    const { results: existingRefs } = await c.env.DB.prepare(
      'SELECT template_id FROM systems WHERE workspace_id = ? AND template_id IS NOT NULL'
    ).bind(workspaceId).all<{ template_id: string }>()
    const existingTemplates = new Set(existingRefs.map((e) => e.template_id))

    let created = 0
    let skipped = 0

    for (const item of libItems) {
      if (existingTemplates.has(item.id) || existingNames.has(item.name.toLowerCase())) {
        skipped++
        continue
      }

      const systemId = generateId()
      await c.env.DB.prepare(
        `INSERT INTO systems (id, workspace_id, template_id, environment, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(
          systemId,
          workspaceId,
          item.id,
          environment ?? 'production',
          now,
          now
        )
        .run()

      created++
    }

    return c.json({ created, skipped, total: libItems.length })
  }
)

const createSystemSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  classification: z.string().optional(),
  dataSensitivity: z.string().optional(),
  ownerEmail: z.string().email().optional(),
  mfaRequired: z.boolean().optional(),
  environment: z.string().optional(),
})

/**
 * POST /systems
 * Create a system. Requires member+ role.
 */
complianceRoutes.post(
  '/systems',
  requireRole('member'),
  zValidator('json', createSystemSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()
    const systemId = generateId()

    await c.env.DB.prepare(
      `INSERT INTO systems (id, workspace_id, name, description, classification, data_sensitivity,
                            owner_email, mfa_required, environment, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        systemId,
        workspaceId,
        body.name,
        body.description ?? null,
        body.classification ?? 'standard',
        body.dataSensitivity ?? 'medium',
        body.ownerEmail ?? null,
        body.mfaRequired ? 1 : 0,
        body.environment ?? 'production',
        now,
        now
      )
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'system.created',
      entityType: 'system',
      entityId: systemId,
      data: { name: body.name, classification: body.classification ?? 'standard' },
      actorId: userId,
    })

    return c.json(
      {
        system: {
          id: systemId,
          workspaceId,
          name: body.name,
          description: body.description ?? null,
          classification: body.classification ?? 'standard',
          dataSensitivity: body.dataSensitivity ?? 'medium',
          ownerEmail: body.ownerEmail ?? null,
          mfaRequired: body.mfaRequired ?? false,
          environment: body.environment ?? 'production',
          createdAt: now,
          updatedAt: now,
        },
      },
      201
    )
  }
)

const updateSystemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  classification: z.string().optional(),
  dataSensitivity: z.string().optional(),
  ownerEmail: z.string().email().optional(),
  mfaRequired: z.boolean().optional(),
  environment: z.string().optional(),
})

/**
 * PATCH /systems/:systemId
 * Update a system. Requires admin+ role.
 */
complianceRoutes.patch(
  '/systems/:systemId',
  requireRole('admin'),
  zValidator('json', updateSystemSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const systemId = c.req.param('systemId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()

    // Verify system belongs to workspace
    const existing = await c.env.DB.prepare(
      'SELECT id FROM systems WHERE id = ? AND workspace_id = ?'
    )
      .bind(systemId, workspaceId)
      .first()

    if (!existing) {
      return c.json({ error: 'System not found' }, 404)
    }

    // Build dynamic update
    const sets: string[] = ['updated_at = ?']
    const bindings: unknown[] = [now]

    if (body.name !== undefined) {
      sets.push('name = ?')
      bindings.push(body.name)
    }
    if (body.description !== undefined) {
      sets.push('description = ?')
      bindings.push(body.description)
    }
    if (body.classification !== undefined) {
      sets.push('classification = ?')
      bindings.push(body.classification)
    }
    if (body.dataSensitivity !== undefined) {
      sets.push('data_sensitivity = ?')
      bindings.push(body.dataSensitivity)
    }
    if (body.ownerEmail !== undefined) {
      sets.push('owner_email = ?')
      bindings.push(body.ownerEmail)
    }
    if (body.mfaRequired !== undefined) {
      sets.push('mfa_required = ?')
      bindings.push(body.mfaRequired ? 1 : 0)
    }
    if (body.environment !== undefined) {
      sets.push('environment = ?')
      bindings.push(body.environment)
    }

    bindings.push(systemId, workspaceId)

    await c.env.DB.prepare(
      `UPDATE systems SET ${sets.join(', ')} WHERE id = ? AND workspace_id = ?`
    )
      .bind(...bindings)
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'system.updated',
      entityType: 'system',
      entityId: systemId,
      data: body,
      actorId: userId,
    })

    // Fetch updated record
    const updated = await c.env.DB.prepare(
      `SELECT id, workspace_id, name, description, classification, data_sensitivity,
              owner_email, mfa_required, environment, integration_ref, created_at, updated_at
       FROM systems WHERE id = ?`
    )
      .bind(systemId)
      .first<{
        id: string
        workspace_id: string
        name: string
        description: string | null
        classification: string
        data_sensitivity: string
        owner_email: string | null
        mfa_required: number
        environment: string
        integration_ref: string | null
        created_at: string
        updated_at: string
      }>()

    return c.json({
      system: {
        id: updated!.id,
        workspaceId: updated!.workspace_id,
        name: updated!.name,
        description: updated!.description,
        classification: updated!.classification,
        dataSensitivity: updated!.data_sensitivity,
        ownerEmail: updated!.owner_email,
        mfaRequired: Boolean(updated!.mfa_required),
        environment: updated!.environment,
        integrationRef: updated!.integration_ref,
        createdAt: updated!.created_at,
        updatedAt: updated!.updated_at,
      },
    })
  }
)

// ─── Directory Users ─────────────────────────────────────────────────

/**
 * GET /directory/library
 * List all roles in the employee directory library.
 */
complianceRoutes.get('/directory/library', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, name, department, title, category, description FROM employee_directory_library ORDER BY category, department, name'
  ).bind().all()
  return c.json({ employees: results })
})

/**
 * POST /directory/from-library
 * Add directory entries from library as employees.
 */
const addFromDirectoryLibSchema = z.object({
  libraryIds: z.array(z.string()).min(1).max(50),
})

complianceRoutes.post(
  '/directory/from-library',
  requireRole('member'),
  zValidator('json', addFromDirectoryLibSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const { libraryIds } = c.req.valid('json')
    const now = new Date().toISOString()

    const placeholders = libraryIds.map(() => '?').join(',')
    const { results: libItems } = await c.env.DB.prepare(
      `SELECT * FROM employee_directory_library WHERE id IN (${placeholders})`
    ).bind(...libraryIds).all()

    let created = 0
    let skipped = 0

    for (const item of libItems) {
      const userId = generateId()
      await c.env.DB.prepare(
        `INSERT INTO directory_users (id, workspace_id, name, email, department, title, employment_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`
      ).bind(
        userId, workspaceId,
        (item as any).name,
        `${(item as any).name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@company.com`,
        (item as any).department,
        (item as any).title,
        now, now
      ).run()
      created++
    }

    return c.json({ created, skipped, total: libItems.length })
  }
)

/**
 * GET /directory
 * List directory users. Supports ?status= and ?search= filters.
 */
complianceRoutes.get('/directory', async (c) => {
  const workspaceId = c.get('workspaceId')
  const status = c.req.query('status')
  const search = c.req.query('search')

  let countSql = 'SELECT COUNT(*) as total FROM directory_users WHERE workspace_id = ?'
  let dataSql = `SELECT id, workspace_id, email, name, department, title, manager_id,
                        employment_status, source, external_id, created_at, updated_at
                 FROM directory_users WHERE workspace_id = ?`

  const bindings: unknown[] = [workspaceId]

  if (status) {
    countSql += ' AND employment_status = ?'
    dataSql += ' AND employment_status = ?'
    bindings.push(status)
  }

  if (search) {
    countSql += ' AND (name LIKE ? OR email LIKE ?)'
    dataSql += ' AND (name LIKE ? OR email LIKE ?)'
    const pattern = `%${search}%`
    bindings.push(pattern, pattern)
  }

  dataSql += ' ORDER BY name ASC'

  const countResult = await c.env.DB.prepare(countSql)
    .bind(...bindings)
    .first<{ total: number }>()

  const { results } = await c.env.DB.prepare(dataSql)
    .bind(...bindings)
    .all<{
      id: string
      workspace_id: string
      email: string
      name: string
      department: string | null
      title: string | null
      manager_id: string | null
      employment_status: string
      source: string
      external_id: string | null
      created_at: string
      updated_at: string
    }>()

  return c.json({
    users: results.map((u) => ({
      id: u.id,
      workspaceId: u.workspace_id,
      email: u.email,
      name: u.name,
      department: u.department,
      title: u.title,
      managerId: u.manager_id,
      employmentStatus: u.employment_status,
      source: u.source,
      externalId: u.external_id,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    })),
    total: countResult?.total ?? 0,
  })
})

const createDirectoryUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  department: z.string().optional(),
  title: z.string().optional(),
  employmentStatus: z.string().optional(),
})

/**
 * POST /directory
 * Create directory user. Requires member+ role.
 */
complianceRoutes.post(
  '/directory',
  requireRole('member'),
  zValidator('json', createDirectoryUserSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()
    const directoryUserId = generateId()

    await c.env.DB.prepare(
      `INSERT INTO directory_users (id, workspace_id, email, name, department, title,
                                    employment_status, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'manual', ?, ?)`
    )
      .bind(
        directoryUserId,
        workspaceId,
        body.email,
        body.name,
        body.department ?? null,
        body.title ?? null,
        body.employmentStatus ?? 'active',
        now,
        now
      )
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'directory_user.created',
      entityType: 'directory_user',
      entityId: directoryUserId,
      data: { email: body.email, name: body.name },
      actorId: userId,
    })

    return c.json(
      {
        user: {
          id: directoryUserId,
          workspaceId,
          email: body.email,
          name: body.name,
          department: body.department ?? null,
          title: body.title ?? null,
          managerId: null,
          employmentStatus: body.employmentStatus ?? 'active',
          source: 'manual',
          externalId: null,
          createdAt: now,
          updatedAt: now,
        },
      },
      201
    )
  }
)

/**
 * PUT /directory/:userId
 * Update a directory user.
 */
const updateDirectoryUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  department: z.string().optional(),
  title: z.string().optional(),
  employmentStatus: z.string().optional(),
})

complianceRoutes.put(
  '/directory/:userId',
  requireRole('member'),
  zValidator('json', updateDirectoryUserSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.req.param('userId')
    const updates = c.req.valid('json')
    const now = new Date().toISOString()

    // Verify user belongs to workspace
    const existing = await c.env.DB.prepare(
      'SELECT id FROM directory_users WHERE id = ? AND workspace_id = ?'
    ).bind(userId, workspaceId).first()

    if (!existing) return c.json({ error: 'User not found' }, 404)

    const setClauses: string[] = ['updated_at = ?']
    const values: any[] = [now]

    if (updates.name !== undefined) { setClauses.push('name = ?'); values.push(updates.name) }
    if (updates.email !== undefined) { setClauses.push('email = ?'); values.push(updates.email) }
    if (updates.department !== undefined) { setClauses.push('department = ?'); values.push(updates.department) }
    if (updates.title !== undefined) { setClauses.push('title = ?'); values.push(updates.title) }
    if (updates.employmentStatus !== undefined) { setClauses.push('employment_status = ?'); values.push(updates.employmentStatus) }

    values.push(userId, workspaceId)

    await c.env.DB.prepare(
      `UPDATE directory_users SET ${setClauses.join(', ')} WHERE id = ? AND workspace_id = ?`
    ).bind(...values).run()

    // Fetch updated record
    const updated = await c.env.DB.prepare(
      'SELECT * FROM directory_users WHERE id = ? AND workspace_id = ?'
    ).bind(userId, workspaceId).first()

    return c.json({ user: updated })
  }
)

/**
 * DELETE /directory/:userId
 * Delete a directory user.
 */
complianceRoutes.delete(
  '/directory/:userId',
  requireRole('member'),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.req.param('userId')

    const existing = await c.env.DB.prepare(
      'SELECT id FROM directory_users WHERE id = ? AND workspace_id = ?'
    ).bind(userId, workspaceId).first()

    if (!existing) return c.json({ error: 'User not found' }, 404)

    // Delete custom field values first
    await c.env.DB.prepare(
      'DELETE FROM custom_field_values WHERE workspace_id = ? AND entity_id = ?'
    ).bind(workspaceId, userId).run()

    // Delete the user
    await c.env.DB.prepare(
      'DELETE FROM directory_users WHERE id = ? AND workspace_id = ?'
    ).bind(userId, workspaceId).run()

    return c.json({ ok: true })
  }
)

// ─── Access Records ──────────────────────────────────────────────────

/**
 * GET /access
 * List access records with joins to directory_users and systems.
 * Supports ?systemId=, ?userId=, ?status=active|revoked|all, ?page=&limit=.
 */
complianceRoutes.get('/access', async (c) => {
  const workspaceId = c.get('workspaceId')
  const systemIdFilter = c.req.query('systemId')
  const userIdFilter = c.req.query('userId')
  const status = c.req.query('status') ?? 'active'
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '50', 10)))
  const offset = (page - 1) * limit

  let countSql = `SELECT COUNT(*) as total
                  FROM access_records ar
                  WHERE ar.workspace_id = ?`
  let dataSql = `SELECT ar.id, ar.workspace_id, ar.user_id, ar.system_id, ar.role,
                        ar.access_type, ar.granted_at, ar.granted_by, ar.approved_by,
                        ar.approval_method, ar.ticket_ref, ar.reviewed_at, ar.reviewed_by,
                        ar.revoked_at, ar.revoked_by, ar.revocation_reason, ar.risk_score,
                        ar.source, ar.created_at, ar.status,
                        ar.updated_at, ar.updated_by,
                        ar.license_type, ar.cost_per_period, ar.cost_currency, ar.cost_frequency,
                        du.name as user_name, du.email as user_email,
                        s.name as system_name
                 FROM access_records ar
                 JOIN directory_users du ON du.id = ar.user_id
                 JOIN systems s ON s.id = ar.system_id
                 WHERE ar.workspace_id = ?`

  const bindings: unknown[] = [workspaceId]

  if (status && status !== 'all' && status !== '') {
    // Also match NULL status as 'active' for pre-migration records
    if (status === 'active') {
      countSql += " AND (ar.status = 'active' OR ar.status IS NULL)"
      dataSql += " AND (ar.status = 'active' OR ar.status IS NULL)"
    } else {
      countSql += ' AND ar.status = ?'
      dataSql += ' AND ar.status = ?'
      bindings.push(status)
    }
  }

  if (systemIdFilter) {
    countSql += ' AND ar.system_id = ?'
    dataSql += ' AND ar.system_id = ?'
    bindings.push(systemIdFilter)
  }

  if (userIdFilter) {
    countSql += ' AND ar.user_id = ?'
    dataSql += ' AND ar.user_id = ?'
    bindings.push(userIdFilter)
  }

  dataSql += ' ORDER BY ar.granted_at DESC LIMIT ? OFFSET ?'

  const countResult = await c.env.DB.prepare(countSql)
    .bind(...bindings)
    .first<{ total: number }>()

  const { results } = await c.env.DB.prepare(dataSql)
    .bind(...bindings, limit, offset)
    .all<{
      id: string
      workspace_id: string
      user_id: string
      system_id: string
      role: string
      access_type: string
      granted_at: string
      granted_by: string | null
      approved_by: string | null
      approval_method: string | null
      ticket_ref: string | null
      reviewed_at: string | null
      reviewed_by: string | null
      revoked_at: string | null
      revoked_by: string | null
      revocation_reason: string | null
      risk_score: number
      source: string
      created_at: string
      status: string
      updated_at: string | null
      updated_by: string | null
      license_type: string | null
      cost_per_period: number | null
      cost_currency: string | null
      cost_frequency: string | null
      user_name: string
      user_email: string
      system_name: string
    }>()

  return c.json({
    records: results.map((r) => ({
      id: r.id,
      workspaceId: r.workspace_id,
      userId: r.user_id,
      systemId: r.system_id,
      role: r.role,
      accessType: r.access_type,
      grantedAt: r.granted_at,
      grantedBy: r.granted_by,
      approvedBy: r.approved_by,
      approvalMethod: r.approval_method,
      ticketRef: r.ticket_ref,
      reviewedAt: r.reviewed_at,
      reviewedBy: r.reviewed_by,
      revokedAt: r.revoked_at,
      revokedBy: r.revoked_by,
      revocationReason: r.revocation_reason,
      riskScore: r.risk_score,
      source: r.source,
      createdAt: r.created_at,
      status: r.status,
      updatedAt: r.updated_at,
      updatedBy: r.updated_by,
      licenseType: r.license_type,
      costPerPeriod: r.cost_per_period,
      costCurrency: r.cost_currency,
      costFrequency: r.cost_frequency,
      userName: r.user_name,
      userEmail: r.user_email,
      systemName: r.system_name,
    })),
    total: countResult?.total ?? 0,
    page,
    limit,
  })
})

const createAccessRecordSchema = z.object({
  userId: z.string().min(1),
  systemId: z.string().min(1),
  role: z.string().min(1),
  accessType: z.string().optional(),
  grantedBy: z.string().optional(),
  approvedBy: z.string().optional(),
  approvalMethod: z.string().optional(),
  ticketRef: z.string().optional(),
  status: z.enum(['requested', 'approved', 'active', 'pending_review', 'suspended', 'expired', 'revoked']).optional(),
  licenseType: z.string().optional(),
  costPerPeriod: z.number().optional(),
  costCurrency: z.string().optional(),
  costFrequency: z.enum(['monthly', 'annual', 'one-time']).optional(),
  customFields: z.record(z.string(), z.string()).optional(),
})

/**
 * POST /access
 * Create access record. Requires member+ role.
 * Computes risk_score on insert.
 */
complianceRoutes.post(
  '/access',
  requireRole('member'),
  zValidator('json', createAccessRecordSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()
    const recordId = generateId()

    // Verify user exists in workspace
    const dirUser = await c.env.DB.prepare(
      'SELECT id FROM directory_users WHERE id = ? AND workspace_id = ?'
    )
      .bind(body.userId, workspaceId)
      .first()

    if (!dirUser) {
      return c.json({ error: 'Directory user not found' }, 404)
    }

    // Verify system exists in workspace and get data for risk scoring
    const system = await c.env.DB.prepare(
      'SELECT id, classification, data_sensitivity, mfa_required FROM systems WHERE id = ? AND workspace_id = ?'
    )
      .bind(body.systemId, workspaceId)
      .first<{
        id: string
        classification: string
        data_sensitivity: string
        mfa_required: number
      }>()

    if (!system) {
      return c.json({ error: 'System not found' }, 404)
    }

    const riskScore = computeRiskScore(system, body.role, body.approvedBy ?? null)

    const status = body.status ?? 'active'

    await c.env.DB.prepare(
      `INSERT INTO access_records (id, workspace_id, user_id, system_id, role, access_type,
                                   granted_at, granted_by, approved_by, approval_method,
                                   ticket_ref, risk_score, source, created_at, status,
                                   license_type, cost_per_period, cost_currency, cost_frequency,
                                   updated_at, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        recordId,
        workspaceId,
        body.userId,
        body.systemId,
        body.role,
        body.accessType ?? 'permanent',
        now,
        body.grantedBy ?? null,
        body.approvedBy ?? null,
        body.approvalMethod ?? null,
        body.ticketRef ?? null,
        riskScore,
        now,
        status,
        body.licenseType ?? null,
        body.costPerPeriod ?? null,
        body.costCurrency ?? 'USD',
        body.costFrequency ?? null,
        now,
        userId
      )
      .run()

    // Save custom field values if provided
    if (body.customFields && Object.keys(body.customFields).length > 0) {
      const cfStmts = Object.entries(body.customFields).map(([fieldId, value]) =>
        c.env.DB.prepare(
          `INSERT INTO custom_field_values (id, workspace_id, entity_type, entity_id, field_id, value, created_at, updated_at)
           VALUES (?, ?, 'access_record', ?, ?, ?, ?, ?)`
        ).bind(generateId(), workspaceId, recordId, fieldId, value, now, now)
      )
      if (cfStmts.length > 0) {
        await c.env.DB.batch(cfStmts)
      }
    }

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'access.granted',
      entityType: 'access_record',
      entityId: recordId,
      data: {
        userId: body.userId,
        systemId: body.systemId,
        role: body.role,
        riskScore,
        status,
      },
      actorId: userId,
    })

    return c.json(
      {
        record: {
          id: recordId,
          workspaceId,
          userId: body.userId,
          systemId: body.systemId,
          role: body.role,
          accessType: body.accessType ?? 'permanent',
          grantedAt: now,
          grantedBy: body.grantedBy ?? null,
          approvedBy: body.approvedBy ?? null,
          approvalMethod: body.approvalMethod ?? null,
          ticketRef: body.ticketRef ?? null,
          reviewedAt: null,
          reviewedBy: null,
          revokedAt: null,
          revokedBy: null,
          revocationReason: null,
          riskScore,
          source: 'manual',
          createdAt: now,
          status,
          updatedAt: now,
          updatedBy: userId,
          licenseType: body.licenseType ?? null,
          costPerPeriod: body.costPerPeriod ?? null,
          costCurrency: body.costCurrency ?? 'USD',
          costFrequency: body.costFrequency ?? null,
        },
      },
      201
    )
  }
)

const revokeAccessSchema = z.object({
  reason: z.string().optional(),
})

/**
 * POST /access/:recordId/revoke
 * Revoke access. Sets revoked_at + revoked_by.
 */
complianceRoutes.post(
  '/access/:recordId/revoke',
  requireRole('member'),
  zValidator('json', revokeAccessSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const recordId = c.req.param('recordId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()

    const record = await c.env.DB.prepare(
      'SELECT id, revoked_at FROM access_records WHERE id = ? AND workspace_id = ?'
    )
      .bind(recordId, workspaceId)
      .first<{ id: string; revoked_at: string | null }>()

    if (!record) {
      return c.json({ error: 'Access record not found' }, 404)
    }

    if (record.revoked_at) {
      return c.json({ error: 'Access already revoked' }, 400)
    }

    await c.env.DB.prepare(
      'UPDATE access_records SET revoked_at = ?, revoked_by = ?, revocation_reason = ? WHERE id = ?'
    )
      .bind(now, userId, body.reason ?? null, recordId)
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'access.revoked',
      entityType: 'access_record',
      entityId: recordId,
      data: { reason: body.reason ?? null },
      actorId: userId,
    })

    return c.json({ success: true, revokedAt: now })
  }
)

/**
 * POST /access/:recordId/review
 * Mark access as reviewed. Sets reviewed_at + reviewed_by.
 */
complianceRoutes.post('/access/:recordId/review', requireRole('member'), async (c) => {
  const workspaceId = c.get('workspaceId')
  const userId = c.get('userId')
  const recordId = c.req.param('recordId')
  const now = new Date().toISOString()

  const record = await c.env.DB.prepare(
    'SELECT id FROM access_records WHERE id = ? AND workspace_id = ?'
  )
    .bind(recordId, workspaceId)
    .first()

  if (!record) {
    return c.json({ error: 'Access record not found' }, 404)
  }

  await c.env.DB.prepare(
    'UPDATE access_records SET reviewed_at = ?, reviewed_by = ? WHERE id = ?'
  )
    .bind(now, userId, recordId)
    .run()

  await emitEvent(c.env.DB, {
    workspaceId,
    eventType: 'access.reviewed',
    entityType: 'access_record',
    entityId: recordId,
    data: {},
    actorId: userId,
  })

  return c.json({ success: true, reviewedAt: now })
})

// ─── Evidence ────────────────────────────────────────────────────────

/**
 * GET /evidence
 * List evidence items. Supports ?page=&limit=.
 */
complianceRoutes.get('/evidence', async (c) => {
  const workspaceId = c.get('workspaceId')
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '50', 10)))
  const offset = (page - 1) * limit

  const countResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM evidence WHERE workspace_id = ?'
  )
    .bind(workspaceId)
    .first<{ total: number }>()

  const { results } = await c.env.DB.prepare(
    `SELECT e.id, e.workspace_id, e.title, e.description, e.file_ref, e.file_name, e.file_size,
            e.file_hash, e.mime_type, e.source, e.source_integration, e.captured_at, e.expires_at,
            e.uploaded_by, e.created_at, e.updated_at, e.updated_by,
            u_up.name as uploaded_by_name,
            u_ed.name as updated_by_name,
            (SELECT COUNT(*) FROM evidence_links el WHERE el.evidence_id = e.id AND el.workspace_id = e.workspace_id) as links_count
     FROM evidence e
     LEFT JOIN auth_users u_up ON u_up.id = e.uploaded_by
     LEFT JOIN auth_users u_ed ON u_ed.id = e.updated_by
     WHERE e.workspace_id = ?
     ORDER BY e.created_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(workspaceId, limit, offset)
    .all<{
      id: string
      workspace_id: string
      title: string
      description: string | null
      file_ref: string | null
      file_name: string | null
      file_size: number | null
      file_hash: string | null
      mime_type: string | null
      source: string
      source_integration: string | null
      captured_at: string
      expires_at: string | null
      uploaded_by: string
      created_at: string
      updated_at: string | null
      updated_by: string | null
      uploaded_by_name: string | null
      updated_by_name: string | null
      links_count: number
    }>()

  return c.json({
    evidence: results.map((e) => ({
      id: e.id,
      workspaceId: e.workspace_id,
      title: e.title,
      description: e.description,
      fileRef: e.file_ref,
      fileName: e.file_name,
      fileSize: e.file_size,
      fileHash: e.file_hash,
      mimeType: e.mime_type,
      source: e.source,
      sourceIntegration: e.source_integration,
      capturedAt: e.captured_at,
      expiresAt: e.expires_at,
      uploadedBy: e.uploaded_by,
      uploadedByName: e.uploaded_by_name,
      createdAt: e.created_at,
      updatedAt: e.updated_at,
      updatedBy: e.updated_by,
      updatedByName: e.updated_by_name,
      linksCount: e.links_count,
    })),
    total: countResult?.total ?? 0,
    page,
    limit,
  })
})

const createEvidenceSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  source: z.string().optional(),
  capturedAt: z.string().optional(),
  expiresAt: z.string().optional(),
})

/**
 * POST /evidence
 * Create evidence record (metadata only).
 */
complianceRoutes.post(
  '/evidence',
  requireRole('member'),
  zValidator('json', createEvidenceSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()
    const evidenceId = generateId()
    const capturedAt = body.capturedAt ?? now

    await c.env.DB.prepare(
      `INSERT INTO evidence (id, workspace_id, title, description, file_name, file_size,
                             mime_type, source, captured_at, expires_at, uploaded_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        evidenceId,
        workspaceId,
        body.title,
        body.description ?? null,
        body.fileName ?? null,
        body.fileSize ?? null,
        body.mimeType ?? null,
        body.source ?? 'manual',
        capturedAt,
        body.expiresAt ?? null,
        userId,
        now
      )
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'evidence.created',
      entityType: 'evidence',
      entityId: evidenceId,
      data: { title: body.title },
      actorId: userId,
    })

    return c.json(
      {
        evidence: {
          id: evidenceId,
          workspaceId,
          title: body.title,
          description: body.description ?? null,
          fileRef: null,
          fileName: body.fileName ?? null,
          fileSize: body.fileSize ?? null,
          fileHash: null,
          mimeType: body.mimeType ?? null,
          source: 'manual',
          sourceIntegration: null,
          capturedAt,
          expiresAt: null,
          uploadedBy: userId,
          createdAt: now,
        },
      },
      201
    )
  }
)

// ─── Evidence Update ──────────────────────────────────────────────────

const updateEvidenceSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  source: z.string().optional(),
  expiresAt: z.string().nullable().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
})

/**
 * PUT /evidence/:evidenceId
 * Update evidence metadata. Requires member+.
 */
complianceRoutes.put(
  '/evidence/:evidenceId',
  requireRole('member'),
  zValidator('json', updateEvidenceSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const evidenceId = c.req.param('evidenceId')
    const body = c.req.valid('json')

    const ev = await c.env.DB.prepare(
      'SELECT id FROM evidence WHERE id = ? AND workspace_id = ?'
    ).bind(evidenceId, workspaceId).first()
    if (!ev) return c.json({ error: 'Evidence not found' }, 404)

    const sets: string[] = []
    const bindings: unknown[] = []
    if (body.title !== undefined) { sets.push('title = ?'); bindings.push(body.title) }
    if (body.description !== undefined) { sets.push('description = ?'); bindings.push(body.description) }
    if (body.source !== undefined) { sets.push('source = ?'); bindings.push(body.source) }
    if (body.expiresAt !== undefined) { sets.push('expires_at = ?'); bindings.push(body.expiresAt) }
    if (body.fileName !== undefined) { sets.push('file_name = ?'); bindings.push(body.fileName) }
    if (body.fileSize !== undefined) { sets.push('file_size = ?'); bindings.push(body.fileSize) }
    if (body.mimeType !== undefined) { sets.push('mime_type = ?'); bindings.push(body.mimeType) }

    if (sets.length === 0) return c.json({ error: 'No fields to update' }, 400)

    // Always set updated_at and updated_by
    const userId = c.get('userId')
    sets.push('updated_at = ?'); bindings.push(new Date().toISOString())
    sets.push('updated_by = ?'); bindings.push(userId)

    bindings.push(evidenceId, workspaceId)
    await c.env.DB.prepare(
      `UPDATE evidence SET ${sets.join(', ')} WHERE id = ? AND workspace_id = ?`
    ).bind(...bindings).run()

    return c.json({ success: true })
  }
)

// ─── Unlink Evidence ──────────────────────────────────────────────────

/**
 * DELETE /evidence/:evidenceId/links/:linkId
 * Remove an evidence-to-control link. Requires member+.
 */
complianceRoutes.delete(
  '/evidence/:evidenceId/links/:linkId',
  requireRole('member'),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const evidenceId = c.req.param('evidenceId')
    const linkId = c.req.param('linkId')
    const userId = c.get('userId')

    const link = await c.env.DB.prepare(
      'SELECT id FROM evidence_links WHERE id = ? AND workspace_id = ? AND evidence_id = ?'
    ).bind(linkId, workspaceId, evidenceId).first()
    if (!link) return c.json({ error: 'Link not found' }, 404)

    // Delete child auto-crosswalk links first (they reference this link via inherited_from)
    await c.env.DB.prepare(
      'DELETE FROM evidence_links WHERE inherited_from = ?'
    ).bind(linkId).run()

    await c.env.DB.prepare('DELETE FROM evidence_links WHERE id = ?').bind(linkId).run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'evidence.unlinked',
      entityType: 'evidence_link',
      entityId: linkId,
      data: { evidenceId },
      actorId: userId,
    })

    return c.json({ success: true })
  }
)

const linkEvidenceSchema = z.object({
  controlId: z.string().min(1),
  frameworkVersionId: z.string().min(1),
  notes: z.string().optional(),
})

/**
 * POST /evidence/:evidenceId/link
 * Link evidence to a control. Creates an IMMUTABLE evidence_link.
 */
complianceRoutes.post(
  '/evidence/:evidenceId/link',
  requireRole('member'),
  zValidator('json', linkEvidenceSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const evidenceId = c.req.param('evidenceId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()
    const linkId = generateId()

    // Verify evidence exists in workspace
    const evidence = await c.env.DB.prepare(
      'SELECT id FROM evidence WHERE id = ? AND workspace_id = ?'
    )
      .bind(evidenceId, workspaceId)
      .first()

    if (!evidence) {
      return c.json({ error: 'Evidence not found' }, 404)
    }

    // Verify control exists
    const control = await c.env.DB.prepare(
      'SELECT id FROM versioned_controls WHERE id = ? AND framework_version_id = ?'
    )
      .bind(body.controlId, body.frameworkVersionId)
      .first()

    if (!control) {
      return c.json({ error: 'Control not found' }, 404)
    }

    // Check for duplicate link
    const existingLink = await c.env.DB.prepare(
      `SELECT id FROM evidence_links
       WHERE workspace_id = ? AND evidence_id = ? AND control_id = ? AND link_type = 'manual'`
    )
      .bind(workspaceId, evidenceId, body.controlId)
      .first()

    if (existingLink) {
      return c.json({ error: 'Evidence is already linked to this control' }, 409)
    }

    await c.env.DB.prepare(
      `INSERT INTO evidence_links (id, workspace_id, evidence_id, control_id,
                                   framework_version_id, linked_at, linked_by,
                                   link_type, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'manual', ?, ?)`
    )
      .bind(
        linkId,
        workspaceId,
        evidenceId,
        body.controlId,
        body.frameworkVersionId,
        now,
        userId,
        body.notes ?? null,
        now
      )
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'evidence.linked',
      entityType: 'evidence_link',
      entityId: linkId,
      data: {
        evidenceId,
        controlId: body.controlId,
        frameworkVersionId: body.frameworkVersionId,
      },
      actorId: userId,
    })

    // ─── Crosswalk Auto-Linking ───────────────────────────────────
    // After creating the manual link, check for crosswalk mappings
    // from this control (as source) and auto-create evidence_links
    // for equivalent/partial mapping targets.
    const autoLinked: Array<{
      id: string
      controlId: string
      frameworkVersionId: string
      mappingType: string
      confidence: number
    }> = []

    const { results: crosswalkTargets } = await c.env.DB.prepare(
      `SELECT cw.target_control_id, cw.mapping_type, cw.confidence,
              vc.framework_version_id as target_fv_id
       FROM control_crosswalks cw
       JOIN versioned_controls vc ON vc.id = cw.target_control_id
       WHERE cw.source_control_id = ?
       AND cw.mapping_type IN ('equivalent', 'partial')`
    )
      .bind(body.controlId)
      .all<{
        target_control_id: string
        mapping_type: string
        confidence: number
        target_fv_id: string
      }>()

    for (const target of crosswalkTargets) {
      // Check if an evidence_link already exists for this target control
      const existingLink = await c.env.DB.prepare(
        `SELECT id FROM evidence_links
         WHERE workspace_id = ? AND evidence_id = ? AND control_id = ?`
      )
        .bind(workspaceId, evidenceId, target.target_control_id)
        .first()

      if (existingLink) continue

      const autoLinkId = generateId()
      await c.env.DB.prepare(
        `INSERT INTO evidence_links (id, workspace_id, evidence_id, control_id,
                                     framework_version_id, linked_at, linked_by,
                                     link_type, confidence, inherited_from, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'auto_crosswalk', ?, ?, ?, ?)`
      )
        .bind(
          autoLinkId,
          workspaceId,
          evidenceId,
          target.target_control_id,
          target.target_fv_id,
          now,
          userId,
          target.confidence,
          linkId,
          `Auto-linked via ${target.mapping_type} crosswalk from control`,
          now
        )
        .run()

      await emitEvent(c.env.DB, {
        workspaceId,
        eventType: 'evidence.auto_linked',
        entityType: 'evidence_link',
        entityId: autoLinkId,
        data: {
          evidenceId,
          controlId: target.target_control_id,
          frameworkVersionId: target.target_fv_id,
          mappingType: target.mapping_type,
          confidence: target.confidence,
          inheritedFrom: linkId,
        },
        actorId: userId,
        actorType: 'system',
      })

      autoLinked.push({
        id: autoLinkId,
        controlId: target.target_control_id,
        frameworkVersionId: target.target_fv_id,
        mappingType: target.mapping_type,
        confidence: target.confidence,
      })
    }

    return c.json(
      {
        link: {
          id: linkId,
          workspaceId,
          evidenceId,
          controlId: body.controlId,
          frameworkVersionId: body.frameworkVersionId,
          linkedAt: now,
          linkedBy: userId,
          linkType: 'manual',
          confidence: null,
          inheritedFrom: null,
          notes: body.notes ?? null,
          createdAt: now,
        },
        autoLinked,
      },
      201
    )
  }
)

/**
 * GET /evidence/:evidenceId/links
 * List all evidence_links for an evidence item.
 */
complianceRoutes.get('/evidence/:evidenceId/links', async (c) => {
  const workspaceId = c.get('workspaceId')
  const evidenceId = c.req.param('evidenceId')

  // Verify evidence exists in workspace
  const evidence = await c.env.DB.prepare(
    'SELECT id FROM evidence WHERE id = ? AND workspace_id = ?'
  )
    .bind(evidenceId, workspaceId)
    .first()

  if (!evidence) {
    return c.json({ error: 'Evidence not found' }, 404)
  }

  const { results } = await c.env.DB.prepare(
    `SELECT el.id, el.workspace_id, el.evidence_id, el.control_id, el.framework_version_id,
            el.linked_at, el.linked_by, el.link_type, el.confidence, el.inherited_from, el.notes, el.created_at,
            vc.control_id as control_code, vc.title as control_title,
            f.name as framework_name
     FROM evidence_links el
     LEFT JOIN versioned_controls vc ON vc.id = el.control_id
     LEFT JOIN framework_versions fv ON fv.id = el.framework_version_id
     LEFT JOIN frameworks f ON f.id = fv.framework_id
     WHERE el.workspace_id = ? AND el.evidence_id = ?
     ORDER BY el.linked_at DESC`
  )
    .bind(workspaceId, evidenceId)
    .all<{
      id: string
      workspace_id: string
      evidence_id: string
      control_id: string
      framework_version_id: string
      linked_at: string
      linked_by: string
      link_type: string
      confidence: number | null
      inherited_from: string | null
      notes: string | null
      created_at: string
      control_code: string | null
      control_title: string | null
      framework_name: string | null
    }>()

  return c.json({
    links: results.map((l) => ({
      id: l.id,
      workspaceId: l.workspace_id,
      evidenceId: l.evidence_id,
      controlId: l.control_id,
      controlCode: l.control_code ?? l.control_id,
      controlTitle: l.control_title ?? 'Unknown control',
      frameworkName: l.framework_name ?? 'Unknown framework',
      frameworkVersionId: l.framework_version_id,
      linkedAt: l.linked_at,
      linkedBy: l.linked_by,
      linkType: l.link_type,
      confidence: l.confidence,
      inheritedFrom: l.inherited_from,
      notes: l.notes,
      createdAt: l.created_at,
    })),
  })
})

// ─── Compliance Events ───────────────────────────────────────────────

/**
 * GET /events
 * List compliance events. Supports ?eventType=, ?entityType=, ?page=&limit=, ?from=&to= date range.
 * Paginated, most recent first.
 */
complianceRoutes.get('/events', async (c) => {
  const workspaceId = c.get('workspaceId')
  const eventType = c.req.query('eventType')
  const entityType = c.req.query('entityType')
  const from = c.req.query('from')
  const to = c.req.query('to')
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '50', 10)))
  const offset = (page - 1) * limit

  let countSql = 'SELECT COUNT(*) as total FROM compliance_events WHERE workspace_id = ?'
  let dataSql = `SELECT id, workspace_id, event_type, entity_type, entity_id, data,
                        actor_id, actor_type, created_at
                 FROM compliance_events WHERE workspace_id = ?`

  const bindings: unknown[] = [workspaceId]

  if (eventType) {
    countSql += ' AND event_type = ?'
    dataSql += ' AND event_type = ?'
    bindings.push(eventType)
  }

  if (entityType) {
    countSql += ' AND entity_type = ?'
    dataSql += ' AND entity_type = ?'
    bindings.push(entityType)
  }

  if (from) {
    countSql += ' AND created_at >= ?'
    dataSql += ' AND created_at >= ?'
    bindings.push(from)
  }

  if (to) {
    countSql += ' AND created_at <= ?'
    dataSql += ' AND created_at <= ?'
    bindings.push(to)
  }

  dataSql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'

  const countResult = await c.env.DB.prepare(countSql)
    .bind(...bindings)
    .first<{ total: number }>()

  const { results } = await c.env.DB.prepare(dataSql)
    .bind(...bindings, limit, offset)
    .all<{
      id: string
      workspace_id: string
      event_type: string
      entity_type: string
      entity_id: string
      data: string | null
      actor_id: string | null
      actor_type: string
      created_at: string
    }>()

  return c.json({
    events: results.map((e) => ({
      id: e.id,
      workspaceId: e.workspace_id,
      eventType: e.event_type,
      entityType: e.entity_type,
      entityId: e.entity_id,
      data: e.data ? JSON.parse(e.data) : null,
      actorId: e.actor_id,
      actorType: e.actor_type,
      createdAt: e.created_at,
    })),
    total: countResult?.total ?? 0,
    page,
    limit,
  })
})

// ─── Dashboard ────────────────────────────────────────────────────────

/**
 * GET /dashboard
 * Returns aggregated compliance posture data for all dashboard widgets in one call.
 * Covers: adoption stats, control coverage per framework, evidence freshness,
 * access risk summary, and recent compliance events.
 */
complianceRoutes.get('/dashboard', async (c) => {
  const workspaceId = c.get('workspaceId')
  const now = new Date().toISOString()
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  // 1. Active adoptions with framework info
  const { results: adoptions } = await c.env.DB.prepare(
    `SELECT wa.id, wa.framework_version_id,
            f.name as framework_name, f.slug as framework_slug,
            fv.version as framework_version, fv.total_controls
     FROM workspace_adoptions wa
     JOIN framework_versions fv ON fv.id = wa.framework_version_id
     JOIN frameworks f ON f.id = fv.framework_id
     WHERE wa.workspace_id = ?
       AND (wa.effective_until IS NULL OR wa.effective_until > datetime('now'))`
  )
    .bind(workspaceId)
    .all<{
      id: string
      framework_version_id: string
      framework_name: string
      framework_slug: string
      framework_version: string
      total_controls: number
    }>()

  // 2. Control coverage per adopted framework version
  const frameworks = await Promise.all(
    adoptions.map(async (adoption) => {
      const totalResult = await c.env.DB.prepare(
        'SELECT COUNT(*) as total FROM versioned_controls WHERE framework_version_id = ?'
      )
        .bind(adoption.framework_version_id)
        .first<{ total: number }>()

      const coveredResult = await c.env.DB.prepare(
        `SELECT COUNT(DISTINCT vc.id) as covered
         FROM versioned_controls vc
         JOIN evidence_links el ON el.control_id = vc.id
           AND el.framework_version_id = vc.framework_version_id
           AND el.workspace_id = ?
         WHERE vc.framework_version_id = ?`
      )
        .bind(workspaceId, adoption.framework_version_id)
        .first<{ covered: number }>()

      const totalControls = totalResult?.total ?? 0
      const coveredControls = coveredResult?.covered ?? 0
      const coveragePercent =
        totalControls > 0
          ? Math.round((coveredControls / totalControls) * 1000) / 10
          : 0

      return {
        name: adoption.framework_name,
        slug: adoption.framework_slug,
        version: adoption.framework_version,
        totalControls,
        coveredControls,
        coveragePercent,
      }
    })
  )

  // 3. Evidence stats
  const evidenceTotal = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM evidence WHERE workspace_id = ?'
  )
    .bind(workspaceId)
    .first<{ total: number }>()

  const evidenceExpired = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM evidence
     WHERE workspace_id = ? AND expires_at IS NOT NULL AND expires_at < ?`
  )
    .bind(workspaceId, now)
    .first<{ total: number }>()

  const evidenceExpiringSoon = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM evidence
     WHERE workspace_id = ? AND expires_at IS NOT NULL AND expires_at >= ? AND expires_at <= ?`
  )
    .bind(workspaceId, now, thirtyDaysFromNow)
    .first<{ total: number }>()

  const totalEvidence = evidenceTotal?.total ?? 0
  const expired = evidenceExpired?.total ?? 0
  const expiringSoon = evidenceExpiringSoon?.total ?? 0
  const fresh = totalEvidence - expired - expiringSoon

  // 4. Access stats
  const accessTotal = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM access_records WHERE workspace_id = ? AND revoked_at IS NULL'
  )
    .bind(workspaceId)
    .first<{ total: number }>()

  const accessHighRisk = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM access_records WHERE workspace_id = ? AND revoked_at IS NULL AND risk_score > 0.7'
  )
    .bind(workspaceId)
    .first<{ total: number }>()

  const accessUnreviewed = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM access_records WHERE workspace_id = ? AND revoked_at IS NULL AND reviewed_at IS NULL'
  )
    .bind(workspaceId)
    .first<{ total: number }>()

  // 5. Recent events (last 10) with actor name
  const { results: events } = await c.env.DB.prepare(
    `SELECT ce.id, ce.event_type, ce.entity_type, ce.created_at, ce.actor_id,
            au.name as actor_name
     FROM compliance_events ce
     LEFT JOIN auth_users au ON au.id = ce.actor_id
     WHERE ce.workspace_id = ?
     ORDER BY ce.created_at DESC
     LIMIT 10`
  )
    .bind(workspaceId)
    .all<{
      id: string
      event_type: string
      entity_type: string
      created_at: string
      actor_id: string | null
      actor_name: string | null
    }>()

  return c.json({
    dashboard: {
      adoptions: {
        count: adoptions.length,
        frameworks,
      },
      evidence: {
        total: totalEvidence,
        expired,
        expiringSoon,
        fresh,
      },
      access: {
        totalActive: accessTotal?.total ?? 0,
        highRisk: accessHighRisk?.total ?? 0,
        unreviewed: accessUnreviewed?.total ?? 0,
      },
      recentEvents: events.map((e) => ({
        id: e.id,
        eventType: e.event_type,
        entityType: e.entity_type,
        actorName: e.actor_name ?? 'System',
        createdAt: e.created_at,
      })),
    },
  })
})

// ─── Baselines ──────────────────────────────────────────────────────

/**
 * GET /baselines
 * List baselines for workspace.
 */
complianceRoutes.get('/baselines', async (c) => {
  const workspaceId = c.get('workspaceId')

  const { results } = await c.env.DB.prepare(
    `SELECT b.id, b.workspace_id, b.template_id,
            COALESCE(b.name, bl.name) AS name,
            COALESCE(b.description, bl.description) AS description,
            COALESCE(b.category, bl.category) AS category,
            COALESCE(b.rule_type, bl.check_type) AS rule_type,
            b.rule_config,
            COALESCE(b.severity, bl.severity) AS severity,
            b.enabled, b.created_by, b.created_at, b.updated_at,
            bl.name AS template_name
     FROM baselines b
     LEFT JOIN baseline_library bl ON b.template_id = bl.id
     WHERE b.workspace_id = ?
     ORDER BY b.created_at DESC`
  )
    .bind(workspaceId)
    .all<{
      id: string
      workspace_id: string
      template_id: string | null
      name: string
      description: string | null
      category: string
      rule_type: string
      rule_config: string | null
      severity: string
      enabled: number
      created_by: string
      created_at: string
      updated_at: string
      template_name: string | null
    }>()

  return c.json({
    baselines: results.map((b) => ({
      id: b.id,
      workspaceId: b.workspace_id,
      templateId: b.template_id,
      name: b.name,
      description: b.description,
      category: b.category,
      ruleType: b.rule_type,
      ruleConfig: b.rule_config ? JSON.parse(b.rule_config) : null,
      severity: b.severity,
      enabled: Boolean(b.enabled),
      createdBy: b.created_by,
      templateName: b.template_name,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    })),
  })
})

const DEFAULT_BASELINES = [
  {
    name: 'MFA Required for Critical Systems',
    description: 'All critical-classified systems must have MFA enabled.',
    category: 'access',
    ruleType: 'boolean',
    ruleConfig: { field: 'mfa_required', expected: true, scope: 'critical_systems' },
    severity: 'high',
  },
  {
    name: 'Access Review Cadence',
    description: 'All access records must be reviewed within 90 days.',
    category: 'access',
    ruleType: 'threshold',
    ruleConfig: { field: 'reviewed_at', maxAgeDays: 90 },
    severity: 'medium',
  },
  {
    name: 'Evidence Freshness',
    description: 'Evidence items must not be older than 365 days.',
    category: 'evidence',
    ruleType: 'threshold',
    ruleConfig: { field: 'captured_at', maxAgeDays: 365 },
    severity: 'medium',
  },
  {
    name: 'Terminated User Access',
    description: 'Terminated users must not have active access records.',
    category: 'access',
    ruleType: 'boolean',
    ruleConfig: { field: 'employment_status', disallowed: 'terminated', scope: 'active_access' },
    severity: 'critical',
  },
  {
    name: 'System Owner Assigned',
    description: 'All systems must have an owner_email assigned.',
    category: 'governance',
    ruleType: 'boolean',
    ruleConfig: { field: 'owner_email', expected: 'not_null' },
    severity: 'low',
  },
]

const createBaselineSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.string().min(1),
  ruleType: z.string().min(1),
  ruleConfig: z.record(z.unknown()),
  severity: z.string().optional(),
})

/**
 * POST /baselines
 * Create a baseline. Requires admin+. Seeds defaults if first baseline.
 */
complianceRoutes.post(
  '/baselines',
  requireRole('admin'),
  zValidator('json', createBaselineSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()

    // Check if this is the first baseline — seed defaults if so
    const count = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM baselines WHERE workspace_id = ?'
    )
      .bind(workspaceId)
      .first<{ total: number }>()

    if (count?.total === 0) {
      for (const def of DEFAULT_BASELINES) {
        const defId = generateId()
        await c.env.DB.prepare(
          `INSERT INTO baselines (id, workspace_id, name, description, category, rule_type, rule_config, severity, enabled, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
        )
          .bind(
            defId, workspaceId, def.name, def.description, def.category,
            def.ruleType, JSON.stringify(def.ruleConfig), def.severity,
            userId, now, now
          )
          .run()
      }
    }

    const baselineId = generateId()

    await c.env.DB.prepare(
      `INSERT INTO baselines (id, workspace_id, name, description, category, rule_type, rule_config, severity, enabled, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
    )
      .bind(
        baselineId, workspaceId, body.name, body.description ?? null,
        body.category, body.ruleType, JSON.stringify(body.ruleConfig),
        body.severity ?? 'medium', userId, now, now
      )
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'baseline.created',
      entityType: 'baseline',
      entityId: baselineId,
      data: { name: body.name, category: body.category },
      actorId: userId,
    })

    return c.json(
      {
        baseline: {
          id: baselineId,
          workspaceId,
          name: body.name,
          description: body.description ?? null,
          category: body.category,
          ruleType: body.ruleType,
          ruleConfig: body.ruleConfig,
          severity: body.severity ?? 'medium',
          enabled: true,
          createdBy: userId,
          createdAt: now,
          updatedAt: now,
        },
      },
      201
    )
  }
)

const updateBaselineSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  ruleType: z.string().optional(),
  ruleConfig: z.record(z.unknown()).optional(),
  severity: z.string().optional(),
  enabled: z.boolean().optional(),
})

/**
 * PATCH /baselines/:baselineId
 * Update a baseline. Admin+.
 */
complianceRoutes.patch(
  '/baselines/:baselineId',
  requireRole('admin'),
  zValidator('json', updateBaselineSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const baselineId = c.req.param('baselineId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()

    const existing = await c.env.DB.prepare(
      'SELECT id FROM baselines WHERE id = ? AND workspace_id = ?'
    )
      .bind(baselineId, workspaceId)
      .first()

    if (!existing) {
      return c.json({ error: 'Baseline not found' }, 404)
    }

    const sets: string[] = ['updated_at = ?']
    const bindings: unknown[] = [now]

    if (body.name !== undefined) { sets.push('name = ?'); bindings.push(body.name) }
    if (body.description !== undefined) { sets.push('description = ?'); bindings.push(body.description) }
    if (body.category !== undefined) { sets.push('category = ?'); bindings.push(body.category) }
    if (body.ruleType !== undefined) { sets.push('rule_type = ?'); bindings.push(body.ruleType) }
    if (body.ruleConfig !== undefined) { sets.push('rule_config = ?'); bindings.push(JSON.stringify(body.ruleConfig)) }
    if (body.severity !== undefined) { sets.push('severity = ?'); bindings.push(body.severity) }
    if (body.enabled !== undefined) { sets.push('enabled = ?'); bindings.push(body.enabled ? 1 : 0) }

    bindings.push(baselineId, workspaceId)

    await c.env.DB.prepare(
      `UPDATE baselines SET ${sets.join(', ')} WHERE id = ? AND workspace_id = ?`
    )
      .bind(...bindings)
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'baseline.updated',
      entityType: 'baseline',
      entityId: baselineId,
      data: body,
      actorId: userId,
    })

    return c.json({ success: true })
  }
)

/**
 * DELETE /baselines/:baselineId
 * Soft disable a baseline (set enabled=0). Admin+.
 */
complianceRoutes.delete('/baselines/:baselineId', requireRole('admin'), async (c) => {
  const workspaceId = c.get('workspaceId')
  const userId = c.get('userId')
  const baselineId = c.req.param('baselineId')
  const now = new Date().toISOString()

  const existing = await c.env.DB.prepare(
    'SELECT id FROM baselines WHERE id = ? AND workspace_id = ?'
  )
    .bind(baselineId, workspaceId)
    .first()

  if (!existing) {
    return c.json({ error: 'Baseline not found' }, 404)
  }

  await c.env.DB.prepare(
    'UPDATE baselines SET enabled = 0, updated_at = ? WHERE id = ? AND workspace_id = ?'
  )
    .bind(now, baselineId, workspaceId)
    .run()

  await emitEvent(c.env.DB, {
    workspaceId,
    eventType: 'baseline.disabled',
    entityType: 'baseline',
    entityId: baselineId,
    actorId: userId,
  })

  return c.json({ success: true })
})

/**
 * GET /baselines/:baselineId/controls
 * List controls linked to a baseline.
 */
complianceRoutes.get('/baselines/:baselineId/controls', async (c) => {
  const workspaceId = c.get('workspaceId')
  const baselineId = c.req.param('baselineId')

  const { results } = await c.env.DB.prepare(
    `SELECT bc.id as link_id, bc.linked_at,
       vc.id as control_id, vc.control_id as control_code, vc.title, vc.domain,
       f.name as framework_name, fv.version as framework_version
     FROM baseline_controls bc
     JOIN versioned_controls vc ON vc.id = bc.control_id
     JOIN framework_versions fv ON fv.id = vc.framework_version_id
     JOIN frameworks f ON f.id = fv.framework_id
     WHERE bc.workspace_id = ? AND bc.baseline_id = ?
     ORDER BY vc.control_id ASC`
  ).bind(workspaceId, baselineId).all()

  return c.json({
    controls: (results ?? []).map((r: any) => ({
      linkId: r.link_id,
      controlId: r.control_id,
      controlCode: r.control_code,
      title: r.title,
      domain: r.domain,
      frameworkName: r.framework_name,
      frameworkVersion: r.framework_version,
      linkedAt: r.linked_at,
    })),
  })
})

/**
 * POST /baselines/:baselineId/controls
 * Link a control to a baseline.
 */
complianceRoutes.post(
  '/baselines/:baselineId/controls',
  requireRole('member'),
  zValidator('json', z.object({ controlId: z.string().min(1) })),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const baselineId = c.req.param('baselineId')
    const { controlId } = c.req.valid('json')
    const now = new Date().toISOString()

    // Validate baseline
    const baseline = await c.env.DB.prepare(
      'SELECT id FROM baselines WHERE id = ? AND workspace_id = ?'
    ).bind(baselineId, workspaceId).first()
    if (!baseline) return c.json({ error: 'Baseline not found' }, 404)

    // Validate control exists
    const control = await c.env.DB.prepare(
      'SELECT id FROM versioned_controls WHERE id = ?'
    ).bind(controlId).first()
    if (!control) return c.json({ error: 'Control not found' }, 404)

    const id = generateId()
    try {
      await c.env.DB.prepare(
        `INSERT INTO baseline_controls (id, workspace_id, baseline_id, control_id, linked_at, linked_by)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(id, workspaceId, baselineId, controlId, now, userId).run()
    } catch (e: any) {
      if (e.message?.includes('UNIQUE')) {
        return c.json({ error: 'Already linked' }, 409)
      }
      throw e
    }

    return c.json({ id }, 201)
  }
)

/**
 * DELETE /baselines/:baselineId/controls/:linkId
 * Unlink a control from a baseline.
 */
complianceRoutes.delete(
  '/baselines/:baselineId/controls/:linkId',
  requireRole('member'),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const baselineId = c.req.param('baselineId')
    const linkId = c.req.param('linkId')

    await c.env.DB.prepare(
      'DELETE FROM baseline_controls WHERE id = ? AND workspace_id = ? AND baseline_id = ?'
    ).bind(linkId, workspaceId, baselineId).run()

    return c.json({ ok: true })
  }
)

/**
 * GET /baselines/library
 * List all baseline templates from the library.
 */
complianceRoutes.get('/baselines/library', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM baseline_library ORDER BY category, name'
  ).bind().all()
  return c.json({ items: results })
})

/**
 * POST /baselines/from-library
 * Activate baselines from the library into the workspace.
 */
const addFromBaselineLibSchema = z.object({
  libraryIds: z.array(z.string()).min(1).max(50),
})

complianceRoutes.post(
  '/baselines/from-library',
  requireRole('member'),
  zValidator('json', addFromBaselineLibSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const { libraryIds } = c.req.valid('json')
    const now = new Date().toISOString()

    const placeholders = libraryIds.map(() => '?').join(',')
    const { results: libItems } = await c.env.DB.prepare(
      `SELECT * FROM baseline_library WHERE id IN (${placeholders})`
    ).bind(...libraryIds).all()

    // Get existing baseline names to avoid duplicates
    const { results: existing } = await c.env.DB.prepare(
      'SELECT name FROM baselines WHERE workspace_id = ?'
    ).bind(workspaceId).all()
    const existingNames = new Set((existing ?? []).map((e: any) => e.name?.toLowerCase()))

    // Check which templates are already referenced
    const { results: existingRefs } = await c.env.DB.prepare(
      'SELECT template_id FROM baselines WHERE workspace_id = ? AND template_id IS NOT NULL'
    ).bind(workspaceId).all<{ template_id: string }>()
    const existingTemplates = new Set(existingRefs.map((e) => e.template_id))

    let created = 0
    let skipped = 0

    for (const item of libItems) {
      const lib = item as any

      // Skip if already referenced or name exists
      if (existingTemplates.has(lib.id) || existingNames.has(lib.name?.toLowerCase())) {
        skipped++
        continue
      }

      const id = generateId()
      await c.env.DB.prepare(
        `INSERT INTO baselines (id, workspace_id, template_id, enabled, created_by, created_at, updated_at)
         VALUES (?, ?, ?, 1, ?, ?, ?)`
      ).bind(id, workspaceId, lib.id, userId, now, now).run()
      created++
    }

    return c.json({ created, skipped, total: libItems.length })
  }
)

/**
 * GET /baselines/violations
 * List violations. Supports ?status=open|resolved|exempted&severity=
 */
complianceRoutes.get('/baselines/violations', async (c) => {
  const workspaceId = c.get('workspaceId')
  const status = c.req.query('status')
  const severity = c.req.query('severity')

  let countSql = 'SELECT COUNT(*) as total FROM baseline_violations bv JOIN baselines b ON bv.baseline_id = b.id WHERE bv.workspace_id = ?'
  let dataSql = `SELECT bv.id, bv.workspace_id, bv.baseline_id, b.name as baseline_name, b.severity,
                        bv.entity_type, bv.entity_id, bv.violation_detail, bv.status,
                        bv.resolved_at, bv.resolved_by, bv.exemption_reason, bv.detected_at
                 FROM baseline_violations bv
                 JOIN baselines b ON bv.baseline_id = b.id
                 WHERE bv.workspace_id = ?`

  const bindings: unknown[] = [workspaceId]

  if (status) {
    countSql += ' AND bv.status = ?'
    dataSql += ' AND bv.status = ?'
    bindings.push(status)
  }

  if (severity) {
    countSql += ' AND b.severity = ?'
    dataSql += ' AND b.severity = ?'
    bindings.push(severity)
  }

  dataSql += ' ORDER BY bv.detected_at DESC'

  const countResult = await c.env.DB.prepare(countSql)
    .bind(...bindings)
    .first<{ total: number }>()

  const { results } = await c.env.DB.prepare(dataSql)
    .bind(...bindings)
    .all<{
      id: string
      workspace_id: string
      baseline_id: string
      baseline_name: string
      severity: string
      entity_type: string
      entity_id: string
      violation_detail: string
      status: string
      resolved_at: string | null
      resolved_by: string | null
      exemption_reason: string | null
      detected_at: string
    }>()

  return c.json({
    violations: results.map((v) => ({
      id: v.id,
      workspaceId: v.workspace_id,
      baselineId: v.baseline_id,
      baselineName: v.baseline_name,
      severity: v.severity,
      entityType: v.entity_type,
      entityId: v.entity_id,
      violationDetail: JSON.parse(v.violation_detail),
      status: v.status,
      resolvedAt: v.resolved_at,
      resolvedBy: v.resolved_by,
      exemptionReason: v.exemption_reason,
      detectedAt: v.detected_at,
    })),
    total: countResult?.total ?? 0,
  })
})

/**
 * POST /baselines/violations/:violationId/resolve
 * Resolve a violation. Body: { reason? }.
 */
complianceRoutes.post(
  '/baselines/violations/:violationId/resolve',
  requireRole('member'),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const violationId = c.req.param('violationId')
    const now = new Date().toISOString()
    const body = await c.req.json<{ reason?: string }>().catch(() => ({ reason: undefined }))

    const violation = await c.env.DB.prepare(
      'SELECT id, status FROM baseline_violations WHERE id = ? AND workspace_id = ?'
    )
      .bind(violationId, workspaceId)
      .first<{ id: string; status: string }>()

    if (!violation) {
      return c.json({ error: 'Violation not found' }, 404)
    }

    await c.env.DB.prepare(
      'UPDATE baseline_violations SET status = ?, resolved_at = ?, resolved_by = ? WHERE id = ?'
    )
      .bind('resolved', now, userId, violationId)
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'violation.resolved',
      entityType: 'baseline_violation',
      entityId: violationId,
      data: { reason: body.reason ?? null },
      actorId: userId,
    })

    return c.json({ success: true, resolvedAt: now })
  }
)

const exemptViolationSchema = z.object({
  reason: z.string().min(1),
})

/**
 * POST /baselines/violations/:violationId/exempt
 * Exempt a violation. Body: { reason }.
 */
complianceRoutes.post(
  '/baselines/violations/:violationId/exempt',
  requireRole('member'),
  zValidator('json', exemptViolationSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const violationId = c.req.param('violationId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()

    const violation = await c.env.DB.prepare(
      'SELECT id FROM baseline_violations WHERE id = ? AND workspace_id = ?'
    )
      .bind(violationId, workspaceId)
      .first()

    if (!violation) {
      return c.json({ error: 'Violation not found' }, 404)
    }

    await c.env.DB.prepare(
      'UPDATE baseline_violations SET status = ?, exemption_reason = ?, resolved_at = ?, resolved_by = ? WHERE id = ?'
    )
      .bind('exempted', body.reason, now, userId, violationId)
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'violation.exempted',
      entityType: 'baseline_violation',
      entityId: violationId,
      data: { reason: body.reason },
      actorId: userId,
    })

    return c.json({ success: true, exemptedAt: now })
  }
)

// ─── Risk Register ──────────────────────────────────────────────────

/**
 * GET /risks
 * List risk entries for workspace.
 */
complianceRoutes.get('/risks', async (c) => {
  const workspaceId = c.get('workspaceId')

  const { results } = await c.env.DB.prepare(
    `SELECT id, workspace_id, title, description, asset, asset_ref, threat, vulnerability,
            likelihood, impact, inherent_risk, controls_applied,
            residual_likelihood, residual_impact, residual_risk,
            risk_owner, treatment, status, review_date,
            created_by, created_at, updated_at
     FROM risk_entries
     WHERE workspace_id = ?
     ORDER BY inherent_risk DESC, created_at DESC`
  )
    .bind(workspaceId)
    .all<{
      id: string
      workspace_id: string
      title: string
      description: string | null
      asset: string | null
      asset_ref: string | null
      threat: string | null
      vulnerability: string | null
      likelihood: number
      impact: number
      inherent_risk: number
      controls_applied: string
      residual_likelihood: number | null
      residual_impact: number | null
      residual_risk: number | null
      risk_owner: string | null
      treatment: string
      status: string
      review_date: string | null
      created_by: string
      created_at: string
      updated_at: string
    }>()

  return c.json({
    risks: results.map((r) => ({
      id: r.id,
      workspaceId: r.workspace_id,
      title: r.title,
      description: r.description,
      asset: r.asset,
      assetRef: r.asset_ref,
      threat: r.threat,
      vulnerability: r.vulnerability,
      likelihood: r.likelihood,
      impact: r.impact,
      inherentRisk: r.inherent_risk,
      controlsApplied: JSON.parse(r.controls_applied),
      residualLikelihood: r.residual_likelihood,
      residualImpact: r.residual_impact,
      residualRisk: r.residual_risk,
      riskOwner: r.risk_owner,
      treatment: r.treatment,
      status: r.status,
      reviewDate: r.review_date,
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
  })
})

const createRiskSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().optional(),
  asset: z.string().optional(),
  threat: z.string().optional(),
  vulnerability: z.string().optional(),
  likelihood: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  treatment: z.string().optional(),
  riskOwner: z.string().optional(),
  reviewDate: z.string().optional(),
})

/**
 * POST /risks
 * Create a risk entry. Member+. Computes inherent_risk = likelihood * impact.
 */
complianceRoutes.post(
  '/risks',
  requireRole('member'),
  zValidator('json', createRiskSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()
    const riskId = generateId()
    const inherentRisk = body.likelihood * body.impact

    await c.env.DB.prepare(
      `INSERT INTO risk_entries (id, workspace_id, title, description, asset, threat, vulnerability,
                                 likelihood, impact, inherent_risk, risk_owner, treatment, review_date,
                                 created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        riskId, workspaceId, body.title, body.description ?? null,
        body.asset ?? null, body.threat ?? null, body.vulnerability ?? null,
        body.likelihood, body.impact, inherentRisk,
        body.riskOwner ?? null, body.treatment ?? 'mitigate',
        body.reviewDate ?? null, userId, now, now
      )
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'risk.created',
      entityType: 'risk_entry',
      entityId: riskId,
      data: { title: body.title, inherentRisk },
      actorId: userId,
    })

    return c.json(
      {
        risk: {
          id: riskId,
          workspaceId,
          title: body.title,
          description: body.description ?? null,
          asset: body.asset ?? null,
          threat: body.threat ?? null,
          vulnerability: body.vulnerability ?? null,
          likelihood: body.likelihood,
          impact: body.impact,
          inherentRisk,
          controlsApplied: [],
          residualLikelihood: null,
          residualImpact: null,
          residualRisk: null,
          riskOwner: body.riskOwner ?? null,
          treatment: body.treatment ?? 'mitigate',
          status: 'open',
          reviewDate: body.reviewDate ?? null,
          createdBy: userId,
          createdAt: now,
          updatedAt: now,
        },
      },
      201
    )
  }
)

const updateRiskSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().optional(),
  asset: z.string().optional(),
  assetRef: z.string().optional(),
  threat: z.string().optional(),
  vulnerability: z.string().optional(),
  likelihood: z.number().int().min(1).max(5).optional(),
  impact: z.number().int().min(1).max(5).optional(),
  controlsApplied: z.array(z.string()).optional(),
  residualLikelihood: z.number().int().min(1).max(5).optional(),
  residualImpact: z.number().int().min(1).max(5).optional(),
  riskOwner: z.string().optional(),
  treatment: z.string().optional(),
  status: z.string().optional(),
  reviewDate: z.string().optional(),
})

/**
 * PATCH /risks/:riskId
 * Update a risk entry. Admin+. Recomputes inherent/residual risk.
 */
complianceRoutes.patch(
  '/risks/:riskId',
  requireRole('admin'),
  zValidator('json', updateRiskSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const riskId = c.req.param('riskId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()

    const existing = await c.env.DB.prepare(
      'SELECT id, likelihood, impact, residual_likelihood, residual_impact FROM risk_entries WHERE id = ? AND workspace_id = ?'
    )
      .bind(riskId, workspaceId)
      .first<{ id: string; likelihood: number; impact: number; residual_likelihood: number | null; residual_impact: number | null }>()

    if (!existing) {
      return c.json({ error: 'Risk entry not found' }, 404)
    }

    const sets: string[] = ['updated_at = ?']
    const bindings: unknown[] = [now]

    if (body.title !== undefined) { sets.push('title = ?'); bindings.push(body.title) }
    if (body.description !== undefined) { sets.push('description = ?'); bindings.push(body.description) }
    if (body.asset !== undefined) { sets.push('asset = ?'); bindings.push(body.asset) }
    if (body.assetRef !== undefined) { sets.push('asset_ref = ?'); bindings.push(body.assetRef) }
    if (body.threat !== undefined) { sets.push('threat = ?'); bindings.push(body.threat) }
    if (body.vulnerability !== undefined) { sets.push('vulnerability = ?'); bindings.push(body.vulnerability) }
    if (body.riskOwner !== undefined) { sets.push('risk_owner = ?'); bindings.push(body.riskOwner) }
    if (body.treatment !== undefined) { sets.push('treatment = ?'); bindings.push(body.treatment) }
    if (body.status !== undefined) { sets.push('status = ?'); bindings.push(body.status) }
    if (body.reviewDate !== undefined) { sets.push('review_date = ?'); bindings.push(body.reviewDate) }
    if (body.controlsApplied !== undefined) { sets.push('controls_applied = ?'); bindings.push(JSON.stringify(body.controlsApplied)) }

    // Recompute inherent risk
    const newLikelihood = body.likelihood ?? existing.likelihood
    const newImpact = body.impact ?? existing.impact
    if (body.likelihood !== undefined) { sets.push('likelihood = ?'); bindings.push(body.likelihood) }
    if (body.impact !== undefined) { sets.push('impact = ?'); bindings.push(body.impact) }
    sets.push('inherent_risk = ?')
    bindings.push(newLikelihood * newImpact)

    // Recompute residual risk
    if (body.residualLikelihood !== undefined) { sets.push('residual_likelihood = ?'); bindings.push(body.residualLikelihood) }
    if (body.residualImpact !== undefined) { sets.push('residual_impact = ?'); bindings.push(body.residualImpact) }
    const resLikelihood = body.residualLikelihood ?? existing.residual_likelihood
    const resImpact = body.residualImpact ?? existing.residual_impact
    if (resLikelihood != null && resImpact != null) {
      sets.push('residual_risk = ?')
      bindings.push(resLikelihood * resImpact)
    }

    bindings.push(riskId, workspaceId)

    await c.env.DB.prepare(
      `UPDATE risk_entries SET ${sets.join(', ')} WHERE id = ? AND workspace_id = ?`
    )
      .bind(...bindings)
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'risk.updated',
      entityType: 'risk_entry',
      entityId: riskId,
      data: body,
      actorId: userId,
    })

    return c.json({ success: true })
  }
)

// ─── Policies ───────────────────────────────────────────────────────

/**
 * GET /policies
 * List policies for workspace.
 */
complianceRoutes.get('/policies', async (c) => {
  const workspaceId = c.get('workspaceId')

  const { results } = await c.env.DB.prepare(
    `SELECT p.id, p.workspace_id, p.template_id,
            COALESCE(p.title, pl.title) AS title,
            COALESCE(p.description, pl.description) AS description,
            COALESCE(p.category, pl.category) AS category,
            COALESCE(p.version, pl.version) AS version,
            COALESCE(p.content_text, pl.content_text) AS content_text,
            COALESCE(p.review_cycle_days, pl.review_cycle_days) AS review_cycle_days,
            p.status, p.file_ref, p.file_name, p.owner_email,
            p.approved_by, p.approved_at, p.next_review_at,
            p.created_at, p.updated_at,
            pl.title AS template_title,
            (SELECT COUNT(*) FROM policy_controls pc WHERE pc.policy_id = p.id AND pc.workspace_id = p.workspace_id) as controls_count
     FROM policies p
     LEFT JOIN policy_library pl ON p.template_id = pl.id
     WHERE p.workspace_id = ?
     ORDER BY COALESCE(p.title, pl.title) ASC`
  )
    .bind(workspaceId)
    .all<{
      id: string
      workspace_id: string
      template_id: string | null
      title: string
      description: string | null
      category: string
      version: string
      content_text: string | null
      review_cycle_days: number
      status: string
      file_ref: string | null
      file_name: string | null
      owner_email: string | null
      approved_by: string | null
      approved_at: string | null
      next_review_at: string | null
      created_at: string
      updated_at: string
      template_title: string | null
      controls_count: number
    }>()

  return c.json({
    policies: results.map((p) => ({
      id: p.id,
      workspaceId: p.workspace_id,
      templateId: p.template_id,
      title: p.title,
      description: p.description,
      category: p.category,
      version: p.version,
      status: p.status,
      fileRef: p.file_ref,
      fileName: p.file_name,
      contentText: p.content_text,
      owner: p.owner_email,
      approvedBy: p.approved_by,
      approvedAt: p.approved_at,
      reviewCycleDays: p.review_cycle_days,
      nextReviewDate: p.next_review_at,
      controlsCount: p.controls_count,
      templateTitle: p.template_title,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    })),
  })
})

/**
 * GET /policies/library
 * List policy templates from the library.
 */
complianceRoutes.get('/policies/library', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM policy_library ORDER BY category, title'
  ).all()
  return c.json({
    items: (results ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      description: r.description,
      contentText: r.content_text,
      version: r.version,
      reviewCycleDays: r.review_cycle_days,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
  })
})

/**
 * POST /policies/from-library
 * Add policies from library as references (not copies).
 */
const addFromPolicyLibSchema = z.object({
  templateIds: z.array(z.string()).min(1).max(50),
})

complianceRoutes.post(
  '/policies/from-library',
  requireRole('member'),
  zValidator('json', addFromPolicyLibSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const { templateIds } = c.req.valid('json')
    const now = new Date().toISOString()

    // Check which templates are already referenced in this workspace
    const { results: existing } = await c.env.DB.prepare(
      'SELECT template_id FROM policies WHERE workspace_id = ? AND template_id IS NOT NULL'
    ).bind(workspaceId).all<{ template_id: string }>()
    const existingTemplates = new Set(existing.map((e) => e.template_id))

    let created = 0
    let skipped = 0

    for (const templateId of templateIds) {
      if (existingTemplates.has(templateId)) {
        skipped++
        continue
      }

      const id = generateId()
      await c.env.DB.prepare(
        `INSERT INTO policies (id, workspace_id, template_id, status, created_at, updated_at)
         VALUES (?, ?, ?, 'draft', ?, ?)`
      ).bind(id, workspaceId, templateId, now, now).run()
      created++
    }

    return c.json({ created, skipped, total: templateIds.length })
  }
)

const createPolicySchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().optional(),
  category: z.string().min(1),
  version: z.string().optional(),
  ownerEmail: z.string().email().optional(),
  reviewCycleDays: z.number().int().min(1).optional(),
})

/**
 * POST /policies
 * Create a standalone policy (no template). Member+.
 */
complianceRoutes.post(
  '/policies',
  requireRole('member'),
  zValidator('json', createPolicySchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()
    const policyId = generateId()
    const reviewCycleDays = body.reviewCycleDays ?? 365
    const nextReview = new Date(Date.now() + reviewCycleDays * 86400000).toISOString()

    await c.env.DB.prepare(
      `INSERT INTO policies (id, workspace_id, title, description, category, version, status,
                             owner_email, review_cycle_days, next_review_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)`
    )
      .bind(
        policyId, workspaceId, body.title, body.description ?? null,
        body.category, body.version ?? '1.0',
        body.ownerEmail ?? null, reviewCycleDays, nextReview,
        now, now
      )
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'policy.created',
      entityType: 'policy',
      entityId: policyId,
      data: { title: body.title, category: body.category },
      actorId: userId,
    })

    return c.json(
      {
        policy: {
          id: policyId,
          workspaceId,
          title: body.title,
          description: body.description ?? null,
          category: body.category,
          version: body.version ?? '1.0',
          status: 'draft',
          fileRef: null,
          fileName: null,
          contentText: null,
          ownerEmail: body.ownerEmail ?? null,
          approvedBy: null,
          approvedAt: null,
          reviewCycleDays,
          nextReviewAt: nextReview,
          createdAt: now,
          updatedAt: now,
        },
      },
      201
    )
  }
)

const updatePolicySchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  version: z.string().optional(),
  status: z.string().optional(),
  contentText: z.string().optional(),
  ownerEmail: z.string().email().optional(),
  approvedBy: z.string().optional(),
  reviewCycleDays: z.number().int().min(1).optional(),
})

/**
 * PATCH /policies/:policyId
 * Update a policy. Admin+.
 */
complianceRoutes.patch(
  '/policies/:policyId',
  requireRole('admin'),
  zValidator('json', updatePolicySchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const policyId = c.req.param('policyId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()

    const existing = await c.env.DB.prepare(
      'SELECT id FROM policies WHERE id = ? AND workspace_id = ?'
    )
      .bind(policyId, workspaceId)
      .first()

    if (!existing) {
      return c.json({ error: 'Policy not found' }, 404)
    }

    const sets: string[] = ['updated_at = ?']
    const bindings: unknown[] = [now]

    if (body.title !== undefined) { sets.push('title = ?'); bindings.push(body.title) }
    if (body.description !== undefined) { sets.push('description = ?'); bindings.push(body.description) }
    if (body.category !== undefined) { sets.push('category = ?'); bindings.push(body.category) }
    if (body.version !== undefined) { sets.push('version = ?'); bindings.push(body.version) }
    if (body.status !== undefined) { sets.push('status = ?'); bindings.push(body.status) }
    if (body.contentText !== undefined) { sets.push('content_text = ?'); bindings.push(body.contentText) }
    if (body.ownerEmail !== undefined) { sets.push('owner_email = ?'); bindings.push(body.ownerEmail) }
    if (body.approvedBy !== undefined) {
      sets.push('approved_by = ?')
      bindings.push(body.approvedBy)
      sets.push('approved_at = ?')
      bindings.push(now)
    }
    if (body.reviewCycleDays !== undefined) {
      sets.push('review_cycle_days = ?')
      bindings.push(body.reviewCycleDays)
      sets.push('next_review_at = ?')
      bindings.push(new Date(Date.now() + body.reviewCycleDays * 86400000).toISOString())
    }

    bindings.push(policyId, workspaceId)

    await c.env.DB.prepare(
      `UPDATE policies SET ${sets.join(', ')} WHERE id = ? AND workspace_id = ?`
    )
      .bind(...bindings)
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'policy.updated',
      entityType: 'policy',
      entityId: policyId,
      data: body,
      actorId: userId,
    })

    return c.json({ success: true })
  }
)

/**
 * DELETE /policies/:policyId
 * Delete a policy and its control links. Admin+.
 */
complianceRoutes.delete(
  '/policies/:policyId',
  requireRole('admin'),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const policyId = c.req.param('policyId')

    const existing = await c.env.DB.prepare(
      'SELECT id FROM policies WHERE id = ? AND workspace_id = ?'
    ).bind(policyId, workspaceId).first()

    if (!existing) {
      return c.json({ error: 'Policy not found' }, 404)
    }

    // Delete control links first
    await c.env.DB.prepare(
      'DELETE FROM policy_controls WHERE policy_id = ? AND workspace_id = ?'
    ).bind(policyId, workspaceId).run()

    await c.env.DB.prepare(
      'DELETE FROM policies WHERE id = ? AND workspace_id = ?'
    ).bind(policyId, workspaceId).run()

    return c.json({ success: true })
  }
)

const linkPolicyControlSchema = z.object({
  controlId: z.string().min(1),
  coverage: z.string().optional(),
  notes: z.string().optional(),
})

/**
 * POST /policies/:policyId/controls
 * Link a policy to a control. Member+.
 */
complianceRoutes.post(
  '/policies/:policyId/controls',
  requireRole('member'),
  zValidator('json', linkPolicyControlSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const policyId = c.req.param('policyId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()

    // Verify policy belongs to workspace
    const policy = await c.env.DB.prepare(
      'SELECT id FROM policies WHERE id = ? AND workspace_id = ?'
    )
      .bind(policyId, workspaceId)
      .first()

    if (!policy) {
      return c.json({ error: 'Policy not found' }, 404)
    }

    // Verify control exists
    const control = await c.env.DB.prepare(
      'SELECT id FROM versioned_controls WHERE id = ?'
    )
      .bind(body.controlId)
      .first()

    if (!control) {
      return c.json({ error: 'Control not found' }, 404)
    }

    const linkId = generateId()

    await c.env.DB.prepare(
      `INSERT INTO policy_controls (id, workspace_id, policy_id, control_id, coverage, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        linkId, workspaceId, policyId, body.controlId,
        body.coverage ?? 'full', body.notes ?? null, now
      )
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'policy.control_linked',
      entityType: 'policy_control',
      entityId: linkId,
      data: { policyId, controlId: body.controlId, coverage: body.coverage ?? 'full' },
      actorId: userId,
    })

    return c.json(
      {
        policyControl: {
          id: linkId,
          workspaceId,
          policyId,
          controlId: body.controlId,
          coverage: body.coverage ?? 'full',
          notes: body.notes ?? null,
          createdAt: now,
        },
      },
      201
    )
  }
)

/**
 * DELETE /policies/:policyId/controls/:linkId
 * Unlink a control from a policy.
 */
complianceRoutes.delete(
  '/policies/:policyId/controls/:linkId',
  requireRole('member'),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const policyId = c.req.param('policyId')
    const linkId = c.req.param('linkId')

    await c.env.DB.prepare(
      'DELETE FROM policy_controls WHERE id = ? AND policy_id = ? AND workspace_id = ?'
    ).bind(linkId, policyId, workspaceId).run()

    return c.json({ ok: true })
  }
)

/**
 * GET /policies/:policyId/controls
 * List linked controls for a policy.
 */
complianceRoutes.get('/policies/:policyId/controls', async (c) => {
  const workspaceId = c.get('workspaceId')
  const policyId = c.req.param('policyId')

  const { results } = await c.env.DB.prepare(
    `SELECT pc.id, pc.policy_id, pc.control_id, pc.coverage, pc.notes, pc.created_at,
            vc.control_id as control_code, vc.title as control_title,
            f.name as framework_name
     FROM policy_controls pc
     JOIN versioned_controls vc ON pc.control_id = vc.id
     JOIN framework_versions fv ON fv.id = vc.framework_version_id
     JOIN frameworks f ON f.id = fv.framework_id
     WHERE pc.workspace_id = ? AND pc.policy_id = ?
     ORDER BY vc.control_id ASC`
  )
    .bind(workspaceId, policyId)
    .all<{
      id: string
      policy_id: string
      control_id: string
      coverage: string
      notes: string | null
      created_at: string
      control_code: string
      control_title: string
      framework_name: string
    }>()

  return c.json({
    controls: results.map((pc) => ({
      id: pc.id,
      policyId: pc.policy_id,
      controlId: pc.control_id,
      controlCode: pc.control_code,
      controlTitle: pc.control_title,
      frameworkName: pc.framework_name,
      coverage: pc.coverage,
      notes: pc.notes,
      createdAt: pc.created_at,
    })),
  })
})

// ─── Compliance Snapshots ───────────────────────────────────────────

const createSnapshotSchema = z.object({
  name: z.string().min(1).max(200),
  snapshotType: z.string().optional(),
})

/**
 * POST /snapshots
 * Capture a compliance snapshot. Admin+.
 * Gathers all current state, computes posture_score, stores as JSON detail.
 */
complianceRoutes.post(
  '/snapshots',
  requireRole('admin'),
  zValidator('json', createSnapshotSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()
    const snapshotId = generateId()

    // Gather framework adoptions
    const { results: adoptions } = await c.env.DB.prepare(
      `SELECT wa.id, wa.framework_version_id, fv.version, f.name as framework_name
       FROM workspace_adoptions wa
       JOIN framework_versions fv ON wa.framework_version_id = fv.id
       JOIN frameworks f ON fv.framework_id = f.id
       WHERE wa.workspace_id = ?
       AND (wa.effective_until IS NULL OR wa.effective_until > datetime('now'))`
    )
      .bind(workspaceId)
      .all<{
        id: string
        framework_version_id: string
        version: string
        framework_name: string
      }>()

    const frameworkNames = adoptions.map((a) => a.framework_name)

    // Gather all controls from adopted frameworks
    const { results: controls } = await c.env.DB.prepare(
      `SELECT vc.id, vc.control_id, vc.title
       FROM versioned_controls vc
       JOIN framework_versions fv ON vc.framework_version_id = fv.id
       JOIN workspace_adoptions wa ON wa.framework_version_id = fv.id
       WHERE wa.workspace_id = ?`
    )
      .bind(workspaceId)
      .all<{ id: string; control_id: string; title: string }>()

    const totalControls = controls.length

    // Check evidence links per control
    const { results: evidenceLinks } = await c.env.DB.prepare(
      `SELECT DISTINCT el.control_id
       FROM evidence_links el
       JOIN evidence e ON el.evidence_id = e.id
       WHERE e.workspace_id = ?`
    )
      .bind(workspaceId)
      .all<{ control_id: string }>()

    const controlsWithEvidence = new Set(evidenceLinks.map((el) => el.control_id))

    // Check mv_control_status for status overrides
    const { results: wcStatuses } = await c.env.DB.prepare(
      `SELECT control_id, status FROM mv_control_status WHERE workspace_id = ?`
    )
      .bind(workspaceId)
      .all<{ control_id: string; status: string }>()

    const statusMap = new Map(wcStatuses.map((wc) => [wc.control_id, wc.status]))

    let compliantCount = 0
    let partialCount = 0
    let gapCount = 0
    let notApplicableCount = 0

    const controlStatuses: Array<{ controlId: string; controlRef: string; status: string }> = []

    for (const ctrl of controls) {
      const override = statusMap.get(ctrl.id)
      let status: string

      if (override === 'not_applicable') {
        status = 'not_applicable'
        notApplicableCount++
      } else if (override === 'compliant' || controlsWithEvidence.has(ctrl.id)) {
        status = 'compliant'
        compliantCount++
      } else if (override === 'partial') {
        status = 'partial'
        partialCount++
      } else {
        status = 'gap'
        gapCount++
      }

      controlStatuses.push({ controlId: ctrl.id, controlRef: ctrl.control_id, status })
    }

    const applicableControls = totalControls - notApplicableCount
    const postureScore =
      applicableControls > 0
        ? Math.round(((compliantCount + 0.5 * partialCount) / applicableControls) * 10000) / 10000
        : null

    // Gather violation summary
    const violationSummary = await c.env.DB.prepare(
      `SELECT status, COUNT(*) as cnt FROM baseline_violations WHERE workspace_id = ? GROUP BY status`
    )
      .bind(workspaceId)
      .all<{ status: string; cnt: number }>()

    // Gather access stats
    const accessTotal = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM access_records WHERE workspace_id = ? AND revoked_at IS NULL'
    )
      .bind(workspaceId)
      .first<{ total: number }>()

    const detail = {
      frameworks: adoptions.map((a) => ({
        name: a.framework_name,
        version: a.version,
      })),
      controlStatuses,
      violations: violationSummary.results ?? [],
      accessStats: { totalActive: accessTotal?.total ?? 0 },
      capturedAt: now,
    }

    const detailJson = JSON.stringify(detail)

    await c.env.DB.prepare(
      `INSERT INTO compliance_snapshots (id, workspace_id, name, snapshot_type, frameworks,
                                         captured_at, captured_by, posture_score,
                                         total_controls, compliant_count, partial_count,
                                         gap_count, not_applicable_count,
                                         detail_ref, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        snapshotId, workspaceId, body.name, body.snapshotType ?? 'manual',
        JSON.stringify(frameworkNames), now, userId, postureScore,
        totalControls, compliantCount, partialCount, gapCount, notApplicableCount,
        detailJson, now
      )
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'snapshot.captured',
      entityType: 'compliance_snapshot',
      entityId: snapshotId,
      data: { name: body.name, postureScore, totalControls, compliantCount },
      actorId: userId,
    })

    return c.json(
      {
        snapshot: {
          id: snapshotId,
          workspaceId,
          name: body.name,
          snapshotType: body.snapshotType ?? 'manual',
          frameworks: frameworkNames,
          capturedAt: now,
          capturedBy: userId,
          postureScore,
          totalControls,
          compliantCount,
          partialCount,
          gapCount,
          notApplicableCount,
          createdAt: now,
        },
      },
      201
    )
  }
)

/**
 * GET /snapshots
 * List compliance snapshots for workspace.
 */
complianceRoutes.get('/snapshots', async (c) => {
  const workspaceId = c.get('workspaceId')

  const { results } = await c.env.DB.prepare(
    `SELECT id, workspace_id, name, snapshot_type, frameworks,
            captured_at, captured_by, posture_score,
            total_controls, compliant_count, partial_count,
            gap_count, not_applicable_count, created_at
     FROM compliance_snapshots
     WHERE workspace_id = ?
     ORDER BY captured_at DESC`
  )
    .bind(workspaceId)
    .all<{
      id: string
      workspace_id: string
      name: string
      snapshot_type: string
      frameworks: string
      captured_at: string
      captured_by: string
      posture_score: number | null
      total_controls: number
      compliant_count: number
      partial_count: number
      gap_count: number
      not_applicable_count: number
      created_at: string
    }>()

  return c.json({
    snapshots: results.map((s) => ({
      id: s.id,
      workspaceId: s.workspace_id,
      name: s.name,
      snapshotType: s.snapshot_type,
      frameworks: JSON.parse(s.frameworks),
      capturedAt: s.captured_at,
      capturedBy: s.captured_by,
      postureScore: s.posture_score,
      totalControls: s.total_controls,
      compliantCount: s.compliant_count,
      partialCount: s.partial_count,
      gapCount: s.gap_count,
      notApplicableCount: s.not_applicable_count,
      createdAt: s.created_at,
    })),
  })
})

/**
 * GET /snapshots/:snapshotId
 * Get snapshot detail including full control-level breakdown.
 */
complianceRoutes.get('/snapshots/:snapshotId', async (c) => {
  const workspaceId = c.get('workspaceId')
  const snapshotId = c.req.param('snapshotId')

  const snapshot = await c.env.DB.prepare(
    `SELECT id, workspace_id, name, snapshot_type, frameworks,
            captured_at, captured_by, posture_score,
            total_controls, compliant_count, partial_count,
            gap_count, not_applicable_count, detail_ref, detail_hash, created_at
     FROM compliance_snapshots
     WHERE id = ? AND workspace_id = ?`
  )
    .bind(snapshotId, workspaceId)
    .first<{
      id: string
      workspace_id: string
      name: string
      snapshot_type: string
      frameworks: string
      captured_at: string
      captured_by: string
      posture_score: number | null
      total_controls: number
      compliant_count: number
      partial_count: number
      gap_count: number
      not_applicable_count: number
      detail_ref: string | null
      detail_hash: string | null
      created_at: string
    }>()

  if (!snapshot) {
    return c.json({ error: 'Snapshot not found' }, 404)
  }

  return c.json({
    snapshot: {
      id: snapshot.id,
      workspaceId: snapshot.workspace_id,
      name: snapshot.name,
      snapshotType: snapshot.snapshot_type,
      frameworks: JSON.parse(snapshot.frameworks),
      capturedAt: snapshot.captured_at,
      capturedBy: snapshot.captured_by,
      postureScore: snapshot.posture_score,
      totalControls: snapshot.total_controls,
      compliantCount: snapshot.compliant_count,
      partialCount: snapshot.partial_count,
      gapCount: snapshot.gap_count,
      notApplicableCount: snapshot.not_applicable_count,
      detail: snapshot.detail_ref ? JSON.parse(snapshot.detail_ref) : null,
      detailHash: snapshot.detail_hash,
      createdAt: snapshot.created_at,
    },
  })
})

// ─── Workspace Settings ───────────────────────────────────────────────

/**
 * GET /api/workspaces/:workspaceId/settings/ai-providers
 * List active AI providers configured by super admins.
 */
complianceRoutes.get('/settings/ai-providers', async (c) => {
  const workspaceId = c.get('workspaceId')

  // Common key names admins use for API keys
  const apiKeyNames = ['api_key', 'apiKey', 'X-Api-Key', 'x-api-key', 'key', 'API_KEY']
  const placeholders = apiKeyNames.map(() => '?').join(', ')

  // Get all AI providers with whether they have an admin-configured key (checking common names)
  const { results } = await c.env.DB.prepare(
    `SELECT p.id, p.slug, p.name, p.enabled,
            CASE WHEN pc.value IS NOT NULL AND pc.value != '' THEN 1 ELSE 0 END AS has_admin_key
     FROM platform_providers p
     LEFT JOIN platform_provider_configs pc
       ON pc.provider_id = p.id AND pc.key IN (${placeholders})
     WHERE p.category = 'ai'
     GROUP BY p.id
     ORDER BY p.name ASC`
  ).bind(...apiKeyNames).all<{ id: string; slug: string; name: string; enabled: number; has_admin_key: number }>()

  // Check workspace settings: user keys + key source preferences
  const { results: wsSettings } = await c.env.DB.prepare(
    `SELECT key, value FROM workspace_settings
     WHERE workspace_id = ? AND (key LIKE 'ai.provider_key.%' OR key LIKE 'ai.key_source.%')`
  ).bind(workspaceId).all<{ key: string; value: string }>()

  const settingsMap = new Map(wsSettings.map((k) => [k.key, k.value]))

  const providers = results.map((p) => {
    const userKey = settingsMap.get(`ai.provider_key.${p.slug}`)
    const keySource = settingsMap.get(`ai.key_source.${p.slug}`) ?? 'platform'
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      enabled: p.enabled === 1,
      hasAdminKey: p.has_admin_key === 1,
      hasUserKey: !!userKey && userKey !== '',
      keySource, // 'platform' = use admin key, 'user' = require own key
    }
  })

  const activeProviders = providers.filter((p) => p.enabled)

  return c.json({
    providers,
    activeProviders,
    hasActiveProvider: activeProviders.length > 0,
  })
})

/**
 * GET /api/workspaces/:workspaceId/settings
 * List all workspace settings.
 */
complianceRoutes.get('/settings', async (c) => {
  const workspaceId = c.get('workspaceId')

  const { results } = await c.env.DB.prepare(
    'SELECT key, value, updated_by, updated_at FROM workspace_settings WHERE workspace_id = ? ORDER BY key ASC'
  )
    .bind(workspaceId)
    .all<{ key: string; value: string; updated_by: string | null; updated_at: string }>()

  return c.json({ settings: results })
})

const updateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
})

/**
 * PUT /api/workspaces/:workspaceId/settings
 * Create or update a workspace setting. Admin+ only.
 */
complianceRoutes.put('/settings', requireRole('admin'), zValidator('json', updateSettingSchema), async (c) => {
  const workspaceId = c.get('workspaceId')
  const userId = c.get('userId')
  const { key, value } = c.req.valid('json')
  const now = new Date().toISOString()

  // Upsert
  const existing = await c.env.DB.prepare(
    'SELECT id FROM workspace_settings WHERE workspace_id = ? AND key = ?'
  ).bind(workspaceId, key).first<{ id: string }>()

  if (existing) {
    await c.env.DB.prepare(
      'UPDATE workspace_settings SET value = ?, updated_by = ?, updated_at = ? WHERE id = ?'
    ).bind(value, userId, now, existing.id).run()
  } else {
    const id = generateId()
    await c.env.DB.prepare(
      'INSERT INTO workspace_settings (id, workspace_id, key, value, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, workspaceId, key, value, userId, now).run()
  }

  await emitEvent(c.env.DB, {
    workspaceId,
    eventType: 'setting.updated',
    entityType: 'workspace_setting',
    entityId: key,
    data: { key, value: value.length > 200 ? value.slice(0, 200) + '...' : value },
    actorId: userId,
  })

  return c.json({ success: true, key, value })
})

/**
 * DELETE /api/workspaces/:workspaceId/settings/:key
 * Delete a workspace setting (revert to default). Admin+ only.
 */
complianceRoutes.delete('/settings/:key', requireRole('admin'), async (c) => {
  const workspaceId = c.get('workspaceId')
  const key = c.req.param('key')

  await c.env.DB.prepare(
    'DELETE FROM workspace_settings WHERE workspace_id = ? AND key = ?'
  ).bind(workspaceId, key).run()

  return c.json({ success: true })
})

// ─── Audit Narrative ──────────────────────────────────────────────

const auditNarrativeSchema = z.object({
  frameworkSlug: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
})

/**
 * POST /audit-narrative
 * Generate a compliance narrative document for auditors. Admin+.
 * Uses Claude to produce a professional narrative per control, or
 * falls back to a template if ANTHROPIC_API_KEY is not configured.
 */
complianceRoutes.post(
  '/audit-narrative',
  requireRole('admin'),
  zValidator('json', auditNarrativeSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const { frameworkSlug, name } = c.req.valid('json')
    const now = new Date().toISOString()
    const today = now.split('T')[0]
    const db = c.env.DB

    // 1. Find active adoption for this framework
    const adoption = await db
      .prepare(
        `SELECT wa.framework_version_id, f.name as framework_name, fv.version as framework_version
         FROM workspace_adoptions wa
         JOIN framework_versions fv ON fv.id = wa.framework_version_id
         JOIN frameworks f ON f.id = fv.framework_id
         WHERE wa.workspace_id = ? AND f.slug = ?
         AND wa.superseded_by IS NULL
         AND (wa.effective_until IS NULL OR wa.effective_until > datetime('now'))
         ORDER BY wa.adopted_at DESC
         LIMIT 1`
      )
      .bind(workspaceId, frameworkSlug)
      .first<{
        framework_version_id: string
        framework_name: string
        framework_version: string
      }>()

    if (!adoption) {
      return c.json({ error: `No active adoption found for framework: ${frameworkSlug}` }, 404)
    }

    // 2. Get all controls for this framework version
    const { results: controls } = await db
      .prepare(
        `SELECT id, control_id, title, requirement_text
         FROM versioned_controls
         WHERE framework_version_id = ?
         ORDER BY control_id ASC`
      )
      .bind(adoption.framework_version_id)
      .all<{ id: string; control_id: string; title: string; requirement_text: string }>()

    // 3. Gather evidence, crosswalks, violations, policies per control
    const controlIds = controls.map((ctrl) => ctrl.id)

    // Evidence links
    const { results: evidenceLinks } = await db
      .prepare(
        `SELECT el.control_id, e.id as evidence_id, e.title as evidence_title, e.created_at as evidence_date
         FROM evidence_links el
         JOIN evidence e ON el.evidence_id = e.id
         WHERE el.workspace_id = ? AND el.framework_version_id = ?`
      )
      .bind(workspaceId, adoption.framework_version_id)
      .all<{ control_id: string; evidence_id: string; evidence_title: string; evidence_date: string }>()

    const evidenceByControl = new Map<string, Array<{ title: string; date: string }>>()
    for (const el of evidenceLinks) {
      const list = evidenceByControl.get(el.control_id) ?? []
      list.push({ title: el.evidence_title, date: el.evidence_date.split('T')[0] })
      evidenceByControl.set(el.control_id, list)
    }

    // Crosswalk mappings
    const { results: crosswalks } = await db
      .prepare(
        `SELECT cw.source_control_id, cw.target_control_id, cw.mapping_type,
                f.name as framework_name, vc.control_id as mapped_control_id
         FROM control_crosswalks cw
         JOIN versioned_controls vc ON vc.id = cw.target_control_id
         JOIN framework_versions fv ON fv.id = vc.framework_version_id
         JOIN frameworks f ON f.id = fv.framework_id
         WHERE cw.source_control_id IN (
           SELECT id FROM versioned_controls WHERE framework_version_id = ?
         )`
      )
      .bind(adoption.framework_version_id)
      .all<{ source_control_id: string; target_control_id: string; mapping_type: string; framework_name: string; mapped_control_id: string }>()

    const crosswalksByControl = new Map<string, Array<{ framework: string; controlId: string }>>()
    for (const cw of crosswalks) {
      const list = crosswalksByControl.get(cw.source_control_id) ?? []
      list.push({ framework: cw.framework_name, controlId: cw.mapped_control_id })
      crosswalksByControl.set(cw.source_control_id, list)
    }

    // Violations
    const { results: violations } = await db
      .prepare(
        `SELECT bv.entity_id, b.name as baseline_name
         FROM baseline_violations bv
         JOIN baselines b ON b.id = bv.baseline_id
         WHERE bv.workspace_id = ? AND bv.status = 'open'`
      )
      .bind(workspaceId)
      .all<{ entity_id: string; baseline_name: string }>()

    const violationsByControl = new Map<string, Array<{ baselineName: string }>>()
    for (const v of violations) {
      const list = violationsByControl.get(v.entity_id) ?? []
      list.push({ baselineName: v.baseline_name })
      violationsByControl.set(v.entity_id, list)
    }

    // Policies mapped to controls
    const { results: policyMappings } = await db
      .prepare(
        `SELECT pc.control_id, p.title
         FROM policy_controls pc
         JOIN policies p ON p.id = pc.policy_id
         WHERE pc.workspace_id = ?`
      )
      .bind(workspaceId)
      .all<{ control_id: string; title: string }>()

    const policiesByControl = new Map<string, Array<{ title: string }>>()
    for (const pm of policyMappings) {
      const list = policiesByControl.get(pm.control_id) ?? []
      list.push({ title: pm.title })
      policiesByControl.set(pm.control_id, list)
    }

    // 4. Build per-control data
    const controlData = controls.map((ctrl) => ({
      controlId: ctrl.control_id,
      title: ctrl.title,
      evidence: evidenceByControl.get(ctrl.id) ?? [],
      crosswalks: crosswalksByControl.get(ctrl.id) ?? [],
      violations: violationsByControl.get(ctrl.id) ?? [],
      policies: policiesByControl.get(ctrl.id) ?? [],
    }))

    // Get workspace name
    const workspace = await db
      .prepare('SELECT name FROM workspaces WHERE id = ?')
      .bind(workspaceId)
      .first<{ name: string }>()
    const workspaceName = workspace?.name ?? 'Unknown'

    let narrativeText: string

    if (c.env.ANTHROPIC_API_KEY) {
      // 5. Build prompt and call Claude
      const controlsBlock = controlData
        .map(
          (ctrl) => `### ${ctrl.controlId} — ${ctrl.title}
Evidence: ${ctrl.evidence.length > 0 ? ctrl.evidence.map((e) => `[${e.title}] (captured ${e.date})`).join(', ') : 'NONE — GAP'}
Crosswalk coverage: ${ctrl.crosswalks.length > 0 ? ctrl.crosswalks.map((x) => `${x.framework} ${x.controlId}`).join(', ') : 'None'}
Violations: ${ctrl.violations.length > 0 ? ctrl.violations.map((v) => v.baselineName).join(', ') : 'None'}
Policies: ${ctrl.policies.length > 0 ? ctrl.policies.map((p) => p.title).join(', ') : 'None'}`
        )
        .join('\n\n')

      const prompt = `Generate a professional compliance narrative for an auditor reviewing ${adoption.framework_name} compliance.

Workspace: ${workspaceName}
Framework: ${adoption.framework_name} v${adoption.framework_version}
Date: ${today}

For each control below, write 2-3 sentences explaining how the organization satisfies it, referencing the evidence provided. If evidence is missing, note the gap.

Controls:
${controlsBlock}`

      // Get workspace AI model setting
      const modelRow = await db
        .prepare("SELECT value FROM workspace_settings WHERE workspace_id = ? AND key = 'ai.model'")
        .bind(workspaceId)
        .first<{ value: string }>()
      const model = modelRow?.value ?? 'claude-sonnet-4-20250514'

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': c.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 8192,
          temperature: 0.3,
          system: 'You are a compliance documentation expert. Write clear, professional audit narratives.',
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return c.json({ error: `Claude API error (${response.status}): ${errorText}` }, 502)
      }

      const claudeResult = (await response.json()) as { content: Array<{ type: string; text?: string }> }
      narrativeText = claudeResult.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text ?? '')
        .join('\n')
    } else {
      // Fallback: template-based narrative (no AI)
      const lines: string[] = [
        `# Compliance Narrative — ${adoption.framework_name} v${adoption.framework_version}`,
        `**Workspace:** ${workspaceName}`,
        `**Date:** ${today}`,
        '',
        '---',
        '',
      ]

      for (const ctrl of controlData) {
        lines.push(`## ${ctrl.controlId} — ${ctrl.title}`)
        if (ctrl.evidence.length > 0) {
          lines.push(`**Status:** Covered`)
          lines.push(`**Evidence:** ${ctrl.evidence.map((e) => `${e.title} (${e.date})`).join(', ')}`)
        } else {
          lines.push(`**Status:** GAP — No evidence on file`)
        }
        if (ctrl.crosswalks.length > 0) {
          lines.push(`**Crosswalk coverage:** ${ctrl.crosswalks.map((x) => `${x.framework} ${x.controlId}`).join(', ')}`)
        }
        if (ctrl.violations.length > 0) {
          lines.push(`**Open violations:** ${ctrl.violations.map((v) => v.baselineName).join(', ')}`)
        }
        if (ctrl.policies.length > 0) {
          lines.push(`**Applicable policies:** ${ctrl.policies.map((p) => p.title).join(', ')}`)
        }
        lines.push('')
      }

      narrativeText = lines.join('\n')
    }

    // 6. Store as a compliance_snapshot with snapshot_type='audit_narrative'
    const snapshotId = generateId()
    const snapshotName = name ?? `Audit Narrative — ${adoption.framework_name} ${today}`

    await db
      .prepare(
        `INSERT INTO compliance_snapshots (id, workspace_id, name, snapshot_type, frameworks,
                                           captured_at, captured_by, posture_score,
                                           total_controls, compliant_count, partial_count,
                                           gap_count, not_applicable_count,
                                           detail_ref, created_at)
         VALUES (?, ?, ?, 'audit_narrative', ?, ?, ?, NULL, ?, ?, 0, ?, 0, ?, ?)`
      )
      .bind(
        snapshotId,
        workspaceId,
        snapshotName,
        JSON.stringify([adoption.framework_name]),
        now,
        userId,
        controls.length,
        controlData.filter((c) => c.evidence.length > 0).length,
        controlData.filter((c) => c.evidence.length === 0).length,
        JSON.stringify({ narrative: narrativeText }),
        now
      )
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'snapshot.captured',
      entityType: 'compliance_snapshot',
      entityId: snapshotId,
      data: { name: snapshotName, type: 'audit_narrative', framework: adoption.framework_name },
      actorId: userId,
    })

    return c.json(
      {
        snapshotId,
        name: snapshotName,
        framework: adoption.framework_name,
        version: adoption.framework_version,
        totalControls: controls.length,
        coveredControls: controlData.filter((c) => c.evidence.length > 0).length,
        gapControls: controlData.filter((c) => c.evidence.length === 0).length,
        narrative: narrativeText,
      },
      201
    )
  }
)

// ─── Risk Score Recomputation ─────────────────────────────────────────

/**
 * POST /risk-recompute
 * Recompute risk_score for all active access records. Admin+.
 * Enhanced scoring includes staleness factor from review dates.
 */
complianceRoutes.post('/risk-recompute', requireRole('admin'), async (c) => {
  const workspaceId = c.get('workspaceId')
  const db = c.env.DB

  // Fetch all active access records joined with system data
  const { results: accessRecords } = await db
    .prepare(
      `SELECT ar.id, ar.role, ar.approved_by, ar.reviewed_at,
              s.classification, s.data_sensitivity, s.mfa_required
       FROM access_records ar
       JOIN systems s ON s.id = ar.system_id
       WHERE ar.workspace_id = ? AND ar.revoked_at IS NULL`
    )
    .bind(workspaceId)
    .all<{
      id: string
      role: string
      approved_by: string | null
      reviewed_at: string | null
      classification: string
      data_sensitivity: string
      mfa_required: number
    }>()

  let highRiskCount = 0

  // Recompute and batch update
  for (const ar of accessRecords) {
    const sensitivity =
      ({ high: 1.0, medium: 0.6, low: 0.3 } as Record<string, number>)[ar.data_sensitivity] ?? 0.5
    const privilege =
      ({ admin: 1.0, write: 0.7, read: 0.3 } as Record<string, number>)[ar.role] ?? 0.5
    const mfaFactor = !ar.mfa_required && ar.classification === 'critical' ? 1.0 : 0.0
    const approvalFactor = ar.approved_by ? 0.0 : 1.0

    // Staleness: days since last review, capped at 1.0
    let staleness = 0
    if (ar.reviewed_at) {
      const daysSinceReview = (Date.now() - new Date(ar.reviewed_at).getTime()) / (1000 * 60 * 60 * 24)
      staleness = Math.min(daysSinceReview / 365, 1.0)
    } else {
      staleness = 1.0 // never reviewed = max staleness
    }

    const newScore =
      Math.round(
        (sensitivity * 0.3 +
          privilege * 0.25 +
          staleness * 0.2 +
          mfaFactor * 0.15 +
          approvalFactor * 0.1) *
          100
      ) / 100

    if (newScore > 0.7) highRiskCount++

    await db
      .prepare('UPDATE access_records SET risk_score = ? WHERE id = ?')
      .bind(newScore, ar.id)
      .run()
  }

  return c.json({
    recomputed: accessRecords.length,
    highRisk: highRiskCount,
  })
})

// ─── Custom Field Definitions ────────────────────────────────────────

/**
 * GET /custom-fields
 * List custom field definitions. Optional ?entityType= filter.
 */
complianceRoutes.get('/custom-fields', async (c) => {
  const workspaceId = c.get('workspaceId')
  const entityType = c.req.query('entityType')

  let sql = `SELECT id, workspace_id, entity_type, field_name, field_label, field_type,
                    field_options, display_order, required, created_at, updated_at
             FROM custom_field_definitions WHERE workspace_id = ?`
  const bindings: unknown[] = [workspaceId]

  if (entityType) {
    sql += ' AND entity_type = ?'
    bindings.push(entityType)
  }

  sql += ' ORDER BY entity_type ASC, display_order ASC, field_name ASC'

  const { results } = await c.env.DB.prepare(sql)
    .bind(...bindings)
    .all<{
      id: string
      workspace_id: string
      entity_type: string
      field_name: string
      field_label: string
      field_type: string
      field_options: string | null
      display_order: number
      required: number
      created_at: string
      updated_at: string
    }>()

  return c.json({
    fields: results.map((f) => ({
      id: f.id,
      workspaceId: f.workspace_id,
      entityType: f.entity_type,
      fieldName: f.field_name,
      fieldLabel: f.field_label,
      fieldType: f.field_type,
      fieldOptions: f.field_options ? JSON.parse(f.field_options) : null,
      displayOrder: f.display_order,
      required: Boolean(f.required),
      createdAt: f.created_at,
      updatedAt: f.updated_at,
    })),
  })
})

const createCustomFieldSchema = z.object({
  entityType: z.enum(['person', 'system', 'access_record']),
  fieldName: z.string().min(1).max(100),
  fieldLabel: z.string().min(1).max(200),
  fieldType: z.enum(['text', 'number', 'select', 'date', 'boolean']),
  fieldOptions: z.array(z.string()).optional(),
  displayOrder: z.number().int().optional(),
  required: z.boolean().optional(),
})

/**
 * POST /custom-fields
 * Create a custom field definition. Requires admin+.
 */
complianceRoutes.post(
  '/custom-fields',
  requireRole('admin'),
  zValidator('json', createCustomFieldSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()
    const fieldId = generateId()

    await c.env.DB.prepare(
      `INSERT INTO custom_field_definitions (id, workspace_id, entity_type, field_name, field_label,
                                             field_type, field_options, display_order, required, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        fieldId,
        workspaceId,
        body.entityType,
        body.fieldName,
        body.fieldLabel,
        body.fieldType,
        body.fieldOptions ? JSON.stringify(body.fieldOptions) : null,
        body.displayOrder ?? 0,
        body.required ? 1 : 0,
        now,
        now
      )
      .run()

    return c.json(
      {
        field: {
          id: fieldId,
          workspaceId,
          entityType: body.entityType,
          fieldName: body.fieldName,
          fieldLabel: body.fieldLabel,
          fieldType: body.fieldType,
          fieldOptions: body.fieldOptions ?? null,
          displayOrder: body.displayOrder ?? 0,
          required: body.required ?? false,
          createdAt: now,
          updatedAt: now,
        },
      },
      201
    )
  }
)

const updateCustomFieldSchema = z.object({
  fieldLabel: z.string().min(1).max(200).optional(),
  fieldOptions: z.array(z.string()).optional(),
  displayOrder: z.number().int().optional(),
  required: z.boolean().optional(),
})

/**
 * PATCH /custom-fields/:fieldId
 * Update a custom field definition. Requires admin+.
 */
complianceRoutes.patch(
  '/custom-fields/:fieldId',
  requireRole('admin'),
  zValidator('json', updateCustomFieldSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const fieldId = c.req.param('fieldId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()

    const existing = await c.env.DB.prepare(
      'SELECT id FROM custom_field_definitions WHERE id = ? AND workspace_id = ?'
    )
      .bind(fieldId, workspaceId)
      .first()

    if (!existing) {
      return c.json({ error: 'Custom field not found' }, 404)
    }

    const sets: string[] = ['updated_at = ?']
    const bindings: unknown[] = [now]

    if (body.fieldLabel !== undefined) {
      sets.push('field_label = ?')
      bindings.push(body.fieldLabel)
    }
    if (body.fieldOptions !== undefined) {
      sets.push('field_options = ?')
      bindings.push(JSON.stringify(body.fieldOptions))
    }
    if (body.displayOrder !== undefined) {
      sets.push('display_order = ?')
      bindings.push(body.displayOrder)
    }
    if (body.required !== undefined) {
      sets.push('required = ?')
      bindings.push(body.required ? 1 : 0)
    }

    bindings.push(fieldId, workspaceId)

    await c.env.DB.prepare(
      `UPDATE custom_field_definitions SET ${sets.join(', ')} WHERE id = ? AND workspace_id = ?`
    )
      .bind(...bindings)
      .run()

    return c.json({ success: true })
  }
)

/**
 * DELETE /custom-fields/:fieldId
 * Delete a custom field definition and all its values. Requires admin+.
 */
complianceRoutes.delete(
  '/custom-fields/:fieldId',
  requireRole('admin'),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const fieldId = c.req.param('fieldId')

    const existing = await c.env.DB.prepare(
      'SELECT id FROM custom_field_definitions WHERE id = ? AND workspace_id = ?'
    )
      .bind(fieldId, workspaceId)
      .first()

    if (!existing) {
      return c.json({ error: 'Custom field not found' }, 404)
    }

    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM custom_field_values WHERE field_id = ? AND workspace_id = ?').bind(
        fieldId,
        workspaceId
      ),
      c.env.DB.prepare('DELETE FROM custom_field_definitions WHERE id = ? AND workspace_id = ?').bind(
        fieldId,
        workspaceId
      ),
    ])

    return c.json({ success: true })
  }
)

/**
 * GET /custom-fields/values/:entityType/:entityId
 * Get custom field values for a specific entity.
 */
complianceRoutes.get('/custom-fields/values/:entityType/:entityId', async (c) => {
  const workspaceId = c.get('workspaceId')
  const entityType = c.req.param('entityType')
  const entityId = c.req.param('entityId')

  const { results } = await c.env.DB.prepare(
    `SELECT cfv.field_id, cfv.value, cfd.field_name, cfd.field_label, cfd.field_type
     FROM custom_field_values cfv
     JOIN custom_field_definitions cfd ON cfd.id = cfv.field_id
     WHERE cfv.workspace_id = ? AND cfv.entity_type = ? AND cfv.entity_id = ?
     ORDER BY cfd.display_order ASC`
  )
    .bind(workspaceId, entityType, entityId)
    .all<{
      field_id: string
      value: string | null
      field_name: string
      field_label: string
      field_type: string
    }>()

  return c.json({
    values: results.map((v) => ({
      fieldId: v.field_id,
      fieldName: v.field_name,
      fieldLabel: v.field_label,
      fieldType: v.field_type,
      value: v.value,
    })),
  })
})

const saveCustomFieldValuesSchema = z.object({
  values: z.record(z.string(), z.string().nullable()),
})

/**
 * PUT /custom-fields/values/:entityType/:entityId
 * Upsert custom field values for an entity. Requires member+.
 */
complianceRoutes.put(
  '/custom-fields/values/:entityType/:entityId',
  requireRole('member'),
  zValidator('json', saveCustomFieldValuesSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const entityType = c.req.param('entityType')
    const entityId = c.req.param('entityId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()

    const entries = Object.entries(body.values)
    if (entries.length === 0) {
      return c.json({ success: true, saved: 0 })
    }

    // Validate field IDs belong to this workspace and entity type
    const fieldIds = entries.map(([fid]) => fid)
    const placeholders = fieldIds.map(() => '?').join(',')
    const { results: validFields } = await c.env.DB.prepare(
      `SELECT id, required FROM custom_field_definitions
       WHERE id IN (${placeholders}) AND workspace_id = ? AND entity_type = ?`
    )
      .bind(...fieldIds, workspaceId, entityType)
      .all<{ id: string; required: number }>()

    const validFieldIds = new Set(validFields.map((f) => f.id))

    // Check required fields
    for (const field of validFields) {
      if (field.required) {
        const val = body.values[field.id]
        if (!val || val.trim() === '') {
          return c.json({ error: `Required field ${field.id} is empty` }, 400)
        }
      }
    }

    const stmts = entries
      .filter(([fid]) => validFieldIds.has(fid))
      .map(([fieldId, value]) =>
        c.env.DB.prepare(
          `INSERT INTO custom_field_values (id, workspace_id, entity_type, entity_id, field_id, value, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(workspace_id, entity_id, field_id)
           DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
        ).bind(generateId(), workspaceId, entityType, entityId, fieldId, value, now, now)
      )

    if (stmts.length > 0) {
      await c.env.DB.batch(stmts)
    }

    return c.json({ success: true, saved: stmts.length })
  }
)

// ─── Bulk Directory Import ──────────────────────────────────────────

const bulkDirectoryUserSchema = z.object({
  users: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        department: z.string().optional(),
        title: z.string().optional(),
        employmentStatus: z.string().optional(),
        customFields: z.record(z.string(), z.string()).optional(),
      })
    )
    .min(1)
    .max(500),
})

/**
 * POST /directory/bulk
 * Bulk import directory users from CSV. Requires member+.
 */
complianceRoutes.post(
  '/directory/bulk',
  requireRole('member'),
  zValidator('json', bulkDirectoryUserSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()

    // Get existing emails for dedup
    const { results: existingUsers } = await c.env.DB.prepare(
      'SELECT email FROM directory_users WHERE workspace_id = ?'
    )
      .bind(workspaceId)
      .all<{ email: string }>()
    const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()))

    // Get custom field definitions for person entity type
    const { results: fieldDefs } = await c.env.DB.prepare(
      "SELECT id, field_name FROM custom_field_definitions WHERE workspace_id = ? AND entity_type = 'person'"
    )
      .bind(workspaceId)
      .all<{ id: string; field_name: string }>()
    const fieldNameToId = new Map(fieldDefs.map((f) => [f.field_name, f.id]))

    let created = 0
    let skipped = 0
    const errors: { row: number; email: string; reason: string }[] = []
    const insertStmts: D1PreparedStatement[] = []
    const cfvStmts: D1PreparedStatement[] = []

    // Dedup within the batch
    const seenEmails = new Set<string>()

    for (let i = 0; i < body.users.length; i++) {
      const user = body.users[i]
      const emailLower = user.email.toLowerCase()

      if (existingEmails.has(emailLower)) {
        skipped++
        continue
      }

      if (seenEmails.has(emailLower)) {
        errors.push({ row: i + 1, email: user.email, reason: 'Duplicate email in batch' })
        continue
      }

      seenEmails.add(emailLower)
      const newId = generateId()

      insertStmts.push(
        c.env.DB.prepare(
          `INSERT INTO directory_users (id, workspace_id, email, name, department, title,
                                        employment_status, source, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'csv-import', ?, ?)`
        ).bind(
          newId,
          workspaceId,
          user.email,
          user.name,
          user.department ?? null,
          user.title ?? null,
          user.employmentStatus ?? 'active',
          now,
          now
        )
      )

      // Custom field values
      if (user.customFields) {
        for (const [fieldName, value] of Object.entries(user.customFields)) {
          const fieldId = fieldNameToId.get(fieldName)
          if (fieldId && value) {
            cfvStmts.push(
              c.env.DB.prepare(
                `INSERT INTO custom_field_values (id, workspace_id, entity_type, entity_id, field_id, value, created_at, updated_at)
                 VALUES (?, ?, 'person', ?, ?, ?, ?, ?)`
              ).bind(generateId(), workspaceId, newId, fieldId, value, now, now)
            )
          }
        }
      }

      created++
    }

    // Execute in batches of 80 (D1 limit safety)
    const allStmts = [...insertStmts, ...cfvStmts]
    for (let i = 0; i < allStmts.length; i += 80) {
      const chunk = allStmts.slice(i, i + 80)
      await c.env.DB.batch(chunk)
    }

    if (created > 0) {
      await emitEvent(c.env.DB, {
        workspaceId,
        eventType: 'directory_user.bulk_created',
        entityType: 'directory_user',
        entityId: workspaceId,
        data: { created, skipped, errors: errors.length },
        actorId: userId,
      })
    }

    return c.json({ created, skipped, errors }, 201)
  }
)

// ─── Access Record Update ───────────────────────────────────────────

const updateAccessRecordSchema = z.object({
  role: z.string().optional(),
  accessType: z.string().optional(),
  approvedBy: z.string().nullable().optional(),
  approvalMethod: z.string().optional(),
  ticketRef: z.string().optional(),
  status: z.enum(['requested', 'approved', 'active', 'pending_review', 'suspended', 'expired', 'revoked']).optional(),
  licenseType: z.string().nullable().optional(),
  costPerPeriod: z.number().nullable().optional(),
  costCurrency: z.string().optional(),
  costFrequency: z.enum(['monthly', 'annual', 'one-time']).nullable().optional(),
  customFields: z.record(z.string(), z.string().nullable()).optional(),
})

/**
 * PUT /access/:recordId
 * Update an access record. Requires member+.
 */
complianceRoutes.put(
  '/access/:recordId',
  requireRole('member'),
  zValidator('json', updateAccessRecordSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const recordId = c.req.param('recordId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()

    const existing = await c.env.DB.prepare(
      'SELECT id, system_id, role FROM access_records WHERE id = ? AND workspace_id = ?'
    )
      .bind(recordId, workspaceId)
      .first<{ id: string; system_id: string; role: string }>()

    if (!existing) {
      return c.json({ error: 'Access record not found' }, 404)
    }

    const sets: string[] = ['updated_at = ?', 'updated_by = ?']
    const bindings: unknown[] = [now, userId]

    if (body.role !== undefined) {
      sets.push('role = ?')
      bindings.push(body.role)
    }
    if (body.accessType !== undefined) {
      sets.push('access_type = ?')
      bindings.push(body.accessType)
    }
    if (body.approvedBy !== undefined) {
      sets.push('approved_by = ?')
      bindings.push(body.approvedBy)
    }
    if (body.approvalMethod !== undefined) {
      sets.push('approval_method = ?')
      bindings.push(body.approvalMethod)
    }
    if (body.ticketRef !== undefined) {
      sets.push('ticket_ref = ?')
      bindings.push(body.ticketRef)
    }
    if (body.licenseType !== undefined) {
      sets.push('license_type = ?')
      bindings.push(body.licenseType)
    }
    if (body.costPerPeriod !== undefined) {
      sets.push('cost_per_period = ?')
      bindings.push(body.costPerPeriod)
    }
    if (body.costCurrency !== undefined) {
      sets.push('cost_currency = ?')
      bindings.push(body.costCurrency)
    }
    if (body.costFrequency !== undefined) {
      sets.push('cost_frequency = ?')
      bindings.push(body.costFrequency)
    }
    if (body.status !== undefined) {
      sets.push('status = ?')
      bindings.push(body.status)
    }

    // Recompute risk score if role changed
    if (body.role && body.role !== existing.role) {
      const system = await c.env.DB.prepare(
        'SELECT classification, data_sensitivity, mfa_required FROM systems WHERE id = ?'
      )
        .bind(existing.system_id)
        .first<{ classification: string; data_sensitivity: string; mfa_required: number }>()

      if (system) {
        const riskScore = computeRiskScore(system, body.role, body.approvedBy ?? null)
        sets.push('risk_score = ?')
        bindings.push(riskScore)
      }
    }

    bindings.push(recordId, workspaceId)

    await c.env.DB.prepare(
      `UPDATE access_records SET ${sets.join(', ')} WHERE id = ? AND workspace_id = ?`
    )
      .bind(...bindings)
      .run()

    // Save custom field values if provided
    if (body.customFields && Object.keys(body.customFields).length > 0) {
      const cfEntries = Object.entries(body.customFields)
      const cfStmts = cfEntries.map(([fieldId, value]) =>
        c.env.DB.prepare(
          `INSERT INTO custom_field_values (id, workspace_id, entity_type, entity_id, field_id, value, created_at, updated_at)
           VALUES (?, ?, 'access_record', ?, ?, ?, ?, ?)
           ON CONFLICT(workspace_id, entity_id, field_id)
           DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
        ).bind(generateId(), workspaceId, recordId, fieldId, value, now, now)
      )
      if (cfStmts.length > 0) {
        await c.env.DB.batch(cfStmts)
      }
    }

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'access.updated',
      entityType: 'access_record',
      entityId: recordId,
      data: body,
      actorId: userId,
    })

    return c.json({ success: true })
  }
)

// ─── Access Record Status Transition ────────────────────────────────

const VALID_TRANSITIONS: Record<string, Record<string, string>> = {
  approve: { from: 'requested', to: 'approved' },
  activate: { from: 'approved,pending_review,suspended', to: 'active' },
  suspend: { from: 'active', to: 'suspended' },
  request_review: { from: 'active', to: 'pending_review' },
  expire: { from: 'active,suspended', to: 'expired' },
}

const transitionAccessSchema = z.object({
  action: z.enum(['approve', 'activate', 'suspend', 'request_review', 'expire', 'revoke']),
  reason: z.string().optional(),
})

/**
 * POST /access/:recordId/transition
 * Transition access record status. Requires member+.
 */
complianceRoutes.post(
  '/access/:recordId/transition',
  requireRole('member'),
  zValidator('json', transitionAccessSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const recordId = c.req.param('recordId')
    const body = c.req.valid('json')
    const now = new Date().toISOString()

    const record = await c.env.DB.prepare(
      'SELECT id, status FROM access_records WHERE id = ? AND workspace_id = ?'
    )
      .bind(recordId, workspaceId)
      .first<{ id: string; status: string }>()

    if (!record) {
      return c.json({ error: 'Access record not found' }, 404)
    }

    // Handle revoke specially — allowed from any non-revoked status
    if (body.action === 'revoke') {
      if (record.status === 'revoked') {
        return c.json({ error: 'Access already revoked' }, 400)
      }

      await c.env.DB.prepare(
        `UPDATE access_records SET status = 'revoked', revoked_at = ?, revoked_by = ?,
                revocation_reason = ?, updated_at = ?, updated_by = ? WHERE id = ?`
      )
        .bind(now, userId, body.reason ?? null, now, userId, recordId)
        .run()

      await emitEvent(c.env.DB, {
        workspaceId,
        eventType: 'access.status_changed',
        entityType: 'access_record',
        entityId: recordId,
        data: { from: record.status, to: 'revoked', reason: body.reason ?? null },
        actorId: userId,
      })

      return c.json({ success: true, from: record.status, to: 'revoked' })
    }

    // Validate transition
    const transition = VALID_TRANSITIONS[body.action]
    if (!transition) {
      return c.json({ error: `Unknown action: ${body.action}` }, 400)
    }

    const allowedFromStates = transition.from.split(',')
    if (!allowedFromStates.includes(record.status)) {
      return c.json(
        {
          error: `Cannot ${body.action} from status "${record.status}". Allowed from: ${transition.from}`,
        },
        400
      )
    }

    const newStatus = transition.to

    // For review-related transitions, also update reviewed_at/reviewed_by
    const extraSets =
      body.action === 'request_review' || body.action === 'approve'
        ? ', reviewed_at = ?, reviewed_by = ?'
        : ''
    const extraBindings =
      body.action === 'request_review' || body.action === 'approve' ? [now, userId] : []

    await c.env.DB.prepare(
      `UPDATE access_records SET status = ?, updated_at = ?, updated_by = ?${extraSets} WHERE id = ?`
    )
      .bind(newStatus, now, userId, ...extraBindings, recordId)
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'access.status_changed',
      entityType: 'access_record',
      entityId: recordId,
      data: { from: record.status, to: newStatus, action: body.action, reason: body.reason ?? null },
      actorId: userId,
    })

    return c.json({ success: true, from: record.status, to: newStatus })
  }
)

export { complianceRoutes }
