export type Bindings = {
  // Resource bindings
  DB: D1Database
  EVIDENCE_BUCKET: R2Bucket
  // Variables (set in wrangler.toml [vars])
  ENVIRONMENT: string
  ALLOWED_ORIGIN: string
  APP_URL: string
  // Secrets (set via `wrangler secret put` or .dev.vars)
  ANTHROPIC_API_KEY: string
  GEMINI_API_KEY: string
  // Token encryption key (32+ chars, set via `wrangler secret put ENCRYPTION_KEY`)
  ENCRYPTION_KEY: string
  // OAuth app credentials (global providers — set via wrangler secret put)
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  JIRA_CLIENT_ID: string
  JIRA_CLIENT_SECRET: string
  LINEAR_CLIENT_ID: string
  LINEAR_CLIENT_SECRET: string
}

export type Variables = {
  userId: string
  workspaceId: string
  memberRole: string
}

export type AppType = { Bindings: Bindings; Variables: Variables }
