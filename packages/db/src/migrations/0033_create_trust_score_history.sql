CREATE TABLE IF NOT EXISTS trust_score_history (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  score REAL NOT NULL,
  grade TEXT NOT NULL,
  frameworks_active INTEGER NOT NULL DEFAULT 0,
  controls_satisfied INTEGER NOT NULL DEFAULT 0,
  controls_total INTEGER NOT NULL DEFAULT 0,
  evidence_freshness REAL NOT NULL DEFAULT 0,
  open_violations INTEGER NOT NULL DEFAULT 0,
  computed_at TEXT NOT NULL
);
CREATE INDEX idx_tsh_ws ON trust_score_history(workspace_id, computed_at);
