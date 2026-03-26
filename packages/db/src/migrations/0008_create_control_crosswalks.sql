CREATE TABLE IF NOT EXISTS control_crosswalks (
  id TEXT PRIMARY KEY,
  source_control_id TEXT NOT NULL REFERENCES versioned_controls(id),
  target_control_id TEXT NOT NULL REFERENCES versioned_controls(id),
  mapping_type TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 0.5,
  notes TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_cw_source ON control_crosswalks(source_control_id);
CREATE INDEX idx_cw_target ON control_crosswalks(target_control_id);
