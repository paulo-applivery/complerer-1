CREATE TABLE IF NOT EXISTS systems (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  description TEXT,
  classification TEXT NOT NULL DEFAULT 'standard',
  data_sensitivity TEXT NOT NULL DEFAULT 'medium',
  owner_email TEXT,
  mfa_required INTEGER NOT NULL DEFAULT 0,
  environment TEXT NOT NULL DEFAULT 'production',
  integration_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_systems_ws ON systems(workspace_id);
