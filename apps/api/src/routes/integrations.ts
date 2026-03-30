import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { AppType } from '../types.js'
import { generateId } from '../lib/id.js'
import { emitEvent } from '../lib/events.js'
import { workspaceMiddleware, requireRole } from '../middleware/workspace.js'
import { authMiddleware } from '../middleware/auth.js'
import { encrypt } from '../lib/encrypt.js'
import { PROVIDERS, getProvider, buildGitHubURL, buildGoogleURL, buildJiraURL, buildLinearURL } from '../lib/oauth-providers.js'
import { getProviderConfigs } from '../lib/provider-config.js'

/**
 * Integration routes — mounted at /api/workspaces/:workspaceId/integrations
 */
const integrationRoutes = new Hono<AppType>()

integrationRoutes.use('*', authMiddleware)
integrationRoutes.use('*', workspaceMiddleware)

// ─── Catalog ────────────────────────────────────────────────────────────────

// GET /catalog — list available connectors (with auth type info)
integrationRoutes.get('/catalog', (c) => {
  const catalog = PROVIDERS.map(({ type, name, category, description, icon, authType, fields }) => ({
    type,
    name,
    category,
    description,
    icon,
    authType,
    fields: fields ?? [],
  }))
  return c.json({ catalog })
})

// ─── OAuth Init ─────────────────────────────────────────────────────────────

// GET /oauth/:provider/init — generate OAuth state and return the authorization URL
// The frontend opens this URL in a popup; the browser gets redirected to the provider
integrationRoutes.get(
  '/oauth/:provider/init',
  requireRole('admin'),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const provider = c.req.param('provider')

    const providerDef = getProvider(provider)
    if (!providerDef || providerDef.authType !== 'oauth_global') {
      return c.json({ error: 'Provider not found or does not use OAuth' }, 400)
    }

    // Generate CSRF state token
    const state = generateId()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString() // 10 min

    await c.env.DB.prepare(
      `INSERT INTO oauth_states (id, workspace_id, provider, created_by, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(state, workspaceId, provider, userId, now.toISOString(), expiresAt)
      .run()

    // Read client_id from admin-managed provider config (DB)
    const cfg = await getProviderConfigs(c.env.DB, provider)
    const clientId = cfg['client_id'] ?? ''

    if (!clientId) {
      return c.json({
        error: `${providerDef.name} is not configured yet. Go to Admin → Providers → Integration and add the client_id and client_secret.`,
      }, 400)
    }

    // Build authorization URL
    const apiBase = new URL(c.req.url).origin
    const redirectUri = `${apiBase}/api/oauth/callback`
    const scopes = providerDef.scopes ?? []

    let authUrl: string
    switch (provider) {
      case 'github':
        authUrl = buildGitHubURL({ clientId, redirectUri, state, scopes })
        break
      case 'google_ws':
        authUrl = buildGoogleURL({ clientId, redirectUri, state, scopes })
        break
      case 'jira':
        authUrl = buildJiraURL({ clientId, redirectUri, state, scopes })
        break
      case 'linear':
        authUrl = buildLinearURL({ clientId, redirectUri, state, scopes })
        break
      default:
        return c.json({ error: 'Unsupported OAuth provider' }, 400)
    }

    return c.json({ authUrl, state })
  }
)

// ─── Connected Integrations ─────────────────────────────────────────────────

// GET / — list workspace integrations (never expose tokens)
integrationRoutes.get('/', async (c) => {
  const workspaceId = c.get('workspaceId')

  const { results } = await c.env.DB.prepare(
    `SELECT id, workspace_id, type, name, status, config, auth_type,
            token_expires_at, token_scope, last_sync_at, last_sync_status,
            last_sync_error, sync_interval_minutes, created_by, created_at, updated_at
     FROM integrations WHERE workspace_id = ? ORDER BY created_at DESC`
  )
    .bind(workspaceId)
    .all()

  return c.json({ integrations: results })
})

// POST / — connect an integration via API key or custom OAuth credentials
const connectSchema = z.object({
  type: z.string().min(1),
  name: z.string().optional(),
  credentials: z.record(z.string()).optional(), // key/secret fields
  config: z.record(z.unknown()).optional(),
})

integrationRoutes.post(
  '/',
  requireRole('admin'),
  zValidator('json', connectSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const body = c.req.valid('json')

    const providerDef = getProvider(body.type)
    if (!providerDef) {
      return c.json({ error: 'Unknown integration type' }, 400)
    }

    // oauth_global providers must use the popup flow
    if (providerDef.authType === 'oauth_global') {
      return c.json({ error: 'Use the OAuth popup flow for this provider' }, 400)
    }

    const encKey = c.env.ENCRYPTION_KEY ?? 'dev-encryption-key-change-me-32chars'
    const id = generateId()
    const now = new Date().toISOString()
    const name = body.name ?? providerDef.name

    // Encrypt credentials if provided
    let accessTokenEnc: string | null = null
    if (body.credentials && Object.keys(body.credentials).length > 0) {
      accessTokenEnc = await encrypt(JSON.stringify(body.credentials), encKey)
    }

    // Check for existing connection (upsert)
    const existing = await c.env.DB.prepare(
      'SELECT id FROM integrations WHERE workspace_id = ? AND type = ?'
    )
      .bind(workspaceId, body.type)
      .first<{ id: string }>()

    if (existing) {
      await c.env.DB.prepare(
        `UPDATE integrations
         SET name = ?, status = 'connected', config = ?, auth_type = ?,
             access_token_enc = ?, updated_at = ?
         WHERE id = ?`
      )
        .bind(
          name,
          JSON.stringify(body.config ?? {}),
          providerDef.authType,
          accessTokenEnc,
          now,
          existing.id
        )
        .run()

      const updated = await c.env.DB.prepare(
        `SELECT id, workspace_id, type, name, status, config, auth_type,
                token_expires_at, last_sync_at, last_sync_status, created_by, created_at, updated_at
         FROM integrations WHERE id = ?`
      )
        .bind(existing.id)
        .first()

      return c.json({ integration: updated })
    }

    await c.env.DB.prepare(
      `INSERT INTO integrations
         (id, workspace_id, type, name, status, config, auth_type,
          access_token_enc, sync_interval_minutes, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'connected', ?, ?, ?, 60, ?, ?, ?)`
    )
      .bind(
        id,
        workspaceId,
        body.type,
        name,
        JSON.stringify(body.config ?? {}),
        providerDef.authType,
        accessTokenEnc,
        userId,
        now,
        now
      )
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'integration.connected',
      entityType: 'integration',
      entityId: id,
      data: { type: body.type, name },
      actorId: userId,
    })

    const integration = await c.env.DB.prepare(
      `SELECT id, workspace_id, type, name, status, config, auth_type,
              token_expires_at, last_sync_at, last_sync_status, created_by, created_at, updated_at
       FROM integrations WHERE id = ?`
    )
      .bind(id)
      .first()

    return c.json({ integration }, 201)
  }
)

// PATCH /:integrationId — update name, config, sync interval
const updateIntegrationSchema = z.object({
  name: z.string().optional(),
  config: z.record(z.unknown()).optional(),
  status: z.enum(['connected', 'disconnected', 'error']).optional(),
  syncIntervalMinutes: z.number().min(5).optional(),
})

integrationRoutes.patch(
  '/:integrationId',
  requireRole('admin'),
  zValidator('json', updateIntegrationSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const integrationId = c.req.param('integrationId')
    const body = c.req.valid('json')

    const existing = await c.env.DB.prepare(
      'SELECT * FROM integrations WHERE id = ? AND workspace_id = ?'
    )
      .bind(integrationId, workspaceId)
      .first()

    if (!existing) {
      return c.json({ error: 'Integration not found' }, 404)
    }

    const now = new Date().toISOString()
    const updates: string[] = ['updated_at = ?']
    const values: unknown[] = [now]

    if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name) }
    if (body.config !== undefined) { updates.push('config = ?'); values.push(JSON.stringify(body.config)) }
    if (body.status !== undefined) { updates.push('status = ?'); values.push(body.status) }
    if (body.syncIntervalMinutes !== undefined) {
      updates.push('sync_interval_minutes = ?')
      values.push(body.syncIntervalMinutes)
    }

    values.push(integrationId, workspaceId)

    await c.env.DB.prepare(
      `UPDATE integrations SET ${updates.join(', ')} WHERE id = ? AND workspace_id = ?`
    )
      .bind(...values)
      .run()

    const updated = await c.env.DB.prepare(
      `SELECT id, workspace_id, type, name, status, config, auth_type,
              token_expires_at, last_sync_at, last_sync_status, created_by, created_at, updated_at
       FROM integrations WHERE id = ?`
    )
      .bind(integrationId)
      .first()

    return c.json({ integration: updated })
  }
)

// DELETE /:integrationId — disconnect (clear tokens, set status to disconnected)
integrationRoutes.delete(
  '/:integrationId',
  requireRole('admin'),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const integrationId = c.req.param('integrationId')

    const existing = await c.env.DB.prepare(
      'SELECT * FROM integrations WHERE id = ? AND workspace_id = ?'
    )
      .bind(integrationId, workspaceId)
      .first<{ type: string }>()

    if (!existing) {
      return c.json({ error: 'Integration not found' }, 404)
    }

    const now = new Date().toISOString()

    await c.env.DB.prepare(
      `UPDATE integrations
       SET status = 'disconnected', access_token_enc = NULL, refresh_token_enc = NULL,
           token_expires_at = NULL, updated_at = ?
       WHERE id = ? AND workspace_id = ?`
    )
      .bind(now, integrationId, workspaceId)
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'integration.disconnected',
      entityType: 'integration',
      entityId: integrationId,
      data: { type: existing.type },
      actorId: userId,
    })

    return c.json({ success: true })
  }
)

// ─── Sync ────────────────────────────────────────────────────────────────────

integrationRoutes.post(
  '/:integrationId/sync',
  requireRole('admin'),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const integrationId = c.req.param('integrationId')

    const integration = await c.env.DB.prepare(
      'SELECT * FROM integrations WHERE id = ? AND workspace_id = ?'
    )
      .bind(integrationId, workspaceId)
      .first()

    if (!integration) {
      return c.json({ error: 'Integration not found' }, 404)
    }

    const syncId = generateId()
    const now = new Date().toISOString()

    await c.env.DB.prepare(
      `INSERT INTO integration_sync_logs
         (id, workspace_id, integration_id, sync_type, status, records_pulled,
          records_created, records_updated, anomalies_detected, started_at, completed_at)
       VALUES (?, ?, ?, 'full', 'completed', 0, 0, 0, 0, ?, ?)`
    )
      .bind(syncId, workspaceId, integrationId, now, now)
      .run()

    await c.env.DB.prepare(
      `UPDATE integrations
       SET last_sync_at = ?, last_sync_status = 'success', last_sync_error = NULL, updated_at = ?
       WHERE id = ?`
    )
      .bind(now, now, integrationId)
      .run()

    const syncLog = await c.env.DB.prepare(
      'SELECT * FROM integration_sync_logs WHERE id = ?'
    )
      .bind(syncId)
      .first()

    return c.json({ syncLog })
  }
)

integrationRoutes.get('/:integrationId/sync-logs', async (c) => {
  const workspaceId = c.get('workspaceId')
  const integrationId = c.req.param('integrationId')

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM integration_sync_logs WHERE integration_id = ? AND workspace_id = ? ORDER BY started_at DESC LIMIT 50'
  )
    .bind(integrationId, workspaceId)
    .all()

  return c.json({ syncLogs: results })
})

// ─── Anomalies ───────────────────────────────────────────────────────────────

integrationRoutes.get('/anomalies', async (c) => {
  const workspaceId = c.get('workspaceId')
  const status = c.req.query('status')

  let query =
    'SELECT a.*, i.name as integration_name, i.type as integration_type FROM anomalies a LEFT JOIN integrations i ON a.integration_id = i.id WHERE a.workspace_id = ?'
  const bindings: unknown[] = [workspaceId]

  if (status) {
    query += ' AND a.status = ?'
    bindings.push(status)
  }

  query += ' ORDER BY a.created_at DESC LIMIT 100'

  const { results } = await c.env.DB.prepare(query).bind(...bindings).all()
  return c.json({ anomalies: results })
})

integrationRoutes.post(
  '/anomalies/:anomalyId/resolve',
  requireRole('admin'),
  zValidator('json', z.object({ reason: z.string().optional() })),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const anomalyId = c.req.param('anomalyId')
    const body = c.req.valid('json')

    const existing = await c.env.DB.prepare(
      'SELECT * FROM anomalies WHERE id = ? AND workspace_id = ?'
    )
      .bind(anomalyId, workspaceId)
      .first()

    if (!existing) return c.json({ error: 'Anomaly not found' }, 404)

    const now = new Date().toISOString()
    await c.env.DB.prepare(
      `UPDATE anomalies SET status = 'resolved', resolved_by = ?, resolved_at = ? WHERE id = ? AND workspace_id = ?`
    )
      .bind(userId, now, anomalyId, workspaceId)
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'anomaly.resolved',
      entityType: 'anomaly',
      entityId: anomalyId,
      data: { reason: body.reason ?? null },
      actorId: userId,
    })

    return c.json({ success: true })
  }
)

integrationRoutes.post(
  '/anomalies/:anomalyId/dismiss',
  requireRole('admin'),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const anomalyId = c.req.param('anomalyId')

    const existing = await c.env.DB.prepare(
      'SELECT * FROM anomalies WHERE id = ? AND workspace_id = ?'
    )
      .bind(anomalyId, workspaceId)
      .first()

    if (!existing) return c.json({ error: 'Anomaly not found' }, 404)

    const now = new Date().toISOString()
    await c.env.DB.prepare(
      `UPDATE anomalies SET status = 'dismissed', resolved_by = ?, resolved_at = ? WHERE id = ? AND workspace_id = ?`
    )
      .bind(userId, now, anomalyId, workspaceId)
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'anomaly.dismissed',
      entityType: 'anomaly',
      entityId: anomalyId,
      actorId: userId,
    })

    return c.json({ success: true })
  }
)

export { integrationRoutes }
