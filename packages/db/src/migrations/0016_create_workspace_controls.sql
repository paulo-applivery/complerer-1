CREATE TABLE IF NOT EXISTS mv_control_status (
  workspace_id TEXT NOT NULL,
  control_id TEXT NOT NULL,
  framework_version_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_assessed',
  evidence_count INTEGER NOT NULL DEFAULT 0,
  last_evidence_at TEXT,
  risk_score REAL NOT NULL DEFAULT 0.5,
  last_assessed_at TEXT,
  computed_at TEXT NOT NULL,
  PRIMARY KEY (workspace_id, control_id)
);
