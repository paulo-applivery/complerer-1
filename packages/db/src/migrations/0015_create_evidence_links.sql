CREATE TABLE IF NOT EXISTS evidence_links (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  evidence_id TEXT NOT NULL REFERENCES evidence(id),
  control_id TEXT NOT NULL REFERENCES versioned_controls(id),
  framework_version_id TEXT NOT NULL REFERENCES framework_versions(id),
  linked_at TEXT NOT NULL,
  linked_by TEXT NOT NULL,
  link_type TEXT NOT NULL DEFAULT 'manual',
  confidence REAL,
  inherited_from TEXT REFERENCES evidence_links(id),
  notes TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_el_ws_control ON evidence_links(workspace_id, control_id);
CREATE INDEX idx_el_ws_evidence ON evidence_links(workspace_id, evidence_id);
