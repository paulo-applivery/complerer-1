import { createMiddleware } from 'hono/factory'
import type { AppType } from '../types.js'

const ROLE_HIERARCHY: Record<string, number> = {
  owner: 4,
  admin: 3,
  auditor: 2,
  member: 1,
  viewer: 0,
}

/**
 * Workspace middleware — extracts :workspaceId from URL params,
 * verifies the current user is a member, and sets workspaceId + memberRole.
 */
export const workspaceMiddleware = createMiddleware<AppType>(async (c, next) => {
  const workspaceId = c.req.param('workspaceId')
  const userId = c.get('userId')

  if (!workspaceId) {
    return c.json({ error: 'Missing workspaceId parameter' }, 400)
  }

  const member = await c.env.DB.prepare(
    'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?'
  )
    .bind(workspaceId, userId)
    .first<{ role: string }>()

  if (!member) {
    return c.json({ error: 'Forbidden: not a workspace member' }, 403)
  }

  c.set('workspaceId', workspaceId)
  c.set('memberRole', member.role)
  await next()
})

/**
 * Middleware factory that checks the user's role against a minimum required role.
 */
export function requireRole(minRole: string) {
  return createMiddleware<AppType>(async (c, next) => {
    const memberRole = c.get('memberRole')
    const userLevel = ROLE_HIERARCHY[memberRole] ?? -1
    const requiredLevel = ROLE_HIERARCHY[minRole] ?? 999

    if (userLevel < requiredLevel) {
      return c.json(
        { error: `Forbidden: requires ${minRole} role or higher` },
        403
      )
    }

    await next()
  })
}
