CREATE TABLE IF NOT EXISTS auth_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  last_login_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_auth_users_email ON auth_users(email);
