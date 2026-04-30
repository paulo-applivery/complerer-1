-- ============================================================
-- Phase 2: dedicated tables for control reinforcements and the
-- audit checklist (evaluated aspects). Backfilled from the JSON
-- columns added in 0071.
--
-- The JSON columns on versioned_controls remain as the source of
-- truth for migrations / seeds — these tables are projections that
-- the API joins for relational queries (filter by reinforcement,
-- search aspects across controls, etc.).
-- ============================================================

CREATE TABLE IF NOT EXISTS control_reinforcements (
  id TEXT PRIMARY KEY,
  control_id TEXT NOT NULL REFERENCES versioned_controls(id) ON DELETE CASCADE,
  reinforcement_code TEXT NOT NULL, -- R1, R2, R3...
  description TEXT NOT NULL,
  required_at TEXT NOT NULL DEFAULT '[]', -- JSON array of "BASICA"|"MEDIA"|"ALTA"
  mode TEXT NOT NULL DEFAULT 'ADDITIVE', -- ADDITIVE | EXCLUSIVE_OR
  created_at TEXT NOT NULL,
  UNIQUE(control_id, reinforcement_code)
);
CREATE INDEX IF NOT EXISTS idx_creinf_control ON control_reinforcements(control_id);

CREATE TABLE IF NOT EXISTS control_evaluated_aspects (
  id TEXT PRIMARY KEY,
  control_id TEXT NOT NULL REFERENCES versioned_controls(id) ON DELETE CASCADE,
  aspect_id TEXT NOT NULL,        -- e.g. op.acc.5.q1
  question TEXT NOT NULL,
  reinforcement_ref TEXT,          -- nullable; references reinforcement_code
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  UNIQUE(control_id, aspect_id)
);
CREATE INDEX IF NOT EXISTS idx_caspect_control ON control_evaluated_aspects(control_id);
CREATE INDEX IF NOT EXISTS idx_caspect_reinf ON control_evaluated_aspects(control_id, reinforcement_ref);
