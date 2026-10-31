CREATE TABLE IF NOT EXISTS oauth_auth_codes (
  code_hash TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  scopes TEXT NOT NULL,
  code_challenge TEXT NOT NULL,
  code_challenge_method TEXT NOT NULL DEFAULT 'S256',
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  FOREIGN KEY (client_id) REFERENCES oauth_clients(client_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_client_id ON oauth_auth_codes(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_user_id ON oauth_auth_codes(user_id);
