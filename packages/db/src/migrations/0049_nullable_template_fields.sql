PRAGMA foreign_keys = OFF;

-- Make fields nullable for template-referenced rows
-- When template_id is set, these fields are resolved via COALESCE from the library table

-- SQLite doesn't support ALTER COLUMN, so we recreate with nullable fields
-- For policies: title and category need to be nullable
-- Using a workaround: create new table, copy data, drop old, rename

CREATE TABLE policies_new (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  template_id TEXT REFERENCES policy_library(id),
  title TEXT,
  description TEXT,
  category TEXT DEFAULT 'security',
  version TEXT DEFAULT '1.0',
  status TEXT NOT NULL DEFAULT 'draft',
  file_ref TEXT,
  file_name TEXT,
  content_text TEXT,
  owner_email TEXT,
  approved_by TEXT,
  approved_at TEXT,
  review_cycle_days INTEGER DEFAULT 365,
  next_review_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO policies_new SELECT id, workspace_id, template_id, title, description, category, version, status, file_ref, file_name, content_text, owner_email, approved_by, approved_at, review_cycle_days, next_review_at, created_at, updated_at FROM policies;

DROP TABLE policies;
ALTER TABLE policies_new RENAME TO policies;
CREATE INDEX idx_policies_ws ON policies(workspace_id);
CREATE INDEX idx_policies_template ON policies(template_id);

-- Same for baselines: name, category, severity need to be nullable for template refs
CREATE TABLE baselines_new (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  template_id TEXT REFERENCES baseline_library(id),
  name TEXT,
  description TEXT,
  category TEXT,
  rule_type TEXT DEFAULT 'boolean',
  rule_config TEXT,
  severity TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO baselines_new SELECT id, workspace_id, template_id, name, description, category, rule_type, rule_config, severity, enabled, created_by, created_at, updated_at FROM baselines;

DROP TABLE baselines;
ALTER TABLE baselines_new RENAME TO baselines;
CREATE INDEX idx_baselines_ws ON baselines(workspace_id);
CREATE INDEX idx_baselines_template ON baselines(template_id);

-- Systems: name, classification need to be nullable for template refs
CREATE TABLE systems_new (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  template_id TEXT REFERENCES system_library(id),
  name TEXT,
  description TEXT,
  classification TEXT DEFAULT 'standard',
  data_sensitivity TEXT DEFAULT 'medium',
  owner_email TEXT,
  mfa_required INTEGER NOT NULL DEFAULT 0,
  environment TEXT DEFAULT 'production',
  integration_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO systems_new SELECT id, workspace_id, template_id, name, description, classification, data_sensitivity, owner_email, mfa_required, environment, integration_ref, created_at, updated_at FROM systems;

DROP TABLE systems;
ALTER TABLE systems_new RENAME TO systems;
CREATE INDEX idx_systems_ws ON systems(workspace_id);
CREATE INDEX idx_systems_template ON systems(template_id);
PRAGMA foreign_keys = ON;
