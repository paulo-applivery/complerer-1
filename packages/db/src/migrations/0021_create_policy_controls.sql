CREATE TABLE IF NOT EXISTS policy_controls (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  policy_id TEXT NOT NULL REFERENCES policies(id),
  control_id TEXT NOT NULL REFERENCES versioned_controls(id),
  coverage TEXT NOT NULL DEFAULT 'full',
  notes TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_pc_policy ON policy_controls(policy_id);
CREATE INDEX idx_pc_control ON policy_controls(control_id);
