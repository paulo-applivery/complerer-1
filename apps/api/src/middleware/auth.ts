import { createMiddleware } from 'hono/factory'
import type { AppType } from '../types.js'

/**
 * Auth middleware — placeholder that reads X-User-Id header.
 * Will be replaced with CF Access JWT validation later.
 */
export const authMiddleware = createMiddleware<AppType>(async (c, next) => {
  const userId = c.req.header('X-User-Id')

  if (!userId) {
    return c.json({ error: 'Unauthorized: missing X-User-Id header' }, 401)
  }

  c.set('userId', userId)
  await next()
})
