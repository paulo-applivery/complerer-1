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
        sampleData[v] = 'https://placehold.co/120x32/18181b/34d399?text=Complerer'
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
 * GET /api/admin/stats
 * Platform-wide stats
 */
adminRoutes.get('/stats', async (c) => {
  const totalWorkspaces = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM workspaces'
  ).first<{ count: number }>()

  const totalUsers = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM auth_users'
  ).first<{ count: number }>()

  const totalEvidence = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM evidence'
  ).first<{ count: number }>()

  const totalControls = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM framework_controls'
  ).first<{ count: number }>()

  return c.json({
    stats: {
      totalWorkspaces: totalWorkspaces?.count ?? 0,
      totalUsers: totalUsers?.count ?? 0,
      totalEvidence: totalEvidence?.count ?? 0,
      totalControls: totalControls?.count ?? 0,
    },
  })
})

export { adminRoutes }
