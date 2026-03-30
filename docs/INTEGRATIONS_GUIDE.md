# Integrations Guide

> **For AI assistants**: This is the authoritative reference for building new integrations. Read this entire file before implementing a new provider.

## Architecture Overview

```
platform_providers (DB)         — Provider registry. Admin enables/disables.
platform_provider_configs (DB)  — Key/value credentials. Secrets stored masked.
integrations (DB)               — Per-workspace connection state + encrypted tokens.
oauth_states (DB)               — CSRF tokens for OAuth popup flow.
anomalies (DB)                  — Detected compliance issues from sync.
evidence (DB)                   — Compliance proof artifacts created by sync.
```

```
apps/api/src/lib/
  oauth-providers.ts    — Provider definitions (catalog, fields, OAuth URL builders)
  provider-config.ts    — Slug mapping + DB config reader
  sync-providers.ts     — Real sync implementations (Cloudflare, Okta, AWS, …)
  encrypt.ts            — AES-GCM 256-bit token encryption

apps/api/src/routes/
  integrations.ts       — REST API (catalog, connect, sync, anomalies)
  oauth.ts              — Public OAuth callback handler

packages/db/src/migrations/
  0026_create_integrations.sql
  0058_oauth_tokens.sql
  0059_seed_integration_providers.sql
  0060_add_cloudflare_provider.sql

apps/web/src/pages/integrations.tsx   — Integrations UI
apps/web/src/hooks/use-integrations.ts
```

---

## Auth Types

| Type | When to use | Examples |
|------|-------------|---------|
| `oauth_global` | Provider supports OAuth; Complerer registers one app for all customers | GitHub, Google Workspace, Jira, Linear |
| `oauth_custom` | Each workspace brings their own OAuth app credentials | Azure AD |
| `api_key` | API token / key + secret pair | Cloudflare, Okta (SSWS), AWS, Applivery |

---

## Current Providers

| Type | Name | Auth | Category | Sync implemented |
|------|------|------|----------|-----------------|
| `github` | GitHub | oauth_global | devops | ✗ (OAuth only) |
| `google_ws` | Google Workspace | oauth_global | identity | ✗ (OAuth only) |
| `jira` | Jira | oauth_global | ticketing | ✗ (OAuth only) |
| `linear` | Linear | oauth_global | ticketing | ✗ (OAuth only) |
| `azure_ad` | Azure AD | oauth_custom | identity | ✗ |
| `cloudflare` | Cloudflare | api_key | cloud | ✓ members, audit logs, MFA anomalies |
| `okta` | Okta | api_key | identity | ✓ users, MFA check, system log |
| `aws` | AWS | api_key | cloud | ✓ IAM users, MFA check, CloudTrail |
| `applivery` | Applivery | api_key | mdm | ✗ |

---

## How to Add a New Integration

### Step 1 — Define the provider (`oauth-providers.ts`)

Add an entry to the `PROVIDERS` array in `apps/api/src/lib/oauth-providers.ts`:

```ts
{
  type: 'datadog',              // snake_case, unique key — used in DB and URL params
  name: 'Datadog',              // display name
  category: 'monitoring',       // identity | cloud | devops | ticketing | mdm | monitoring | …
  description: 'Infrastructure monitoring & security signals',
  icon: 'datadog',              // used by frontend for logo lookup
  authType: 'api_key',          // oauth_global | oauth_custom | api_key
  fields: [
    { key: 'api_key', label: 'API Key', type: 'password', required: true,
      help: 'Find at app.datadoghq.com → Organization Settings → API Keys' },
    { key: 'app_key', label: 'Application Key', type: 'password', required: true },
    { key: 'site', label: 'Site', placeholder: 'datadoghq.com', required: false,
      help: 'Use datadoghq.eu for EU customers' },
  ],
},
```

**Auth type rules:**
- `oauth_global` → also add OAuth URL builder in `buildXxxURL()` and token exchanger in `exchangeXxx()`
- `oauth_custom` → fields must include `client_id`, `client_secret`, plus any domain/tenant fields
- `api_key` → fields are whatever credentials the API needs; mark secret fields with `type: 'password'`

**Field types:**
- `text` (default) — stored in `integrations.config` JSON (plaintext, non-sensitive)
- `password` — stored encrypted in `integrations.access_token_enc`
- `url` — treated as `text`

---

### Step 2 — Add slug mapping (`provider-config.ts`)

Add the provider to the `TYPE_TO_SLUG` map in `apps/api/src/lib/provider-config.ts`:

```ts
const TYPE_TO_SLUG: Record<string, string> = {
  // …existing entries…
  datadog: 'datadog',   // type → platform_providers.slug
}
```

The slug must match the value in `platform_providers.slug` in the DB.

---

### Step 3 — Write the sync worker (`sync-providers.ts`)

Add a `syncDatadog` function in `apps/api/src/lib/sync-providers.ts` and register it in the `runSync` switch:

```ts
async function syncDatadog(ctx: SyncContext): Promise<SyncResult> {
  // 1. Read credentials
  const apiKey = await getDecrypted(ctx, 'api_key')
  const appKey = await getDecrypted(ctx, 'app_key')
  const site = ctx.credentials['site'] || 'datadoghq.com'

  if (!apiKey || !appKey) {
    return { recordsPulled: 0, recordsCreated: 0, recordsUpdated: 0, anomaliesDetected: 0,
             error: 'Missing api_key or app_key' }
  }

  let pulled = 0, created = 0, updated = 0, anomalies = 0
  const headers = { 'DD-API-KEY': apiKey, 'DD-APPLICATION-KEY': appKey }

  // 2. Fetch data from provider API
  const usersRes = await fetch(`https://api.${site}/api/v2/users`, { headers })
  if (usersRes.ok) {
    const data = await usersRes.json() as { data: unknown[] }
    pulled += data.data.length

    // 3. Create evidence entry
    const ev = await upsertEvidence(
      ctx.db, ctx.workspaceId,
      'Datadog Users',
      `${data.data.length} users found in Datadog.`,
      'integration:datadog'
    )
    ev.created ? created++ : updated++

    // 4. Detect anomalies
    // e.g. users without MFA → upsertAnomaly(...)
  }

  return { recordsPulled: pulled, recordsCreated: created, recordsUpdated: updated, anomaliesDetected: anomalies }
}

// In runSync() switch:
case 'datadog': return await syncDatadog(ctx)
```

**Helper functions available:**

```ts
// Decrypt an encrypted credential field
const value = await getDecrypted(ctx, 'field_key')

// Read a plaintext config field (domain, region, account_id, etc.)
const value = ctx.credentials['field_key'] ?? ''

// Upsert an evidence entry (creates or updates by title+source)
const { created } = await upsertEvidence(db, workspaceId, title, description, 'integration:datadog')

// Create an anomaly if it doesn't already exist (open)
const { created } = await upsertAnomaly(db, workspaceId, integrationId,
  'type_slug',        // snake_case type for grouping
  'high',             // low | medium | high | critical
  'Short title',
  'Detailed description for the compliance team'
)
```

**Sync result shape:**
```ts
return {
  recordsPulled: number,      // total records fetched from external API
  recordsCreated: number,     // new evidence/records written to DB
  recordsUpdated: number,     // existing records updated
  anomaliesDetected: number,  // new anomalies created
  error?: string              // set if sync failed; saved to sync log
}
```

---

### Step 4 — DB migration

Create `packages/db/src/migrations/006N_add_datadog_provider.sql`:

```sql
-- Add Datadog integration provider
INSERT OR IGNORE INTO platform_providers (id, category, slug, name, description, enabled, created_at, updated_at)
VALUES ('prov_datadog', 'integration', 'datadog', 'Datadog',
        'Infrastructure monitoring & security signals', 0, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO platform_provider_configs (id, provider_id, key, value, is_secret, created_at, updated_at) VALUES
  ('cfg_dd_api',   'prov_datadog', 'api_key', '', 1, datetime('now'), datetime('now')),
  ('cfg_dd_app',   'prov_datadog', 'app_key', '', 1, datetime('now'), datetime('now')),
  ('cfg_dd_site',  'prov_datadog', 'site',    'datadoghq.com', 0, datetime('now'), datetime('now'));
```

**Rules:**
- `id` must be globally unique (prefix `prov_` for providers, `cfg_` for configs)
- `slug` must match `TYPE_TO_SLUG` in `provider-config.ts`
- `is_secret = 1` for any password/key fields (masked in admin UI responses)
- Start with `enabled = 0`; admin enables it after filling in credentials

Run the migration:
```bash
cd apps/api
# Local
node_modules/.bin/wrangler d1 execute complerer-db --local \
  --file=../../packages/db/src/migrations/006N_add_datadog_provider.sql

# Remote
node_modules/.bin/wrangler d1 execute complerer-db --remote --env production \
  --file=../../packages/db/src/migrations/006N_add_datadog_provider.sql
```

---

### Step 5 — Update the admin hints (optional)

In `apps/web/src/pages/admin/providers.tsx`, add a setup link to `INTEGRATION_HINTS`:

```ts
const INTEGRATION_HINTS: Record<string, string> = {
  // …existing…
  datadog: 'Create API + App keys at app.datadoghq.com → Organization Settings → API Keys',
}
```

---

### Step 6 — Deploy

```bash
# Typecheck
cd apps/api && npx tsc --noEmit

# Deploy API
node_modules/.bin/wrangler deploy --env production

# Deploy web (MUST run from apps/web)
cd ../web && pnpm run deploy
```

---

## OAuth Global — Additional Steps

For `oauth_global` providers (GitHub, Google, Jira, Linear), there are two extra things:

### A. Add URL builder

In `oauth-providers.ts`, add a `buildXxxURL()` function:
```ts
export function buildDatadogURL({ clientId, redirectUri, state, scopes }: OAuthURLParams): string {
  const url = new URL('https://app.datadoghq.com/oauth2/v1/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', state)
  url.searchParams.set('scope', scopes.join(' '))
  url.searchParams.set('response_type', 'code')
  return url.toString()
}
```

### B. Add token exchange

Add `exchangeDatadog()` function in `oauth-providers.ts`, then wire it into:
- `integrations.ts` → OAuth init `switch` (to build the auth URL)
- `oauth.ts` → callback `switch` (to exchange the code for tokens)

### C. Seed provider-level credentials (not workspace)

OAuth global credentials (`client_id`, `client_secret`) are NOT stored per-workspace. They are configured by the super admin at `/admin/providers`. The DB seeding is the same as Step 4.

---

## Security Rules

1. **Never store credentials in plaintext** — `password` fields must be encrypted
2. **Never return token columns in API responses** — SELECT must exclude `access_token_enc` and `refresh_token_enc`
3. **Admin-only** — All integration connect/disconnect/sync routes require `requireRole('admin')`
4. **Provider config readable only server-side** — `getProviderConfigs()` is only called from Worker code, never exposed to frontend
5. **OAuth state tokens** expire in 10 minutes and are single-use

---

## Anomaly Types Reference

Use consistent `type` slugs so anomalies can be grouped across providers:

| Type slug | Meaning |
|-----------|---------|
| `mfa_not_enabled` | User/account has MFA disabled |
| `mfa_not_enrolled` | User has no MFA factors enrolled |
| `privileged_access` | User has unexpected admin/privileged role |
| `inactive_user_access` | Inactive/terminated user still has active access |
| `public_exposure` | Resource is publicly accessible |
| `unencrypted_storage` | Storage bucket/volume is unencrypted |
| `missing_audit_log` | Audit logging not enabled for a resource |
| `policy_violation` | Generic policy rule broken |
