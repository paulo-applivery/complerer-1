CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  title TEXT NOT NULL,
  description TEXT,
  file_ref TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_hash TEXT,
  mime_type TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  source_integration TEXT,
  captured_at TEXT NOT NULL,
  expires_at TEXT,
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_evidence_ws ON evidence(workspace_id);
