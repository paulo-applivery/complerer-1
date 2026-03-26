CREATE TABLE IF NOT EXISTS anomalies (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  integration_id TEXT NOT NULL REFERENCES integrations(id),
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '{}',
  entity_type TEXT,
  entity_id TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  resolved_by TEXT,
  resolved_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_anomalies_ws ON anomalies(workspace_id, status);
