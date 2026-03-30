-- Add Cloudflare as an integration provider
-- (AWS and Okta remain as-is)

INSERT OR IGNORE INTO platform_providers (id, category, slug, name, description, enabled, created_at, updated_at)
VALUES ('prov_cloudflare', 'integration', 'cloudflare', 'Cloudflare',
        'Cloudflare infrastructure, Workers, D1, R2 & audit logs', 0, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO platform_provider_configs (id, provider_id, key, value, is_secret, created_at, updated_at) VALUES
  ('cfg_cf_token',  'prov_cloudflare', 'api_token',  '', 1, datetime('now'), datetime('now')),
  ('cfg_cf_acctid', 'prov_cloudflare', 'account_id', '', 0, datetime('now'), datetime('now'));

-- Fix Okta from oauth_custom to api_key (SSWS token is the standard API access method)
UPDATE platform_providers SET description = 'Identity & access management — users, MFA status & audit logs' WHERE id = 'prov_okta';
INSERT OR IGNORE INTO platform_provider_configs (id, provider_id, key, value, is_secret, created_at, updated_at) VALUES
  ('cfg_okta_domain', 'prov_okta', 'domain',    '', 0, datetime('now'), datetime('now')),
  ('cfg_okta_token',  'prov_okta', 'api_token', '', 1, datetime('now'), datetime('now'));

-- Add AWS config placeholders (access key + secret)
INSERT OR IGNORE INTO platform_provider_configs (id, provider_id, key, value, is_secret, created_at, updated_at) VALUES
  ('cfg_aws_key',    'prov_aws', 'access_key_id',     '', 0, datetime('now'), datetime('now')),
  ('cfg_aws_secret', 'prov_aws', 'secret_access_key', '', 1, datetime('now'), datetime('now')),
  ('cfg_aws_region', 'prov_aws', 'region',            'us-east-1', 0, datetime('now'), datetime('now'));
