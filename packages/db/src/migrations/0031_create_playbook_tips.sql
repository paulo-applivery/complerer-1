CREATE TABLE IF NOT EXISTS playbook_tips (
  id TEXT PRIMARY KEY,
  playbook_id TEXT NOT NULL REFERENCES playbooks(id),
  tip_type TEXT NOT NULL DEFAULT 'pro_tip',
  content TEXT NOT NULL,
  source_segment TEXT,
  upvotes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL
);
CREATE INDEX idx_tips_playbook ON playbook_tips(playbook_id);
