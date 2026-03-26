CREATE TABLE IF NOT EXISTS policies (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'security',
  version TEXT NOT NULL DEFAULT '1.0',
  status TEXT NOT NULL DEFAULT 'draft',
  file_ref TEXT,
  file_name TEXT,
  content_text TEXT,
  owner_email TEXT,
  approved_by TEXT,
  approved_at TEXT,
  review_cycle_days INTEGER NOT NULL DEFAULT 365,
  next_review_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_policies_ws ON policies(workspace_id);
