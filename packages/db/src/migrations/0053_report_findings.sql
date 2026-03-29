-- Report Findings
CREATE TABLE IF NOT EXISTS report_findings (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  control_id TEXT,
  section_id TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  finding_type TEXT NOT NULL DEFAULT 'deficiency',
  title TEXT NOT NULL,
  condition TEXT,
  criteria TEXT,
  cause TEXT,
  effect TEXT,
  recommendation TEXT,
  management_response TEXT,
  management_response_by TEXT,
  management_response_at TEXT,
  remediation_due_date TEXT,
  remediation_owner TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  is_repeat INTEGER NOT NULL DEFAULT 0,
  prior_finding_id TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX IF NOT EXISTS idx_report_findings_report ON report_findings(report_id);
CREATE INDEX IF NOT EXISTS idx_report_findings_workspace ON report_findings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_report_findings_status ON report_findings(report_id, status);
CREATE INDEX IF NOT EXISTS idx_report_findings_severity ON report_findings(report_id, severity);
