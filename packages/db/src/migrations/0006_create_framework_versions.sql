CREATE TABLE IF NOT EXISTS framework_versions (
  id TEXT PRIMARY KEY,
  framework_id TEXT NOT NULL REFERENCES frameworks(id),
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  total_controls INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  changelog TEXT,
  source_url TEXT,
  checksum TEXT,
  previous_version_id TEXT REFERENCES framework_versions(id),
  created_at TEXT NOT NULL,
  UNIQUE(framework_id, version)
);
CREATE INDEX idx_fv_framework ON framework_versions(framework_id);
