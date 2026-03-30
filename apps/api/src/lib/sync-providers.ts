/**
 * Real sync implementations for each integration provider.
 *
 * Each provider fetches live data from the external API, writes evidence entries
 * to the workspace, and creates anomalies for compliance issues detected.
 *
 * ─── Adding a new provider ────────────────────────────────────────────────────
 * 1. Add the provider definition to `apps/api/src/lib/oauth-providers.ts`
 * 2. Add the slug mapping to `apps/api/src/lib/provider-config.ts`
 * 3. Implement a `sync<ProviderName>` function in this file following the pattern below
 * 4. Add a `case '<type>':` entry in the `runSync` switch statement
 * 5. Add a DB migration to seed the provider into `platform_providers` and its
 *    config placeholder rows into `platform_provider_configs`
 * 6. Update the README Integration guide section
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { D1Database } from '@cloudflare/workers-types'
import { generateId } from './id.js'
import { decrypt } from './encrypt.js'

// ── Shared types ──────────────────────────────────────────────────────────────

export interface SyncResult {
  recordsPulled: number
  recordsCreated: number
  recordsUpdated: number
  anomaliesDetected: number
  error?: string
}

interface SyncContext {
  db: D1Database
  workspaceId: string
  integrationId: string
  encryptionKey: string
  /** Raw credentials map (values may be encrypted) */
  credentials: Record<string, string>
}

async function getDecrypted(ctx: SyncContext, key: string): Promise<string> {
  const raw = ctx.credentials[key] ?? ''
  if (!raw) return ''
  try {
    return await decrypt(raw, ctx.encryptionKey)
  } catch {
    return raw // not encrypted (legacy plain text)
  }
}

// ── Evidence helpers ──────────────────────────────────────────────────────────

async function upsertEvidence(
  db: D1Database,
  workspaceId: string,
  title: string,
  description: string,
  source: string
): Promise<{ created: boolean }> {
  const existing = await db
    .prepare('SELECT id FROM evidence WHERE workspace_id = ? AND title = ? AND source = ?')
    .bind(workspaceId, title, source)
    .first<{ id: string }>()

  const now = new Date().toISOString()

  if (existing) {
    await db
      .prepare('UPDATE evidence SET description = ?, updated_at = ? WHERE id = ?')
      .bind(description, now, existing.id)
      .run()
    return { created: false }
  }

  await db
    .prepare(
      `INSERT INTO evidence (id, workspace_id, title, description, source, captured_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(generateId(), workspaceId, title, description, source, now, now, now)
    .run()
  return { created: true }
}

async function upsertAnomaly(
  db: D1Database,
  workspaceId: string,
  integrationId: string,
  type: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  title: string,
  detail: string
): Promise<{ created: boolean }> {
  const existing = await db
    .prepare(
      `SELECT id, status FROM anomalies
       WHERE workspace_id = ? AND integration_id = ? AND type = ? AND title = ? AND status = 'open'`
    )
    .bind(workspaceId, integrationId, type, title)
    .first<{ id: string; status: string }>()

  if (existing) return { created: false }

  await db
    .prepare(
      `INSERT INTO anomalies (id, workspace_id, integration_id, type, severity, title, detail, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?)`
    )
    .bind(generateId(), workspaceId, integrationId, type, severity, title, detail, new Date().toISOString())
    .run()
  return { created: true }
}

// ── Cloudflare ────────────────────────────────────────────────────────────────

async function syncCloudflare(ctx: SyncContext): Promise<SyncResult> {
  const apiToken = await getDecrypted(ctx, 'api_token')
  const accountId = ctx.credentials['account_id'] ?? ''

  if (!apiToken || !accountId) {
    return { recordsPulled: 0, recordsCreated: 0, recordsUpdated: 0, anomaliesDetected: 0, error: 'Missing api_token or account_id' }
  }

  const headers = { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' }
  let pulled = 0, created = 0, updated = 0, anomalies = 0

  // ── 1. Account members + 2FA status ─────────────────────────────────
  const membersRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/members?per_page=100`,
    { headers }
  )
  if (membersRes.ok) {
    const membersData = await membersRes.json() as {
      result: Array<{ user: { email: string; two_factor_authentication_enabled: boolean }; roles: Array<{ name: string }> }>
    }
    const members = membersData.result ?? []
    pulled += members.length

    const noMfa = members.filter((m) => !m.user?.two_factor_authentication_enabled)

    // Evidence: member list
    const memberTable = members
      .map((m) => `- ${m.user.email} (${m.roles.map((r) => r.name).join(', ')}) — 2FA: ${m.user.two_factor_authentication_enabled ? '✓' : '✗'}`)
      .join('\n')

    const ev = await upsertEvidence(
      ctx.db, ctx.workspaceId,
      'Cloudflare Account Members',
      `Account member list pulled from Cloudflare API.\n\n${memberTable}`,
      'integration:cloudflare'
    )
    ev.created ? created++ : updated++

    // Anomalies: members without 2FA
    for (const m of noMfa) {
      const a = await upsertAnomaly(
        ctx.db, ctx.workspaceId, ctx.integrationId,
        'mfa_not_enabled', 'high',
        `Cloudflare member without 2FA: ${m.user.email}`,
        `Account member ${m.user.email} does not have two-factor authentication enabled on their Cloudflare account.`
      )
      if (a.created) anomalies++
    }
  }

  // ── 2. Audit log ────────────────────────────────────────────────────
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const auditRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/audit_logs?since=${since}&per_page=50`,
    { headers }
  )
  if (auditRes.ok) {
    const auditData = await auditRes.json() as { result: unknown[] }
    const logs = auditData.result ?? []
    pulled += logs.length

    const ev = await upsertEvidence(
      ctx.db, ctx.workspaceId,
      'Cloudflare Audit Logs (Last 7 Days)',
      `${logs.length} audit log entries retrieved from Cloudflare for the past 7 days.`,
      'integration:cloudflare'
    )
    ev.created ? created++ : updated++
  }

  return { recordsPulled: pulled, recordsCreated: created, recordsUpdated: updated, anomaliesDetected: anomalies }
}

// ── Okta ──────────────────────────────────────────────────────────────────────

async function syncOkta(ctx: SyncContext): Promise<SyncResult> {
  const domain = (ctx.credentials['domain'] ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '')
  const apiToken = await getDecrypted(ctx, 'api_token')

  if (!domain || !apiToken) {
    return { recordsPulled: 0, recordsCreated: 0, recordsUpdated: 0, anomaliesDetected: 0, error: 'Missing domain or api_token' }
  }

  const base = `https://${domain}`
  const headers = { Authorization: `SSWS ${apiToken}`, Accept: 'application/json' }
  let pulled = 0, created = 0, updated = 0, anomalies = 0

  // ── 1. Users + MFA factor status ─────────────────────────────────────
  const usersRes = await fetch(`${base}/api/v1/users?limit=200&filter=status+eq+"ACTIVE"`, { headers })
  if (usersRes.ok) {
    const users = await usersRes.json() as Array<{
      id: string
      profile: { login: string; firstName: string; lastName: string; email: string }
      status: string
    }>
    pulled += users.length

    const userRows: string[] = []
    const noMfaUsers: string[] = []

    // Check MFA factors for each user (batched via Promise.all, capped at 50)
    const sample = users.slice(0, 50)
    await Promise.all(
      sample.map(async (user) => {
        const factorsRes = await fetch(`${base}/api/v1/users/${user.id}/factors`, { headers })
        const factors = factorsRes.ok ? await factorsRes.json() as unknown[] : []
        const hasMfa = factors.length > 0
        if (!hasMfa) noMfaUsers.push(user.profile.login)
        userRows.push(`- ${user.profile.firstName} ${user.profile.lastName} <${user.profile.login}> — MFA: ${hasMfa ? '✓' : '✗'}`)
      })
    )

    const ev = await upsertEvidence(
      ctx.db, ctx.workspaceId,
      'Okta Active Users',
      `${users.length} active users in Okta.\n\n${userRows.join('\n')}`,
      'integration:okta'
    )
    ev.created ? created++ : updated++

    // Anomalies: active users without MFA
    for (const login of noMfaUsers) {
      const a = await upsertAnomaly(
        ctx.db, ctx.workspaceId, ctx.integrationId,
        'mfa_not_enrolled', 'high',
        `Okta user without MFA: ${login}`,
        `Active Okta user ${login} has no MFA factors enrolled.`
      )
      if (a.created) anomalies++
    }
  }

  // ── 2. System log (last 24h) ─────────────────────────────────────────
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const logRes = await fetch(`${base}/api/v1/logs?since=${since}&limit=100`, { headers })
  if (logRes.ok) {
    const logs = await logRes.json() as unknown[]
    pulled += logs.length

    const ev = await upsertEvidence(
      ctx.db, ctx.workspaceId,
      'Okta System Log (Last 24h)',
      `${logs.length} system log events retrieved from Okta in the past 24 hours.`,
      'integration:okta'
    )
    ev.created ? created++ : updated++
  }

  return { recordsPulled: pulled, recordsCreated: created, recordsUpdated: updated, anomaliesDetected: anomalies }
}

// ── AWS ───────────────────────────────────────────────────────────────────────

/**
 * AWS Signature v4 — implemented with the Web Crypto API (no external deps).
 */
async function awsSig4(
  method: string,
  service: string,
  region: string,
  host: string,
  path: string,
  query: string,
  body: string,
  accessKeyId: string,
  secretAccessKey: string
): Promise<Record<string, string>> {
  const now = new Date()
  const dateStr = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z'
  const dateShort = dateStr.slice(0, 8)

  const payloadHash = Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body)))
  ).map((b) => b.toString(16).padStart(2, '0')).join('')

  const canonicalHeaders = `host:${host}\nx-amz-date:${dateStr}\n`
  const signedHeaders = 'host;x-amz-date'
  const canonicalRequest = [method, path, query, canonicalHeaders, signedHeaders, payloadHash].join('\n')

  const credentialScope = `${dateShort}/${region}/${service}/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    dateStr,
    credentialScope,
    Array.from(
      new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest)))
    ).map((b) => b.toString(16).padStart(2, '0')).join(''),
  ].join('\n')

  async function hmac(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
    const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    return crypto.subtle.sign('HMAC', k, new TextEncoder().encode(data))
  }

  const signingKey = await hmac(
    await hmac(
      await hmac(
        await hmac(new TextEncoder().encode(`AWS4${secretAccessKey}`).buffer as ArrayBuffer, dateShort),
        region
      ),
      service
    ),
    'aws4_request'
  )

  const signature = Array.from(new Uint8Array(await hmac(signingKey, stringToSign)))
    .map((b) => b.toString(16).padStart(2, '0')).join('')

  return {
    Authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    'X-Amz-Date': dateStr,
    'Content-Type': 'application/x-amz-json-1.1',
  }
}

async function syncAWS(ctx: SyncContext): Promise<SyncResult> {
  const accessKeyId = ctx.credentials['access_key_id'] ?? ''
  const secretAccessKey = await getDecrypted(ctx, 'secret_access_key')
  const region = ctx.credentials['region'] || 'us-east-1'

  if (!accessKeyId || !secretAccessKey) {
    return { recordsPulled: 0, recordsCreated: 0, recordsUpdated: 0, anomaliesDetected: 0, error: 'Missing access_key_id or secret_access_key' }
  }

  let pulled = 0, created = 0, updated = 0, anomalies = 0

  // ── 1. IAM users ─────────────────────────────────────────────────────
  const iamHost = 'iam.amazonaws.com'
  const iamHeaders = await awsSig4('GET', 'iam', 'us-east-1', iamHost,
    '/', 'Action=ListUsers&Version=2010-05-08', '', accessKeyId, secretAccessKey)

  const iamRes = await fetch(
    `https://${iamHost}/?Action=ListUsers&Version=2010-05-08`,
    { headers: iamHeaders }
  )

  if (iamRes.ok) {
    const xml = await iamRes.text()
    // Parse UserName values from XML
    const userNames = [...xml.matchAll(/<UserName>([^<]+)<\/UserName>/g)].map((m) => m[1])
    pulled += userNames.length

    const noMfaUsers: string[] = []

    // Check MFA for each user
    for (const userName of userNames.slice(0, 50)) {
      const mfaHeaders = await awsSig4('GET', 'iam', 'us-east-1', iamHost,
        '/', `Action=ListMFADevices&UserName=${encodeURIComponent(userName)}&Version=2010-05-08`,
        '', accessKeyId, secretAccessKey)
      const mfaRes = await fetch(
        `https://${iamHost}/?Action=ListMFADevices&UserName=${encodeURIComponent(userName)}&Version=2010-05-08`,
        { headers: mfaHeaders }
      )
      if (mfaRes.ok) {
        const mfaXml = await mfaRes.text()
        if (!mfaXml.includes('<SerialNumber>')) {
          noMfaUsers.push(userName)
        }
      }
    }

    const ev = await upsertEvidence(
      ctx.db, ctx.workspaceId,
      'AWS IAM Users',
      `${userNames.length} IAM users found.\nUsers without MFA: ${noMfaUsers.length || 'none'}.\n\nUser list:\n${userNames.map((u) => `- ${u}`).join('\n')}`,
      'integration:aws'
    )
    ev.created ? created++ : updated++

    for (const user of noMfaUsers) {
      const a = await upsertAnomaly(
        ctx.db, ctx.workspaceId, ctx.integrationId,
        'mfa_not_enabled', 'critical',
        `AWS IAM user without MFA: ${user}`,
        `IAM user ${user} does not have an MFA device configured.`
      )
      if (a.created) anomalies++
    }
  }

  // ── 2. CloudTrail — recent events ─────────────────────────────────────
  const ctHost = `cloudtrail.${region}.amazonaws.com`
  const ctBody = JSON.stringify({ MaxResults: 50 })
  const ctHeaders = await awsSig4('POST', 'cloudtrail', region, ctHost,
    '/', '', ctBody, accessKeyId, secretAccessKey)
  ctHeaders['X-Amz-Target'] = 'com.amazonaws.cloudtrail.v20131101.CloudTrail_20131101.LookupEvents'

  const ctRes = await fetch(`https://${ctHost}/`, { method: 'POST', headers: ctHeaders, body: ctBody })
  if (ctRes.ok) {
    const ctData = await ctRes.json() as { Events?: unknown[] }
    const events = ctData.Events ?? []
    pulled += events.length

    const ev = await upsertEvidence(
      ctx.db, ctx.workspaceId,
      'AWS CloudTrail Events (Recent)',
      `${events.length} recent CloudTrail events retrieved from ${region}.`,
      'integration:aws'
    )
    ev.created ? created++ : updated++
  }

  return { recordsPulled: pulled, recordsCreated: created, recordsUpdated: updated, anomaliesDetected: anomalies }
}

// ── Main dispatcher ───────────────────────────────────────────────────────────

export async function runSync(
  type: string,
  ctx: SyncContext
): Promise<SyncResult> {
  try {
    switch (type) {
      case 'cloudflare': return await syncCloudflare(ctx)
      case 'okta':       return await syncOkta(ctx)
      case 'aws':        return await syncAWS(ctx)
      default:
        return { recordsPulled: 0, recordsCreated: 0, recordsUpdated: 0, anomaliesDetected: 0,
                 error: `No sync implementation for provider: ${type}` }
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return { recordsPulled: 0, recordsCreated: 0, recordsUpdated: 0, anomaliesDetected: 0, error }
  }
}
