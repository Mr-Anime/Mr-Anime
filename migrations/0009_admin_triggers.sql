CREATE TRIGGER IF NOT EXISTS prevent_demote_last_admin
BEFORE UPDATE OF role ON users
WHEN OLD.role = 'admin' AND NEW.role = 'user'
BEGIN
  SELECT CASE
    WHEN (SELECT COUNT(*) FROM users WHERE role = 'admin') <= 1
    THEN RAISE(ABORT, 'Cannot demote the last admin')
  END;
END;

CREATE TRIGGER IF NOT EXISTS prevent_ban_last_admin
BEFORE UPDATE OF is_banned ON users
WHEN OLD.is_banned = 0 AND NEW.is_banned = 1 AND OLD.role = 'admin'
BEGIN
  SELECT CASE
    WHEN (SELECT COUNT(*) FROM users WHERE role = 'admin' AND is_banned = 0) <= 1
    THEN RAISE(ABORT, 'Cannot ban the last admin')
  END;
END;

CREATE TRIGGER IF NOT EXISTS prevent_delete_last_admin
BEFORE DELETE ON users
WHEN OLD.role = 'admin'
BEGIN
  SELECT CASE
    WHEN (SELECT COUNT(*) FROM users WHERE role = 'admin') <= 1
    THEN RAISE(ABORT, 'Cannot delete the last admin')
  END;
END;
