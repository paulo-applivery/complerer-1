import { generateId } from './id.js'
import { emitEvent } from './events.js'

/**
 * Executes a tool call against the workspace data.
 * Each tool function queries D1 and returns a JSON string result.
 */
export async function executeTool(
  db: D1Database,
  workspaceId: string,
  userId: string,
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<string> {
  switch (toolName) {
    case 'search_controls':
      return searchControls(db, workspaceId, toolInput)
    case 'get_compliance_posture':
      return getCompliancePosture(db, workspaceId)
    case 'list_access_records':
      return listAccessRecords(db, workspaceId, toolInput)
    case 'register_access':
      return registerAccess(db, workspaceId, userId, toolInput)
    case 'check_evidence_gaps':
      return checkEvidenceGaps(db, workspaceId, toolInput)
    case 'list_violations':
      return listViolations(db, workspaceId, toolInput)
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` })
  }
}

// ─── search_controls ──────────────────────────────────────────────────

async function searchControls(
  db: D1Database,
  workspaceId: string,
  input: Record<string, unknown>
): Promise<string> {
  const query = input.query as string
  const framework = input.framework as string | undefined
  const limit = (input.limit as number) || 5
  const likeQuery = `%${query}%`

  let sql = `
    SELECT vc.control_id, vc.title, vc.domain, vc.requirement_text, f.name AS framework_name, f.slug AS framework_slug
    FROM versioned_controls vc
    JOIN framework_versions fv ON vc.framework_version_id = fv.id
    JOIN frameworks f ON fv.framework_id = f.id
    JOIN workspace_adoptions wa ON wa.framework_version_id = fv.id AND wa.workspace_id = ?
    WHERE wa.superseded_by IS NULL
      AND (vc.title LIKE ? OR vc.requirement_text LIKE ? OR vc.domain LIKE ?)
  `
  const binds: unknown[] = [workspaceId, likeQuery, likeQuery, likeQuery]

  if (framework) {
    sql += ` AND f.slug = ?`
    binds.push(framework)
  }

  sql += ` ORDER BY vc.control_id ASC LIMIT ?`
  binds.push(limit)

  const stmt = db.prepare(sql)
  const { results } = await stmt.bind(...binds).all<{
    control_id: string
    title: string
    domain: string | null
    requirement_text: string
    framework_name: string
    framework_slug: string
  }>()

  return JSON.stringify({
    controls: results.map((r) => ({
      controlId: r.control_id,
      title: r.title,
      domain: r.domain,
      requirementText: r.requirement_text,
      framework: r.framework_name,
      frameworkSlug: r.framework_slug,
    })),
    total: results.length,
  })
}

// ─── get_compliance_posture ───────────────────────────────────────────

async function getCompliancePosture(
  db: D1Database,
  workspaceId: string
): Promise<string> {
  // Adopted frameworks
  const { results: adoptions } = await db
    .prepare(
      `SELECT f.name, f.slug, fv.version, fv.total_controls
       FROM workspace_adoptions wa
       JOIN framework_versions fv ON wa.framework_version_id = fv.id
       JOIN frameworks f ON fv.framework_id = f.id
       WHERE wa.workspace_id = ? AND wa.superseded_by IS NULL`
    )
    .bind(workspaceId)
    .all<{ name: string; slug: string; version: string; total_controls: number }>()

  // Total controls across adopted frameworks
  const totalControls = adoptions.reduce((sum, a) => sum + a.total_controls, 0)

  // Controls with evidence
  const evidenceRow = await db
    .prepare(
      `SELECT COUNT(DISTINCT el.control_id) AS covered
       FROM evidence_links el
       JOIN workspace_adoptions wa ON el.framework_version_id = wa.framework_version_id
       WHERE el.workspace_id = ? AND wa.workspace_id = ? AND wa.superseded_by IS NULL`
    )
    .bind(workspaceId, workspaceId)
    .first<{ covered: number }>()
  const coveredControls = evidenceRow?.covered ?? 0

  // Active access records count
  const accessRow = await db
    .prepare(
      `SELECT COUNT(*) AS cnt FROM access_records WHERE workspace_id = ? AND revoked_at IS NULL`
    )
    .bind(workspaceId)
    .first<{ cnt: number }>()
  const activeAccessCount = accessRow?.cnt ?? 0

  // High-risk access (risk_score >= 0.7)
  const highRiskRow = await db
    .prepare(
      `SELECT COUNT(*) AS cnt FROM access_records WHERE workspace_id = ? AND revoked_at IS NULL AND risk_score >= 0.7`
    )
    .bind(workspaceId)
    .first<{ cnt: number }>()
  const highRiskCount = highRiskRow?.cnt ?? 0

  // Open violations
  const violationRow = await db
    .prepare(
      `SELECT COUNT(*) AS cnt FROM baseline_violations WHERE workspace_id = ? AND status = 'open'`
    )
    .bind(workspaceId)
    .first<{ cnt: number }>()
  const openViolations = violationRow?.cnt ?? 0

  return JSON.stringify({
    frameworks: adoptions.map((a) => ({
      name: a.name,
      slug: a.slug,
      version: a.version,
      totalControls: a.total_controls,
    })),
    totalControls,
    coveredControls,
    coveragePercent: totalControls > 0 ? Math.round((coveredControls / totalControls) * 100) : 0,
    activeAccessRecords: activeAccessCount,
    highRiskAccess: highRiskCount,
    openViolations,
  })
}

// ─── list_access_records ──────────────────────────────────────────────

async function listAccessRecords(
  db: D1Database,
  workspaceId: string,
  input: Record<string, unknown>
): Promise<string> {
  const systemName = input.systemName as string | undefined
  const userName = input.userName as string | undefined
  const status = (input.status as string) || 'active'

  let sql = `
    SELECT ar.id, du.name AS user_name, du.email AS user_email, s.name AS system_name,
           ar.role, ar.granted_at, ar.approved_by, ar.risk_score, ar.revoked_at, ar.ticket_ref
    FROM access_records ar
    JOIN directory_users du ON ar.user_id = du.id
    JOIN systems s ON ar.system_id = s.id
    WHERE ar.workspace_id = ?
  `
  const binds: unknown[] = [workspaceId]

  if (status === 'active') {
    sql += ` AND ar.revoked_at IS NULL`
  } else if (status === 'revoked') {
    sql += ` AND ar.revoked_at IS NOT NULL`
  }

  if (systemName) {
    sql += ` AND s.name LIKE ?`
    binds.push(`%${systemName}%`)
  }

  if (userName) {
    sql += ` AND du.name LIKE ?`
    binds.push(`%${userName}%`)
  }

  sql += ` ORDER BY ar.granted_at DESC LIMIT 20`

  const { results } = await db
    .prepare(sql)
    .bind(...binds)
    .all<{
      id: string
      user_name: string
      user_email: string
      system_name: string
      role: string
      granted_at: string
      approved_by: string | null
      risk_score: number
      revoked_at: string | null
      ticket_ref: string | null
    }>()

  return JSON.stringify({
    records: results.map((r) => ({
      id: r.id,
      userName: r.user_name,
      userEmail: r.user_email,
      systemName: r.system_name,
      role: r.role,
      grantedAt: r.granted_at,
      approvedBy: r.approved_by,
      riskScore: r.risk_score,
      revokedAt: r.revoked_at,
      ticketRef: r.ticket_ref,
    })),
    total: results.length,
  })
}

// ─── register_access ──────────────────────────────────────────────────

function computeRiskScore(
  system: { classification: string; data_sensitivity: string; mfa_required: number },
  accessRole: string,
  approvedBy: string | null
): number {
  const sensitivity =
    ({ high: 1.0, medium: 0.6, low: 0.3 } as Record<string, number>)[system.data_sensitivity] ??
    0.5
  const privilege =
    ({ admin: 1.0, write: 0.7, read: 0.3 } as Record<string, number>)[accessRole] ?? 0.5
  const mfa = !system.mfa_required && system.classification === 'critical' ? 1.0 : 0.0
  const approval = approvedBy ? 0.0 : 1.0
  return Math.round((sensitivity * 0.3 + privilege * 0.25 + mfa * 0.15 + approval * 0.1) * 100) / 100
}

async function registerAccess(
  db: D1Database,
  workspaceId: string,
  userId: string,
  input: Record<string, unknown>
): Promise<string> {
  const userName = input.userName as string
  const userEmail = input.userEmail as string
  const systemName = input.systemName as string
  const role = input.role as string
  const approvedBy = (input.approvedBy as string) || null
  const ticketRef = (input.ticketRef as string) || null
  const now = new Date().toISOString()

  // Find system by name
  const system = await db
    .prepare(`SELECT id, classification, data_sensitivity, mfa_required FROM systems WHERE workspace_id = ? AND name = ?`)
    .bind(workspaceId, systemName)
    .first<{ id: string; classification: string; data_sensitivity: string; mfa_required: number }>()

  if (!system) {
    return JSON.stringify({
      error: `System "${systemName}" not found in this workspace. Please create the system first or check the name.`,
    })
  }

  // Find or create directory user
  let dirUser = await db
    .prepare(`SELECT id FROM directory_users WHERE workspace_id = ? AND email = ?`)
    .bind(workspaceId, userEmail)
    .first<{ id: string }>()

  if (!dirUser) {
    const dirUserId = generateId()
    await db
      .prepare(
        `INSERT INTO directory_users (id, workspace_id, email, name, employment_status, source, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'active', 'chat', ?, ?)`
      )
      .bind(dirUserId, workspaceId, userEmail, userName, now, now)
      .run()
    dirUser = { id: dirUserId }
  }

  // Create access record
  const recordId = generateId()
  const riskScore = computeRiskScore(system, role, approvedBy)

  await db
    .prepare(
      `INSERT INTO access_records (id, workspace_id, user_id, system_id, role, access_type, granted_at, granted_by, approved_by, ticket_ref, risk_score, source, created_at)
       VALUES (?, ?, ?, ?, ?, 'permanent', ?, ?, ?, ?, ?, 'chat', ?)`
    )
    .bind(
      recordId,
      workspaceId,
      dirUser.id,
      system.id,
      role,
      now,
      userId,
      approvedBy,
      ticketRef,
      riskScore,
      now
    )
    .run()

  // Emit compliance event
  await emitEvent(db, {
    workspaceId,
    eventType: 'access.granted',
    entityType: 'access_record',
    entityId: recordId,
    data: { userName, userEmail, systemName, role, riskScore, source: 'chat' },
    actorId: userId,
  })

  return JSON.stringify({
    success: true,
    record: {
      id: recordId,
      userName,
      userEmail,
      systemName,
      role,
      approvedBy,
      ticketRef,
      riskScore,
      grantedAt: now,
    },
  })
}

// ─── check_evidence_gaps ──────────────────────────────────────────────

async function checkEvidenceGaps(
  db: D1Database,
  workspaceId: string,
  input: Record<string, unknown>
): Promise<string> {
  const framework = input.framework as string | undefined

  let sql = `
    SELECT vc.id, vc.control_id, vc.title, vc.domain, vc.evidence_requirements, f.name AS framework_name, f.slug AS framework_slug
    FROM versioned_controls vc
    JOIN framework_versions fv ON vc.framework_version_id = fv.id
    JOIN frameworks f ON fv.framework_id = f.id
    JOIN workspace_adoptions wa ON wa.framework_version_id = fv.id AND wa.workspace_id = ?
    WHERE wa.superseded_by IS NULL
      AND vc.deprecated = 0
      AND vc.id NOT IN (
        SELECT DISTINCT el.control_id FROM evidence_links el WHERE el.workspace_id = ?
      )
  `
  const binds: unknown[] = [workspaceId, workspaceId]

  if (framework) {
    sql += ` AND f.slug = ?`
    binds.push(framework)
  }

  sql += ` ORDER BY f.slug, vc.control_id ASC LIMIT 30`

  const { results } = await db
    .prepare(sql)
    .bind(...binds)
    .all<{
      id: string
      control_id: string
      title: string
      domain: string | null
      evidence_requirements: string
      framework_name: string
      framework_slug: string
    }>()

  return JSON.stringify({
    gaps: results.map((r) => ({
      controlId: r.control_id,
      title: r.title,
      domain: r.domain,
      framework: r.framework_name,
      frameworkSlug: r.framework_slug,
      evidenceRequirements: JSON.parse(r.evidence_requirements || '[]'),
    })),
    totalGaps: results.length,
  })
}

// ─── list_violations ──────────────────────────────────────────────────

async function listViolations(
  db: D1Database,
  workspaceId: string,
  input: Record<string, unknown>
): Promise<string> {
  const status = (input.status as string) || 'open'

  const { results } = await db
    .prepare(
      `SELECT bv.id, bv.entity_type, bv.entity_id, bv.violation_detail, bv.status,
              bv.detected_at, bv.resolved_at, bv.exemption_reason,
              b.name AS baseline_name, b.severity, b.category
       FROM baseline_violations bv
       JOIN baselines b ON bv.baseline_id = b.id
       WHERE bv.workspace_id = ? AND bv.status = ?
       ORDER BY bv.detected_at DESC
       LIMIT 20`
    )
    .bind(workspaceId, status)
    .all<{
      id: string
      entity_type: string
      entity_id: string
      violation_detail: string
      status: string
      detected_at: string
      resolved_at: string | null
      exemption_reason: string | null
      baseline_name: string
      severity: string
      category: string
    }>()

  return JSON.stringify({
    violations: results.map((r) => ({
      id: r.id,
      baselineName: r.baseline_name,
      severity: r.severity,
      category: r.category,
      entityType: r.entity_type,
      entityId: r.entity_id,
      detail: JSON.parse(r.violation_detail || '{}'),
      status: r.status,
      detectedAt: r.detected_at,
      resolvedAt: r.resolved_at,
      exemptionReason: r.exemption_reason,
    })),
    total: results.length,
  })
}
