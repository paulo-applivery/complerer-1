-- Workspace-level report templates (reference library via template_library_id)
CREATE TABLE IF NOT EXISTS report_templates (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  template_library_id TEXT,
  framework_id TEXT,
  name TEXT,
  description TEXT,
  content TEXT,
  variables TEXT,
  sections TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (template_library_id) REFERENCES report_template_library(id)
);

CREATE INDEX IF NOT EXISTS idx_report_templates_workspace ON report_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_library ON report_templates(template_library_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_framework ON report_templates(framework_id);
