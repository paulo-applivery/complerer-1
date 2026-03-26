CREATE TABLE IF NOT EXISTS compliance_events (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  data TEXT NOT NULL DEFAULT '{}',
  actor_id TEXT,
  actor_type TEXT NOT NULL DEFAULT 'system',
  metadata TEXT DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX idx_ce_ws_type_date ON compliance_events(workspace_id, event_type, created_at);
CREATE INDEX idx_ce_ws_entity ON compliance_events(workspace_id, entity_id, created_at);
CREATE INDEX idx_ce_ws_entity_type ON compliance_events(workspace_id, entity_type, created_at);
