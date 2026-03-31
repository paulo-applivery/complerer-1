-- Unify all email templates to match the OTP style:
-- dark background, logo from dash.complerer.com, consistent typography & button.
-- Uses UPDATE so existing rows are replaced (INSERT OR IGNORE would skip them).

-- Helper: shared outer wrapper open / close snippets are inlined per template below.
-- Logo URL: https://dash.complerer.com/logo-white.png (same as working OTP template)

-- 1. OTP Verification (already correct style, just pin logo URL)
UPDATE email_templates SET
  body_html = '<div style="background:#09090b;padding:40px 20px;"><div style="font-family:''Red Hat Display'',sans-serif;max-width:480px;margin:0 auto;background:#09090b;border-radius:16px;padding:40px 32px;"><div style="text-align:center;margin-bottom:32px;"><img src="https://dash.complerer.com/logo-white.png" alt="Complerer" height="28" /></div><h2 style="color:#fafafa;font-size:20px;font-weight:700;margin:0 0 8px;">Verify your email</h2><p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 24px;">Enter this code to sign in to Complerer:</p><div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;"><span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#34d399;">{{code}}</span></div><p style="color:#71717a;font-size:12px;line-height:1.6;margin:0 0 32px;">This code expires in 10 minutes. If you did not request this, please ignore this email.</p><p style="color:#3f3f46;font-size:11px;text-align:center;margin:0;">Complerer · Compliance Platform</p></div></div>',
  variables = '["code"]',
  updated_at = datetime('now')
WHERE slug = 'otp-verification';

-- 2. Invitation Approved
UPDATE email_templates SET
  body_html = '<div style="background:#09090b;padding:40px 20px;"><div style="font-family:''Red Hat Display'',sans-serif;max-width:480px;margin:0 auto;background:#09090b;border-radius:16px;padding:40px 32px;"><div style="text-align:center;margin-bottom:32px;"><img src="https://dash.complerer.com/logo-white.png" alt="Complerer" height="28" /></div><h2 style="color:#fafafa;font-size:20px;font-weight:700;margin:0 0 8px;">Welcome to {{workspaceName}}</h2><p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 32px;">Your invitation request has been approved. You can now sign in and access the workspace.</p><div style="text-align:center;margin:0 0 32px;"><a href="{{loginUrl}}" style="display:inline-block;background:#34d399;color:#09090b;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;font-size:14px;">Sign In to Complerer</a></div><p style="color:#3f3f46;font-size:11px;text-align:center;margin:0;">Complerer · Compliance Platform</p></div></div>',
  variables = '["workspaceName", "loginUrl"]',
  updated_at = datetime('now')
WHERE slug = 'invitation-approved';

-- 3. Invitation Rejected
UPDATE email_templates SET
  body_html = '<div style="background:#09090b;padding:40px 20px;"><div style="font-family:''Red Hat Display'',sans-serif;max-width:480px;margin:0 auto;background:#09090b;border-radius:16px;padding:40px 32px;"><div style="text-align:center;margin-bottom:32px;"><img src="https://dash.complerer.com/logo-white.png" alt="Complerer" height="28" /></div><h2 style="color:#fafafa;font-size:20px;font-weight:700;margin:0 0 8px;">Request not approved</h2><p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 24px;">Unfortunately, your request to join <strong style="color:#fafafa;">{{workspaceName}}</strong> was not approved at this time.</p><p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 32px;">Please contact a workspace administrator for more information.</p><p style="color:#3f3f46;font-size:11px;text-align:center;margin:0;">Complerer · Compliance Platform</p></div></div>',
  variables = '["workspaceName"]',
  updated_at = datetime('now')
WHERE slug = 'invitation-rejected';

-- 4. New Invitation Request (admin notification)
UPDATE email_templates SET
  body_html = '<div style="background:#09090b;padding:40px 20px;"><div style="font-family:''Red Hat Display'',sans-serif;max-width:480px;margin:0 auto;background:#09090b;border-radius:16px;padding:40px 32px;"><div style="text-align:center;margin-bottom:32px;"><img src="https://dash.complerer.com/logo-white.png" alt="Complerer" height="28" /></div><h2 style="color:#fafafa;font-size:20px;font-weight:700;margin:0 0 8px;">New join request</h2><p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 8px;"><strong style="color:#fafafa;">{{userName}}</strong> wants to join <strong style="color:#fafafa;">{{workspaceName}}</strong>.</p><div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px;margin:0 0 32px;"><p style="color:#71717a;font-size:12px;margin:0;">Email</p><p style="color:#fafafa;font-size:14px;font-weight:600;margin:4px 0 0;">{{userEmail}}</p></div><div style="text-align:center;margin:0 0 32px;"><a href="{{settingsUrl}}" style="display:inline-block;background:#34d399;color:#09090b;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;font-size:14px;">Review Request</a></div><p style="color:#3f3f46;font-size:11px;text-align:center;margin:0;">Complerer · Compliance Platform</p></div></div>',
  variables = '["userName", "userEmail", "workspaceName", "settingsUrl"]',
  updated_at = datetime('now')
WHERE slug = 'new-invitation-request';

-- 5. Compliance Alert
UPDATE email_templates SET
  body_html = '<div style="background:#09090b;padding:40px 20px;"><div style="font-family:''Red Hat Display'',sans-serif;max-width:480px;margin:0 auto;background:#09090b;border-radius:16px;padding:40px 32px;"><div style="text-align:center;margin-bottom:32px;"><img src="https://dash.complerer.com/logo-white.png" alt="Complerer" height="28" /></div><h2 style="color:#fafafa;font-size:20px;font-weight:700;margin:0 0 8px;">{{alertTitle}}</h2><p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 24px;">{{alertMessage}}</p><div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px;margin:0 0 32px;"><p style="color:#71717a;font-size:12px;margin:0 0 6px;">Severity</p><p style="font-size:14px;font-weight:700;color:{{severityColor}};margin:0 0 12px;">{{severity}}</p><p style="color:#71717a;font-size:12px;margin:0 0 6px;">Framework</p><p style="color:#fafafa;font-size:14px;margin:0;">{{framework}}</p></div><div style="text-align:center;margin:0 0 32px;"><a href="{{dashboardUrl}}" style="display:inline-block;background:#34d399;color:#09090b;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;font-size:14px;">View Dashboard</a></div><p style="color:#3f3f46;font-size:11px;text-align:center;margin:0;">Complerer · Compliance Platform</p></div></div>',
  variables = '["alertTitle", "alertMessage", "severity", "severityColor", "framework", "dashboardUrl"]',
  updated_at = datetime('now')
WHERE slug = 'compliance-alert';

-- 6. Evidence Expiring
UPDATE email_templates SET
  body_html = '<div style="background:#09090b;padding:40px 20px;"><div style="font-family:''Red Hat Display'',sans-serif;max-width:480px;margin:0 auto;background:#09090b;border-radius:16px;padding:40px 32px;"><div style="text-align:center;margin-bottom:32px;"><img src="https://dash.complerer.com/logo-white.png" alt="Complerer" height="28" /></div><h2 style="color:#fafafa;font-size:20px;font-weight:700;margin:0 0 8px;">Evidence expiring soon</h2><p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 24px;">The following evidence will expire on <strong style="color:#fafafa;">{{expiresAt}}</strong>:</p><div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px;margin:0 0 32px;"><p style="color:#fafafa;font-weight:700;font-size:14px;margin:0 0 6px;">{{evidenceTitle}}</p><p style="color:#71717a;font-size:12px;margin:0;">Linked to {{controlCount}} controls</p></div><div style="text-align:center;margin:0 0 32px;"><a href="{{evidenceUrl}}" style="display:inline-block;background:#34d399;color:#09090b;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;font-size:14px;">Update Evidence</a></div><p style="color:#3f3f46;font-size:11px;text-align:center;margin:0;">Complerer · Compliance Platform</p></div></div>',
  variables = '["evidenceTitle", "expiresAt", "controlCount", "evidenceUrl"]',
  updated_at = datetime('now')
WHERE slug = 'evidence-expiring';

-- 7. Workspace Invitation (direct admin invite)
UPDATE email_templates SET
  body_html = '<div style="background:#09090b;padding:40px 20px;"><div style="font-family:''Red Hat Display'',sans-serif;max-width:480px;margin:0 auto;background:#09090b;border-radius:16px;padding:40px 32px;"><div style="text-align:center;margin-bottom:32px;"><img src="https://dash.complerer.com/logo-white.png" alt="Complerer" height="28" /></div><h2 style="color:#fafafa;font-size:20px;font-weight:700;margin:0 0 8px;">You''ve been invited</h2><p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 8px;">You''ve been invited to join <strong style="color:#fafafa;">{{workspaceName}}</strong> on Complerer as a <strong style="color:#fafafa;">{{role}}</strong>.</p><p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 32px;">Sign in with this email address to accept and get started.</p><div style="text-align:center;margin:0 0 32px;"><a href="{{loginUrl}}" style="display:inline-block;background:#34d399;color:#09090b;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;font-size:14px;">Accept Invitation</a></div><p style="color:#71717a;font-size:12px;text-align:center;margin:0 0 16px;">This invitation expires in 7 days.</p><p style="color:#3f3f46;font-size:11px;text-align:center;margin:0;">Complerer · Compliance Platform</p></div></div>',
  variables = '["workspaceName", "role", "loginUrl"]',
  updated_at = datetime('now')
WHERE slug = 'workspace-invitation';
