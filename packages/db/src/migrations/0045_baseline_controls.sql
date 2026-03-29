CREATE TABLE IF NOT EXISTS baseline_controls (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  baseline_id TEXT NOT NULL REFERENCES baselines(id) ON DELETE CASCADE,
  control_id TEXT NOT NULL REFERENCES versioned_controls(id),
  linked_at TEXT NOT NULL,
  linked_by TEXT NOT NULL,
  UNIQUE(workspace_id, baseline_id, control_id)
);

CREATE INDEX IF NOT EXISTS idx_bc_baseline ON baseline_controls(baseline_id);
CREATE INDEX IF NOT EXISTS idx_bc_control ON baseline_controls(control_id);
CREATE INDEX IF NOT EXISTS idx_bc_ws ON baseline_controls(workspace_id);
