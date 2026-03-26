CREATE TABLE IF NOT EXISTS baseline_violations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  baseline_id TEXT NOT NULL REFERENCES baselines(id),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  violation_detail TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open',
  resolved_at TEXT,
  resolved_by TEXT,
  exemption_reason TEXT,
  detected_at TEXT NOT NULL
);
CREATE INDEX idx_bv_ws ON baseline_violations(workspace_id);
CREATE INDEX idx_bv_baseline ON baseline_violations(baseline_id);
CREATE INDEX idx_bv_status ON baseline_violations(workspace_id, status);
