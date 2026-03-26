-- Add super admin flag to users
ALTER TABLE auth_users ADD COLUMN is_super_admin INTEGER NOT NULL DEFAULT 0;

-- Platform providers (AI, email, integrations available to workspaces)
CREATE TABLE IF NOT EXISTS platform_providers (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  config_schema TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Provider configs (per-provider settings like API keys, endpoints)
CREATE TABLE IF NOT EXISTS platform_provider_configs (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES platform_providers(id),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  is_secret INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(provider_id, key)
);

-- Feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  enabled INTEGER NOT NULL DEFAULT 0,
  rollout_percentage INTEGER NOT NULL DEFAULT 100,
  target_workspaces TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Email templates
CREATE TABLE IF NOT EXISTS email_templates (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables TEXT,
  category TEXT NOT NULL DEFAULT 'transactional',
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Set first user as super admin (for dev)
UPDATE auth_users SET is_super_admin = 1 WHERE id = (SELECT id FROM auth_users ORDER BY created_at ASC LIMIT 1);
