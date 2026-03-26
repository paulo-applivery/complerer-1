CREATE TABLE IF NOT EXISTS playbooks (
  id TEXT PRIMARY KEY,
  control_id TEXT NOT NULL,
  framework_version_id TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  contributor_count INTEGER NOT NULL DEFAULT 0,
  avg_audit_pass_rate REAL,
  estimated_effort_hours REAL,
  difficulty_rating REAL,
  source TEXT NOT NULL DEFAULT 'ai_generated',
  last_updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_playbooks_control ON playbooks(control_id);
CREATE INDEX idx_playbooks_fv ON playbooks(framework_version_id);
