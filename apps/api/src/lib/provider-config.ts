import type { D1Database } from '@cloudflare/workers-types'

/**
 * Maps integration provider types (used in the integrations table)
 * to the slugs used in platform_providers.
 * Some slugs differ because the platform_providers were seeded separately.
 */
const TYPE_TO_SLUG: Record<string, string> = {
  github: 'github',
  google_ws: 'google-workspace',
  jira: 'jira',
  linear: 'linear',
  okta: 'okta',
  azure_ad: 'azure-ad',
  aws: 'aws',
  applivery: 'applivery',
}

function toSlug(type: string): string {
  return TYPE_TO_SLUG[type] ?? type
}

/**
 * Read a provider config value from platform_provider_configs by integration type + key.
 * The provider must be enabled.
 */
export async function getProviderConfig(
  db: D1Database,
  type: string,
  key: string
): Promise<string> {
  const slug = toSlug(type)
  const row = await db
    .prepare(
      `SELECT pc.value
       FROM platform_provider_configs pc
       JOIN platform_providers p ON pc.provider_id = p.id
       WHERE p.slug = ? AND pc.key = ? AND p.enabled = 1`
    )
    .bind(slug, key)
    .first<{ value: string }>()

  return row?.value ?? ''
}

/**
 * Read all config keys for a provider as a plain object.
 * The provider must be enabled.
 */
export async function getProviderConfigs(
  db: D1Database,
  type: string
): Promise<Record<string, string>> {
  const slug = toSlug(type)
  const { results } = await db
    .prepare(
      `SELECT pc.key, pc.value
       FROM platform_provider_configs pc
       JOIN platform_providers p ON pc.provider_id = p.id
       WHERE p.slug = ? AND p.enabled = 1`
    )
    .bind(slug)
    .all<{ key: string; value: string }>()

  return Object.fromEntries((results ?? []).map((r) => [r.key, r.value]))
}
