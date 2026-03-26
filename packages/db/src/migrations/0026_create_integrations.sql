CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected',
  config TEXT NOT NULL DEFAULT '{}',
  credentials_ref TEXT,
  last_sync_at TEXT,
  last_sync_status TEXT,
  last_sync_error TEXT,
  sync_interval_minutes INTEGER NOT NULL DEFAULT 60,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_integrations_ws ON integrations(workspace_id);
