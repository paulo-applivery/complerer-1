-- OAuth state tokens for CSRF protection during OAuth flows
CREATE TABLE IF NOT EXISTS oauth_states (
  id TEXT PRIMARY KEY,           -- random state token (used as CSRF token)
  workspace_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_oauth_states_ws ON oauth_states(workspace_id);

-- Add encrypted token columns to integrations
ALTER TABLE integrations ADD COLUMN access_token_enc TEXT;
ALTER TABLE integrations ADD COLUMN refresh_token_enc TEXT;
ALTER TABLE integrations ADD COLUMN token_expires_at TEXT;
ALTER TABLE integrations ADD COLUMN token_scope TEXT;
ALTER TABLE integrations ADD COLUMN auth_type TEXT NOT NULL DEFAULT 'api_key';
