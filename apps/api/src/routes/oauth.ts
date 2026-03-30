/**
 * Public OAuth callback route — mounted at /api/oauth
 * Handles the redirect back from external OAuth providers.
 * This route is intentionally public (no auth middleware) — security is via the state token.
 */
import { Hono } from 'hono'
import type { AppType } from '../types.js'
import { generateId } from '../lib/id.js'
import { encrypt } from '../lib/encrypt.js'
import {
  exchangeGitHub,
  exchangeGoogle,
  exchangeJira,
  exchangeLinear,
  getProvider,
} from '../lib/oauth-providers.js'

const oauthRoutes = new Hono<AppType>()

// Popup success/error HTML pages
function successPage(providerName: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Connected</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #09090b; color: #a1a1aa;
           display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { text-align: center; background: #18181b; border: 1px solid #27272a;
            border-radius: 12px; padding: 2rem 2.5rem; }
    .icon { font-size: 2.5rem; }
    h2 { color: #f4f4f5; margin: 0.5rem 0; }
    p { margin: 0; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h2>${providerName} Connected</h2>
    <p>This window will close automatically…</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage({ type: 'OAUTH_SUCCESS', provider: '${providerName}' }, '*');
    }
    setTimeout(() => window.close(), 1500);
  </script>
</body>
</html>`
}

function errorPage(message: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Connection Failed</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #09090b; color: #a1a1aa;
           display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { text-align: center; background: #18181b; border: 1px solid #27272a;
            border-radius: 12px; padding: 2rem 2.5rem; }
    .icon { font-size: 2.5rem; }
    h2 { color: #f4f4f5; margin: 0.5rem 0; }
    p { margin: 0; font-size: 0.875rem; color: #f87171; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✗</div>
    <h2>Connection Failed</h2>
    <p>${message}</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage({ type: 'OAUTH_ERROR', error: '${message}' }, '*');
    }
    setTimeout(() => window.close(), 3000);
  </script>
</body>
</html>`
}

// GET /api/oauth/callback — handles redirect from all OAuth providers
oauthRoutes.get('/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  const errorParam = c.req.query('error')

  if (errorParam) {
    return c.html(errorPage(`Provider returned error: ${errorParam}`))
  }

  if (!code || !state) {
    return c.html(errorPage('Missing code or state parameter'))
  }

  // Look up the state token
  const stateRow = await c.env.DB.prepare(
    'SELECT * FROM oauth_states WHERE id = ? AND used = 0'
  )
    .bind(state)
    .first<{
      id: string
      workspace_id: string
      provider: string
      created_by: string
      expires_at: string
    }>()

  if (!stateRow) {
    return c.html(errorPage('Invalid or expired state token'))
  }

  // Check expiry (state tokens expire in 10 minutes)
  if (new Date(stateRow.expires_at) < new Date()) {
    return c.html(errorPage('Authorization expired — please try again'))
  }

  // Mark state as used immediately to prevent replay
  await c.env.DB.prepare('UPDATE oauth_states SET used = 1 WHERE id = ?')
    .bind(state)
    .run()

  const { workspace_id: workspaceId, provider, created_by: userId } = stateRow
  const providerDef = getProvider(provider)
  if (!providerDef) {
    return c.html(errorPage(`Unknown provider: ${provider}`))
  }

  const apiBase = new URL(c.req.url).origin
  const redirectUri = `${apiBase}/api/oauth/callback`
  const encKey = c.env.ENCRYPTION_KEY ?? 'dev-encryption-key-change-me-32chars'

  try {
    // Exchange code for tokens
    let tokenRes: { access_token: string; refresh_token?: string; expires_in?: number; scope?: string }

    switch (provider) {
      case 'github':
        tokenRes = await exchangeGitHub(
          code,
          c.env.GITHUB_CLIENT_ID ?? '',
          c.env.GITHUB_CLIENT_SECRET ?? '',
          redirectUri
        )
        break
      case 'google_ws':
        tokenRes = await exchangeGoogle(
          code,
          c.env.GOOGLE_CLIENT_ID ?? '',
          c.env.GOOGLE_CLIENT_SECRET ?? '',
          redirectUri
        )
        break
      case 'jira':
        tokenRes = await exchangeJira(
          code,
          c.env.JIRA_CLIENT_ID ?? '',
          c.env.JIRA_CLIENT_SECRET ?? '',
          redirectUri
        )
        break
      case 'linear':
        tokenRes = await exchangeLinear(
          code,
          c.env.LINEAR_CLIENT_ID ?? '',
          c.env.LINEAR_CLIENT_SECRET ?? '',
          redirectUri
        )
        break
      default:
        return c.html(errorPage(`OAuth not supported for provider: ${provider}`))
    }

    if (!tokenRes.access_token) {
      return c.html(errorPage('No access token returned from provider'))
    }

    // Encrypt tokens
    const accessTokenEnc = await encrypt(tokenRes.access_token, encKey)
    const refreshTokenEnc = tokenRes.refresh_token
      ? await encrypt(tokenRes.refresh_token, encKey)
      : null

    const tokenExpiresAt = tokenRes.expires_in
      ? new Date(Date.now() + tokenRes.expires_in * 1000).toISOString()
      : null

    const now = new Date().toISOString()

    // Upsert integration record
    const existing = await c.env.DB.prepare(
      'SELECT id FROM integrations WHERE workspace_id = ? AND type = ?'
    )
      .bind(workspaceId, provider)
      .first<{ id: string }>()

    if (existing) {
      await c.env.DB.prepare(
        `UPDATE integrations
         SET status = 'connected', access_token_enc = ?, refresh_token_enc = ?,
             token_expires_at = ?, token_scope = ?, auth_type = 'oauth_global',
             updated_at = ?
         WHERE id = ?`
      )
        .bind(
          accessTokenEnc,
          refreshTokenEnc,
          tokenExpiresAt,
          tokenRes.scope ?? null,
          now,
          existing.id
        )
        .run()
    } else {
      const id = generateId()
      await c.env.DB.prepare(
        `INSERT INTO integrations
           (id, workspace_id, type, name, status, config, auth_type,
            access_token_enc, refresh_token_enc, token_expires_at, token_scope,
            sync_interval_minutes, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'connected', '{}', 'oauth_global', ?, ?, ?, ?, 60, ?, ?, ?)`
      )
        .bind(
          id,
          workspaceId,
          provider,
          providerDef.name,
          accessTokenEnc,
          refreshTokenEnc,
          tokenExpiresAt,
          tokenRes.scope ?? null,
          userId,
          now,
          now
        )
        .run()
    }

    return c.html(successPage(providerDef.name))
  } catch (err) {
    console.error('OAuth callback error:', err)
    return c.html(errorPage('Failed to exchange authorization code'))
  }
})

export { oauthRoutes }
