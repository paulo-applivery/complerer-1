CREATE TABLE IF NOT EXISTS frameworks (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  source_org TEXT,
  source_url TEXT,
  created_at TEXT NOT NULL
);
