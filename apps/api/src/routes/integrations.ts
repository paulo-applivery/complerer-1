import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { AppType } from '../types.js'
import { generateId } from '../lib/id.js'
import { emitEvent } from '../lib/events.js'
import { workspaceMiddleware, requireRole } from '../middleware/workspace.js'
import { authMiddleware } from '../middleware/auth.js'

/**
 * Integration routes — mounted at /api/workspaces/:workspaceId/integrations
 * Handles integration connectors, sync logs, and anomalies.
 */
const integrationRoutes = new Hono<AppType>()

// All routes require authentication + workspace membership
integrationRoutes.use('*', authMiddleware)
integrationRoutes.use('*', workspaceMiddleware)

// ─── Integration Catalog ────────────────────────────────────────────

const INTEGRATION_CATALOG = [
  { type: 'okta', name: 'Okta', category: 'identity', description: 'Identity & access management', icon: 'okta' },
  { type: 'azure_ad', name: 'Azure AD / Entra ID', category: 'identity', description: 'Microsoft identity platform', icon: 'microsoft' },
  { type: 'google_ws', name: 'Google Workspace', category: 'identity', description: 'Google identity & directory', icon: 'google' },
  { type: 'applivery', name: 'Applivery', category: 'mdm', description: 'Mobile device management & UEM', icon: 'applivery' },
  { type: 'aws', name: 'AWS', category: 'cloud', description: 'Amazon Web Services IAM & infrastructure', icon: 'aws' },
  { type: 'jira', name: 'Jira', category: 'ticketing', description: 'Issue tracking & change management', icon: 'jira' },
  { type: 'linear', name: 'Linear', category: 'ticketing', description: 'Project & issue tracking', icon: 'linear' },
  { type: 'github', name: 'GitHub', category: 'devops', description: 'Source code & CI/CD', icon: 'github' },
]

// GET /catalog — list available connectors
integrationRoutes.get('/catalog', (c) => {
  return c.json({ catalog: INTEGRATION_CATALOG })
})

// ─── Connected Integrations ─────────────────────────────────────────

// GET / — list workspace's configured integrations
integrationRoutes.get('/', async (c) => {
  const workspaceId = c.get('workspaceId')

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM integrations WHERE workspace_id = ? ORDER BY created_at DESC'
  )
    .bind(workspaceId)
    .all()

  return c.json({ integrations: results })
})

// POST / — connect a new integration
const createIntegrationSchema = z.object({
  type: z.string().min(1),
  name: z.string().optional(),
  config: z.record(z.unknown()).optional(),
})

integrationRoutes.post(
  '/',
  requireRole('admin'),
  zValidator('json', createIntegrationSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const body = c.req.valid('json')

    const catalogEntry = INTEGRATION_CATALOG.find((i) => i.type === body.type)
    if (!catalogEntry) {
      return c.json({ error: 'Unknown integration type' }, 400)
    }

    const id = generateId()
    const now = new Date().toISOString()
    const name = body.name ?? catalogEntry.name

    await c.env.DB.prepare(
      `INSERT INTO integrations (id, workspace_id, type, name, status, config, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'connected', ?, ?, ?, ?)`
    )
      .bind(id, workspaceId, body.type, name, JSON.stringify(body.config ?? {}), userId, now, now)
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'integration.connected',
      entityType: 'integration',
      entityId: id,
      data: { type: body.type, name },
      actorId: userId,
    })

    const integration = await c.env.DB.prepare('SELECT * FROM integrations WHERE id = ?')
      .bind(id)
      .first()

    return c.json({ integration }, 201)
  }
)

// PATCH /:integrationId — update integration config/status
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

    if (body.name !== undefined) {
      updates.push('name = ?')
      values.push(body.name)
    }
    if (body.config !== undefined) {
      updates.push('config = ?')
      values.push(JSON.stringify(body.config))
    }
    if (body.status !== undefined) {
      updates.push('status = ?')
      values.push(body.status)
    }
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

    const updated = await c.env.DB.prepare('SELECT * FROM integrations WHERE id = ?')
      .bind(integrationId)
      .first()

    return c.json({ integration: updated })
  }
)

// DELETE /:integrationId — disconnect integration (soft delete)
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
      .first()

    if (!existing) {
      return c.json({ error: 'Integration not found' }, 404)
    }

    const now = new Date().toISOString()

    await c.env.DB.prepare(
      `UPDATE integrations SET status = 'disconnected', updated_at = ? WHERE id = ? AND workspace_id = ?`
    )
      .bind(now, integrationId, workspaceId)
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'integration.disconnected',
      entityType: 'integration',
      entityId: integrationId,
      data: { type: (existing as Record<string, unknown>).type },
      actorId: userId,
    })

    return c.json({ success: true })
  }
)

// ─── Sync ───────────────────────────────────────────────────────────

// POST /:integrationId/sync — trigger manual sync
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

    // Create sync log entry
    await c.env.DB.prepare(
      `INSERT INTO integration_sync_logs (id, workspace_id, integration_id, sync_type, status, records_pulled, records_created, records_updated, anomalies_detected, started_at, completed_at)
       VALUES (?, ?, ?, 'full', 'completed', 0, 0, 0, 0, ?, ?)`
    )
      .bind(syncId, workspaceId, integrationId, now, now)
      .run()

    // Update integration's last sync timestamp
    await c.env.DB.prepare(
      `UPDATE integrations SET last_sync_at = ?, last_sync_status = 'success', last_sync_error = NULL, updated_at = ? WHERE id = ?`
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

// GET /:integrationId/sync-logs — list sync history
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

// ─── Anomalies ──────────────────────────────────────────────────────

// GET /anomalies — list anomalies across all integrations
integrationRoutes.get('/anomalies', async (c) => {
  const workspaceId = c.get('workspaceId')
  const status = c.req.query('status')

  let query = 'SELECT a.*, i.name as integration_name, i.type as integration_type FROM anomalies a LEFT JOIN integrations i ON a.integration_id = i.id WHERE a.workspace_id = ?'
  const bindings: unknown[] = [workspaceId]

  if (status) {
    query += ' AND a.status = ?'
    bindings.push(status)
  }

  query += ' ORDER BY a.created_at DESC LIMIT 100'

  const { results } = await c.env.DB.prepare(query).bind(...bindings).all()

  return c.json({ anomalies: results })
})

// POST /anomalies/:anomalyId/resolve — resolve an anomaly
const resolveAnomalySchema = z.object({
  reason: z.string().optional(),
})

integrationRoutes.post(
  '/anomalies/:anomalyId/resolve',
  requireRole('admin'),
  zValidator('json', resolveAnomalySchema),
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

    if (!existing) {
      return c.json({ error: 'Anomaly not found' }, 404)
    }

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

// POST /anomalies/:anomalyId/dismiss — dismiss an anomaly
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

    if (!existing) {
      return c.json({ error: 'Anomaly not found' }, 404)
    }

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
