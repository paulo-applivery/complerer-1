-- Report Exports (PDF storage)
CREATE TABLE IF NOT EXISTS report_exports (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  format TEXT NOT NULL DEFAULT 'pdf',
  r2_key TEXT NOT NULL,
  file_size INTEGER,
  generated_at TEXT NOT NULL,
  generated_by TEXT NOT NULL,
  content_hash TEXT,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_report_exports_report ON report_exports(report_id);
