CREATE TABLE IF NOT EXISTS trust_profiles (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  slug TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  show_frameworks INTEGER NOT NULL DEFAULT 1,
  show_posture_score INTEGER NOT NULL DEFAULT 1,
  show_evidence_freshness INTEGER NOT NULL DEFAULT 1,
  show_last_snapshot INTEGER NOT NULL DEFAULT 1,
  show_control_count INTEGER NOT NULL DEFAULT 1,
  badge_style TEXT NOT NULL DEFAULT 'standard',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_trust_ws ON trust_profiles(workspace_id);
