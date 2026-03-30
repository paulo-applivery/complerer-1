-- Add client_id / client_secret config placeholders to existing integration providers.
-- Admins fill these in via /admin/providers → Integration tab.
-- Uses the real provider IDs already seeded in the DB.

INSERT OR IGNORE INTO platform_provider_configs (id, provider_id, key, value, is_secret, created_at, updated_at) VALUES
  ('cfg_gh_cid',  'prov_github',    'client_id',     '', 0, datetime('now'), datetime('now')),
  ('cfg_gh_cs',   'prov_github',    'client_secret', '', 1, datetime('now'), datetime('now')),
  ('cfg_gw_cid',  'prov_google_ws', 'client_id',     '', 0, datetime('now'), datetime('now')),
  ('cfg_gw_cs',   'prov_google_ws', 'client_secret', '', 1, datetime('now'), datetime('now')),
  ('cfg_ji_cid',  'prov_jira',      'client_id',     '', 0, datetime('now'), datetime('now')),
  ('cfg_ji_cs',   'prov_jira',      'client_secret', '', 1, datetime('now'), datetime('now')),
  ('cfg_li_cid',  'prov_linear',    'client_id',     '', 0, datetime('now'), datetime('now')),
  ('cfg_li_cs',   'prov_linear',    'client_secret', '', 1, datetime('now'), datetime('now'));
