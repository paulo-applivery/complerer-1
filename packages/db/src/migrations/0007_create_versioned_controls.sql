CREATE TABLE IF NOT EXISTS versioned_controls (
  id TEXT PRIMARY KEY,
  framework_version_id TEXT NOT NULL REFERENCES framework_versions(id),
  control_id TEXT NOT NULL,
  domain TEXT,
  subdomain TEXT,
  title TEXT NOT NULL,
  requirement_text TEXT NOT NULL,
  guidance TEXT,
  evidence_requirements TEXT NOT NULL DEFAULT '[]',
  risk_weight REAL NOT NULL DEFAULT 0.5,
  implementation_group TEXT,
  supersedes TEXT REFERENCES versioned_controls(id),
  deprecated INTEGER NOT NULL DEFAULT 0,
  deprecation_note TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(framework_version_id, control_id)
);
CREATE INDEX idx_vc_fv ON versioned_controls(framework_version_id);
CREATE INDEX idx_vc_control ON versioned_controls(control_id);
