CREATE TABLE IF NOT EXISTS playbook_evidence_patterns (
  id TEXT PRIMARY KEY,
  playbook_id TEXT NOT NULL REFERENCES playbooks(id),
  evidence_type TEXT NOT NULL,
  evidence_source_tool TEXT,
  usage_percentage REAL NOT NULL DEFAULT 0,
  auditor_acceptance_rate REAL,
  collection_frequency TEXT,
  automation_available INTEGER NOT NULL DEFAULT 0,
  effort_minutes INTEGER,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_pep_playbook ON playbook_evidence_patterns(playbook_id);
