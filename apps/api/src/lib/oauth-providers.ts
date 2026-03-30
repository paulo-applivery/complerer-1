/**
 * OAuth provider definitions and helper builders.
 *
 * Auth types:
 *  - oauth_global   → Complerer registers one OAuth app; all workspaces connect through it
 *  - oauth_custom   → Each workspace provides their own OAuth app credentials (e.g. Okta)
 *  - api_key        → Static credentials (API key / secret pair)
 */

export type AuthType = 'oauth_global' | 'oauth_custom' | 'api_key'

export interface ProviderDef {
  type: string
  name: string
  category: string
  description: string
  icon: string
  authType: AuthType
  /** Only for oauth_global — scopes to request */
  scopes?: string[]
  /** Fields to collect from the user (api_key / oauth_custom providers) */
  fields?: ProviderField[]
}

export interface ProviderField {
  key: string
  label: string
  placeholder?: string
  type?: 'text' | 'password' | 'url'
  required?: boolean
  help?: string
}

export const PROVIDERS: ProviderDef[] = [
  // ─── Global OAuth (Complerer manages the app) ───────────────────────
  {
    type: 'github',
    name: 'GitHub',
    category: 'devops',
    description: 'Source code, repositories & CI/CD access logs',
    icon: 'github',
    authType: 'oauth_global',
    scopes: ['read:org', 'read:user', 'repo'],
  },
  {
    type: 'google_ws',
    name: 'Google Workspace',
    category: 'identity',
    description: 'Google identity, directory & audit logs',
    icon: 'google',
    authType: 'oauth_global',
    scopes: [
      'https://www.googleapis.com/auth/admin.directory.user.readonly',
      'https://www.googleapis.com/auth/admin.reports.audit.readonly',
      'openid',
      'email',
      'profile',
    ],
  },
  {
    type: 'jira',
    name: 'Jira',
    category: 'ticketing',
    description: 'Issue tracking & change management evidence',
    icon: 'jira',
    authType: 'oauth_global',
    scopes: ['read:jira-work', 'read:jira-user', 'offline_access'],
  },
  {
    type: 'linear',
    name: 'Linear',
    category: 'ticketing',
    description: 'Project & issue tracking',
    icon: 'linear',
    authType: 'oauth_global',
    scopes: ['read'],
  },

  // ─── Custom OAuth (workspace provides own credentials) ───────────────
  {
    type: 'azure_ad',
    name: 'Azure AD / Entra ID',
    category: 'identity',
    description: 'Microsoft identity platform & access management',
    icon: 'microsoft',
    authType: 'oauth_custom',
    fields: [
      { key: 'tenant_id', label: 'Tenant ID', placeholder: 'Azure tenant ID (GUID)', required: true },
      { key: 'client_id', label: 'Client ID (App ID)', placeholder: 'Application client ID', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', required: true },
    ],
  },

  // ─── API Key ─────────────────────────────────────────────────────────
  {
    type: 'cloudflare',
    name: 'Cloudflare',
    category: 'cloud',
    description: 'Cloudflare infrastructure, account members, Workers & audit logs',
    icon: 'cloudflare',
    authType: 'api_key',
    fields: [
      { key: 'api_token', label: 'API Token', type: 'password', required: true,
        help: 'Create a token at dash.cloudflare.com/profile/api-tokens with Account Read + Audit Logs Read permissions' },
      { key: 'account_id', label: 'Account ID', placeholder: 'e.g. a1b2c3d4e5f6…', required: true,
        help: 'Found in the right sidebar of any zone overview page in your Cloudflare dashboard' },
    ],
  },
  {
    type: 'okta',
    name: 'Okta',
    category: 'identity',
    description: 'Identity & access management — users, MFA status & audit logs',
    icon: 'okta',
    authType: 'api_key',
    fields: [
      { key: 'domain', label: 'Okta Domain', placeholder: 'yourcompany.okta.com', type: 'url', required: true,
        help: 'Your Okta organization URL (without https://)' },
      { key: 'api_token', label: 'API Token (SSWS)', type: 'password', required: true,
        help: 'Create at Security → API → Tokens in your Okta Admin Console' },
    ],
  },
  {
    type: 'aws',
    name: 'AWS',
    category: 'cloud',
    description: 'Amazon Web Services — IAM users, MFA status & CloudTrail audit logs',
    icon: 'aws',
    authType: 'api_key',
    fields: [
      { key: 'access_key_id', label: 'Access Key ID', placeholder: 'AKIA…', required: true,
        help: 'Create an IAM user with ReadOnlyAccess + CloudTrail:LookupEvents permissions' },
      { key: 'secret_access_key', label: 'Secret Access Key', type: 'password', required: true },
      { key: 'region', label: 'Default Region', placeholder: 'us-east-1', required: false,
        help: 'Primary AWS region for CloudTrail and IAM lookups' },
    ],
  },
  {
    type: 'applivery',
    name: 'Applivery',
    category: 'mdm',
    description: 'Mobile device management & UEM compliance',
    icon: 'applivery',
    authType: 'api_key',
    fields: [
      { key: 'api_token', label: 'API Token', type: 'password', required: true,
        help: 'Find your token in Applivery Settings → Integrations → API Tokens' },
    ],
  },
]

export function getProvider(type: string): ProviderDef | undefined {
  return PROVIDERS.find((p) => p.type === type)
}

// ── OAuth Authorization URL builders ──────────────────────────────────────────

interface OAuthURLParams {
  clientId: string
  redirectUri: string
  state: string
  scopes: string[]
  extras?: Record<string, string>
}

export function buildGitHubURL({ clientId, redirectUri, state, scopes }: OAuthURLParams): string {
  const url = new URL('https://github.com/login/oauth/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', state)
  url.searchParams.set('scope', scopes.join(' '))
  return url.toString()
}

export function buildGoogleURL({ clientId, redirectUri, state, scopes }: OAuthURLParams): string {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', state)
  url.searchParams.set('scope', scopes.join(' '))
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')
  return url.toString()
}

export function buildJiraURL({ clientId, redirectUri, state, scopes }: OAuthURLParams): string {
  const url = new URL('https://auth.atlassian.com/authorize')
  url.searchParams.set('audience', 'api.atlassian.com')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', state)
  url.searchParams.set('scope', scopes.join(' '))
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('prompt', 'consent')
  return url.toString()
}

export function buildLinearURL({ clientId, redirectUri, state, scopes }: OAuthURLParams): string {
  const url = new URL('https://linear.app/oauth/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', state)
  url.searchParams.set('scope', scopes.join(','))
  url.searchParams.set('response_type', 'code')
  return url.toString()
}

// ── Token exchange ─────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  token_type?: string
}

export async function exchangeGitHub(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<TokenResponse> {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }),
  })
  if (!res.ok) throw new Error('GitHub token exchange failed')
  return res.json() as Promise<TokenResponse>
}

export async function exchangeGoogle(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) throw new Error('Google token exchange failed')
  return res.json() as Promise<TokenResponse>
}

export async function exchangeJira(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<TokenResponse> {
  const res = await fetch('https://auth.atlassian.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  })
  if (!res.ok) throw new Error('Jira token exchange failed')
  return res.json() as Promise<TokenResponse>
}

export async function exchangeLinear(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })
  const res = await fetch('https://api.linear.app/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) throw new Error('Linear token exchange failed')
  return res.json() as Promise<TokenResponse>
}
