CREATE TABLE IF NOT EXISTS directory_users (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  department TEXT,
  title TEXT,
  manager_id TEXT REFERENCES directory_users(id),
  employment_status TEXT NOT NULL DEFAULT 'active',
  source TEXT NOT NULL DEFAULT 'manual',
  external_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_du_ws ON directory_users(workspace_id);
CREATE INDEX idx_du_email ON directory_users(workspace_id, email);
