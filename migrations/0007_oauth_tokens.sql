CREATE TABLE IF NOT EXISTS oauth_tokens (
  id TEXT PRIMARY KEY,
  access_token_hash TEXT UNIQUE,
  refresh_token_hash TEXT UNIQUE,
  client_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  scopes TEXT NOT NULL,
  access_expires_at INTEGER NOT NULL,
  refresh_expires_at INTEGER,
  revoked_at INTEGER,
  rotated_from TEXT,
  FOREIGN KEY (client_id) REFERENCES oauth_clients(client_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_access_token_hash ON oauth_tokens(access_token_hash);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_refresh_token_hash ON oauth_tokens(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_client_id ON oauth_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON oauth_tokens(user_id);
