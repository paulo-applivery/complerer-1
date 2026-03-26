CREATE TABLE IF NOT EXISTS compliance_snapshots (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  snapshot_type TEXT NOT NULL DEFAULT 'manual',
  frameworks TEXT NOT NULL DEFAULT '[]',
  captured_at TEXT NOT NULL,
  captured_by TEXT NOT NULL,
  posture_score REAL,
  total_controls INTEGER NOT NULL DEFAULT 0,
  compliant_count INTEGER NOT NULL DEFAULT 0,
  partial_count INTEGER NOT NULL DEFAULT 0,
  gap_count INTEGER NOT NULL DEFAULT 0,
  not_applicable_count INTEGER NOT NULL DEFAULT 0,
  detail_ref TEXT,
  detail_hash TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_snap_ws ON compliance_snapshots(workspace_id);
