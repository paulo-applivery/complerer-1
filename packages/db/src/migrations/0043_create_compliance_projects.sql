-- Compliance Projects: certification efforts scoped to a framework version
CREATE TABLE IF NOT EXISTS compliance_projects (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  description TEXT,
  framework_id TEXT NOT NULL REFERENCES frameworks(id),
  framework_version_id TEXT NOT NULL REFERENCES framework_versions(id),
  status TEXT NOT NULL DEFAULT 'planning',
  auditor_name TEXT,
  auditor_firm TEXT,
  audit_period_start TEXT,
  audit_period_end TEXT,
  target_completion_date TEXT,
  created_by TEXT NOT NULL REFERENCES auth_users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cp_ws ON compliance_projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_cp_ws_status ON compliance_projects(workspace_id, status);

-- Project Evidence: links workspace-level evidence to project + control
CREATE TABLE IF NOT EXISTS project_evidence (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES compliance_projects(id) ON DELETE CASCADE,
  evidence_id TEXT NOT NULL REFERENCES evidence(id),
  control_id TEXT NOT NULL REFERENCES versioned_controls(id),
  linked_at TEXT NOT NULL,
  linked_by TEXT NOT NULL REFERENCES auth_users(id),
  link_type TEXT NOT NULL DEFAULT 'manual',
  notes TEXT,
  UNIQUE(project_id, evidence_id, control_id)
);
CREATE INDEX IF NOT EXISTS idx_pe_proj ON project_evidence(project_id);
CREATE INDEX IF NOT EXISTS idx_pe_evidence ON project_evidence(evidence_id);

-- Project Milestones: timeline tracking (scaffolded for Phase 3)
CREATE TABLE IF NOT EXISTS project_milestones (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES compliance_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_date TEXT,
  completed_at TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pm_proj ON project_milestones(project_id);
