/**
 * Email service — reads Brevo config from platform_provider_configs,
 * renders email templates from email_templates table,
 * and sends via Brevo Transactional API.
 */

interface EmailPayload {
  to: string
  toName?: string
  templateSlug: string
  variables: Record<string, string>
}

interface BrevoConfig {
  apiKey: string
  senderEmail: string
  senderName: string
}

interface EmailTemplate {
  subject: string
  body_html: string
  body_text: string | null
  enabled: number
}

/**
 * Load Brevo provider config from DB.
 */
async function getBrevoConfig(db: D1Database): Promise<BrevoConfig | null> {
  // Find the brevo provider
  const provider = await db
    .prepare("SELECT id FROM platform_providers WHERE slug = 'brevo' AND enabled = 1")
    .first<{ id: string }>()

  if (!provider) return null

  // Load its configs
  const { results: configs } = await db
    .prepare('SELECT key, value FROM platform_provider_configs WHERE provider_id = ?')
    .bind(provider.id)
    .all<{ key: string; value: string }>()

  const configMap = new Map(configs.map((c) => [c.key, c.value]))

  const apiKey = configMap.get('api_key')
  const senderEmail = configMap.get('sender_email')
  const senderName = configMap.get('sender_name')

  if (!apiKey || !senderEmail) return null

  return {
    apiKey,
    senderEmail,
    senderName: senderName ?? 'Complerer',
  }
}

/**
 * Load and render an email template with variable substitution.
 */
async function renderTemplate(
  db: D1Database,
  slug: string,
  variables: Record<string, string>
): Promise<{ subject: string; html: string; text: string | null } | null> {
  const template = await db
    .prepare('SELECT subject, body_html, body_text, enabled FROM email_templates WHERE slug = ?')
    .bind(slug)
    .first<EmailTemplate>()

  if (!template || !template.enabled) return null

  const substitute = (text: string): string => {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`)
  }

  return {
    subject: substitute(template.subject),
    html: substitute(template.body_html),
    text: template.body_text ? substitute(template.body_text) : null,
  }
}

/**
 * Send email via Brevo Transactional API (v3).
 * https://developers.brevo.com/reference/sendtransacemail
 */
async function sendViaBrevo(
  config: BrevoConfig,
  to: string,
  toName: string | undefined,
  subject: string,
  html: string,
  text: string | null
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const body: Record<string, unknown> = {
    sender: { email: config.senderEmail, name: config.senderName },
    to: [{ email: to, name: toName ?? to }],
    subject,
    htmlContent: html,
  }

  if (text) {
    body.textContent = text
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': config.apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`[Email] Brevo error ${response.status}: ${errorBody}`)
      return { success: false, error: `Brevo API error: ${response.status}` }
    }

    const result = (await response.json()) as { messageId?: string }
    console.log(`[Email] Sent to ${to} via Brevo — messageId: ${result.messageId}`)
    return { success: true, messageId: result.messageId }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[Email] Failed to send via Brevo: ${message}`)
    return { success: false, error: message }
  }
}

/**
 * Main email sending function.
 * Reads config + template from DB, renders, sends via Brevo.
 * Falls back gracefully if Brevo isn't configured (logs to console in dev).
 */
export async function sendEmail(
  db: D1Database,
  payload: EmailPayload,
  isDev = false
): Promise<{ sent: boolean; fallback: boolean; error?: string }> {
  // 1. Render the template
  const rendered = await renderTemplate(db, payload.templateSlug, payload.variables)
  if (!rendered) {
    console.warn(`[Email] Template "${payload.templateSlug}" not found or disabled`)
    return { sent: false, fallback: false, error: 'Template not found or disabled' }
  }

  // 2. Try to get Brevo config
  const brevoConfig = await getBrevoConfig(db)

  if (!brevoConfig) {
    // No Brevo configured — fallback to console log in dev
    if (isDev) {
      console.log(`[Email][DEV] Would send to: ${payload.to}`)
      console.log(`[Email][DEV] Subject: ${rendered.subject}`)
      console.log(`[Email][DEV] Template: ${payload.templateSlug}`)
    }
    return { sent: false, fallback: true }
  }

  // 3. Send via Brevo
  const result = await sendViaBrevo(
    brevoConfig,
    payload.to,
    payload.toName,
    rendered.subject,
    rendered.html,
    rendered.text
  )

  return { sent: result.success, fallback: false, error: result.error }
}

/**
 * Send a test email (used by admin panel "Send Test" button).
 */
export async function sendTestEmail(
  db: D1Database,
  to: string,
  templateSlug: string
): Promise<{ success: boolean; error?: string; renderedSubject?: string }> {
  // Sample variables for each template
  const sampleVars: Record<string, Record<string, string>> = {
    'otp-verification': {
      code: '123456',
      logoUrl: 'https://complerer.com/logo-color.svg',
    },
    'invitation-approved': {
      workspaceName: 'Acme Corp',
      loginUrl: 'https://complerer.com/login',
      logoUrl: 'https://complerer.com/logo-color.svg',
    },
    'invitation-rejected': {
      workspaceName: 'Acme Corp',
      logoUrl: 'https://complerer.com/logo-color.svg',
    },
    'new-invitation-request': {
      userName: 'Jane Doe',
      userEmail: 'jane@acme.com',
      workspaceName: 'Acme Corp',
      settingsUrl: 'https://complerer.com/settings',
      logoUrl: 'https://complerer.com/logo-color.svg',
    },
    'compliance-alert': {
      alertTitle: 'Access Review Overdue',
      alertMessage: 'Quarterly access review for production systems is 7 days overdue.',
      severity: 'High',
      severityColor: '#ef4444',
      framework: 'SOC 2 — CC6.1',
      dashboardUrl: 'https://complerer.com/dashboard',
      logoUrl: 'https://complerer.com/logo-color.svg',
    },
    'evidence-expiring': {
      evidenceTitle: 'Okta Access Report — Q1 2026',
      expiresAt: '2026-04-15',
      controlCount: '4',
      evidenceUrl: 'https://complerer.com/evidence',
      logoUrl: 'https://complerer.com/logo-color.svg',
    },
  }

  const variables = sampleVars[templateSlug] ?? {}
  const rendered = await renderTemplate(db, templateSlug, variables)

  if (!rendered) {
    return { success: false, error: 'Template not found or disabled' }
  }

  const brevoConfig = await getBrevoConfig(db)
  if (!brevoConfig) {
    return { success: false, error: 'Brevo provider not configured or disabled. Enable it in Providers and add api_key + sender_email.' }
  }

  const result = await sendViaBrevo(brevoConfig, to, undefined, rendered.subject, rendered.html, rendered.text)
  return { success: result.success, error: result.error, renderedSubject: rendered.subject }
}
