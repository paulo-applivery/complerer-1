CREATE TABLE IF NOT EXISTS workspace_settings (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_by TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(workspace_id, key)
);
CREATE INDEX idx_ws_settings ON workspace_settings(workspace_id);
