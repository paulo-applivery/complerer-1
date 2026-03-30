import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { AppType } from '../types.js'
import { generateId } from '../lib/id.js'
import { sendEmail } from '../lib/email.js'
import { authMiddleware } from '../middleware/auth.js'
import { workspaceMiddleware, requireRole } from '../middleware/workspace.js'

const authRoutes = new Hono<AppType>()

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateOtpCode(): string {
  const digits = '0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += digits[Math.floor(Math.random() * 10)]
  }
  return code
}

function getDomainFromEmail(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? ''
}

// ── POST /api/auth/send-otp ──────────────────────────────────────────────────

const sendOtpSchema = z.object({
  email: z.string().email(),
})

authRoutes.post('/send-otp', zValidator('json', sendOtpSchema), async (c) => {
  const { email } = c.req.valid('json')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000) // 10 minutes
  const code = generateOtpCode()
  const id = generateId()

  // Invalidate any existing unused codes for this email
  await c.env.DB.prepare(
    'UPDATE otp_codes SET used = 1 WHERE email = ? AND used = 0'
  )
    .bind(email.toLowerCase())
    .run()

  // Store new OTP
  await c.env.DB.prepare(
    'INSERT INTO otp_codes (id, email, code, expires_at, used, created_at) VALUES (?, ?, ?, ?, 0, ?)'
  )
    .bind(id, email.toLowerCase(), code, expiresAt.toISOString(), now.toISOString())
    .run()

  const isDev = c.env.ENVIRONMENT === 'development'

  // Send OTP email via Brevo (if configured)
  const emailResult = await sendEmail(c.env.DB, {
    to: email,
    templateSlug: 'otp-verification',
    variables: {
      code,
      logoUrl: 'https://complerer.com/logo-color.svg',
    },
  }, isDev)

  if (isDev) {
    console.log(`[DEV] OTP for ${email}: ${code}`)
    return c.json({
      success: true,
      message: emailResult.sent ? 'OTP sent via email' : 'OTP generated (email not configured)',
      devCode: code,
      emailSent: emailResult.sent,
    })
  }

  return c.json({
    success: true,
    message: emailResult.sent ? 'OTP sent to your email' : 'OTP sent',
    emailSent: emailResult.sent,
  })
})

// ── POST /api/auth/verify-otp ────────────────────────────────────────────────

const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  name: z.string().min(1).optional(),
})

authRoutes.post('/verify-otp', zValidator('json', verifyOtpSchema), async (c) => {
  const { email, code, name } = c.req.valid('json')
  const now = new Date().toISOString()
  const emailLower = email.toLowerCase()

  // Find valid OTP
  const otp = await c.env.DB.prepare(
    'SELECT id, expires_at FROM otp_codes WHERE email = ? AND code = ? AND used = 0 ORDER BY created_at DESC LIMIT 1'
  )
    .bind(emailLower, code)
    .first<{ id: string; expires_at: string }>()

  if (!otp) {
    return c.json({ error: 'Invalid or expired code' }, 400)
  }

  // Check expiry
  if (new Date(otp.expires_at) < new Date()) {
    return c.json({ error: 'Code has expired. Please request a new one.' }, 400)
  }

  // Check if user exists
  const existingUser = await c.env.DB.prepare(
    'SELECT id, email, name, avatar_url, last_login_at, created_at FROM auth_users WHERE email = ?'
  )
    .bind(emailLower)
    .first<{
      id: string
      email: string
      name: string
      avatar_url: string | null
      last_login_at: string
      created_at: string
    }>()

  if (existingUser) {
    // Mark OTP as used
    await c.env.DB.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?')
      .bind(otp.id)
      .run()

    // Update last login
    await c.env.DB.prepare(
      'UPDATE auth_users SET last_login_at = ? WHERE id = ?'
    )
      .bind(now, existingUser.id)
      .run()

    return c.json({
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        avatarUrl: existingUser.avatar_url,
        lastLoginAt: now,
        createdAt: existingUser.created_at,
      },
      status: 'authenticated',
    })
  }

  // New user — need a name. Don't mark OTP as used yet so it can be
  // re-verified with the name in a follow-up call (no second OTP needed)
  if (!name) {
    return c.json({ status: 'needs_name' })
  }

  // Mark OTP as used now that we have everything needed to create the user
  await c.env.DB.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?')
    .bind(otp.id)
    .run()

  // Create user
  const userId = generateId()
  await c.env.DB.prepare(
    'INSERT INTO auth_users (id, email, name, last_login_at, created_at) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(userId, emailLower, name, now, now)
    .run()

  const user = {
    id: userId,
    email: emailLower,
    name,
    avatarUrl: null,
    lastLoginAt: now,
    createdAt: now,
  }

  // Check if email domain matches any workspace
  const domain = getDomainFromEmail(emailLower)

  const matchingWorkspace = await c.env.DB.prepare(
    `SELECT id, name, slug FROM workspaces
     WHERE slug LIKE ? OR name LIKE ?
     LIMIT 1`
  )
    .bind(`%${domain.split('.')[0]}%`, `%${domain.split('.')[0]}%`)
    .first<{ id: string; name: string; slug: string }>()

  if (matchingWorkspace) {
    // Check if already a member
    const existingMember = await c.env.DB.prepare(
      'SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?'
    )
      .bind(matchingWorkspace.id, userId)
      .first()

    if (!existingMember) {
      // Check workspace setting for invitation requests
      const invSetting = await c.env.DB.prepare(
        "SELECT value FROM workspace_settings WHERE workspace_id = ? AND key = 'allow_invitation_requests'"
      )
        .bind(matchingWorkspace.id)
        .first<{ value: string }>()

      const allowInvitations = invSetting?.value !== 'false'

      // Check auto-join setting
      const autoJoinSetting = await c.env.DB.prepare(
        "SELECT value FROM workspace_settings WHERE workspace_id = ? AND key = 'auto_join'"
      )
        .bind(matchingWorkspace.id)
        .first<{ value: string }>()

      if (autoJoinSetting?.value === 'true') {
        // Auto-join the workspace
        const memberId = generateId()
        await c.env.DB.prepare(
          'INSERT INTO workspace_members (id, workspace_id, user_id, role, invited_by, joined_at) VALUES (?, ?, ?, ?, ?, ?)'
        )
          .bind(memberId, matchingWorkspace.id, userId, 'member', userId, now)
          .run()

        return c.json({
          user,
          status: 'joined',
          workspaceId: matchingWorkspace.id,
          workspaceName: matchingWorkspace.name,
        })
      }

      if (allowInvitations) {
        // Create invitation request
        const requestId = generateId()
        await c.env.DB.prepare(
          'INSERT INTO invitation_requests (id, email, name, workspace_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        )
          .bind(requestId, emailLower, name, matchingWorkspace.id, 'pending', now)
          .run()

        return c.json({
          user,
          status: 'pending_invitation',
          workspaceId: matchingWorkspace.id,
          workspaceName: matchingWorkspace.name,
        })
      }
    }
  }

  // No domain match or invitations disabled — create personal workspace
  const workspaceId = generateId()
  const workspaceName = name.split(' ')[0] + "'s Workspace"
  const workspaceSlug = domain.split('.')[0] + '-' + userId.slice(0, 8)

  await c.env.DB.prepare(
    'INSERT INTO workspaces (id, name, slug, plan, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(workspaceId, workspaceName, workspaceSlug, 'free', now, now)
    .run()

  const memberId = generateId()
  await c.env.DB.prepare(
    'INSERT INTO workspace_members (id, workspace_id, user_id, role, invited_by, joined_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(memberId, workspaceId, userId, 'owner', userId, now)
    .run()

  return c.json({
    user,
    status: 'workspace_created',
    workspaceId,
    workspaceName,
  }, 201)
})

// ── POST /api/auth/request-invitation ────────────────────────────────────────

const requestInvitationSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  workspaceId: z.string().min(1),
})

authRoutes.post(
  '/request-invitation',
  zValidator('json', requestInvitationSchema),
  async (c) => {
    const { email, name, workspaceId } = c.req.valid('json')
    const now = new Date().toISOString()

    // Check workspace exists
    const workspace = await c.env.DB.prepare(
      'SELECT id FROM workspaces WHERE id = ?'
    )
      .bind(workspaceId)
      .first()

    if (!workspace) {
      return c.json({ error: 'Workspace not found' }, 404)
    }

    // Check for existing pending request
    const existing = await c.env.DB.prepare(
      "SELECT id FROM invitation_requests WHERE email = ? AND workspace_id = ? AND status = 'pending'"
    )
      .bind(email.toLowerCase(), workspaceId)
      .first()

    if (existing) {
      return c.json({ success: true, message: 'Request already submitted' })
    }

    const id = generateId()
    await c.env.DB.prepare(
      'INSERT INTO invitation_requests (id, email, name, workspace_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(id, email.toLowerCase(), name, workspaceId, 'pending', now)
      .run()

    return c.json({ success: true })
  }
)

// ── GET /api/auth/me ─────────────────────────────────────────────────────────

authRoutes.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId')

  const user = await c.env.DB.prepare(
    'SELECT id, email, name, avatar_url, last_login_at, created_at, is_super_admin FROM auth_users WHERE id = ?'
  )
    .bind(userId)
    .first<{
      id: string
      email: string
      name: string
      avatar_url: string | null
      last_login_at: string
      created_at: string
      is_super_admin: number
    }>()

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  const { results: memberships } = await c.env.DB.prepare(
    `SELECT wm.id, wm.workspace_id, wm.role, wm.joined_at,
            w.name as workspace_name, w.slug as workspace_slug
     FROM workspace_members wm
     JOIN workspaces w ON w.id = wm.workspace_id
     WHERE wm.user_id = ?`
  )
    .bind(userId)
    .all<{
      id: string
      workspace_id: string
      role: string
      joined_at: string
      workspace_name: string
      workspace_slug: string
    }>()

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
      isSuperAdmin: user.is_super_admin === 1,
    },
    memberships: memberships.map((m) => ({
      id: m.id,
      workspaceId: m.workspace_id,
      role: m.role,
      joinedAt: m.joined_at,
      workspaceName: m.workspace_name,
      workspaceSlug: m.workspace_slug,
    })),
  })
})

// ── Invitation management (workspace-scoped) ─────────────────────────────────

// GET /api/auth/workspaces/:workspaceId/invitations
authRoutes.get(
  '/workspaces/:workspaceId/invitations',
  authMiddleware,
  workspaceMiddleware,
  requireRole('admin'),
  async (c) => {
    const workspaceId = c.get('workspaceId')

    const { results } = await c.env.DB.prepare(
      `SELECT id, email, name, status, created_at, reviewed_by, reviewed_at
       FROM invitation_requests
       WHERE workspace_id = ?
       ORDER BY created_at DESC`
    )
      .bind(workspaceId)
      .all<{
        id: string
        email: string
        name: string
        status: string
        created_at: string
        reviewed_by: string | null
        reviewed_at: string | null
      }>()

    return c.json({
      invitations: results.map((r) => ({
        id: r.id,
        email: r.email,
        name: r.name,
        status: r.status,
        createdAt: r.created_at,
        reviewedBy: r.reviewed_by,
        reviewedAt: r.reviewed_at,
      })),
    })
  }
)

// POST /api/auth/workspaces/:workspaceId/invitations/:requestId/approve
authRoutes.post(
  '/workspaces/:workspaceId/invitations/:requestId/approve',
  authMiddleware,
  workspaceMiddleware,
  requireRole('admin'),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const requestId = c.req.param('requestId')
    const now = new Date().toISOString()

    const request = await c.env.DB.prepare(
      "SELECT id, email, name FROM invitation_requests WHERE id = ? AND workspace_id = ? AND status = 'pending'"
    )
      .bind(requestId, workspaceId)
      .first<{ id: string; email: string; name: string }>()

    if (!request) {
      return c.json({ error: 'Invitation request not found or already processed' }, 404)
    }

    // Find or create the user
    let invitedUser = await c.env.DB.prepare(
      'SELECT id FROM auth_users WHERE email = ?'
    )
      .bind(request.email)
      .first<{ id: string }>()

    if (!invitedUser) {
      const newUserId = generateId()
      await c.env.DB.prepare(
        'INSERT INTO auth_users (id, email, name, created_at) VALUES (?, ?, ?, ?)'
      )
        .bind(newUserId, request.email, request.name, now)
        .run()
      invitedUser = { id: newUserId }
    }

    // Create workspace membership
    const memberId = generateId()
    await c.env.DB.prepare(
      'INSERT INTO workspace_members (id, workspace_id, user_id, role, invited_by, joined_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(memberId, workspaceId, invitedUser.id, 'member', userId, now)
      .run()

    // Update invitation request
    await c.env.DB.prepare(
      "UPDATE invitation_requests SET status = 'approved', reviewed_by = ?, reviewed_at = ? WHERE id = ?"
    )
      .bind(userId, now, requestId)
      .run()

    return c.json({ success: true })
  }
)

// POST /api/auth/workspaces/:workspaceId/invitations/:requestId/reject
authRoutes.post(
  '/workspaces/:workspaceId/invitations/:requestId/reject',
  authMiddleware,
  workspaceMiddleware,
  requireRole('admin'),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const requestId = c.req.param('requestId')
    const now = new Date().toISOString()

    const request = await c.env.DB.prepare(
      "SELECT id FROM invitation_requests WHERE id = ? AND workspace_id = ? AND status = 'pending'"
    )
      .bind(requestId, workspaceId)
      .first()

    if (!request) {
      return c.json({ error: 'Invitation request not found or already processed' }, 404)
    }

    await c.env.DB.prepare(
      "UPDATE invitation_requests SET status = 'rejected', reviewed_by = ?, reviewed_at = ? WHERE id = ?"
    )
      .bind(userId, now, requestId)
      .run()

    return c.json({ success: true })
  }
)

export { authRoutes }
