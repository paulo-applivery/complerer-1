-- D1/SQLite doesn't support ALTER COLUMN, so we recreate the table with control_id nullable
-- and a modified unique constraint

CREATE TABLE IF NOT EXISTS project_evidence_new (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES compliance_projects(id) ON DELETE CASCADE,
  evidence_id TEXT NOT NULL REFERENCES evidence(id),
  control_id TEXT REFERENCES versioned_controls(id),
  linked_at TEXT NOT NULL,
  linked_by TEXT NOT NULL REFERENCES auth_users(id),
  link_type TEXT NOT NULL DEFAULT 'manual',
  notes TEXT
);

INSERT INTO project_evidence_new SELECT * FROM project_evidence;
DROP TABLE project_evidence;
ALTER TABLE project_evidence_new RENAME TO project_evidence;

CREATE INDEX IF NOT EXISTS idx_pe_project ON project_evidence(project_id);
CREATE INDEX IF NOT EXISTS idx_pe_evidence ON project_evidence(evidence_id);
CREATE INDEX IF NOT EXISTS idx_pe_control ON project_evidence(control_id);
