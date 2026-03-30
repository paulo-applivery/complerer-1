import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { AppType } from '../types.js'
import { generateId } from '../lib/id.js'
import { sendTestEmail } from '../lib/email.js'
import { superAdminMiddleware } from '../middleware/super-admin.js'

const adminRoutes = new Hono<AppType>()

// All admin routes require super admin access
adminRoutes.use('*', superAdminMiddleware)

// ─── Providers ──────────────────────────────────────────────────────────────

/**
 * GET /api/admin/providers
 * List all providers, optionally filter by category
 */
adminRoutes.get('/providers', async (c) => {
  const category = c.req.query('category')
  let query = 'SELECT * FROM platform_providers'
  const binds: string[] = []

  if (category) {
    query += ' WHERE category = ?'
    binds.push(category)
  }

  query += ' ORDER BY category, name'

  const stmt = binds.length
    ? c.env.DB.prepare(query).bind(...binds)
    : c.env.DB.prepare(query)

  const { results } = await stmt.all<{
    id: string
    category: string
    slug: string
    name: string
    description: string | null
    config_schema: string | null
    enabled: number
    created_at: string
    updated_at: string
  }>()

  return c.json({
    providers: results.map((p) => ({
      id: p.id,
      category: p.category,
      slug: p.slug,
      name: p.name,
      description: p.description,
      configSchema: p.config_schema,
      enabled: p.enabled === 1,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    })),
  })
})

/**
 * GET /api/admin/providers/:id
 * Get provider with its configs
 */
adminRoutes.get('/providers/:id', async (c) => {
  const id = c.req.param('id')

  const provider = await c.env.DB.prepare(
    'SELECT * FROM platform_providers WHERE id = ?'
  )
    .bind(id)
    .first<{
      id: string
      category: string
      slug: string
      name: string
      description: string | null
      config_schema: string | null
      enabled: number
      created_at: string
      updated_at: string
    }>()

  if (!provider) {
    return c.json({ error: 'Provider not found' }, 404)
  }

  const { results: configs } = await c.env.DB.prepare(
    'SELECT * FROM platform_provider_configs WHERE provider_id = ? ORDER BY key'
  )
    .bind(id)
    .all<{
      id: string
      provider_id: string
      key: string
      value: string
      is_secret: number
      created_at: string
      updated_at: string
    }>()

  return c.json({
    provider: {
      id: provider.id,
      category: provider.category,
      slug: provider.slug,
      name: provider.name,
      description: provider.description,
      configSchema: provider.config_schema,
      enabled: provider.enabled === 1,
      createdAt: provider.created_at,
      updatedAt: provider.updated_at,
    },
    configs: configs.map((cfg) => ({
      id: cfg.id,
      key: cfg.key,
      value: cfg.is_secret ? '••••••' : cfg.value,
      isSecret: cfg.is_secret === 1,
      createdAt: cfg.created_at,
      updatedAt: cfg.updated_at,
    })),
  })
})

const createProviderSchema = z.object({
  category: z.enum(['ai', 'email', 'integration']),
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  enabled: z.boolean().optional().default(true),
})

/**
 * POST /api/admin/providers
 * Create a new provider
 */
adminRoutes.post(
  '/providers',
  zValidator('json', createProviderSchema),
  async (c) => {
    const body = c.req.valid('json')
    const now = new Date().toISOString()
    const id = generateId()

    await c.env.DB.prepare(
      'INSERT INTO platform_providers (id, category, slug, name, description, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(id, body.category, body.slug, body.name, body.description ?? null, body.enabled ? 1 : 0, now, now)
      .run()

    return c.json({ id }, 201)
  }
)

const updateProviderSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
})

/**
 * PUT /api/admin/providers/:id
 * Update a provider
 */
adminRoutes.put(
  '/providers/:id',
  zValidator('json', updateProviderSchema),
  async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const now = new Date().toISOString()

    const sets: string[] = ['updated_at = ?']
    const binds: (string | number)[] = [now]

    if (body.name !== undefined) {
      sets.push('name = ?')
      binds.push(body.name)
    }
    if (body.description !== undefined) {
      sets.push('description = ?')
      binds.push(body.description)
    }
    if (body.enabled !== undefined) {
      sets.push('enabled = ?')
      binds.push(body.enabled ? 1 : 0)
    }

    binds.push(id)

    await c.env.DB.prepare(
      `UPDATE platform_providers SET ${sets.join(', ')} WHERE id = ?`
    )
      .bind(...binds)
      .run()

    return c.json({ success: true })
  }
)

/**
 * DELETE /api/admin/providers/:id
 */
adminRoutes.delete('/providers/:id', async (c) => {
  const id = c.req.param('id')

  // Delete configs first
  await c.env.DB.prepare('DELETE FROM platform_provider_configs WHERE provider_id = ?')
    .bind(id)
    .run()

  await c.env.DB.prepare('DELETE FROM platform_providers WHERE id = ?')
    .bind(id)
    .run()

  return c.json({ success: true })
})

const upsertConfigSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  isSecret: z.boolean().optional().default(false),
})

/**
 * PUT /api/admin/providers/:id/configs
 * Upsert a provider config
 */
adminRoutes.put(
  '/providers/:id/configs',
  zValidator('json', upsertConfigSchema),
  async (c) => {
    const providerId = c.req.param('id')
    const body = c.req.valid('json')
    const now = new Date().toISOString()

    // Check if config exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM platform_provider_configs WHERE provider_id = ? AND key = ?'
    )
      .bind(providerId, body.key)
      .first<{ id: string }>()

    if (existing) {
      await c.env.DB.prepare(
        'UPDATE platform_provider_configs SET value = ?, is_secret = ?, updated_at = ? WHERE id = ?'
      )
        .bind(body.value, body.isSecret ? 1 : 0, now, existing.id)
        .run()
    } else {
      const id = generateId()
      await c.env.DB.prepare(
        'INSERT INTO platform_provider_configs (id, provider_id, key, value, is_secret, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
        .bind(id, providerId, body.key, body.value, body.isSecret ? 1 : 0, now, now)
        .run()
    }

    return c.json({ success: true })
  }
)

/**
 * DELETE /api/admin/providers/:id/configs/:key
 */
adminRoutes.delete('/providers/:id/configs/:key', async (c) => {
  const providerId = c.req.param('id')
  const key = c.req.param('key')

  await c.env.DB.prepare(
    'DELETE FROM platform_provider_configs WHERE provider_id = ? AND key = ?'
  )
    .bind(providerId, key)
    .run()

  return c.json({ success: true })
})

// ─── Feature Flags ──────────────────────────────────────────────────────────

/**
 * GET /api/admin/feature-flags
 */
adminRoutes.get('/feature-flags', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM feature_flags ORDER BY name'
  ).all<{
    id: string
    slug: string
    name: string
    description: string | null
    enabled: number
    rollout_percentage: number
    target_workspaces: string | null
    created_at: string
    updated_at: string
  }>()

  return c.json({
    featureFlags: results.map((f) => ({
      id: f.id,
      slug: f.slug,
      name: f.name,
      description: f.description,
      enabled: f.enabled === 1,
      rolloutPercentage: f.rollout_percentage,
      targetWorkspaces: f.target_workspaces ? JSON.parse(f.target_workspaces) : null,
      createdAt: f.created_at,
      updatedAt: f.updated_at,
    })),
  })
})

const createFeatureFlagSchema = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  enabled: z.boolean().optional().default(false),
  rolloutPercentage: z.number().min(0).max(100).optional().default(100),
  targetWorkspaces: z.array(z.string()).optional(),
})

/**
 * POST /api/admin/feature-flags
 */
adminRoutes.post(
  '/feature-flags',
  zValidator('json', createFeatureFlagSchema),
  async (c) => {
    const body = c.req.valid('json')
    const now = new Date().toISOString()
    const id = generateId()

    await c.env.DB.prepare(
      'INSERT INTO feature_flags (id, slug, name, description, enabled, rollout_percentage, target_workspaces, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(
        id,
        body.slug,
        body.name,
        body.description ?? null,
        body.enabled ? 1 : 0,
        body.rolloutPercentage,
        body.targetWorkspaces ? JSON.stringify(body.targetWorkspaces) : null,
        now,
        now
      )
      .run()

    return c.json({ id }, 201)
  }
)

const updateFeatureFlagSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  rolloutPercentage: z.number().min(0).max(100).optional(),
  targetWorkspaces: z.array(z.string()).nullable().optional(),
})

/**
 * PUT /api/admin/feature-flags/:id
 */
adminRoutes.put(
  '/feature-flags/:id',
  zValidator('json', updateFeatureFlagSchema),
  async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const now = new Date().toISOString()

    const sets: string[] = ['updated_at = ?']
    const binds: (string | number | null)[] = [now]

    if (body.name !== undefined) {
      sets.push('name = ?')
      binds.push(body.name)
    }
    if (body.description !== undefined) {
      sets.push('description = ?')
      binds.push(body.description)
    }
    if (body.enabled !== undefined) {
      sets.push('enabled = ?')
      binds.push(body.enabled ? 1 : 0)
    }
    if (body.rolloutPercentage !== undefined) {
      sets.push('rollout_percentage = ?')
      binds.push(body.rolloutPercentage)
    }
    if (body.targetWorkspaces !== undefined) {
      sets.push('target_workspaces = ?')
      binds.push(body.targetWorkspaces ? JSON.stringify(body.targetWorkspaces) : null)
    }

    binds.push(id)

    await c.env.DB.prepare(
      `UPDATE feature_flags SET ${sets.join(', ')} WHERE id = ?`
    )
      .bind(...binds)
      .run()

    return c.json({ success: true })
  }
)

/**
 * DELETE /api/admin/feature-flags/:id
 */
adminRoutes.delete('/feature-flags/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM feature_flags WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// ─── Email Templates ────────────────────────────────────────────────────────

/**
 * GET /api/admin/email-templates
 */
adminRoutes.get('/email-templates', async (c) => {
  const category = c.req.query('category')
  let query = 'SELECT id, slug, name, subject, variables, category, enabled, created_at, updated_at FROM email_templates'
  const binds: string[] = []

  if (category) {
    query += ' WHERE category = ?'
    binds.push(category)
  }

  query += ' ORDER BY category, name'

  const stmt = binds.length
    ? c.env.DB.prepare(query).bind(...binds)
    : c.env.DB.prepare(query)

  const { results } = await stmt.all<{
    id: string
    slug: string
    name: string
    subject: string
    variables: string | null
    category: string
    enabled: number
    created_at: string
    updated_at: string
  }>()

  return c.json({
    emailTemplates: results.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      subject: t.subject,
      variables: t.variables ? JSON.parse(t.variables) : [],
      category: t.category,
      enabled: t.enabled === 1,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    })),
  })
})

/**
 * GET /api/admin/email-templates/:id
 */
adminRoutes.get('/email-templates/:id', async (c) => {
  const id = c.req.param('id')

  const template = await c.env.DB.prepare(
    'SELECT * FROM email_templates WHERE id = ?'
  )
    .bind(id)
    .first<{
      id: string
      slug: string
      name: string
      subject: string
      body_html: string
      body_text: string | null
      variables: string | null
      category: string
      enabled: number
      created_at: string
      updated_at: string
    }>()

  if (!template) {
    return c.json({ error: 'Template not found' }, 404)
  }

  return c.json({
    template: {
      id: template.id,
      slug: template.slug,
      name: template.name,
      subject: template.subject,
      bodyHtml: template.body_html,
      bodyText: template.body_text,
      variables: template.variables ? JSON.parse(template.variables) : [],
      category: template.category,
      enabled: template.enabled === 1,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
    },
  })
})

const createEmailTemplateSchema = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
  bodyText: z.string().optional(),
  variables: z.array(z.string()).optional(),
  category: z.enum(['auth', 'notification', 'compliance', 'transactional']),
  enabled: z.boolean().optional().default(true),
})

/**
 * POST /api/admin/email-templates
 */
adminRoutes.post(
  '/email-templates',
  zValidator('json', createEmailTemplateSchema),
  async (c) => {
    const body = c.req.valid('json')
    const now = new Date().toISOString()
    const id = generateId()

    await c.env.DB.prepare(
      'INSERT INTO email_templates (id, slug, name, subject, body_html, body_text, variables, category, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(
        id,
        body.slug,
        body.name,
        body.subject,
        body.bodyHtml,
        body.bodyText ?? null,
        body.variables ? JSON.stringify(body.variables) : null,
        body.category,
        body.enabled ? 1 : 0,
        now,
        now
      )
      .run()

    return c.json({ id }, 201)
  }
)

const updateEmailTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  subject: z.string().min(1).optional(),
  bodyHtml: z.string().min(1).optional(),
  bodyText: z.string().optional(),
  variables: z.array(z.string()).optional(),
  category: z.enum(['auth', 'notification', 'compliance', 'transactional']).optional(),
  enabled: z.boolean().optional(),
})

/**
 * PUT /api/admin/email-templates/:id
 */
adminRoutes.put(
  '/email-templates/:id',
  zValidator('json', updateEmailTemplateSchema),
  async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const now = new Date().toISOString()

    const sets: string[] = ['updated_at = ?']
    const binds: (string | number | null)[] = [now]

    if (body.name !== undefined) {
      sets.push('name = ?')
      binds.push(body.name)
    }
    if (body.subject !== undefined) {
      sets.push('subject = ?')
      binds.push(body.subject)
    }
    if (body.bodyHtml !== undefined) {
      sets.push('body_html = ?')
      binds.push(body.bodyHtml)
    }
    if (body.bodyText !== undefined) {
      sets.push('body_text = ?')
      binds.push(body.bodyText)
    }
    if (body.variables !== undefined) {
      sets.push('variables = ?')
      binds.push(JSON.stringify(body.variables))
    }
    if (body.category !== undefined) {
      sets.push('category = ?')
      binds.push(body.category)
    }
    if (body.enabled !== undefined) {
      sets.push('enabled = ?')
      binds.push(body.enabled ? 1 : 0)
    }

    binds.push(id)

    await c.env.DB.prepare(
      `UPDATE email_templates SET ${sets.join(', ')} WHERE id = ?`
    )
      .bind(...binds)
      .run()

    return c.json({ success: true })
  }
)

/**
 * DELETE /api/admin/email-templates/:id
 */
adminRoutes.delete('/email-templates/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM email_templates WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

/**
 * POST /api/admin/email-templates/:id/preview
 * Preview rendered template with sample data
 */
adminRoutes.post('/email-templates/:id/preview', async (c) => {
  const id = c.req.param('id')

  const template = await c.env.DB.prepare(
    'SELECT body_html, variables FROM email_templates WHERE id = ?'
  )
    .bind(id)
    .first<{ body_html: string; variables: string | null }>()

  if (!template) {
    return c.json({ error: 'Template not found' }, 404)
  }

  const variables: string[] = template.variables ? JSON.parse(template.variables) : []

  // Generate sample values for each variable
  const sampleData: Record<string, string> = {}
  for (const v of variables) {
    switch (v) {
      case 'code':
        sampleData[v] = '123456'
        break
      case 'logoUrl':
        sampleData[v] = 'https://complerer.com/logo-color.svg'
        break
      case 'workspaceName':
        sampleData[v] = 'Acme Corp'
        break
      case 'loginUrl':
      case 'dashboardUrl':
      case 'settingsUrl':
      case 'evidenceUrl':
        sampleData[v] = 'https://app.complerer.com'
        break
      case 'userName':
        sampleData[v] = 'John Doe'
        break
      case 'userEmail':
        sampleData[v] = 'john@acme.com'
        break
      case 'alertTitle':
        sampleData[v] = 'Missing evidence for SOC 2 CC6.1'
        break
      case 'alertMessage':
        sampleData[v] = 'Evidence for access control policy has expired and needs renewal.'
        break
      case 'severity':
        sampleData[v] = 'High'
        break
      case 'severityColor':
        sampleData[v] = '#ef4444'
        break
      case 'framework':
        sampleData[v] = 'SOC 2 Type II'
        break
      case 'evidenceTitle':
        sampleData[v] = 'Annual Security Training Completion'
        break
      case 'expiresAt':
        sampleData[v] = '2025-04-15'
        break
      case 'controlCount':
        sampleData[v] = '3'
        break
      default:
        sampleData[v] = `{{${v}}}`
    }
  }

  // Replace template variables
  let rendered = template.body_html
  for (const [key, value] of Object.entries(sampleData)) {
    rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }

  return c.json({ html: rendered })
})

/**
 * POST /api/admin/email-templates/:id/send-test
 * Send a test email using Brevo with sample data
 */
adminRoutes.post(
  '/email-templates/:id/send-test',
  zValidator('json', z.object({ to: z.string().email() })),
  async (c) => {
    const id = c.req.param('id')
    const { to } = c.req.valid('json')

    // Get the template slug
    const template = await c.env.DB.prepare(
      'SELECT slug FROM email_templates WHERE id = ?'
    )
      .bind(id)
      .first<{ slug: string }>()

    if (!template) {
      return c.json({ error: 'Template not found' }, 404)
    }

    const result = await sendTestEmail(c.env.DB, to, template.slug)

    if (!result.success) {
      return c.json({ error: result.error ?? 'Failed to send test email' }, 400)
    }

    return c.json({
      success: true,
      message: `Test email sent to ${to}`,
      subject: result.renderedSubject,
    })
  }
)

// ─── Workspaces Overview ────────────────────────────────────────────────────

/**
 * GET /api/admin/workspaces
 * List all workspaces with stats
 */
adminRoutes.get('/workspaces', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT w.*,
      (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) as member_count,
      (SELECT COUNT(*) FROM workspace_adoptions WHERE workspace_id = w.id AND effective_until IS NULL) as framework_count,
      (SELECT COUNT(*) FROM evidence WHERE workspace_id = w.id) as evidence_count,
      (SELECT COUNT(*) FROM compliance_events WHERE workspace_id = w.id) as event_count,
      (SELECT COUNT(*) FROM systems WHERE workspace_id = w.id) as system_count
    FROM workspaces w
    ORDER BY w.created_at DESC`
  ).all<{
    id: string
    name: string
    slug: string
    plan: string
    created_at: string
    updated_at: string
    member_count: number
    framework_count: number
    evidence_count: number
    event_count: number
    system_count: number
  }>()

  return c.json({
    workspaces: results.map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      plan: w.plan,
      createdAt: w.created_at,
      updatedAt: w.updated_at,
      memberCount: w.member_count,
      frameworkCount: w.framework_count,
      evidenceCount: w.evidence_count,
      eventCount: w.event_count,
      systemCount: w.system_count,
    })),
  })
})

/**
 * GET /api/admin/workspaces/:id/detail
 */
adminRoutes.get('/workspaces/:id/detail', async (c) => {
  const id = c.req.param('id')

  const workspace = await c.env.DB.prepare(
    `SELECT w.*,
      (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) as member_count,
      (SELECT COUNT(*) FROM workspace_adoptions WHERE workspace_id = w.id AND effective_until IS NULL) as framework_count,
      (SELECT COUNT(*) FROM evidence WHERE workspace_id = w.id) as evidence_count,
      (SELECT COUNT(*) FROM compliance_events WHERE workspace_id = w.id) as event_count,
      (SELECT COUNT(*) FROM systems WHERE workspace_id = w.id) as system_count
    FROM workspaces w
    WHERE w.id = ?`
  )
    .bind(id)
    .first<{
      id: string
      name: string
      slug: string
      plan: string
      created_at: string
      updated_at: string
      member_count: number
      framework_count: number
      evidence_count: number
      event_count: number
      system_count: number
    }>()

  if (!workspace) {
    return c.json({ error: 'Workspace not found' }, 404)
  }

  // Get members
  const { results: members } = await c.env.DB.prepare(
    `SELECT wm.role, wm.joined_at, u.id as user_id, u.email, u.name
     FROM workspace_members wm
     JOIN auth_users u ON u.id = wm.user_id
     WHERE wm.workspace_id = ?
     ORDER BY wm.joined_at DESC`
  )
    .bind(id)
    .all<{
      role: string
      joined_at: string
      user_id: string
      email: string
      name: string
    }>()

  return c.json({
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      plan: workspace.plan,
      createdAt: workspace.created_at,
      updatedAt: workspace.updated_at,
      memberCount: workspace.member_count,
      frameworkCount: workspace.framework_count,
      evidenceCount: workspace.evidence_count,
      eventCount: workspace.event_count,
      systemCount: workspace.system_count,
    },
    members: members.map((m) => ({
      userId: m.user_id,
      email: m.email,
      name: m.name,
      role: m.role,
      joinedAt: m.joined_at,
    })),
  })
})

/**
 * POST /api/admin/workspaces
 * Create a workspace.
 */
const createWorkspaceSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  plan: z.string().optional(),
})

adminRoutes.post('/workspaces', zValidator('json', createWorkspaceSchema), async (c) => {
  const data = c.req.valid('json')
  const id = generateId()
  const now = new Date().toISOString()
  await c.env.DB.prepare(
    'INSERT INTO workspaces (id, name, slug, plan, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, data.name, data.slug, data.plan ?? 'free', now, now).run()
  return c.json({ id })
})

/**
 * PUT /api/admin/workspaces/:id
 * Update a workspace.
 */
const updateWorkspaceSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  plan: z.string().optional(),
})

adminRoutes.put('/workspaces/:id', zValidator('json', updateWorkspaceSchema), async (c) => {
  const id = c.req.param('id')
  const data = c.req.valid('json')
  const now = new Date().toISOString()
  const setClauses: string[] = ['updated_at = ?']
  const values: any[] = [now]
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) { setClauses.push(`${key} = ?`); values.push(val) }
  }
  values.push(id)
  await c.env.DB.prepare(`UPDATE workspaces SET ${setClauses.join(', ')} WHERE id = ?`).bind(...values).run()
  return c.json({ ok: true })
})

/**
 * DELETE /api/admin/workspaces/:id
 * Delete a workspace and all associated data.
 */
adminRoutes.delete('/workspaces/:id', async (c) => {
  const id = c.req.param('id')
  // Cascade delete workspace data
  const tables = [
    'workspace_settings', 'workspace_members', 'workspace_adoptions',
    'systems', 'directory_users', 'access_records', 'evidence',
    'baselines', 'baseline_violations', 'policies', 'compliance_events',
    'custom_field_definitions', 'custom_field_values',
  ]
  for (const table of tables) {
    try {
      await c.env.DB.prepare(`DELETE FROM ${table} WHERE workspace_id = ?`).bind(id).run()
    } catch (_) { /* table might not exist or no workspace_id column */ }
  }
  await c.env.DB.prepare('DELETE FROM workspaces WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

/**
 * POST /api/admin/workspaces/:id/members
 * Add a member to a workspace.
 */
const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'member', 'auditor', 'viewer']),
})

adminRoutes.post('/workspaces/:id/members', zValidator('json', addMemberSchema), async (c) => {
  const workspaceId = c.req.param('id')
  const { email, role } = c.req.valid('json')
  const now = new Date().toISOString()

  // Find or create user
  let user = await c.env.DB.prepare('SELECT id FROM auth_users WHERE email = ?').bind(email.toLowerCase()).first<{ id: string }>()
  if (!user) {
    const userId = generateId()
    await c.env.DB.prepare(
      'INSERT INTO auth_users (id, email, name, created_at, last_login_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(userId, email.toLowerCase(), email.split('@')[0], now, now).run()
    user = { id: userId }
  }

  // Check if already a member
  const existing = await c.env.DB.prepare(
    'SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?'
  ).bind(workspaceId, user.id).first()
  if (existing) return c.json({ error: 'Already a member' }, 400)

  const memberId = generateId()
  await c.env.DB.prepare(
    'INSERT INTO workspace_members (id, workspace_id, user_id, role, invited_by, joined_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(memberId, workspaceId, user.id, role, 'admin', now).run()

  return c.json({ ok: true })
})

/**
 * PUT /api/admin/workspaces/:wsId/members/:userId/role
 * Change a member's role.
 */
adminRoutes.put('/workspaces/:wsId/members/:userId/role', zValidator('json', z.object({ role: z.string() })), async (c) => {
  const { wsId, userId } = c.req.param() as { wsId: string; userId: string }
  const { role } = c.req.valid('json')
  await c.env.DB.prepare(
    'UPDATE workspace_members SET role = ? WHERE workspace_id = ? AND user_id = ?'
  ).bind(role, wsId, userId).run()
  return c.json({ ok: true })
})

/**
 * DELETE /api/admin/workspaces/:wsId/members/:userId
 * Remove a member from a workspace.
 */
adminRoutes.delete('/workspaces/:wsId/members/:userId', async (c) => {
  const { wsId, userId } = c.req.param() as { wsId: string; userId: string }
  await c.env.DB.prepare(
    'DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?'
  ).bind(wsId, userId).run()
  return c.json({ ok: true })
})

/**
 * GET /api/admin/stats
 * Platform-wide stats
 */
adminRoutes.get('/stats', async (c) => {
  const q = async (sql: string) => {
    try {
      const r = await c.env.DB.prepare(sql).first<{ count: number }>()
      return r?.count ?? 0
    } catch { return 0 }
  }

  const [totalWorkspaces, totalUsers, totalEvidence, totalControls, totalSystems, totalBaselines, totalPolicies, totalAccessRecords, totalFrameworks, totalPeople, recentUsersWeek] = await Promise.all([
    q('SELECT COUNT(*) as count FROM workspaces'),
    q('SELECT COUNT(*) as count FROM auth_users'),
    q('SELECT COUNT(*) as count FROM evidence'),
    q('SELECT COUNT(*) as count FROM versioned_controls'),
    q('SELECT COUNT(*) as count FROM systems'),
    q('SELECT COUNT(*) as count FROM baselines'),
    q('SELECT COUNT(*) as count FROM policies'),
    q('SELECT COUNT(*) as count FROM access_records'),
    q('SELECT COUNT(*) as count FROM frameworks'),
    q('SELECT COUNT(*) as count FROM directory_users'),
    q("SELECT COUNT(*) as count FROM auth_users WHERE created_at > datetime('now', '-7 days')"),
  ])

  // Recent workspaces
  const { results: recentWs } = await c.env.DB.prepare(
    `SELECT w.id, w.name, w.slug, w.plan, w.created_at,
      (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) as member_count
     FROM workspaces w ORDER BY w.created_at DESC LIMIT 5`
  ).all()

  // Plan distribution
  const { results: planDist } = await c.env.DB.prepare(
    'SELECT plan, COUNT(*) as count FROM workspaces GROUP BY plan ORDER BY count DESC'
  ).all()

  return c.json({
    stats: {
      totalWorkspaces,
      totalUsers,
      totalEvidence,
      totalControls,
      totalSystems,
      totalBaselines,
      totalPolicies,
      totalAccessRecords,
      totalFrameworks,
      totalPeople,
      recentUsersWeek,
    },
    recentWorkspaces: recentWs ?? [],
    planDistribution: planDist ?? [],
  })
})

// ─── Super Admin Members ────────────────────────────────────────────────────

/**
 * GET /api/admin/members
 * List all super admins
 */
adminRoutes.get('/members', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, email, name, is_super_admin, last_login_at, created_at
     FROM auth_users
     ORDER BY is_super_admin DESC, created_at ASC`
  ).all<{
    id: string
    email: string
    name: string
    is_super_admin: number
    last_login_at: string | null
    created_at: string
  }>()

  return c.json({
    members: results.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      isSuperAdmin: u.is_super_admin === 1,
      lastLoginAt: u.last_login_at,
      createdAt: u.created_at,
    })),
  })
})

/**
 * POST /api/admin/members/:userId/promote
 * Grant super admin access to a user
 */
adminRoutes.post('/members/:userId/promote', async (c) => {
  const userId = c.req.param('userId')

  const user = await c.env.DB.prepare(
    'SELECT id, email FROM auth_users WHERE id = ?'
  ).bind(userId).first<{ id: string; email: string }>()

  if (!user) return c.json({ error: 'User not found' }, 404)

  await c.env.DB.prepare(
    'UPDATE auth_users SET is_super_admin = 1 WHERE id = ?'
  ).bind(userId).run()

  return c.json({ success: true, message: `${user.email} is now a super admin` })
})

/**
 * POST /api/admin/members/:userId/demote
 * Remove super admin access from a user
 */
adminRoutes.post('/members/:userId/demote', async (c) => {
  const userId = c.req.param('userId')
  const currentUserId = c.get('userId')

  // Prevent self-demotion
  if (userId === currentUserId) {
    return c.json({ error: 'Cannot remove your own super admin access' }, 400)
  }

  const user = await c.env.DB.prepare(
    'SELECT id, email FROM auth_users WHERE id = ?'
  ).bind(userId).first<{ id: string; email: string }>()

  if (!user) return c.json({ error: 'User not found' }, 404)

  await c.env.DB.prepare(
    'UPDATE auth_users SET is_super_admin = 0 WHERE id = ?'
  ).bind(userId).run()

  return c.json({ success: true, message: `${user.email} is no longer a super admin` })
})

// ── Systems Library ─────────────────────────────────────────────────────────

adminRoutes.get('/libraries/systems', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM system_library ORDER BY category, name'
  ).bind().all()
  return c.json({ items: results })
})

const systemLibSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().nullish(),
  vendor: z.string().nullish(),
  website: z.string().nullish(),
  default_classification: z.string().nullish(),
  default_sensitivity: z.string().nullish(),
  icon_hint: z.string().nullish(),
})

adminRoutes.post('/libraries/systems', zValidator('json', systemLibSchema), async (c) => {
  const data = c.req.valid('json')
  const id = 'sl_' + generateId().slice(0, 12)
  const now = new Date().toISOString()
  await c.env.DB.prepare(
    `INSERT INTO system_library (id, name, category, description, vendor, website, default_classification, default_sensitivity, icon_hint, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, data.name, data.category, data.description ?? null, data.vendor ?? null, data.website ?? null, data.default_classification ?? null, data.default_sensitivity ?? null, data.icon_hint ?? null, now).run()
  return c.json({ id })
})

adminRoutes.put('/libraries/systems/:id', zValidator('json', systemLibSchema.partial()), async (c) => {
  const id = c.req.param('id')
  const data = c.req.valid('json')
  const setClauses: string[] = []
  const values: any[] = []
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) { setClauses.push(`${key} = ?`); values.push(val) }
  }
  if (setClauses.length === 0) return c.json({ ok: true })
  values.push(id)
  await c.env.DB.prepare(`UPDATE system_library SET ${setClauses.join(', ')} WHERE id = ?`).bind(...values).run()
  return c.json({ ok: true })
})

adminRoutes.delete('/libraries/systems/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM system_library WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// ── Departments & Roles Library ─────────────────────────────────────────────

adminRoutes.get('/libraries/roles', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM employee_directory_library ORDER BY category, department, title'
  ).bind().all()
  return c.json({ items: results })
})

const roleLibSchema = z.object({
  name: z.string().min(1),
  department: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  description: z.string().nullish(),
})

adminRoutes.post('/libraries/roles', zValidator('json', roleLibSchema), async (c) => {
  const data = c.req.valid('json')
  const id = 'el_' + generateId().slice(0, 12)
  const now = new Date().toISOString()
  await c.env.DB.prepare(
    `INSERT INTO employee_directory_library (id, name, department, title, category, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, data.name, data.department, data.title, data.category, data.description ?? null, now).run()
  return c.json({ id })
})

adminRoutes.put('/libraries/roles/:id', zValidator('json', roleLibSchema.partial()), async (c) => {
  const id = c.req.param('id')
  const data = c.req.valid('json')
  const setClauses: string[] = []
  const values: any[] = []
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) { setClauses.push(`${key} = ?`); values.push(val) }
  }
  if (setClauses.length === 0) return c.json({ ok: true })
  values.push(id)
  await c.env.DB.prepare(`UPDATE employee_directory_library SET ${setClauses.join(', ')} WHERE id = ?`).bind(...values).run()
  return c.json({ ok: true })
})

adminRoutes.delete('/libraries/roles/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM employee_directory_library WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// ── Baseline Library ────────────────────────────────────────────────────────

adminRoutes.get('/libraries/baselines', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM baseline_library ORDER BY category, name'
  ).bind().all()
  return c.json({ items: results })
})

const baselineLibSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().nullish(),
  check_type: z.enum(['manual', 'automated']).nullish(),
  expected_value: z.string().nullish(),
  severity: z.enum(['critical', 'high', 'medium', 'low']).nullish(),
  framework_hints: z.string().nullish(),
})

adminRoutes.post('/libraries/baselines', zValidator('json', baselineLibSchema), async (c) => {
  const data = c.req.valid('json')
  const id = 'bl_' + generateId().slice(0, 12)
  const now = new Date().toISOString()
  await c.env.DB.prepare(
    `INSERT INTO baseline_library (id, name, category, description, check_type, expected_value, severity, framework_hints, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, data.name, data.category, data.description ?? null, data.check_type ?? 'manual', data.expected_value ?? null, data.severity ?? 'medium', data.framework_hints ?? null, now).run()
  return c.json({ id })
})

adminRoutes.put('/libraries/baselines/:id', zValidator('json', baselineLibSchema.partial()), async (c) => {
  const id = c.req.param('id')
  const data = c.req.valid('json')
  const setClauses: string[] = []
  const values: any[] = []
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      const dbKey = key === 'checkType' ? 'check_type' : key === 'expectedValue' ? 'expected_value' : key === 'frameworkHints' ? 'framework_hints' : key
      setClauses.push(`${dbKey} = ?`)
      values.push(val)
    }
  }
  if (setClauses.length === 0) return c.json({ ok: true })
  values.push(id)
  await c.env.DB.prepare(`UPDATE baseline_library SET ${setClauses.join(', ')} WHERE id = ?`).bind(...values).run()
  return c.json({ ok: true })
})

adminRoutes.delete('/libraries/baselines/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM baseline_library WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// ── Policy Library ──────────────────────────────────────────────────────────

adminRoutes.get('/libraries/policies', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM policy_library ORDER BY category, title'
  ).bind().all()
  return c.json({ items: results })
})

const policyLibSchema = z.object({
  title: z.string().min(1),
  category: z.enum(['security', 'access', 'privacy', 'hr', 'incident']),
  description: z.string().nullish(),
  content_text: z.string().nullish(),
  version: z.string().nullish(),
  review_cycle_days: z.number().nullish(),
})

adminRoutes.post('/libraries/policies', zValidator('json', policyLibSchema), async (c) => {
  const data = c.req.valid('json')
  const id = 'pl_' + generateId().slice(0, 12)
  const now = new Date().toISOString()
  await c.env.DB.prepare(
    `INSERT INTO policy_library (id, title, category, description, content_text, version, review_cycle_days, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, data.title, data.category, data.description ?? null, data.content_text ?? null, data.version ?? '1.0', data.review_cycle_days ?? 365, now, now).run()
  return c.json({ id })
})

adminRoutes.put('/libraries/policies/:id', zValidator('json', policyLibSchema.partial()), async (c) => {
  const id = c.req.param('id')
  const data = c.req.valid('json')
  const setClauses: string[] = ['updated_at = ?']
  const values: any[] = [new Date().toISOString()]
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      const dbKey = key === 'contentText' ? 'content_text' : key === 'reviewCycleDays' ? 'review_cycle_days' : key
      setClauses.push(`${dbKey} = ?`)
      values.push(val)
    }
  }
  values.push(id)
  await c.env.DB.prepare(`UPDATE policy_library SET ${setClauses.join(', ')} WHERE id = ?`).bind(...values).run()
  return c.json({ ok: true })
})

adminRoutes.delete('/libraries/policies/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM policy_library WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// ── Frameworks ──────────────────────────────────────────────────────────────

adminRoutes.get('/libraries/frameworks', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT f.*,
      (SELECT COUNT(*) FROM framework_versions fv WHERE fv.framework_id = f.id) as version_count,
      (SELECT COUNT(*) FROM versioned_controls c JOIN framework_versions fv2 ON fv2.id = c.framework_version_id WHERE fv2.framework_id = f.id) as control_count
     FROM frameworks f ORDER BY f.name`
  ).bind().all()
  return c.json({ items: results })
})

adminRoutes.get('/libraries/frameworks/:id', async (c) => {
  const id = c.req.param('id')
  const framework = await c.env.DB.prepare('SELECT * FROM frameworks WHERE id = ?').bind(id).first()
  if (!framework) return c.json({ error: 'Not found' }, 404)
  const { results: versions } = await c.env.DB.prepare(
    'SELECT * FROM framework_versions WHERE framework_id = ? ORDER BY created_at DESC'
  ).bind(id).all()
  return c.json({ framework, versions })
})

const frameworkSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  source_org: z.string().optional(),
  website: z.string().optional(),
})

adminRoutes.post('/libraries/frameworks', zValidator('json', frameworkSchema), async (c) => {
  const data = c.req.valid('json')
  const id = generateId()
  const now = new Date().toISOString()
  await c.env.DB.prepare(
    `INSERT INTO frameworks (id, name, slug, description, source_org, website, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, data.name, data.slug, data.description ?? null, data.source_org ?? null, data.website ?? null, now, now).run()
  return c.json({ id })
})

adminRoutes.put('/libraries/frameworks/:id', zValidator('json', frameworkSchema.partial()), async (c) => {
  const id = c.req.param('id')
  const data = c.req.valid('json')
  const now = new Date().toISOString()
  const setClauses: string[] = ['updated_at = ?']
  const values: any[] = [now]
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) { setClauses.push(`${key} = ?`); values.push(val) }
  }
  values.push(id)
  await c.env.DB.prepare(`UPDATE frameworks SET ${setClauses.join(', ')} WHERE id = ?`).bind(...values).run()
  return c.json({ ok: true })
})

adminRoutes.delete('/libraries/frameworks/:id', async (c) => {
  const id = c.req.param('id')
  // Delete controls → versions → framework
  const { results: versions } = await c.env.DB.prepare('SELECT id FROM framework_versions WHERE framework_id = ?').bind(id).all()
  for (const v of versions) {
    await c.env.DB.prepare('DELETE FROM versioned_controls WHERE framework_version_id = ?').bind((v as any).id).run()
  }
  await c.env.DB.prepare('DELETE FROM framework_versions WHERE framework_id = ?').bind(id).run()
  await c.env.DB.prepare('DELETE FROM frameworks WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// ── Framework Versions ──────────────────────────────────────────────────────

adminRoutes.get('/libraries/frameworks/:id/versions', async (c) => {
  const frameworkId = c.req.param('id')
  const { results } = await c.env.DB.prepare(
    `SELECT fv.*,
      (SELECT COUNT(*) FROM versioned_controls vc WHERE vc.framework_version_id = fv.id) as control_count
     FROM framework_versions fv WHERE fv.framework_id = ? ORDER BY fv.created_at DESC`
  ).bind(frameworkId).all()
  return c.json({ items: results })
})

const versionSchema = z.object({
  version: z.string().min(1),
  status: z.string().optional(),
  changelog: z.string().optional(),
  source_url: z.string().optional(),
})

adminRoutes.post('/libraries/frameworks/:id/versions', zValidator('json', versionSchema), async (c) => {
  const frameworkId = c.req.param('id')
  const data = c.req.valid('json')
  const id = generateId()
  const now = new Date().toISOString()
  await c.env.DB.prepare(
    `INSERT INTO framework_versions (id, framework_id, version, status, changelog, source_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, frameworkId, data.version, data.status ?? 'draft', data.changelog ?? null, data.source_url ?? null, now).run()
  return c.json({ id })
})

adminRoutes.put('/libraries/frameworks/:fwId/versions/:verId', zValidator('json', versionSchema.partial()), async (c) => {
  const verId = c.req.param('verId')
  const data = c.req.valid('json')
  const setClauses: string[] = []
  const values: any[] = []
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) { setClauses.push(`${key} = ?`); values.push(val) }
  }
  if (setClauses.length === 0) return c.json({ ok: true })
  values.push(verId)
  await c.env.DB.prepare(`UPDATE framework_versions SET ${setClauses.join(', ')} WHERE id = ?`).bind(...values).run()
  return c.json({ ok: true })
})

adminRoutes.delete('/libraries/frameworks/:fwId/versions/:verId', async (c) => {
  const verId = c.req.param('verId')
  await c.env.DB.prepare('DELETE FROM versioned_controls WHERE framework_version_id = ?').bind(verId).run()
  await c.env.DB.prepare('DELETE FROM framework_versions WHERE id = ?').bind(verId).run()
  return c.json({ ok: true })
})

// ── Framework Controls ──────────────────────────────────────────────────────

adminRoutes.get('/libraries/frameworks/:fwId/versions/:verId/controls', async (c) => {
  const verId = c.req.param('verId')
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM versioned_controls WHERE framework_version_id = ? ORDER BY domain, control_id'
  ).bind(verId).all()
  return c.json({ items: results })
})

const controlSchema = z.object({
  control_id: z.string().min(1),
  domain: z.string().optional(),
  subdomain: z.string().optional(),
  title: z.string().min(1),
  requirement_text: z.string().min(1),
  guidance: z.string().optional(),
  evidence_requirements: z.string().optional(),
  risk_weight: z.number().optional(),
  implementation_group: z.string().optional(),
})

adminRoutes.post('/libraries/frameworks/:fwId/versions/:verId/controls', zValidator('json', controlSchema), async (c) => {
  const verId = c.req.param('verId')
  const data = c.req.valid('json')
  const id = generateId()
  const now = new Date().toISOString()
  await c.env.DB.prepare(
    `INSERT INTO versioned_controls (id, framework_version_id, control_id, domain, subdomain, title, requirement_text, guidance, evidence_requirements, risk_weight, implementation_group, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, verId, data.control_id, data.domain ?? null, data.subdomain ?? null, data.title, data.requirement_text, data.guidance ?? null, data.evidence_requirements ?? '[]', data.risk_weight ?? 0.5, data.implementation_group ?? null, now).run()

  // Update total_controls count
  const { results } = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM versioned_controls WHERE framework_version_id = ?').bind(verId).all()
  const cnt = (results[0] as any)?.cnt ?? 0
  await c.env.DB.prepare('UPDATE framework_versions SET total_controls = ? WHERE id = ?').bind(cnt, verId).run()

  return c.json({ id })
})

adminRoutes.put('/libraries/frameworks/:fwId/versions/:verId/controls/:ctrlId', zValidator('json', controlSchema.partial()), async (c) => {
  const ctrlId = c.req.param('ctrlId')
  const data = c.req.valid('json')
  const setClauses: string[] = []
  const values: any[] = []
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) { setClauses.push(`${key} = ?`); values.push(val) }
  }
  if (setClauses.length === 0) return c.json({ ok: true })
  values.push(ctrlId)
  await c.env.DB.prepare(`UPDATE versioned_controls SET ${setClauses.join(', ')} WHERE id = ?`).bind(...values).run()
  return c.json({ ok: true })
})

adminRoutes.delete('/libraries/frameworks/:fwId/versions/:verId/controls/:ctrlId', async (c) => {
  const ctrlId = c.req.param('ctrlId')
  const verId = c.req.param('verId')
  await c.env.DB.prepare('DELETE FROM versioned_controls WHERE id = ?').bind(ctrlId).run()

  // Update total_controls count
  const { results } = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM versioned_controls WHERE framework_version_id = ?').bind(verId).all()
  const cnt = (results[0] as any)?.cnt ?? 0
  await c.env.DB.prepare('UPDATE framework_versions SET total_controls = ? WHERE id = ?').bind(cnt, verId).run()

  return c.json({ ok: true })
})

// ─── Report Template Library ─────────────────────────────────────────────────

adminRoutes.get('/libraries/reports', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM report_template_library ORDER BY category, name'
  ).all()
  return c.json({ items: results })
})

adminRoutes.post('/libraries/reports', async (c) => {
  const body = await c.req.json<{ name: string; frameworkSlug?: string; category?: string; description?: string; content?: string; variables?: string; sections?: string; version?: string }>()
  if (!body.name) return c.json({ error: 'name is required' }, 400)

  const id = 'rt_' + generateId().slice(0, 12)
  const ts = new Date().toISOString()
  await c.env.DB.prepare(
    `INSERT INTO report_template_library (id, name, framework_slug, category, description, content, variables, sections, version, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.name, body.frameworkSlug || null, body.category || 'compliance',
    body.description || null, body.content || '{"type":"doc","content":[]}',
    body.variables || '[]', body.sections || '[]', body.version || '1.0', ts, ts).run()

  return c.json({ id }, 201)
})

adminRoutes.put('/libraries/reports/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<any>()

  const sets: string[] = []
  const vals: any[] = []
  const fieldMap: Record<string, string> = {
    name: 'name', frameworkSlug: 'framework_slug', category: 'category',
    description: 'description', content: 'content', variables: 'variables',
    sections: 'sections', version: 'version',
  }
  for (const [jsKey, dbKey] of Object.entries(fieldMap)) {
    if (body[jsKey] !== undefined) { sets.push(`${dbKey} = ?`); vals.push(body[jsKey]) }
  }
  if (sets.length === 0) return c.json({ error: 'No fields to update' }, 400)
  sets.push('updated_at = ?'); vals.push(new Date().toISOString())
  vals.push(id)

  await c.env.DB.prepare(
    `UPDATE report_template_library SET ${sets.join(', ')} WHERE id = ?`
  ).bind(...vals).run()
  return c.json({ ok: true })
})

adminRoutes.delete('/libraries/reports/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM report_template_library WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

export { adminRoutes }
