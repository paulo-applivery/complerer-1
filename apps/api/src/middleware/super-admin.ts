import { createMiddleware } from 'hono/factory'
import type { AppType } from '../types.js'

export const superAdminMiddleware = createMiddleware<AppType>(async (c, next) => {
  const userId = c.req.header('X-User-Id')
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const user = await c.env.DB.prepare(
    'SELECT is_super_admin FROM auth_users WHERE id = ?'
  ).bind(userId).first<{ is_super_admin: number }>()

  if (!user || user.is_super_admin !== 1) {
    return c.json({ error: 'Forbidden: super admin access required' }, 403)
  }

  c.set('userId', userId)
  await next()
})
