CREATE TABLE IF NOT EXISTS oauth_consents (
  user_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  scopes TEXT NOT NULL,
  granted_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, client_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES oauth_clients(client_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_oauth_consents_client_id ON oauth_consents(client_id);
