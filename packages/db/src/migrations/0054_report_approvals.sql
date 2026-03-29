-- Report Approvals (sign-off audit trail)
CREATE TABLE IF NOT EXISTS report_approvals (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  role TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  comment TEXT,
  signed_at TEXT NOT NULL,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_report_approvals_report ON report_approvals(report_id);
CREATE INDEX IF NOT EXISTS idx_report_approvals_user ON report_approvals(user_id);
