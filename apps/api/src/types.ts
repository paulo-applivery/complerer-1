export type Bindings = {
  DB: D1Database
  EVIDENCE_BUCKET: R2Bucket
  ENVIRONMENT: string
  ANTHROPIC_API_KEY: string
  GEMINI_API_KEY: string
}

export type Variables = {
  userId: string
  workspaceId: string
  memberRole: string
}

export type AppType = { Bindings: Bindings; Variables: Variables }
