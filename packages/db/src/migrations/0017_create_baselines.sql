CREATE TABLE IF NOT EXISTS baselines (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'access',
  rule_type TEXT NOT NULL DEFAULT 'boolean',
  rule_config TEXT NOT NULL DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'medium',
  enabled INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_baselines_ws ON baselines(workspace_id);
