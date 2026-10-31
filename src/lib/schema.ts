import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified').default(0),
  passwordHash: text('password_hash'),
  username: text('username').unique(),
  avatarUrl: text('avatar_url'),
  role: text('role').default('user'),
  isVerified: integer('is_verified').default(0),
  badges: text('badges').default('[]'),
  isBanned: integer('is_banned').default(0),
  banReason: text('ban_reason'),
  createdAt: integer('created_at').notNull(),
});

export const sessions = sqliteTable('sessions', {
  idHash: text('id_hash').primaryKey(),
  userId: text('user_id').notNull(),
  expiresAt: integer('expires_at').notNull(),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at').notNull(),
});

export const emailTokens = sqliteTable('email_tokens', {
  tokenHash: text('token_hash').primaryKey(),
  userId: text('user_id').notNull(),
  type: text('type').notNull(),
  expiresAt: integer('expires_at').notNull(),
  usedAt: integer('used_at'),
});

export const adminActions = sqliteTable('admin_actions', {
  id: text('id').primaryKey(),
  adminId: text('admin_id').notNull(),
  targetUserId: text('target_user_id'),
  action: text('action').notNull(),
  details: text('details').default('{}'),
  createdAt: integer('created_at').notNull(),
});

export const oauthClients = sqliteTable('oauth_clients', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().unique(),
  clientSecretHash: text('client_secret_hash'),
  name: text('name').notNull(),
  description: text('description'),
  logoUrl: text('logo_url'),
  redirectUris: text('redirect_uris').notNull().default('[]'),
  allowedScopes: text('allowed_scopes').notNull().default('["profile"]'),
  isConfidential: integer('is_confidential').default(0),
  isActive: integer('is_active').default(1),
  ownerId: text('owner_id'),
  createdAt: integer('created_at').notNull(),
});

export const oauthAuthCodes = sqliteTable('oauth_auth_codes', {
  codeHash: text('code_hash').primaryKey(),
  clientId: text('client_id').notNull(),
  userId: text('user_id').notNull(),
  redirectUri: text('redirect_uri').notNull(),
  scopes: text('scopes').notNull(),
  codeChallenge: text('code_challenge').notNull(),
  codeChallengeMethod: text('code_challenge_method').notNull().default('S256'),
  expiresAt: integer('expires_at').notNull(),
  usedAt: integer('used_at'),
});

export const oauthTokens = sqliteTable('oauth_tokens', {
  id: text('id').primaryKey(),
  accessTokenHash: text('access_token_hash').unique(),
  refreshTokenHash: text('refresh_token_hash').unique(),
  clientId: text('client_id').notNull(),
  userId: text('user_id').notNull(),
  scopes: text('scopes').notNull(),
  accessExpiresAt: integer('access_expires_at').notNull(),
  refreshExpiresAt: integer('refresh_expires_at'),
  revokedAt: integer('revoked_at'),
  rotatedFrom: text('rotated_from'),
});

export const oauthConsents = sqliteTable('oauth_consents', {
  userId: text('user_id').notNull(),
  clientId: text('client_id').notNull(),
  scopes: text('scopes').notNull(),
  grantedAt: integer('granted_at').notNull(),
});
