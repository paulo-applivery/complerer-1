CREATE TABLE IF NOT EXISTS workspace_adoptions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  framework_version_id TEXT NOT NULL REFERENCES framework_versions(id),
  adopted_at TEXT NOT NULL,
  adopted_by TEXT NOT NULL REFERENCES auth_users(id),
  reason TEXT,
  effective_from TEXT NOT NULL,
  effective_until TEXT,
  superseded_by TEXT REFERENCES workspace_adoptions(id),
  auto_update_minor INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_wa_workspace ON workspace_adoptions(workspace_id);
CREATE INDEX idx_wa_fv ON workspace_adoptions(framework_version_id);
