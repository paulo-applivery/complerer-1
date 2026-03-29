-- Custom field definitions (workspace-scoped, per entity type)
CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  entity_type TEXT NOT NULL CHECK(entity_type IN ('person', 'system', 'access_record')),
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK(field_type IN ('text', 'number', 'select', 'date', 'boolean')),
  field_options TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  required INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(workspace_id, entity_type, field_name)
);
CREATE INDEX idx_cfd_ws_entity ON custom_field_definitions(workspace_id, entity_type);

-- Custom field values (EAV pattern)
CREATE TABLE IF NOT EXISTS custom_field_values (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  entity_type TEXT NOT NULL CHECK(entity_type IN ('person', 'system', 'access_record')),
  entity_id TEXT NOT NULL,
  field_id TEXT NOT NULL REFERENCES custom_field_definitions(id),
  value TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(workspace_id, entity_id, field_id)
);
CREATE INDEX idx_cfv_entity ON custom_field_values(workspace_id, entity_type, entity_id);
CREATE INDEX idx_cfv_field ON custom_field_values(field_id);
