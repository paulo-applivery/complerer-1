-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  project_id TEXT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  content TEXT NOT NULL DEFAULT '{}',
  resolved_variables TEXT NOT NULL DEFAULT '{}',
  audit_period_start TEXT,
  audit_period_end TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  locked_at TEXT,
  locked_by TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (template_id) REFERENCES report_templates(id),
  FOREIGN KEY (project_id) REFERENCES compliance_projects(id)
);

CREATE INDEX IF NOT EXISTS idx_reports_workspace ON reports(workspace_id);
CREATE INDEX IF NOT EXISTS idx_reports_template ON reports(template_id);
CREATE INDEX IF NOT EXISTS idx_reports_project ON reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(workspace_id, status);

-- Report Versions
CREATE TABLE IF NOT EXISTS report_versions (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  change_type TEXT NOT NULL DEFAULT 'edit',
  change_description TEXT,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_report_versions_report ON report_versions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_versions_report_version ON report_versions(report_id, version);
