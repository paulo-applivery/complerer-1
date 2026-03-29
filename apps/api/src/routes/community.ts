import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { AppType } from '../types.js'
import { generateId } from '../lib/id.js'
import { emitEvent } from '../lib/events.js'
import { workspaceMiddleware, requireRole } from '../middleware/workspace.js'
import { authMiddleware } from '../middleware/auth.js'

/**
 * Community routes — Playbooks + Trust Score
 *
 * Workspace-scoped routes are mounted at /api/workspaces/:workspaceId
 * Public trust routes are mounted at /api/trust
 * Seed routes are mounted at /api/seed
 */

// ── Workspace-scoped routes ──────────────────────────────────────────────────

const communityRoutes = new Hono<AppType>()

communityRoutes.use('*', authMiddleware)
communityRoutes.use('*', workspaceMiddleware)

// ─── Trust Score Computation ─────────────────────────────────────────────────

function computeGrade(score: number): string {
  if (score >= 95) return 'A+'
  if (score >= 85) return 'A'
  if (score >= 75) return 'B+'
  if (score >= 65) return 'B'
  if (score >= 55) return 'C'
  return 'D'
}

async function safeQuery<T>(db: D1Database, sql: string, ...binds: any[]): Promise<T | null> {
  try {
    return await db.prepare(sql).bind(...binds).first<T>()
  } catch {
    return null
  }
}

async function computeTrustScore(db: D1Database, workspaceId: string) {
  // Framework coverage: % of adopted controls that are satisfied
  const adoptionStats = await safeQuery<{ total_controls: number; met_controls: number }>(
    db,
    `SELECT
      COUNT(DISTINCT wc.control_id) as total_controls,
      COUNT(DISTINCT CASE WHEN wc.status = 'met' THEN wc.control_id END) as met_controls
     FROM mv_control_status wc
     WHERE wc.workspace_id = ?`,
    workspaceId
  )

  const totalControls = adoptionStats?.total_controls ?? 0
  const metControls = adoptionStats?.met_controls ?? 0
  const frameworkCoverage = totalControls > 0 ? (metControls / totalControls) * 100 : 0

  // Evidence freshness: % of evidence items updated in the last 90 days
  const evidenceStats = await safeQuery<{ total: number; fresh: number }>(
    db,
    `SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN updated_at >= datetime('now', '-90 days') THEN 1 END) as fresh
     FROM evidence
     WHERE workspace_id = ?`,
    workspaceId
  )

  const totalEvidence = evidenceStats?.total ?? 0
  const freshEvidence = evidenceStats?.fresh ?? 0
  const evidenceFreshness = totalEvidence > 0 ? (freshEvidence / totalEvidence) * 100 : 0

  // Violation ratio: inverted — fewer open violations = higher score
  const violationStats = await safeQuery<{ total: number; open_count: number }>(
    db,
    `SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'open' THEN 1 END) as open_count
     FROM baseline_violations
     WHERE workspace_id = ?`,
    workspaceId
  )

  const totalViolations = violationStats?.total ?? 0
  const openViolations = violationStats?.open_count ?? 0
  const violationRatio =
    totalViolations > 0 ? ((totalViolations - openViolations) / totalViolations) * 100 : 100

  // Review completeness: % of policies that have been reviewed (status = 'active')
  const policyStats = await safeQuery<{ total: number; reviewed: number }>(
    db,
    `SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as reviewed
     FROM policies
     WHERE workspace_id = ?`,
    workspaceId
  )

  const totalPolicies = policyStats?.total ?? 0
  const reviewedPolicies = policyStats?.reviewed ?? 0
  const reviewCompleteness = totalPolicies > 0 ? (reviewedPolicies / totalPolicies) * 100 : 0

  // Snapshot recency: 100 if a snapshot was taken in last 30 days, decays from there
  const latestSnapshot = await safeQuery<{ captured_at: string }>(
    db,
    `SELECT captured_at FROM compliance_snapshots
     WHERE workspace_id = ?
     ORDER BY captured_at DESC LIMIT 1`,
    workspaceId
  )

  let snapshotRecency = 0
  if (latestSnapshot) {
    const daysSince = Math.floor(
      (Date.now() - new Date(latestSnapshot.captured_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    snapshotRecency = daysSince <= 30 ? 100 : Math.max(0, 100 - (daysSince - 30) * 2)
  }

  // Weighted trust score
  const score =
    frameworkCoverage * 0.35 +
    evidenceFreshness * 0.25 +
    violationRatio * 0.2 +
    reviewCompleteness * 0.1 +
    snapshotRecency * 0.1

  const roundedScore = Math.round(score * 10) / 10
  const grade = computeGrade(roundedScore)

  // Count active frameworks
  const frameworkCount = await safeQuery<{ count: number }>(
    db,
    `SELECT COUNT(DISTINCT wa.framework_version_id) as count
     FROM workspace_adoptions wa
     WHERE wa.workspace_id = ?`,
    workspaceId
  )

  return {
    score: roundedScore,
    grade,
    breakdown: {
      frameworkCoverage: Math.round(frameworkCoverage * 10) / 10,
      evidenceFreshness: Math.round(evidenceFreshness * 10) / 10,
      violationRatio: Math.round(violationRatio * 10) / 10,
      reviewCompleteness: Math.round(reviewCompleteness * 10) / 10,
      snapshotRecency: Math.round(snapshotRecency * 10) / 10,
    },
    stats: {
      frameworksActive: frameworkCount?.count ?? 0,
      controlsSatisfied: metControls,
      controlsTotal: totalControls,
      evidenceFreshness: Math.round(evidenceFreshness * 10) / 10,
      openViolations,
    },
  }
}

// ─── Playbook: GET /playbooks/:controlId ─────────────────────────────────────

communityRoutes.get('/playbooks/:controlId', async (c) => {
  const workspaceId = c.get('workspaceId')
  const controlId = c.req.param('controlId')
  const db = c.env.DB

  // Look up the control to get its data
  const control = await db
    .prepare('SELECT * FROM versioned_controls WHERE id = ?')
    .bind(controlId)
    .first<{
      id: string
      framework_version_id: string
      control_id: string
      title: string
      requirement_text: string
      guidance: string | null
      evidence_requirements: string | null
    }>()

  if (!control) {
    return c.json({ error: 'Control not found' }, 404)
  }

  // Check if a playbook already exists
  let playbook = await db
    .prepare('SELECT * FROM playbooks WHERE control_id = ?')
    .bind(controlId)
    .first()

  if (!playbook) {
    // Auto-generate a playbook from the control's data
    const now = new Date().toISOString()
    const playbookId = generateId()

    const evidenceReqs: string[] = control.evidence_requirements
      ? JSON.parse(control.evidence_requirements)
      : []

    await db
      .prepare(
        `INSERT INTO playbooks (id, control_id, framework_version_id, title, summary, contributor_count, avg_audit_pass_rate, estimated_effort_hours, difficulty_rating, source, last_updated_at, created_at)
         VALUES (?, ?, ?, ?, ?, 0, NULL, ?, ?, 'ai_generated', ?, ?)`
      )
      .bind(
        playbookId,
        controlId,
        control.framework_version_id,
        `How to satisfy: ${control.title}`,
        `Playbook for implementing ${control.control_id} — ${control.title}. ${control.requirement_text}`,
        evidenceReqs.length > 0 ? evidenceReqs.length * 0.5 : 2,
        evidenceReqs.length > 3 ? 3.5 : 2.0,
        now,
        now
      )
      .run()

    // Generate evidence patterns from the control's evidence_requirements
    for (const req of evidenceReqs) {
      const patternId = generateId()
      await db
        .prepare(
          `INSERT INTO playbook_evidence_patterns (id, playbook_id, evidence_type, evidence_source_tool, usage_percentage, auditor_acceptance_rate, collection_frequency, automation_available, effort_minutes, created_at)
           VALUES (?, ?, ?, NULL, 80, 0.85, 'quarterly', 0, 30, ?)`
        )
        .bind(patternId, playbookId, req, now)
        .run()
    }

    // Generate a default pro tip
    const tipId = generateId()
    await db
      .prepare(
        `INSERT INTO playbook_tips (id, playbook_id, tip_type, content, source_segment, upvotes, status, created_at)
         VALUES (?, ?, 'pro_tip', ?, 'all', 0, 'published', ?)`
      )
      .bind(
        tipId,
        playbookId,
        `Start by documenting your current process for ${control.title.toLowerCase()}, then identify gaps against the requirement.`,
        now
      )
      .run()

    playbook = await db
      .prepare('SELECT * FROM playbooks WHERE id = ?')
      .bind(playbookId)
      .first()
  }

  // Fetch evidence patterns and tips
  const evidencePatterns = await db
    .prepare('SELECT * FROM playbook_evidence_patterns WHERE playbook_id = ? ORDER BY usage_percentage DESC')
    .bind((playbook as any).id)
    .all()

  const tips = await db
    .prepare("SELECT * FROM playbook_tips WHERE playbook_id = ? AND status = 'published' ORDER BY upvotes DESC")
    .bind((playbook as any).id)
    .all()

  return c.json({
    playbook,
    evidencePatterns: evidencePatterns.results,
    tips: tips.results,
  })
})

// ─── Trust Score: GET /trust ─────────────────────────────────────────────────

communityRoutes.get('/trust', async (c) => {
  const workspaceId = c.get('workspaceId')
  const db = c.env.DB

  const profile = await db
    .prepare('SELECT * FROM trust_profiles WHERE workspace_id = ?')
    .bind(workspaceId)
    .first()

  const trustData = await computeTrustScore(db, workspaceId)

  return c.json({
    profile: profile ?? null,
    ...trustData,
  })
})

// ─── Trust Profile: POST /trust ──────────────────────────────────────────────

const trustProfileSchema = z.object({
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  companyName: z.string().min(1).max(200),
  enabled: z.boolean().optional(),
  showFrameworks: z.boolean().optional(),
  showPostureScore: z.boolean().optional(),
  showEvidenceFreshness: z.boolean().optional(),
  showLastSnapshot: z.boolean().optional(),
  showControlCount: z.boolean().optional(),
  badgeStyle: z.enum(['minimal', 'standard', 'detailed']).optional(),
})

communityRoutes.post(
  '/trust',
  requireRole('admin'),
  zValidator('json', trustProfileSchema),
  async (c) => {
    const workspaceId = c.get('workspaceId')
    const body = c.req.valid('json')
    const db = c.env.DB
    const now = new Date().toISOString()

    // Check if profile already exists for this workspace
    const existing = await db
      .prepare('SELECT id FROM trust_profiles WHERE workspace_id = ?')
      .bind(workspaceId)
      .first<{ id: string }>()

    if (existing) {
      // Update
      await db
        .prepare(
          `UPDATE trust_profiles SET
            slug = ?, company_name = ?, enabled = ?,
            show_frameworks = ?, show_posture_score = ?,
            show_evidence_freshness = ?, show_last_snapshot = ?,
            show_control_count = ?, badge_style = ?, updated_at = ?
           WHERE id = ?`
        )
        .bind(
          body.slug,
          body.companyName,
          body.enabled !== undefined ? (body.enabled ? 1 : 0) : 0,
          body.showFrameworks !== undefined ? (body.showFrameworks ? 1 : 0) : 1,
          body.showPostureScore !== undefined ? (body.showPostureScore ? 1 : 0) : 1,
          body.showEvidenceFreshness !== undefined ? (body.showEvidenceFreshness ? 1 : 0) : 1,
          body.showLastSnapshot !== undefined ? (body.showLastSnapshot ? 1 : 0) : 1,
          body.showControlCount !== undefined ? (body.showControlCount ? 1 : 0) : 1,
          body.badgeStyle ?? 'standard',
          now,
          existing.id
        )
        .run()

      await emitEvent(db, {
        workspaceId,
        eventType: 'trust_profile.updated',
        entityType: 'trust_profile',
        entityId: existing.id,
        actorId: c.get('userId'),
      })

      const updated = await db
        .prepare('SELECT * FROM trust_profiles WHERE id = ?')
        .bind(existing.id)
        .first()

      return c.json({ profile: updated })
    }

    // Create new
    const id = generateId()
    await db
      .prepare(
        `INSERT INTO trust_profiles (id, workspace_id, slug, company_name, enabled, show_frameworks, show_posture_score, show_evidence_freshness, show_last_snapshot, show_control_count, badge_style, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        workspaceId,
        body.slug,
        body.companyName,
        body.enabled !== undefined ? (body.enabled ? 1 : 0) : 0,
        body.showFrameworks !== undefined ? (body.showFrameworks ? 1 : 0) : 1,
        body.showPostureScore !== undefined ? (body.showPostureScore ? 1 : 0) : 1,
        body.showEvidenceFreshness !== undefined ? (body.showEvidenceFreshness ? 1 : 0) : 1,
        body.showLastSnapshot !== undefined ? (body.showLastSnapshot ? 1 : 0) : 1,
        body.showControlCount !== undefined ? (body.showControlCount ? 1 : 0) : 1,
        body.badgeStyle ?? 'standard',
        now,
        now
      )
      .run()

    await emitEvent(db, {
      workspaceId,
      eventType: 'trust_profile.created',
      entityType: 'trust_profile',
      entityId: id,
      actorId: c.get('userId'),
    })

    const profile = await db
      .prepare('SELECT * FROM trust_profiles WHERE id = ?')
      .bind(id)
      .first()

    return c.json({ profile }, 201)
  }
)

// ── Public trust routes (no auth) ────────────────────────────────────────────

const publicTrustRoutes = new Hono<AppType>()

publicTrustRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const db = c.env.DB

  const profile = await db
    .prepare('SELECT * FROM trust_profiles WHERE slug = ? AND enabled = 1')
    .bind(slug)
    .first()

  if (!profile) {
    return c.json({ error: 'Trust profile not found' }, 404)
  }

  const workspaceId = (profile as any).workspace_id
  const trustData = await computeTrustScore(db, workspaceId)

  return c.json({
    profile,
    ...trustData,
  })
})

// ── Seed playbooks route (no auth, dev-only) ─────────────────────────────────

const seedPlaybooksRoutes = new Hono<AppType>()

seedPlaybooksRoutes.post('/playbooks', async (c) => {
  const body = await c.req.json<{ frameworkSlug: string }>()
  const db = c.env.DB
  const now = new Date().toISOString()

  if (!body.frameworkSlug) {
    return c.json({ error: 'Missing frameworkSlug' }, 400)
  }

  // Find framework + latest version
  const fv = await db
    .prepare(
      `SELECT fv.id as version_id
       FROM framework_versions fv
       JOIN frameworks f ON f.id = fv.framework_id
       WHERE f.slug = ?
       ORDER BY fv.created_at DESC
       LIMIT 1`
    )
    .bind(body.frameworkSlug)
    .first<{ version_id: string }>()

  if (!fv) {
    return c.json({ error: 'Framework not found' }, 404)
  }

  // Get all controls for this version
  const controls = await db
    .prepare(
      'SELECT * FROM versioned_controls WHERE framework_version_id = ?'
    )
    .bind(fv.version_id)
    .all<{
      id: string
      control_id: string
      title: string
      requirement_text: string
      evidence_requirements: string | null
    }>()

  let created = 0
  let skipped = 0

  for (const control of controls.results) {
    // Skip if playbook already exists
    const existing = await db
      .prepare('SELECT id FROM playbooks WHERE control_id = ?')
      .bind(control.id)
      .first()

    if (existing) {
      skipped++
      continue
    }

    const playbookId = generateId()
    const evidenceReqs: string[] = control.evidence_requirements
      ? JSON.parse(control.evidence_requirements)
      : []

    await db
      .prepare(
        `INSERT INTO playbooks (id, control_id, framework_version_id, title, summary, contributor_count, avg_audit_pass_rate, estimated_effort_hours, difficulty_rating, source, last_updated_at, created_at)
         VALUES (?, ?, ?, ?, ?, 0, NULL, ?, ?, 'ai_generated', ?, ?)`
      )
      .bind(
        playbookId,
        control.id,
        fv.version_id,
        `How to satisfy: ${control.title}`,
        `Playbook for implementing ${control.control_id} — ${control.title}. ${control.requirement_text}`,
        evidenceReqs.length > 0 ? evidenceReqs.length * 0.5 : 2,
        evidenceReqs.length > 3 ? 3.5 : 2.0,
        now,
        now
      )
      .run()

    // Generate evidence patterns
    for (const req of evidenceReqs) {
      const patternId = generateId()
      await db
        .prepare(
          `INSERT INTO playbook_evidence_patterns (id, playbook_id, evidence_type, evidence_source_tool, usage_percentage, auditor_acceptance_rate, collection_frequency, automation_available, effort_minutes, created_at)
           VALUES (?, ?, ?, NULL, 80, 0.85, 'quarterly', 0, 30, ?)`
        )
        .bind(patternId, playbookId, req, now)
        .run()
    }

    // Generate a default tip
    const tipId = generateId()
    await db
      .prepare(
        `INSERT INTO playbook_tips (id, playbook_id, tip_type, content, source_segment, upvotes, status, created_at)
         VALUES (?, ?, 'pro_tip', ?, 'all', 0, 'published', ?)`
      )
      .bind(
        tipId,
        playbookId,
        `Start by documenting your current process for ${control.title.toLowerCase()}, then identify gaps against the requirement.`,
        now
      )
      .run()

    created++
  }

  return c.json({
    seeded: {
      framework: body.frameworkSlug,
      total: controls.results.length,
      created,
      skipped,
    },
  })
})

export { communityRoutes, publicTrustRoutes, seedPlaybooksRoutes }
