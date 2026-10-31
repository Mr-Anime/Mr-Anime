CREATE TABLE IF NOT EXISTS admin_actions (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  target_user_id TEXT,
  action TEXT NOT NULL,
  details TEXT DEFAULT '{}',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (admin_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user_id ON admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at);
