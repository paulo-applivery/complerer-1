-- Reference-based template system
-- Templates are managed by super admin in library tables.
-- Workspace tables reference templates via template_id FK.
-- Content is resolved via JOIN (COALESCE) so updates propagate automatically.

-- 1. Policy library (new)
CREATE TABLE IF NOT EXISTS policy_library (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'security',
  description TEXT,
  content_text TEXT,
  version TEXT NOT NULL DEFAULT '1.0',
  review_cycle_days INTEGER NOT NULL DEFAULT 365,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 2. Add template_id to workspace tables
ALTER TABLE policies ADD COLUMN template_id TEXT REFERENCES policy_library(id);
ALTER TABLE baselines ADD COLUMN template_id TEXT REFERENCES baseline_library(id);
ALTER TABLE systems ADD COLUMN template_id TEXT REFERENCES system_library(id);
