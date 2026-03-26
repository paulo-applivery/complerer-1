-- Default AI providers
INSERT OR IGNORE INTO platform_providers (id, category, slug, name, description, enabled, created_at, updated_at) VALUES
  ('prov_anthropic', 'ai', 'anthropic', 'Anthropic (Claude)', 'Claude AI models for compliance assistant', 1, datetime('now'), datetime('now')),
  ('prov_gemini', 'ai', 'google-gemini', 'Google Gemini', 'Gemini models for embeddings and analysis', 1, datetime('now'), datetime('now')),
  ('prov_openai', 'ai', 'openai', 'OpenAI', 'GPT models (alternative)', 0, datetime('now'), datetime('now'));

-- Default email provider
INSERT OR IGNORE INTO platform_providers (id, category, slug, name, description, enabled, created_at, updated_at) VALUES
  ('prov_brevo', 'email', 'brevo', 'Brevo', 'Transactional email delivery via Brevo (formerly Sendinblue)', 0, datetime('now'), datetime('now')),
  ('prov_resend', 'email', 'resend', 'Resend', 'Modern email API for developers', 0, datetime('now'), datetime('now'));

-- Default integration providers
INSERT OR IGNORE INTO platform_providers (id, category, slug, name, description, enabled, created_at, updated_at) VALUES
  ('prov_okta', 'integration', 'okta', 'Okta', 'Identity & access management', 1, datetime('now'), datetime('now')),
  ('prov_azure_ad', 'integration', 'azure-ad', 'Azure AD / Entra ID', 'Microsoft identity platform', 1, datetime('now'), datetime('now')),
  ('prov_google_ws', 'integration', 'google-workspace', 'Google Workspace', 'Google identity & directory', 1, datetime('now'), datetime('now')),
  ('prov_applivery', 'integration', 'applivery', 'Applivery', 'Mobile device management & UEM', 1, datetime('now'), datetime('now')),
  ('prov_aws', 'integration', 'aws', 'AWS', 'Amazon Web Services IAM & infrastructure', 1, datetime('now'), datetime('now')),
  ('prov_jira', 'integration', 'jira', 'Jira', 'Issue tracking & change management', 1, datetime('now'), datetime('now')),
  ('prov_linear', 'integration', 'linear', 'Linear', 'Project & issue tracking', 1, datetime('now'), datetime('now')),
  ('prov_github', 'integration', 'github', 'GitHub', 'Source code & CI/CD', 1, datetime('now'), datetime('now'));

-- Default feature flags
INSERT OR IGNORE INTO feature_flags (id, slug, name, description, enabled, rollout_percentage, created_at, updated_at) VALUES
  ('ff_ai_chat', 'ai-chat', 'AI Chat Assistant', 'Enable the AI compliance chat', 1, 100, datetime('now'), datetime('now')),
  ('ff_crosswalks', 'auto-crosswalks', 'Auto Crosswalk Linking', 'Automatically link evidence across frameworks via crosswalks', 1, 100, datetime('now'), datetime('now')),
  ('ff_trust_score', 'trust-score', 'Trust Score Badge', 'Allow workspaces to publish trust score badges', 1, 100, datetime('now'), datetime('now')),
  ('ff_playbooks', 'playbooks', 'Community Playbooks', 'Show community compliance playbooks', 0, 50, datetime('now'), datetime('now')),
  ('ff_audit_narrator', 'audit-narrator', 'Audit Narrator', 'AI-generated audit narrative reports', 1, 100, datetime('now'), datetime('now')),
  ('ff_csv_import', 'csv-import', 'CSV Framework Import', 'Allow importing framework controls via CSV', 1, 100, datetime('now'), datetime('now'));

-- Default email templates
INSERT OR IGNORE INTO email_templates (id, slug, name, subject, body_html, body_text, variables, category, enabled, created_at, updated_at) VALUES
  ('et_otp', 'otp-verification', 'OTP Verification', 'Your verification code: {{code}}',
   '<div style="font-family: Red Hat Display, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;"><div style="text-align: center; margin-bottom: 32px;"><img src="{{logoUrl}}" alt="Complerer" height="32" /></div><h2 style="color: #fafafa; font-size: 20px; margin-bottom: 8px;">Verify your email</h2><p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">Enter this code to sign in to Complerer:</p><div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;"><span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #34d399;">{{code}}</span></div><p style="color: #71717a; font-size: 12px;">This code expires in 10 minutes. If you did not request this, please ignore this email.</p></div>',
   'Your Complerer verification code is: {{code}}. This code expires in 10 minutes.',
   '["code", "logoUrl"]', 'auth', 1, datetime('now'), datetime('now')),

  ('et_invitation_approved', 'invitation-approved', 'Invitation Approved', 'You''ve been added to {{workspaceName}}',
   '<div style="font-family: Red Hat Display, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;"><div style="text-align: center; margin-bottom: 32px;"><img src="{{logoUrl}}" alt="Complerer" height="32" /></div><h2 style="color: #fafafa; font-size: 20px;">Welcome to {{workspaceName}}</h2><p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">Your invitation request has been approved. You can now sign in and access the workspace.</p><div style="text-align: center; margin: 32px 0;"><a href="{{loginUrl}}" style="display: inline-block; background: #34d399; color: #09090b; font-weight: 600; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-size: 14px;">Sign In</a></div></div>',
   'Your invitation to {{workspaceName}} has been approved. Sign in at {{loginUrl}}.',
   '["workspaceName", "loginUrl", "logoUrl"]', 'auth', 1, datetime('now'), datetime('now')),

  ('et_invitation_rejected', 'invitation-rejected', 'Invitation Request Update', 'Update on your request to join {{workspaceName}}',
   '<div style="font-family: Red Hat Display, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;"><div style="text-align: center; margin-bottom: 32px;"><img src="{{logoUrl}}" alt="Complerer" height="32" /></div><h2 style="color: #fafafa; font-size: 20px;">Request not approved</h2><p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">Unfortunately, your request to join {{workspaceName}} was not approved at this time. Please contact a workspace administrator for more information.</p></div>',
   'Your request to join {{workspaceName}} was not approved.',
   '["workspaceName", "logoUrl"]', 'auth', 1, datetime('now'), datetime('now')),

  ('et_new_invitation_request', 'new-invitation-request', 'New Invitation Request', '{{userName}} wants to join {{workspaceName}}',
   '<div style="font-family: Red Hat Display, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;"><div style="text-align: center; margin-bottom: 32px;"><img src="{{logoUrl}}" alt="Complerer" height="32" /></div><h2 style="color: #fafafa; font-size: 20px;">New join request</h2><p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;"><strong style="color: #fafafa;">{{userName}}</strong> ({{userEmail}}) has requested to join <strong style="color: #fafafa;">{{workspaceName}}</strong>.</p><div style="text-align: center; margin: 32px 0;"><a href="{{settingsUrl}}" style="display: inline-block; background: #34d399; color: #09090b; font-weight: 600; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-size: 14px;">Review Request</a></div></div>',
   '{{userName}} ({{userEmail}}) wants to join {{workspaceName}}. Review at {{settingsUrl}}.',
   '["userName", "userEmail", "workspaceName", "settingsUrl", "logoUrl"]', 'notification', 1, datetime('now'), datetime('now')),

  ('et_compliance_alert', 'compliance-alert', 'Compliance Alert', 'Compliance alert: {{alertTitle}}',
   '<div style="font-family: Red Hat Display, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;"><div style="text-align: center; margin-bottom: 32px;"><img src="{{logoUrl}}" alt="Complerer" height="32" /></div><h2 style="color: #fafafa; font-size: 20px;">{{alertTitle}}</h2><p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">{{alertMessage}}</p><div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin: 24px 0;"><p style="color: #71717a; font-size: 12px; margin: 0;">Severity: <span style="color: {{severityColor}}; font-weight: 600;">{{severity}}</span></p><p style="color: #71717a; font-size: 12px; margin: 8px 0 0;">Framework: {{framework}}</p></div><div style="text-align: center; margin: 32px 0;"><a href="{{dashboardUrl}}" style="display: inline-block; background: #34d399; color: #09090b; font-weight: 600; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-size: 14px;">View Dashboard</a></div></div>',
   'Compliance alert: {{alertTitle}} - {{alertMessage}}. Severity: {{severity}}.',
   '["alertTitle", "alertMessage", "severity", "severityColor", "framework", "dashboardUrl", "logoUrl"]', 'compliance', 1, datetime('now'), datetime('now')),

  ('et_evidence_expiring', 'evidence-expiring', 'Evidence Expiring Soon', 'Evidence expiring: {{evidenceTitle}}',
   '<div style="font-family: Red Hat Display, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;"><div style="text-align: center; margin-bottom: 32px;"><img src="{{logoUrl}}" alt="Complerer" height="32" /></div><h2 style="color: #fafafa; font-size: 20px;">Evidence expiring soon</h2><p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">The following evidence will expire on <strong style="color: #fafafa;">{{expiresAt}}</strong>:</p><div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin: 24px 0;"><p style="color: #fafafa; font-weight: 600; margin: 0;">{{evidenceTitle}}</p><p style="color: #71717a; font-size: 12px; margin: 8px 0 0;">Linked to {{controlCount}} controls</p></div><div style="text-align: center; margin: 32px 0;"><a href="{{evidenceUrl}}" style="display: inline-block; background: #34d399; color: #09090b; font-weight: 600; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-size: 14px;">Update Evidence</a></div></div>',
   'Evidence "{{evidenceTitle}}" expires on {{expiresAt}}. Update at {{evidenceUrl}}.',
   '["evidenceTitle", "expiresAt", "controlCount", "evidenceUrl", "logoUrl"]', 'compliance', 1, datetime('now'), datetime('now'));
