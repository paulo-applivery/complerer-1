import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { AppType } from '../types.js'
import { generateId } from '../lib/id.js'
import { emitEvent } from '../lib/events.js'
import { authMiddleware } from '../middleware/auth.js'
import { workspaceMiddleware, requireRole } from '../middleware/workspace.js'

const workspaceRoutes = new Hono<AppType>()

// All workspace routes require authentication
workspaceRoutes.use('*', authMiddleware)

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
})

/**
 * POST /api/workspaces
 * Create workspace + add creator as owner, emit compliance event.
 */
workspaceRoutes.post(
  '/',
  zValidator('json', createWorkspaceSchema),
  async (c) => {
    const userId = c.get('userId')
    const { name, slug } = c.req.valid('json')
    const now = new Date().toISOString()

    // Check slug uniqueness
    const existing = await c.env.DB.prepare(
      'SELECT id FROM workspaces WHERE slug = ?'
    )
      .bind(slug)
      .first()

    if (existing) {
      return c.json({ error: 'Workspace slug already taken' }, 409)
    }

    const workspaceId = generateId()
    const memberId = generateId()

    // Create workspace
    await c.env.DB.prepare(
      'INSERT INTO workspaces (id, name, slug, plan, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(workspaceId, name, slug, 'free', now, now)
      .run()

    // Add creator as owner
    await c.env.DB.prepare(
      'INSERT INTO workspace_members (id, workspace_id, user_id, role, invited_by, joined_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(memberId, workspaceId, userId, 'owner', userId, now)
      .run()

    // Emit compliance event
    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'workspace.created',
      entityType: 'workspace',
      entityId: workspaceId,
      data: { name, slug },
      actorId: userId,
    })

    return c.json(
      {
        workspace: {
          id: workspaceId,
          name,
          slug,
          plan: 'free',
          createdAt: now,
          updatedAt: now,
        },
      },
      201
    )
  }
)

/**
 * GET /api/workspaces
 * List workspaces for the current user.
 */
workspaceRoutes.get('/', async (c) => {
  const userId = c.get('userId')

  const { results } = await c.env.DB.prepare(
    `SELECT w.id, w.name, w.slug, w.plan, w.created_at, w.updated_at, wm.role
     FROM workspaces w
     JOIN workspace_members wm ON wm.workspace_id = w.id
     WHERE wm.user_id = ?
     ORDER BY w.name ASC`
  )
    .bind(userId)
    .all<{
      id: string
      name: string
      slug: string
      plan: string
      created_at: string
      updated_at: string
      role: string
    }>()

  return c.json({
    workspaces: results.map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      plan: w.plan,
      createdAt: w.created_at,
      updatedAt: w.updated_at,
      role: w.role,
    })),
  })
})

/**
 * GET /api/workspaces/:workspaceId
 * Get workspace details.
 */
workspaceRoutes.get('/:workspaceId', workspaceMiddleware, async (c) => {
  const workspaceId = c.get('workspaceId')

  const workspace = await c.env.DB.prepare(
    'SELECT id, name, slug, plan, created_at, updated_at FROM workspaces WHERE id = ?'
  )
    .bind(workspaceId)
    .first<{
      id: string
      name: string
      slug: string
      plan: string
      created_at: string
      updated_at: string
    }>()

  if (!workspace) {
    return c.json({ error: 'Workspace not found' }, 404)
  }

  // Also fetch members so the frontend has them in one call
  const { results: memberRows } = await c.env.DB.prepare(
    `SELECT wm.id, wm.user_id, wm.role, wm.joined_at,
            u.email, u.name, u.avatar_url
     FROM workspace_members wm
     JOIN auth_users u ON u.id = wm.user_id
     WHERE wm.workspace_id = ?
     ORDER BY wm.joined_at ASC`
  )
    .bind(workspaceId)
    .all<{
      id: string
      user_id: string
      role: string
      joined_at: string
      email: string
      name: string
      avatar_url: string | null
    }>()

  return c.json({
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      plan: workspace.plan,
      createdAt: workspace.created_at,
      updatedAt: workspace.updated_at,
    },
    members: memberRows.map((m) => ({
      id: m.id,
      userId: m.user_id,
      email: m.email,
      name: m.name,
      role: m.role,
      avatarUrl: m.avatar_url,
      joinedAt: m.joined_at,
    })),
    role: c.get('memberRole'),
  })
})

/**
 * GET /api/workspaces/:workspaceId/members
 * List workspace members.
 */
workspaceRoutes.get(
  '/:workspaceId/members',
  workspaceMiddleware,
  async (c) => {
    const workspaceId = c.get('workspaceId')

    const { results } = await c.env.DB.prepare(
      `SELECT wm.id, wm.user_id, wm.role, wm.invited_by, wm.joined_at,
              u.email, u.name, u.avatar_url
       FROM workspace_members wm
       JOIN auth_users u ON u.id = wm.user_id
       WHERE wm.workspace_id = ?
       ORDER BY wm.joined_at ASC`
    )
      .bind(workspaceId)
      .all<{
        id: string
        user_id: string
        role: string
        invited_by: string
        joined_at: string
        email: string
        name: string
        avatar_url: string | null
      }>()

    return c.json({
      members: results.map((m) => ({
        id: m.id,
        userId: m.user_id,
        role: m.role,
        invitedBy: m.invited_by,
        joinedAt: m.joined_at,
        email: m.email,
        name: m.name,
        avatarUrl: m.avatar_url,
      })),
    })
  }
)

const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'auditor', 'member', 'viewer']),
})

/**
 * POST /api/workspaces/:workspaceId/invitations
 * Create an invitation (admin+ only).
 */
workspaceRoutes.post(
  '/:workspaceId/invitations',
  workspaceMiddleware,
  requireRole('admin'),
  zValidator('json', createInvitationSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const { email, role } = c.req.valid('json')
    const now = new Date().toISOString()

    // Check if already a member
    const existingMember = await c.env.DB.prepare(
      `SELECT wm.id FROM workspace_members wm
       JOIN auth_users u ON u.id = wm.user_id
       WHERE wm.workspace_id = ? AND u.email = ?`
    )
      .bind(workspaceId, email)
      .first()

    if (existingMember) {
      return c.json({ error: 'User is already a member of this workspace' }, 409)
    }

    // Check for pending invitation
    const existingInvitation = await c.env.DB.prepare(
      "SELECT id FROM invitations WHERE workspace_id = ? AND email = ? AND status = 'pending'"
    )
      .bind(workspaceId, email)
      .first()

    if (existingInvitation) {
      return c.json({ error: 'Pending invitation already exists for this email' }, 409)
    }

    const invitationId = generateId()
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString() // 7 days

    await c.env.DB.prepare(
      `INSERT INTO invitations (id, workspace_id, email, role, invited_by, status, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`
    )
      .bind(invitationId, workspaceId, email, role, userId, expiresAt, now)
      .run()

    await emitEvent(c.env.DB, {
      workspaceId,
      eventType: 'invitation.created',
      entityType: 'invitation',
      entityId: invitationId,
      data: { email, role },
      actorId: userId,
    })

    return c.json(
      {
        invitation: {
          id: invitationId,
          workspaceId,
          email,
          role,
          invitedBy: userId,
          status: 'pending',
          expiresAt,
          createdAt: now,
        },
      },
      201
    )
  }
)

/**
 * POST /api/invitations/:invitationId/accept
 * Accept an invitation and join the workspace.
 */
workspaceRoutes.post('/invitations/:invitationId/accept', async (c) => {
  const userId = c.get('userId')
  const invitationId = c.req.param('invitationId')
  const now = new Date().toISOString()

  // Get invitation
  const invitation = await c.env.DB.prepare(
    'SELECT id, workspace_id, email, role, status, expires_at FROM invitations WHERE id = ?'
  )
    .bind(invitationId)
    .first<{
      id: string
      workspace_id: string
      email: string
      role: string
      status: string
      expires_at: string
    }>()

  if (!invitation) {
    return c.json({ error: 'Invitation not found' }, 404)
  }

  if (invitation.status !== 'pending') {
    return c.json({ error: 'Invitation is no longer pending' }, 400)
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return c.json({ error: 'Invitation has expired' }, 400)
  }

  // Verify user email matches invitation
  const user = await c.env.DB.prepare(
    'SELECT email FROM auth_users WHERE id = ?'
  )
    .bind(userId)
    .first<{ email: string }>()

  if (!user || user.email !== invitation.email) {
    return c.json(
      { error: 'Invitation email does not match your account' },
      403
    )
  }

  // Check if already a member
  const existingMember = await c.env.DB.prepare(
    'SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?'
  )
    .bind(invitation.workspace_id, userId)
    .first()

  if (existingMember) {
    return c.json({ error: 'Already a member of this workspace' }, 409)
  }

  const memberId = generateId()

  // Add as member
  await c.env.DB.prepare(
    'INSERT INTO workspace_members (id, workspace_id, user_id, role, invited_by, joined_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(
      memberId,
      invitation.workspace_id,
      userId,
      invitation.role,
      invitation.id,
      now
    )
    .run()

  // Update invitation status
  await c.env.DB.prepare(
    "UPDATE invitations SET status = 'accepted' WHERE id = ?"
  )
    .bind(invitationId)
    .run()

  await emitEvent(c.env.DB, {
    workspaceId: invitation.workspace_id,
    eventType: 'member.joined',
    entityType: 'workspace_member',
    entityId: memberId,
    data: { role: invitation.role, invitationId },
    actorId: userId,
  })

  return c.json({
    member: {
      id: memberId,
      workspaceId: invitation.workspace_id,
      userId,
      role: invitation.role,
      joinedAt: now,
    },
  })
})

/**
 * GET /api/workspaces/:workspaceId/features
 * List enabled feature flags for this workspace.
 */
workspaceRoutes.get(
  '/:workspaceId/features',
  workspaceMiddleware,
  async (c) => {
    const workspaceId = c.get('workspaceId')

    const { results } = await c.env.DB.prepare(
      'SELECT slug, enabled, rollout_percentage, target_workspaces FROM feature_flags'
    ).all<{
      slug: string
      enabled: number
      rollout_percentage: number
      target_workspaces: string | null
    }>()

    // Compute which flags are active for this workspace
    const features: Record<string, boolean> = {}
    for (const flag of results) {
      let active = flag.enabled === 1

      // Check workspace targeting
      if (active && flag.target_workspaces) {
        try {
          const targets = JSON.parse(flag.target_workspaces) as string[]
          if (targets.length > 0) {
            active = targets.includes(workspaceId)
          }
        } catch {}
      }

      // Check rollout percentage (simple hash-based)
      if (active && flag.rollout_percentage < 100) {
        const hash = Array.from(workspaceId + flag.slug).reduce((acc, c) => acc + c.charCodeAt(0), 0)
        active = (hash % 100) < flag.rollout_percentage
      }

      features[flag.slug] = active
    }

    return c.json({ features })
  }
)

// ─── Update Workspace ────────────────────────────────────────────────────────

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
})

/**
 * PATCH /api/workspaces/:workspaceId
 * Update workspace name (owner only).
 */
workspaceRoutes.patch(
  '/:workspaceId',
  workspaceMiddleware,
  requireRole('owner'),
  zValidator('json', updateWorkspaceSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const { name, slug } = c.req.valid('json')
    const now = new Date().toISOString()

    const setClauses: string[] = ['updated_at = ?']
    const values: any[] = [now]
    if (name) { setClauses.push('name = ?'); values.push(name) }
    if (slug) { setClauses.push('slug = ?'); values.push(slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')) }
    values.push(workspaceId)

    await c.env.DB.prepare(
      `UPDATE workspaces SET ${setClauses.join(', ')} WHERE id = ?`
    ).bind(...values).run()

    const workspace = await c.env.DB.prepare(
      'SELECT id, name, slug, plan, created_at, updated_at FROM workspaces WHERE id = ?'
    )
      .bind(workspaceId)
      .first()

    return c.json({ workspace })
  }
)

// ─── Member Role Change ──────────────────────────────────────────────────────

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'auditor', 'member', 'viewer']),
})

/**
 * PATCH /api/workspaces/:workspaceId/members/:memberId
 * Change a member's role (admin+ only).
 */
workspaceRoutes.patch(
  '/:workspaceId/members/:memberId',
  workspaceMiddleware,
  requireRole('admin'),
  zValidator('json', updateRoleSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const memberId = c.req.param('memberId')
    const { role: newRole } = c.req.valid('json')
    const db = c.env.DB

    const member = await db
      .prepare('SELECT id, user_id, role FROM workspace_members WHERE id = ? AND workspace_id = ?')
      .bind(memberId, workspaceId)
      .first<{ id: string; user_id: string; role: string }>()

    if (!member) {
      return c.json({ error: 'Member not found' }, 404)
    }

    if (member.role === 'owner') {
      return c.json({ error: 'Cannot change the owner role' }, 403)
    }

    if (member.user_id === userId) {
      return c.json({ error: 'Cannot change your own role' }, 403)
    }

    await db
      .prepare('UPDATE workspace_members SET role = ? WHERE id = ?')
      .bind(newRole, memberId)
      .run()

    await emitEvent(db, {
      workspaceId,
      eventType: 'member.role_changed',
      entityType: 'workspace_member',
      entityId: memberId,
      data: { oldRole: member.role, newRole },
      actorId: userId,
    })

    return c.json({ success: true, role: newRole })
  }
)

// ─── Remove Member ───────────────────────────────────────────────────────────

/**
 * DELETE /api/workspaces/:workspaceId/members/:memberId
 * Remove a member from the workspace (admin+ only).
 */
workspaceRoutes.delete(
  '/:workspaceId/members/:memberId',
  workspaceMiddleware,
  requireRole('admin'),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const memberId = c.req.param('memberId')
    const db = c.env.DB

    const member = await db
      .prepare('SELECT id, user_id, role FROM workspace_members WHERE id = ? AND workspace_id = ?')
      .bind(memberId, workspaceId)
      .first<{ id: string; user_id: string; role: string }>()

    if (!member) {
      return c.json({ error: 'Member not found' }, 404)
    }

    if (member.role === 'owner') {
      return c.json({ error: 'Cannot remove the workspace owner' }, 403)
    }

    if (member.user_id === userId) {
      return c.json({ error: 'Cannot remove yourself' }, 403)
    }

    await db
      .prepare('DELETE FROM workspace_members WHERE id = ?')
      .bind(memberId)
      .run()

    await emitEvent(db, {
      workspaceId,
      eventType: 'member.removed',
      entityType: 'workspace_member',
      entityId: memberId,
      data: { removedUserId: member.user_id, role: member.role },
      actorId: userId,
    })

    return c.json({ success: true })
  }
)

// ─── List Direct Invitations ─────────────────────────────────────────────────

/**
 * GET /api/workspaces/:workspaceId/invitations/direct
 * List pending direct invitations (admin+ only).
 */
workspaceRoutes.get(
  '/:workspaceId/invitations/direct',
  workspaceMiddleware,
  requireRole('admin'),
  async (c) => {
    const workspaceId = c.get('workspaceId')

    const { results } = await c.env.DB.prepare(
      `SELECT id, email, role, invited_by, status, expires_at, created_at
       FROM invitations
       WHERE workspace_id = ? AND status = 'pending'
       ORDER BY created_at DESC`
    )
      .bind(workspaceId)
      .all<{
        id: string
        email: string
        role: string
        invited_by: string
        status: string
        expires_at: string
        created_at: string
      }>()

    return c.json({
      invitations: results.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        invitedBy: inv.invited_by,
        status: inv.status,
        expiresAt: inv.expires_at,
        createdAt: inv.created_at,
      })),
    })
  }
)

// ─── Cancel Invitation ───────────────────────────────────────────────────────

/**
 * DELETE /api/workspaces/:workspaceId/invitations/:invitationId
 * Cancel a pending invitation (admin+ only).
 */
workspaceRoutes.delete(
  '/:workspaceId/invitations/:invitationId',
  workspaceMiddleware,
  requireRole('admin'),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const invitationId = c.req.param('invitationId')
    const db = c.env.DB

    const inv = await db
      .prepare("SELECT id, email FROM invitations WHERE id = ? AND workspace_id = ? AND status = 'pending'")
      .bind(invitationId, workspaceId)
      .first<{ id: string; email: string }>()

    if (!inv) {
      return c.json({ error: 'Invitation not found or already processed' }, 404)
    }

    await db
      .prepare("UPDATE invitations SET status = 'cancelled' WHERE id = ?")
      .bind(invitationId)
      .run()

    await emitEvent(db, {
      workspaceId,
      eventType: 'invitation.cancelled',
      entityType: 'invitation',
      entityId: invitationId,
      data: { email: inv.email },
      actorId: userId,
    })

    return c.json({ success: true })
  }
)

export { workspaceRoutes }
