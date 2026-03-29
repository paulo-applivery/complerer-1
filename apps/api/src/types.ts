export type Bindings = {
  // Resource bindings
  DB: D1Database
  EVIDENCE_BUCKET: R2Bucket
  // Variables (set in wrangler.toml [vars])
  ENVIRONMENT: string
  ALLOWED_ORIGIN: string
  // Secrets (set via `wrangler secret put` or .dev.vars)
  ANTHROPIC_API_KEY: string
  GEMINI_API_KEY: string
}

export type Variables = {
  userId: string
  workspaceId: string
  memberRole: string
}

export type AppType = { Bindings: Bindings; Variables: Variables }
