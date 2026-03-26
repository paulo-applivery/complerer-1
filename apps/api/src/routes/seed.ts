import { Hono } from 'hono'
import type { AppType } from '../types.js'
import { generateId } from '../lib/id.js'

/**
 * Seed routes — mounted at /api/seed
 * Dev-only endpoints for populating framework data.
 *
 * Usage:
 *   curl -X POST http://localhost:8787/api/seed/frameworks \
 *     -H "Content-Type: application/json" \
 *     -d @packages/db/src/seeds/soc2-2024.json
 */
const seedRoutes = new Hono<AppType>()

interface SeedControl {
  controlId: string
  domain?: string
  subdomain?: string
  title: string
  requirementText: string
  guidance?: string
  evidenceRequirements?: string[]
  riskWeight?: number
  implementationGroup?: string
}

interface SeedPayload {
  framework: {
    slug: string
    name: string
    description?: string
    sourceOrg?: string
    sourceUrl?: string
  }
  version: {
    version: string
    status?: string
    publishedAt?: string
    changelog?: string
    sourceUrl?: string
  }
  controls: SeedControl[]
}

/**
 * POST /api/seed/frameworks
 * Seed one framework at a time via POST body (same format as seed JSON files).
 * No auth required — dev-only endpoint.
 */
seedRoutes.post('/frameworks', async (c) => {
  const body = await c.req.json<SeedPayload>()
  const now = new Date().toISOString()

  if (!body.framework?.slug || !body.framework?.name) {
    return c.json({ error: 'Missing framework.slug or framework.name' }, 400)
  }
  if (!body.version?.version) {
    return c.json({ error: 'Missing version.version' }, 400)
  }
  if (!Array.isArray(body.controls) || body.controls.length === 0) {
    return c.json({ error: 'Missing or empty controls array' }, 400)
  }

  const db = c.env.DB

  // 1. Upsert framework (by slug)
  let framework = await db
    .prepare('SELECT id FROM frameworks WHERE slug = ?')
    .bind(body.framework.slug)
    .first<{ id: string }>()

  let frameworkId: string

  if (framework) {
    frameworkId = framework.id
    await db
      .prepare(
        'UPDATE frameworks SET name = ?, description = ?, source_org = ?, source_url = ? WHERE id = ?'
      )
      .bind(
        body.framework.name,
        body.framework.description ?? null,
        body.framework.sourceOrg ?? null,
        body.framework.sourceUrl ?? null,
        frameworkId
      )
      .run()
  } else {
    frameworkId = generateId()
    await db
      .prepare(
        'INSERT INTO frameworks (id, slug, name, description, source_org, source_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        frameworkId,
        body.framework.slug,
        body.framework.name,
        body.framework.description ?? null,
        body.framework.sourceOrg ?? null,
        body.framework.sourceUrl ?? null,
        now
      )
      .run()
  }

  // 2. Upsert framework version (by framework_id + version)
  let fv = await db
    .prepare(
      'SELECT id FROM framework_versions WHERE framework_id = ? AND version = ?'
    )
    .bind(frameworkId, body.version.version)
    .first<{ id: string }>()

  let versionId: string

  if (fv) {
    versionId = fv.id
    await db
      .prepare(
        'UPDATE framework_versions SET status = ?, published_at = ?, changelog = ?, source_url = ? WHERE id = ?'
      )
      .bind(
        body.version.status ?? 'draft',
        body.version.publishedAt ?? null,
        body.version.changelog ?? null,
        body.version.sourceUrl ?? null,
        versionId
      )
      .run()

    // Delete existing controls for this version before re-inserting
    await db
      .prepare('DELETE FROM versioned_controls WHERE framework_version_id = ?')
      .bind(versionId)
      .run()
  } else {
    versionId = generateId()
    await db
      .prepare(
        `INSERT INTO framework_versions (id, framework_id, version, status, total_controls, published_at, changelog, source_url, created_at)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)`
      )
      .bind(
        versionId,
        frameworkId,
        body.version.version,
        body.version.status ?? 'draft',
        body.version.publishedAt ?? null,
        body.version.changelog ?? null,
        body.version.sourceUrl ?? null,
        now
      )
      .run()
  }

  // 3. Insert all controls (batch for performance)
  const batchSize = 25
  for (let i = 0; i < body.controls.length; i += batchSize) {
    const batch = body.controls.slice(i, i + batchSize)
    const stmts = batch.map((ctrl) => {
      const controlUlid = generateId()
      return db
        .prepare(
          `INSERT INTO versioned_controls (id, framework_version_id, control_id, domain, subdomain, title, requirement_text, guidance, evidence_requirements, risk_weight, implementation_group, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          controlUlid,
          versionId,
          ctrl.controlId,
          ctrl.domain ?? null,
          ctrl.subdomain ?? null,
          ctrl.title,
          ctrl.requirementText,
          ctrl.guidance ?? null,
          JSON.stringify(ctrl.evidenceRequirements ?? []),
          ctrl.riskWeight ?? 0.5,
          ctrl.implementationGroup ?? null,
          now
        )
    })
    await db.batch(stmts)
  }

  // 4. Update total_controls count on the framework_version
  await db
    .prepare(
      'UPDATE framework_versions SET total_controls = ? WHERE id = ?'
    )
    .bind(body.controls.length, versionId)
    .run()

  return c.json({
    seeded: [
      {
        framework: body.framework.slug,
        version: body.version.version,
        controls: body.controls.length,
      },
    ],
  })
})

// ─── Crosswalk Seeding ──────────────────────────────────────────────

interface CrosswalkEntry {
  source: { framework: string; controlId: string }
  target: { framework: string; controlId: string }
  mappingType: string
  confidence: number
  notes?: string
}

interface CrosswalkPayload {
  crosswalks: CrosswalkEntry[]
}

/**
 * POST /api/seed/crosswalks
 * Seed control crosswalks via POST body (same format as crosswalks.json).
 * No auth required — dev-only endpoint.
 *
 * Resolves human-readable controlId strings to internal ULID IDs via
 * versioned_controls + framework_versions + frameworks joins.
 */
seedRoutes.post('/crosswalks', async (c) => {
  const body = await c.req.json<CrosswalkPayload>()

  if (!Array.isArray(body.crosswalks) || body.crosswalks.length === 0) {
    return c.json({ error: 'Missing or empty crosswalks array' }, 400)
  }

  const db = c.env.DB
  const now = new Date().toISOString()
  let inserted = 0
  let skipped = 0

  // Resolve a framework slug + controlId to the internal ULID
  async function resolveControl(
    framework: string,
    controlId: string
  ): Promise<string | null> {
    const row = await db
      .prepare(
        `SELECT vc.id
         FROM versioned_controls vc
         JOIN framework_versions fv ON fv.id = vc.framework_version_id
         JOIN frameworks f ON f.id = fv.framework_id
         WHERE f.slug = ? AND vc.control_id = ?
         ORDER BY fv.created_at DESC
         LIMIT 1`
      )
      .bind(framework, controlId)
      .first<{ id: string }>()
    return row?.id ?? null
  }

  for (const cw of body.crosswalks) {
    const sourceId = await resolveControl(
      cw.source.framework,
      cw.source.controlId
    )
    const targetId = await resolveControl(
      cw.target.framework,
      cw.target.controlId
    )

    if (!sourceId || !targetId) {
      skipped++
      continue
    }

    // Skip duplicates (same source + target pair)
    const existing = await db
      .prepare(
        `SELECT id FROM control_crosswalks
         WHERE source_control_id = ? AND target_control_id = ?`
      )
      .bind(sourceId, targetId)
      .first()

    if (existing) {
      skipped++
      continue
    }

    const crosswalkId = generateId()
    await db
      .prepare(
        `INSERT INTO control_crosswalks (id, source_control_id, target_control_id, mapping_type, confidence, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        crosswalkId,
        sourceId,
        targetId,
        cw.mappingType,
        cw.confidence,
        cw.notes ?? null,
        now
      )
      .run()
    inserted++
  }

  return c.json({
    seeded: {
      total: body.crosswalks.length,
      inserted,
      skipped,
    },
  })
})

export { seedRoutes }
