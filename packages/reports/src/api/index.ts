import { Hono } from 'hono'
import { generateId } from './id.js'

type ReportsAppType = {
  Bindings: {
    DB: D1Database
    EVIDENCE_BUCKET: R2Bucket
    ENVIRONMENT: string
    ANTHROPIC_API_KEY: string
  }
  Variables: {
    userId: string
    workspaceId: string
    memberRole: string
  }
}

function now() { return new Date().toISOString() }

export function createReportsAPI() {
  const api = new Hono<ReportsAppType>()

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 2: Template System
  // ═══════════════════════════════════════════════════════════════════════

  // List available library templates
  api.get('/templates/library', async (c) => {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM report_template_library ORDER BY category, name'
    ).all()
    return c.json({ data: results })
  })

  // Adopt templates from library
  api.post('/templates/from-library', async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const body = await c.req.json<{ templateIds: string[] }>()
    if (!body.templateIds?.length) return c.json({ error: 'templateIds required' }, 400)

    const existing = await c.env.DB.prepare(
      'SELECT template_library_id FROM report_templates WHERE workspace_id = ? AND template_library_id IS NOT NULL'
    ).bind(workspaceId).all<{ template_library_id: string }>()
    const existingSet = new Set(existing.results.map(r => r.template_library_id))

    let created = 0
    const ts = now()
    for (const templateId of body.templateIds) {
      if (existingSet.has(templateId)) continue
      const id = generateId()
      await c.env.DB.prepare(
        'INSERT INTO report_templates (id, workspace_id, template_library_id, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(id, workspaceId, templateId, userId, ts, ts).run()
      created++
    }
    return c.json({ created }, 201)
  })

  // List workspace templates (with COALESCE from library)
  api.get('/templates', async (c) => {
    const workspaceId = c.get('workspaceId')
    const { results } = await c.env.DB.prepare(`
      SELECT rt.id, rt.workspace_id, rt.template_library_id, rt.framework_id,
             COALESCE(rt.name, rtl.name) AS name,
             COALESCE(rt.description, rtl.description) AS description,
             COALESCE(rt.content, rtl.content) AS content,
             COALESCE(rt.variables, rtl.variables) AS variables,
             COALESCE(rt.sections, rtl.sections) AS sections,
             rt.is_default, rt.created_by, rt.created_at, rt.updated_at,
             rtl.framework_slug, rtl.category
      FROM report_templates rt
      LEFT JOIN report_template_library rtl ON rt.template_library_id = rtl.id
      WHERE rt.workspace_id = ?
      ORDER BY rt.created_at DESC
    `).bind(workspaceId).all()
    return c.json({ data: results })
  })

  // Create custom template
  api.post('/templates', async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const body = await c.req.json<{ name: string; description?: string; frameworkId?: string; content?: string; variables?: string; sections?: string }>()
    if (!body.name) return c.json({ error: 'name is required' }, 400)

    const id = generateId()
    const ts = now()
    await c.env.DB.prepare(
      `INSERT INTO report_templates (id, workspace_id, name, description, framework_id, content, variables, sections, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, workspaceId, body.name, body.description || null, body.frameworkId || null,
      body.content || '{"type":"doc","content":[]}', body.variables || '[]', body.sections || '[]',
      userId, ts, ts).run()

    return c.json({ id }, 201)
  })

  // Get template
  api.get('/templates/:templateId', async (c) => {
    const workspaceId = c.get('workspaceId')
    const templateId = c.req.param('templateId')
    const row = await c.env.DB.prepare(`
      SELECT rt.*, COALESCE(rt.name, rtl.name) AS name,
             COALESCE(rt.description, rtl.description) AS description,
             COALESCE(rt.content, rtl.content) AS content,
             COALESCE(rt.variables, rtl.variables) AS variables,
             COALESCE(rt.sections, rtl.sections) AS sections,
             rtl.framework_slug, rtl.category
      FROM report_templates rt
      LEFT JOIN report_template_library rtl ON rt.template_library_id = rtl.id
      WHERE rt.id = ? AND rt.workspace_id = ?
    `).bind(templateId, workspaceId).first()
    if (!row) return c.json({ error: 'Template not found' }, 404)
    return c.json(row)
  })

  // Update template
  api.put('/templates/:templateId', async (c) => {
    const workspaceId = c.get('workspaceId')
    const templateId = c.req.param('templateId')
    const body = await c.req.json<{ name?: string; description?: string; content?: string; variables?: string; sections?: string }>()

    const existing = await c.env.DB.prepare(
      'SELECT id FROM report_templates WHERE id = ? AND workspace_id = ?'
    ).bind(templateId, workspaceId).first()
    if (!existing) return c.json({ error: 'Template not found' }, 404)

    const sets: string[] = []
    const vals: any[] = []
    if (body.name !== undefined) { sets.push('name = ?'); vals.push(body.name) }
    if (body.description !== undefined) { sets.push('description = ?'); vals.push(body.description) }
    if (body.content !== undefined) { sets.push('content = ?'); vals.push(body.content) }
    if (body.variables !== undefined) { sets.push('variables = ?'); vals.push(body.variables) }
    if (body.sections !== undefined) { sets.push('sections = ?'); vals.push(body.sections) }
    sets.push('updated_at = ?'); vals.push(now())
    vals.push(templateId, workspaceId)

    await c.env.DB.prepare(
      `UPDATE report_templates SET ${sets.join(', ')} WHERE id = ? AND workspace_id = ?`
    ).bind(...vals).run()

    return c.json({ success: true })
  })

  // Delete template
  api.delete('/templates/:templateId', async (c) => {
    const workspaceId = c.get('workspaceId')
    const templateId = c.req.param('templateId')
    await c.env.DB.prepare(
      'DELETE FROM report_templates WHERE id = ? AND workspace_id = ?'
    ).bind(templateId, workspaceId).run()
    return c.json({ success: true })
  })

  // Duplicate template
  api.post('/templates/:templateId/duplicate', async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const templateId = c.req.param('templateId')

    const source = await c.env.DB.prepare(`
      SELECT COALESCE(rt.name, rtl.name) AS name,
             COALESCE(rt.description, rtl.description) AS description,
             COALESCE(rt.content, rtl.content) AS content,
             COALESCE(rt.variables, rtl.variables) AS variables,
             COALESCE(rt.sections, rtl.sections) AS sections,
             rt.framework_id
      FROM report_templates rt
      LEFT JOIN report_template_library rtl ON rt.template_library_id = rtl.id
      WHERE rt.id = ? AND rt.workspace_id = ?
    `).bind(templateId, workspaceId).first<any>()
    if (!source) return c.json({ error: 'Template not found' }, 404)

    const id = generateId()
    const ts = now()
    await c.env.DB.prepare(
      `INSERT INTO report_templates (id, workspace_id, name, description, content, variables, sections, framework_id, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, workspaceId, `${source.name} (Copy)`, source.description, source.content,
      source.variables, source.sections, source.framework_id, userId, ts, ts).run()

    return c.json({ id }, 201)
  })

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 3: Report Generation & Management
  // ═══════════════════════════════════════════════════════════════════════

  // List reports
  api.get('/', async (c) => {
    const workspaceId = c.get('workspaceId')
    const status = c.req.query('status')
    const projectId = c.req.query('projectId')

    let sql = 'SELECT * FROM reports WHERE workspace_id = ?'
    const params: any[] = [workspaceId]
    if (status) { sql += ' AND status = ?'; params.push(status) }
    if (projectId) { sql += ' AND project_id = ?'; params.push(projectId) }
    sql += ' ORDER BY updated_at DESC'

    const { results } = await c.env.DB.prepare(sql).bind(...params).all()
    return c.json({
      data: results.map((r: any) => ({
        id: r.id, workspaceId: r.workspace_id, templateId: r.template_id,
        projectId: r.project_id, name: r.name, status: r.status,
        auditPeriodStart: r.audit_period_start, auditPeriodEnd: r.audit_period_end,
        createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at,
        lockedAt: r.locked_at, lockedBy: r.locked_by,
      })),
    })
  })

  // Create report from template
  api.post('/', async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const body = await c.req.json<{ templateId: string; projectId?: string; name: string; auditPeriodStart?: string; auditPeriodEnd?: string; variables?: Record<string, string> }>()

    if (!body.templateId || !body.name) return c.json({ error: 'templateId and name are required' }, 400)

    // Fetch template content
    const template = await c.env.DB.prepare(`
      SELECT COALESCE(rt.content, rtl.content) AS content,
             COALESCE(rt.variables, rtl.variables) AS variables
      FROM report_templates rt
      LEFT JOIN report_template_library rtl ON rt.template_library_id = rtl.id
      WHERE rt.id = ? AND rt.workspace_id = ?
    `).bind(body.templateId, workspaceId).first<any>()
    if (!template) return c.json({ error: 'Template not found' }, 404)

    const id = generateId()
    const ts = now()
    const resolvedVars = JSON.stringify(body.variables || {})

    await c.env.DB.prepare(
      `INSERT INTO reports (id, workspace_id, template_id, project_id, name, status, content, resolved_variables, audit_period_start, audit_period_end, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, workspaceId, body.templateId, body.projectId || null, body.name,
      template.content, resolvedVars, body.auditPeriodStart || null, body.auditPeriodEnd || null,
      userId, ts, ts).run()

    // Create initial version
    const versionId = generateId()
    await c.env.DB.prepare(
      `INSERT INTO report_versions (id, report_id, version, content, changed_by, changed_at, change_type, change_description)
       VALUES (?, ?, 1, ?, ?, ?, 'created', 'Initial report created from template')`
    ).bind(versionId, id, template.content, userId, ts).run()

    return c.json({ id }, 201)
  })

  // Get report
  api.get('/:reportId', async (c) => {
    const workspaceId = c.get('workspaceId')
    const reportId = c.req.param('reportId')
    const row = await c.env.DB.prepare(
      'SELECT * FROM reports WHERE id = ? AND workspace_id = ?'
    ).bind(reportId, workspaceId).first<any>()
    if (!row) return c.json({ error: 'Report not found' }, 404)

    return c.json({
      id: row.id, workspaceId: row.workspace_id, templateId: row.template_id,
      projectId: row.project_id, name: row.name, status: row.status,
      content: row.content, resolvedVariables: row.resolved_variables,
      auditPeriodStart: row.audit_period_start, auditPeriodEnd: row.audit_period_end,
      createdBy: row.created_by, createdAt: row.created_at, updatedAt: row.updated_at,
      lockedAt: row.locked_at, lockedBy: row.locked_by,
    })
  })

  // Update report
  api.put('/:reportId', async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const reportId = c.req.param('reportId')
    const body = await c.req.json<{ name?: string; content?: string }>()

    const report = await c.env.DB.prepare(
      'SELECT status FROM reports WHERE id = ? AND workspace_id = ?'
    ).bind(reportId, workspaceId).first<any>()
    if (!report) return c.json({ error: 'Report not found' }, 404)
    if (report.status === 'approved' || report.status === 'published') {
      return c.json({ error: 'Report is locked and cannot be edited' }, 403)
    }

    const sets: string[] = []
    const vals: any[] = []
    if (body.name !== undefined) { sets.push('name = ?'); vals.push(body.name) }
    if (body.content !== undefined) { sets.push('content = ?'); vals.push(body.content) }
    sets.push('updated_at = ?'); vals.push(now())
    vals.push(reportId, workspaceId)

    await c.env.DB.prepare(
      `UPDATE reports SET ${sets.join(', ')} WHERE id = ? AND workspace_id = ?`
    ).bind(...vals).run()

    // Create version for content changes
    if (body.content !== undefined) {
      const lastVersion = await c.env.DB.prepare(
        'SELECT MAX(version) as v FROM report_versions WHERE report_id = ?'
      ).bind(reportId).first<any>()
      const nextVersion = (lastVersion?.v || 0) + 1
      const versionId = generateId()
      await c.env.DB.prepare(
        `INSERT INTO report_versions (id, report_id, version, content, changed_by, changed_at, change_type)
         VALUES (?, ?, ?, ?, ?, ?, 'edit')`
      ).bind(versionId, reportId, nextVersion, body.content, userId, now()).run()
    }

    return c.json({ success: true })
  })

  // Delete report
  api.delete('/:reportId', async (c) => {
    const workspaceId = c.get('workspaceId')
    const reportId = c.req.param('reportId')
    // Cascading deletes handle versions, findings, approvals, exports
    await c.env.DB.prepare(
      'DELETE FROM reports WHERE id = ? AND workspace_id = ?'
    ).bind(reportId, workspaceId).run()
    return c.json({ success: true })
  })

  // Status transition
  api.patch('/:reportId/status', async (c) => {
    const workspaceId = c.get('workspaceId')
    const reportId = c.req.param('reportId')
    const body = await c.req.json<{ status: string }>()

    const validTransitions: Record<string, string[]> = {
      draft: ['review'],
      review: ['draft', 'approved'],
      approved: ['review', 'published'],
      published: [],
    }

    const report = await c.env.DB.prepare(
      'SELECT status FROM reports WHERE id = ? AND workspace_id = ?'
    ).bind(reportId, workspaceId).first<any>()
    if (!report) return c.json({ error: 'Report not found' }, 404)

    const allowed = validTransitions[report.status] || []
    if (!allowed.includes(body.status)) {
      return c.json({ error: `Cannot transition from ${report.status} to ${body.status}` }, 400)
    }

    const updates: any = { status: body.status, updated_at: now() }
    if (body.status === 'approved' || body.status === 'published') {
      updates.locked_at = now()
      updates.locked_by = c.get('userId')
    }

    await c.env.DB.prepare(
      'UPDATE reports SET status = ?, updated_at = ?, locked_at = ?, locked_by = ? WHERE id = ? AND workspace_id = ?'
    ).bind(updates.status, updates.updated_at, updates.locked_at || null, updates.locked_by || null, reportId, workspaceId).run()

    return c.json({ success: true })
  })

  // List versions
  api.get('/:reportId/versions', async (c) => {
    const workspaceId = c.get('workspaceId')
    const reportId = c.req.param('reportId')

    const report = await c.env.DB.prepare(
      'SELECT id FROM reports WHERE id = ? AND workspace_id = ?'
    ).bind(reportId, workspaceId).first()
    if (!report) return c.json({ error: 'Report not found' }, 404)

    const { results } = await c.env.DB.prepare(
      'SELECT id, report_id, version, changed_by, changed_at, change_type, change_description FROM report_versions WHERE report_id = ? ORDER BY version DESC'
    ).bind(reportId).all()
    return c.json({ data: results })
  })

  // Get specific version
  api.get('/:reportId/versions/:version', async (c) => {
    const reportId = c.req.param('reportId')
    const version = parseInt(c.req.param('version'))
    const row = await c.env.DB.prepare(
      'SELECT * FROM report_versions WHERE report_id = ? AND version = ?'
    ).bind(reportId, version).first()
    if (!row) return c.json({ error: 'Version not found' }, 404)
    return c.json(row)
  })

  // Revert to version
  api.post('/:reportId/revert/:version', async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const reportId = c.req.param('reportId')
    const version = parseInt(c.req.param('version'))

    const report = await c.env.DB.prepare(
      'SELECT status FROM reports WHERE id = ? AND workspace_id = ?'
    ).bind(reportId, workspaceId).first<any>()
    if (!report) return c.json({ error: 'Report not found' }, 404)
    if (report.status === 'approved' || report.status === 'published') {
      return c.json({ error: 'Cannot revert a locked report' }, 403)
    }

    const versionRow = await c.env.DB.prepare(
      'SELECT content FROM report_versions WHERE report_id = ? AND version = ?'
    ).bind(reportId, version).first<any>()
    if (!versionRow) return c.json({ error: 'Version not found' }, 404)

    const ts = now()
    await c.env.DB.prepare(
      'UPDATE reports SET content = ?, updated_at = ? WHERE id = ? AND workspace_id = ?'
    ).bind(versionRow.content, ts, reportId, workspaceId).run()

    // Create a new version for the revert
    const lastVersion = await c.env.DB.prepare(
      'SELECT MAX(version) as v FROM report_versions WHERE report_id = ?'
    ).bind(reportId).first<any>()
    const nextVersion = (lastVersion?.v || 0) + 1
    const versionId = generateId()
    await c.env.DB.prepare(
      `INSERT INTO report_versions (id, report_id, version, content, changed_by, changed_at, change_type, change_description)
       VALUES (?, ?, ?, ?, ?, ?, 'revert', ?)`
    ).bind(versionId, reportId, nextVersion, versionRow.content, userId, ts, `Reverted to version ${version}`).run()

    return c.json({ success: true })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 4: AI-Assisted Drafting
  // ═══════════════════════════════════════════════════════════════════════

  async function handleAIDraft(c: any, reportId: string, action: string, extraPrompt?: string) {
    const workspaceId = c.get('workspaceId')
    const body = await c.req.json().catch(() => ({})) as { sectionId?: string; prompt?: string }

    const report = await c.env.DB.prepare(
      'SELECT * FROM reports WHERE id = ? AND workspace_id = ?'
    ).bind(reportId, workspaceId).first()
    if (!report) return c.json({ error: 'Report not found' }, 404)

    // Gather context
    const findings = await c.env.DB.prepare(
      'SELECT severity, title, status FROM report_findings WHERE report_id = ?'
    ).bind(reportId).all()

    const systemPrompt = `You are an expert compliance auditor writing a professional audit report.
Organization context: ${report.resolved_variables || '{}'}
Audit period: ${report.audit_period_start || 'N/A'} to ${report.audit_period_end || 'N/A'}
Report status: ${report.status}
Findings summary: ${JSON.stringify(findings.results?.slice(0, 20) || [])}
${extraPrompt || ''}`

    const userPrompt = body.prompt || `${action} for section: ${body.sectionId || 'general'}`

    // Stream response via SSE
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': c.env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 4096,
              stream: true,
              system: systemPrompt,
              messages: [{ role: 'user', content: userPrompt }],
            }),
          })

          const reader = response.body?.getReader()
          if (!reader) { controller.close(); return }

          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })

            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') continue
                try {
                  const parsed = JSON.parse(data)
                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`))
                  }
                } catch {}
              }
            }
          }
        } catch (err: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`))
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  }

  api.post('/:reportId/ai/draft-section', async (c) => {
    return handleAIDraft(c, c.req.param('reportId'), 'Draft this section with professional audit language')
  })

  api.post('/:reportId/ai/executive-summary', async (c) => {
    return handleAIDraft(c, c.req.param('reportId'), 'Write a concise executive summary covering key findings, overall compliance posture, and recommendations',
      'Focus on: overall pass rate, critical findings count, key risks, and certification readiness.')
  })

  api.post('/:reportId/ai/finding-narrative', async (c) => {
    return handleAIDraft(c, c.req.param('reportId'), 'Generate a professional finding narrative with condition, criteria, cause, effect, and recommendation')
  })

  api.post('/:reportId/ai/gap-analysis', async (c) => {
    return handleAIDraft(c, c.req.param('reportId'), 'Identify gaps between controls in scope and linked evidence, listing controls with insufficient evidence')
  })

  api.post('/:reportId/ai/recommendation', async (c) => {
    return handleAIDraft(c, c.req.param('reportId'), 'Generate specific, actionable remediation recommendations for identified findings')
  })

  api.post('/:reportId/ai/evidence-sufficiency', async (c) => {
    return handleAIDraft(c, c.req.param('reportId'), 'Assess evidence sufficiency for all controls in scope, flag controls with missing or expired evidence')
  })

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 5: PDF Export
  // ═══════════════════════════════════════════════════════════════════════

  api.post('/:reportId/export/pdf', async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const reportId = c.req.param('reportId')

    const report = await c.env.DB.prepare(
      'SELECT * FROM reports WHERE id = ? AND workspace_id = ?'
    ).bind(reportId, workspaceId).first<any>()
    if (!report) return c.json({ error: 'Report not found' }, 404)

    // Render HTML from content
    const html = renderReportHTML(report)

    // Store HTML as PDF placeholder in R2 (actual Puppeteer rendering requires browser binding)
    const r2Key = `reports/${workspaceId}/${reportId}/${Date.now()}.html`
    await c.env.EVIDENCE_BUCKET.put(r2Key, html, { httpMetadata: { contentType: 'text/html' } })

    // Get current version
    const lastVersion = await c.env.DB.prepare(
      'SELECT MAX(version) as v FROM report_versions WHERE report_id = ?'
    ).bind(reportId).first<any>()

    const exportId = generateId()
    const ts = now()
    await c.env.DB.prepare(
      `INSERT INTO report_exports (id, report_id, version, format, r2_key, file_size, generated_at, generated_by)
       VALUES (?, ?, ?, 'pdf', ?, ?, ?, ?)`
    ).bind(exportId, reportId, lastVersion?.v || 1, r2Key, html.length, ts, userId).run()

    return c.json({ exportId, r2Key }, 201)
  })

  api.get('/:reportId/exports', async (c) => {
    const workspaceId = c.get('workspaceId')
    const reportId = c.req.param('reportId')

    const report = await c.env.DB.prepare(
      'SELECT id FROM reports WHERE id = ? AND workspace_id = ?'
    ).bind(reportId, workspaceId).first()
    if (!report) return c.json({ error: 'Report not found' }, 404)

    const { results } = await c.env.DB.prepare(
      'SELECT * FROM report_exports WHERE report_id = ? ORDER BY generated_at DESC'
    ).bind(reportId).all()
    return c.json({ data: results })
  })

  api.get('/:reportId/exports/:exportId/download', async (c) => {
    const workspaceId = c.get('workspaceId')
    const reportId = c.req.param('reportId')
    const exportId = c.req.param('exportId')

    const exp = await c.env.DB.prepare(
      'SELECT re.* FROM report_exports re JOIN reports r ON re.report_id = r.id WHERE re.id = ? AND re.report_id = ? AND r.workspace_id = ?'
    ).bind(exportId, reportId, workspaceId).first<any>()
    if (!exp) return c.json({ error: 'Export not found' }, 404)

    const object = await c.env.EVIDENCE_BUCKET.get(exp.r2_key)
    if (!object) return c.json({ error: 'File not found in storage' }, 404)

    return new Response(object.body, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="report-${reportId}.html"`,
      },
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 6: Findings Management
  // ═══════════════════════════════════════════════════════════════════════

  api.get('/:reportId/findings', async (c) => {
    const workspaceId = c.get('workspaceId')
    const reportId = c.req.param('reportId')

    const report = await c.env.DB.prepare(
      'SELECT id FROM reports WHERE id = ? AND workspace_id = ?'
    ).bind(reportId, workspaceId).first()
    if (!report) return c.json({ error: 'Report not found' }, 404)

    const { results } = await c.env.DB.prepare(
      'SELECT * FROM report_findings WHERE report_id = ? ORDER BY severity, created_at DESC'
    ).bind(reportId).all()

    return c.json({
      data: results.map((f: any) => ({
        id: f.id, reportId: f.report_id, workspaceId: f.workspace_id,
        controlId: f.control_id, sectionId: f.section_id, severity: f.severity,
        findingType: f.finding_type, title: f.title, condition: f.condition,
        criteria: f.criteria, cause: f.cause, effect: f.effect,
        recommendation: f.recommendation, managementResponse: f.management_response,
        managementResponseBy: f.management_response_by, managementResponseAt: f.management_response_at,
        remediationDueDate: f.remediation_due_date, remediationOwner: f.remediation_owner,
        status: f.status, isRepeat: !!f.is_repeat, priorFindingId: f.prior_finding_id,
        createdBy: f.created_by, createdAt: f.created_at, updatedAt: f.updated_at,
      })),
    })
  })

  api.post('/:reportId/findings', async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const reportId = c.req.param('reportId')
    const body = await c.req.json<any>()

    const report = await c.env.DB.prepare(
      'SELECT id FROM reports WHERE id = ? AND workspace_id = ?'
    ).bind(reportId, workspaceId).first()
    if (!report) return c.json({ error: 'Report not found' }, 404)

    const id = generateId()
    const ts = now()
    await c.env.DB.prepare(
      `INSERT INTO report_findings (id, report_id, workspace_id, control_id, section_id, severity, finding_type, title, condition, criteria, cause, effect, recommendation, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)`
    ).bind(id, reportId, workspaceId, body.controlId || null, body.sectionId || null,
      body.severity || 'medium', body.findingType || 'deficiency', body.title,
      body.condition || null, body.criteria || null, body.cause || null,
      body.effect || null, body.recommendation || null, userId, ts, ts).run()

    return c.json({ id }, 201)
  })

  api.put('/:reportId/findings/:findingId', async (c) => {
    const workspaceId = c.get('workspaceId')
    const reportId = c.req.param('reportId')
    const findingId = c.req.param('findingId')
    const body = await c.req.json<any>()

    const fields = ['severity', 'finding_type', 'title', 'condition', 'criteria', 'cause', 'effect', 'recommendation', 'section_id', 'control_id']
    const fieldMap: Record<string, string> = {
      severity: 'severity', findingType: 'finding_type', title: 'title',
      condition: 'condition', criteria: 'criteria', cause: 'cause',
      effect: 'effect', recommendation: 'recommendation',
      sectionId: 'section_id', controlId: 'control_id',
    }

    const sets: string[] = []
    const vals: any[] = []
    for (const [jsKey, dbKey] of Object.entries(fieldMap)) {
      if (body[jsKey] !== undefined) { sets.push(`${dbKey} = ?`); vals.push(body[jsKey]) }
    }
    if (sets.length === 0) return c.json({ error: 'No fields to update' }, 400)
    sets.push('updated_at = ?'); vals.push(now())
    vals.push(findingId, reportId, workspaceId)

    await c.env.DB.prepare(
      `UPDATE report_findings SET ${sets.join(', ')} WHERE id = ? AND report_id = ? AND workspace_id = ?`
    ).bind(...vals).run()
    return c.json({ success: true })
  })

  api.delete('/:reportId/findings/:findingId', async (c) => {
    const workspaceId = c.get('workspaceId')
    const reportId = c.req.param('reportId')
    const findingId = c.req.param('findingId')
    await c.env.DB.prepare(
      'DELETE FROM report_findings WHERE id = ? AND report_id = ? AND workspace_id = ?'
    ).bind(findingId, reportId, workspaceId).run()
    return c.json({ success: true })
  })

  api.patch('/:reportId/findings/:findingId/status', async (c) => {
    const workspaceId = c.get('workspaceId')
    const reportId = c.req.param('reportId')
    const findingId = c.req.param('findingId')
    const body = await c.req.json<{ status: string }>()

    const validStatuses = ['open', 'acknowledged', 'remediation_planned', 'remediated', 'validated', 'closed', 'reopened']
    if (!validStatuses.includes(body.status)) return c.json({ error: 'Invalid status' }, 400)

    await c.env.DB.prepare(
      'UPDATE report_findings SET status = ?, updated_at = ? WHERE id = ? AND report_id = ? AND workspace_id = ?'
    ).bind(body.status, now(), findingId, reportId, workspaceId).run()
    return c.json({ success: true })
  })

  api.post('/:reportId/findings/:findingId/response', async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const reportId = c.req.param('reportId')
    const findingId = c.req.param('findingId')
    const body = await c.req.json<{ response: string; remediationDueDate?: string; remediationOwner?: string }>()

    const ts = now()
    await c.env.DB.prepare(
      `UPDATE report_findings SET management_response = ?, management_response_by = ?, management_response_at = ?,
       remediation_due_date = ?, remediation_owner = ?, status = 'acknowledged', updated_at = ?
       WHERE id = ? AND report_id = ? AND workspace_id = ?`
    ).bind(body.response, userId, ts, body.remediationDueDate || null,
      body.remediationOwner || null, ts, findingId, reportId, workspaceId).run()
    return c.json({ success: true })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 7: Sign-off & Approval Workflow
  // ═══════════════════════════════════════════════════════════════════════

  api.post('/:reportId/submit-review', async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const reportId = c.req.param('reportId')
    const body = await c.req.json<{ comment?: string }>().catch(() => ({} as { comment?: string }))

    const report = await c.env.DB.prepare(
      'SELECT status FROM reports WHERE id = ? AND workspace_id = ?'
    ).bind(reportId, workspaceId).first<any>()
    if (!report) return c.json({ error: 'Report not found' }, 404)
    if (report.status !== 'draft') return c.json({ error: 'Only draft reports can be submitted for review' }, 400)

    const ts = now()
    await c.env.DB.prepare(
      'UPDATE reports SET status = ?, updated_at = ? WHERE id = ? AND workspace_id = ?'
    ).bind('review', ts, reportId, workspaceId).run()

    const lastVersion = await c.env.DB.prepare(
      'SELECT MAX(version) as v FROM report_versions WHERE report_id = ?'
    ).bind(reportId).first<any>()

    const approvalId = generateId()
    await c.env.DB.prepare(
      `INSERT INTO report_approvals (id, report_id, version, role, user_id, action, comment, signed_at)
       VALUES (?, ?, ?, 'preparer', ?, 'submitted', ?, ?)`
    ).bind(approvalId, reportId, lastVersion?.v || 1, userId, body.comment || null, ts).run()

    return c.json({ success: true })
  })

  api.post('/:reportId/approve', async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const reportId = c.req.param('reportId')
    const body = await c.req.json<{ comment?: string }>().catch(() => ({} as { comment?: string }))

    const report = await c.env.DB.prepare(
      'SELECT status FROM reports WHERE id = ? AND workspace_id = ?'
    ).bind(reportId, workspaceId).first<any>()
    if (!report) return c.json({ error: 'Report not found' }, 404)
    if (report.status !== 'review') return c.json({ error: 'Only reports in review can be approved' }, 400)

    const ts = now()
    await c.env.DB.prepare(
      'UPDATE reports SET status = ?, locked_at = ?, locked_by = ?, updated_at = ? WHERE id = ? AND workspace_id = ?'
    ).bind('approved', ts, userId, ts, reportId, workspaceId).run()

    const lastVersion = await c.env.DB.prepare(
      'SELECT MAX(version) as v FROM report_versions WHERE report_id = ?'
    ).bind(reportId).first<any>()

    const approvalId = generateId()
    await c.env.DB.prepare(
      `INSERT INTO report_approvals (id, report_id, version, role, user_id, action, comment, signed_at)
       VALUES (?, ?, ?, 'reviewer', ?, 'approved', ?, ?)`
    ).bind(approvalId, reportId, lastVersion?.v || 1, userId, body.comment || null, ts).run()

    return c.json({ success: true })
  })

  api.post('/:reportId/reject', async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const reportId = c.req.param('reportId')
    const body = await c.req.json<{ comment?: string }>().catch(() => ({} as { comment?: string }))

    const report = await c.env.DB.prepare(
      'SELECT status FROM reports WHERE id = ? AND workspace_id = ?'
    ).bind(reportId, workspaceId).first<any>()
    if (!report) return c.json({ error: 'Report not found' }, 404)
    if (report.status !== 'review' && report.status !== 'approved') {
      return c.json({ error: 'Can only reject reports in review or approved status' }, 400)
    }

    const ts = now()
    await c.env.DB.prepare(
      'UPDATE reports SET status = ?, locked_at = NULL, locked_by = NULL, updated_at = ? WHERE id = ? AND workspace_id = ?'
    ).bind('draft', ts, reportId, workspaceId).run()

    const lastVersion = await c.env.DB.prepare(
      'SELECT MAX(version) as v FROM report_versions WHERE report_id = ?'
    ).bind(reportId).first<any>()

    const approvalId = generateId()
    await c.env.DB.prepare(
      `INSERT INTO report_approvals (id, report_id, version, role, user_id, action, comment, signed_at)
       VALUES (?, ?, ?, 'reviewer', ?, 'rejected', ?, ?)`
    ).bind(approvalId, reportId, lastVersion?.v || 1, userId, body.comment || null, ts).run()

    return c.json({ success: true })
  })

  api.post('/:reportId/publish', async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const reportId = c.req.param('reportId')

    const report = await c.env.DB.prepare(
      'SELECT status FROM reports WHERE id = ? AND workspace_id = ?'
    ).bind(reportId, workspaceId).first<any>()
    if (!report) return c.json({ error: 'Report not found' }, 404)
    if (report.status !== 'approved') return c.json({ error: 'Only approved reports can be published' }, 400)

    const ts = now()
    await c.env.DB.prepare(
      'UPDATE reports SET status = ?, locked_at = ?, locked_by = ?, updated_at = ? WHERE id = ? AND workspace_id = ?'
    ).bind('published', ts, userId, ts, reportId, workspaceId).run()

    const lastVersion = await c.env.DB.prepare(
      'SELECT MAX(version) as v FROM report_versions WHERE report_id = ?'
    ).bind(reportId).first<any>()

    const approvalId = generateId()
    await c.env.DB.prepare(
      `INSERT INTO report_approvals (id, report_id, version, role, user_id, action, comment, signed_at)
       VALUES (?, ?, ?, 'approver', ?, 'published', NULL, ?)`
    ).bind(approvalId, reportId, lastVersion?.v || 1, userId, ts).run()

    return c.json({ success: true })
  })

  api.get('/:reportId/approvals', async (c) => {
    const workspaceId = c.get('workspaceId')
    const reportId = c.req.param('reportId')

    const report = await c.env.DB.prepare(
      'SELECT id FROM reports WHERE id = ? AND workspace_id = ?'
    ).bind(reportId, workspaceId).first()
    if (!report) return c.json({ error: 'Report not found' }, 404)

    const { results } = await c.env.DB.prepare(
      'SELECT * FROM report_approvals WHERE report_id = ? ORDER BY signed_at DESC'
    ).bind(reportId).all()
    return c.json({ data: results })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 9: Cross-Framework & Advanced Features
  // ═══════════════════════════════════════════════════════════════════════

  api.get('/compare', async (c) => {
    const workspaceId = c.get('workspaceId')
    const reportA = c.req.query('reportA')
    const reportB = c.req.query('reportB')
    if (!reportA || !reportB) return c.json({ error: 'reportA and reportB query params required' }, 400)

    const a = await c.env.DB.prepare(
      'SELECT content, name, status FROM reports WHERE id = ? AND workspace_id = ?'
    ).bind(reportA, workspaceId).first<any>()
    const b = await c.env.DB.prepare(
      'SELECT content, name, status FROM reports WHERE id = ? AND workspace_id = ?'
    ).bind(reportB, workspaceId).first<any>()

    if (!a || !b) return c.json({ error: 'One or both reports not found' }, 404)
    return c.json({ reportA: { name: a.name, status: a.status, content: a.content }, reportB: { name: b.name, status: b.status, content: b.content } })
  })

  api.post('/bulk-generate', async (c) => {
    const workspaceId = c.get('workspaceId')
    const userId = c.get('userId')
    const body = await c.req.json<{ templateIds: string[]; projectId?: string; namePrefix?: string; auditPeriodStart?: string; auditPeriodEnd?: string }>()

    if (!body.templateIds?.length) return c.json({ error: 'templateIds required' }, 400)

    const reportIds: string[] = []
    const ts = now()

    for (const templateId of body.templateIds) {
      const template = await c.env.DB.prepare(`
        SELECT COALESCE(rt.name, rtl.name) AS name,
               COALESCE(rt.content, rtl.content) AS content
        FROM report_templates rt
        LEFT JOIN report_template_library rtl ON rt.template_library_id = rtl.id
        WHERE rt.id = ? AND rt.workspace_id = ?
      `).bind(templateId, workspaceId).first<any>()
      if (!template) continue

      const id = generateId()
      const name = body.namePrefix ? `${body.namePrefix} — ${template.name}` : template.name
      await c.env.DB.prepare(
        `INSERT INTO reports (id, workspace_id, template_id, project_id, name, status, content, resolved_variables, audit_period_start, audit_period_end, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'draft', ?, '{}', ?, ?, ?, ?, ?)`
      ).bind(id, workspaceId, templateId, body.projectId || null, name,
        template.content, body.auditPeriodStart || null, body.auditPeriodEnd || null,
        userId, ts, ts).run()

      const versionId = generateId()
      await c.env.DB.prepare(
        `INSERT INTO report_versions (id, report_id, version, content, changed_by, changed_at, change_type)
         VALUES (?, ?, 1, ?, ?, ?, 'created')`
      ).bind(versionId, id, template.content, userId, ts).run()

      reportIds.push(id)
    }

    return c.json({ reportIds }, 201)
  })

  api.post('/:reportId/share', async (c) => {
    // Sharing via signed URL — generate a read-only access token
    const workspaceId = c.get('workspaceId')
    const reportId = c.req.param('reportId')
    const body = await c.req.json<{ expiresInHours?: number }>().catch(() => ({} as { expiresInHours?: number }))

    const report = await c.env.DB.prepare(
      'SELECT id, name, status FROM reports WHERE id = ? AND workspace_id = ?'
    ).bind(reportId, workspaceId).first<any>()
    if (!report) return c.json({ error: 'Report not found' }, 404)

    const token = generateId() + generateId()
    const expiresAt = new Date(Date.now() + (body.expiresInHours || 168) * 3600 * 1000).toISOString()

    return c.json({ token, expiresAt, reportId, reportName: report.name })
  })

  api.get('/:reportId/share', async (c) => {
    const workspaceId = c.get('workspaceId')
    const reportId = c.req.param('reportId')

    const report = await c.env.DB.prepare(
      'SELECT id FROM reports WHERE id = ? AND workspace_id = ?'
    ).bind(reportId, workspaceId).first()
    if (!report) return c.json({ error: 'Report not found' }, 404)

    return c.json({ sharing: { enabled: false, links: [] } })
  })

  return api
}

// ── HTML Renderer (Phase 5) ────────────────────────────────────────────────

function renderReportHTML(report: any): string {
  let content = ''
  try {
    const doc = JSON.parse(report.content)
    content = renderNode(doc)
  } catch {
    content = '<p>Unable to render report content</p>'
  }

  const isDraft = report.status !== 'published'
  const watermark = isDraft ? `
    <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);
      font-size:120px;color:rgba(200,200,200,0.15);font-weight:bold;z-index:0;pointer-events:none;">
      DRAFT
    </div>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(report.name)}</title>
  <style>
    @page { size: A4; margin: 2cm 2.5cm; }
    @page :first { margin-top: 0; }
    body { font-family: 'Georgia', 'Times New Roman', serif; font-size: 11pt; line-height: 1.6; color: #1a1a1a; }
    h1 { font-size: 24pt; margin-top: 2em; page-break-after: avoid; border-bottom: 2px solid #333; padding-bottom: 0.3em; }
    h2 { font-size: 16pt; margin-top: 1.5em; page-break-after: avoid; color: #333; }
    h3 { font-size: 13pt; margin-top: 1.2em; page-break-after: avoid; }
    p { margin: 0.5em 0; text-align: justify; }
    table { width: 100%; border-collapse: collapse; margin: 1em 0; page-break-inside: avoid; }
    th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 10pt; }
    th { background: #f5f5f5; font-weight: bold; }
    blockquote { border-left: 3px solid #ccc; padding-left: 1em; margin-left: 0; color: #555; font-style: italic; }
    code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; font-size: 10pt; }
    pre { background: #f4f4f4; padding: 1em; border-radius: 4px; overflow-x: auto; font-size: 9pt; }
    ul, ol { padding-left: 1.5em; }
    hr { border: none; border-top: 1px solid #ccc; margin: 2em 0; }
    .finding-card { border: 1px solid #ccc; border-radius: 6px; padding: 1em; margin: 1em 0; page-break-inside: avoid; }
    .finding-card .severity { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 9pt; font-weight: bold; text-transform: uppercase; }
    .severity-critical { background: #fee; color: #c00; }
    .severity-high { background: #fff3e0; color: #e65100; }
    .severity-medium { background: #fff8e1; color: #f57f17; }
    .severity-low { background: #e3f2fd; color: #1565c0; }
    .variable-placeholder { background: #e8f5e9; padding: 2px 6px; border-radius: 3px; font-style: italic; }
    .cover-page { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 90vh; text-align: center; page-break-after: always; }
    .cover-page h1 { border: none; font-size: 28pt; }
    @media print {
      .cover-page { min-height: 100vh; }
    }
  </style>
</head>
<body>
  ${watermark}
  <div class="cover-page">
    <h1>${escapeHtml(report.name)}</h1>
    ${report.audit_period_start ? `<p>Audit Period: ${report.audit_period_start} to ${report.audit_period_end || 'Present'}</p>` : ''}
    <p>Status: ${report.status.toUpperCase()}</p>
    <p style="margin-top:2em;color:#888;">Generated: ${new Date().toLocaleDateString()}</p>
  </div>
  ${content}
</body>
</html>`
}

function renderNode(node: any): string {
  if (!node) return ''
  if (node.type === 'text') {
    let text = escapeHtml(node.text || '')
    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.type === 'bold') text = `<strong>${text}</strong>`
        if (mark.type === 'italic') text = `<em>${text}</em>`
        if (mark.type === 'underline') text = `<u>${text}</u>`
        if (mark.type === 'strike') text = `<s>${text}</s>`
        if (mark.type === 'code') text = `<code>${text}</code>`
        if (mark.type === 'link') text = `<a href="${escapeHtml(mark.attrs?.href || '')}">${text}</a>`
      }
    }
    return text
  }

  const children = (node.content || []).map(renderNode).join('')

  switch (node.type) {
    case 'doc': return children
    case 'paragraph': return `<p>${children}</p>`
    case 'heading': return `<h${node.attrs?.level || 1}>${children}</h${node.attrs?.level || 1}>`
    case 'bulletList': return `<ul>${children}</ul>`
    case 'orderedList': return `<ol>${children}</ol>`
    case 'listItem': return `<li>${children}</li>`
    case 'blockquote': return `<blockquote>${children}</blockquote>`
    case 'codeBlock': return `<pre><code>${children}</code></pre>`
    case 'horizontalRule': return '<hr>'
    case 'table': return `<table>${children}</table>`
    case 'tableRow': return `<tr>${children}</tr>`
    case 'tableCell': return `<td>${children}</td>`
    case 'tableHeader': return `<th>${children}</th>`
    case 'image': return `<img src="${escapeHtml(node.attrs?.src || '')}" alt="${escapeHtml(node.attrs?.alt || '')}" style="max-width:100%">`
    case 'taskList': return `<ul style="list-style:none;padding-left:0">${children}</ul>`
    case 'taskItem': return `<li>${node.attrs?.checked ? '\u2611' : '\u2610'} ${children}</li>`
    case 'variablePlaceholder': return `<span class="variable-placeholder">{${escapeHtml(node.attrs?.variableKey || '')}}</span>`
    case 'evidenceTable': return `<div><p><em>[Evidence Table — ${(node.attrs?.controlIds || []).length} controls]</em></p></div>`
    case 'findingCard': {
      const sev = node.attrs?.severity || 'medium'
      return `<div class="finding-card">
        <span class="severity severity-${sev}">${sev}</span>
        <strong> ${escapeHtml(node.attrs?.title || 'Finding')}</strong>
        ${node.attrs?.condition ? `<p><strong>Condition:</strong> ${escapeHtml(node.attrs.condition)}</p>` : ''}
        ${node.attrs?.criteria ? `<p><strong>Criteria:</strong> ${escapeHtml(node.attrs.criteria)}</p>` : ''}
        ${node.attrs?.cause ? `<p><strong>Cause:</strong> ${escapeHtml(node.attrs.cause)}</p>` : ''}
        ${node.attrs?.effect ? `<p><strong>Effect:</strong> ${escapeHtml(node.attrs.effect)}</p>` : ''}
        ${node.attrs?.recommendation ? `<p><strong>Recommendation:</strong> ${escapeHtml(node.attrs.recommendation)}</p>` : ''}
      </div>`
    }
    default: return children
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
