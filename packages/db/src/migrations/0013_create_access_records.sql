CREATE TABLE IF NOT EXISTS access_records (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  user_id TEXT NOT NULL REFERENCES directory_users(id),
  system_id TEXT NOT NULL REFERENCES systems(id),
  role TEXT NOT NULL DEFAULT 'read',
  access_type TEXT NOT NULL DEFAULT 'permanent',
  granted_at TEXT NOT NULL,
  granted_by TEXT,
  approved_by TEXT,
  approval_method TEXT,
  ticket_ref TEXT,
  reviewed_at TEXT,
  reviewed_by TEXT,
  revoked_at TEXT,
  revoked_by TEXT,
  revocation_reason TEXT,
  risk_score REAL NOT NULL DEFAULT 0.5,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL
);
CREATE INDEX idx_ar_ws_system ON access_records(workspace_id, system_id);
CREATE INDEX idx_ar_ws_user ON access_records(workspace_id, user_id);
CREATE INDEX idx_ar_ws_active ON access_records(workspace_id, revoked_at);
