CREATE TABLE IF NOT EXISTS oauth_clients (
  id TEXT PRIMARY KEY,
  client_id TEXT UNIQUE NOT NULL,
  client_secret_hash TEXT,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  redirect_uris TEXT NOT NULL DEFAULT '[]',
  allowed_scopes TEXT NOT NULL DEFAULT '[\"profile\"]',
  is_confidential INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  owner_id TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_oauth_clients_client_id ON oauth_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_clients_owner_id ON oauth_clients(owner_id);
