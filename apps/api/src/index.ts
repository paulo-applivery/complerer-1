import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { AppType } from './types.js'
import { authRoutes } from './routes/auth.js'
import { workspaceRoutes } from './routes/workspaces.js'
import { frameworkRoutes } from './routes/frameworks.js'
import { complianceRoutes } from './routes/compliance.js'
import { chatRoutes } from './routes/chat.js'
import { integrationRoutes } from './routes/integrations.js'
import { oauthRoutes } from './routes/oauth.js'
import { seedRoutes } from './routes/seed.js'
import { communityRoutes, publicTrustRoutes, seedPlaybooksRoutes } from './routes/community.js'
import { adminRoutes } from './routes/admin.js'
import { projectRoutes } from './routes/projects.js'
import { createReportsAPI } from '@complerer/reports/api'

const app = new Hono<AppType>()

// CORS middleware — uses ALLOWED_ORIGIN from env vars
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      if (c.env.ENVIRONMENT === 'development') {
        return origin // allow all in dev
      }
      const allowed = c.env.ALLOWED_ORIGIN
      if (allowed && origin === allowed) {
        return origin
      }
      return undefined
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
    maxAge: 86400,
  })
)

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Route groups
app.route('/api/auth', authRoutes)
app.route('/api/workspaces', workspaceRoutes)
app.route('/api/workspaces/:workspaceId', frameworkRoutes)
app.route('/api/workspaces/:workspaceId', complianceRoutes)
app.route('/api/workspaces/:workspaceId/chat', chatRoutes)
app.route('/api/workspaces/:workspaceId/integrations', integrationRoutes)
app.route('/api/oauth', oauthRoutes)
app.route('/api/workspaces/:workspaceId', projectRoutes)
app.route('/api/workspaces/:workspaceId', communityRoutes)
app.route('/api/trust', publicTrustRoutes)
app.route('/api/seed', seedRoutes)
app.route('/api/seed', seedPlaybooksRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/workspaces/:workspaceId/reports', createReportsAPI())

// Accept invitation lives under /api/workspaces but uses a different path pattern
// It's already handled inside workspaceRoutes as /invitations/:invitationId/accept

export default app
