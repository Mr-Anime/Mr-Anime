import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const roleEnum = ["user", "creator", "moderator", "admin"] as const;
export type Role = (typeof roleEnum)[number];

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  image: text("image"),
  role: text("role").notNull().default("user"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const accounts = sqliteTable("accounts", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = sqliteTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const creatorApplications = sqliteTable("creator_applications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  channelName: text("channel_name").notNull(),
  bio: text("bio").notNull(),
  portfolioLinks: text("portfolio_links").notNull().default("[]"),
  sampleWorkUrl: text("sample_work_url"),
  ownsRights: integer("owns_rights", { mode: "boolean" }).notNull().default(false),
  status: text("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  reviewedBy: text("reviewed_by").references(() => users.id),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const genres = sqliteTable("genres", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const series = sqliteTable("series", {
  id: text("id").primaryKey(),
  creatorId: text("creator_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  posterUrl: text("poster_url"),
  bannerUrl: text("banner_url"),
  ageRating: text("age_rating").notNull().default("PG-13"),
  status: text("status").notNull().default("ongoing"),
  visibility: text("visibility").notNull().default("premium"),
  moderationStatus: text("moderation_status").notNull().default("draft"),
  rejectionReason: text("rejection_reason"),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const seriesGenres = sqliteTable("series_genres", {
  seriesId: text("series_id").notNull().references(() => series.id, { onDelete: "cascade" }),
  genreId: text("genre_id").notNull().references(() => genres.id, { onDelete: "cascade" }),
});

export const seriesTags = sqliteTable("series_tags", {
  seriesId: text("series_id").notNull().references(() => series.id, { onDelete: "cascade" }),
  tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
});

export const seasons = sqliteTable("seasons", {
  id: text("id").primaryKey(),
  seriesId: text("series_id").notNull().references(() => series.id, { onDelete: "cascade" }),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const episodes = sqliteTable("episodes", {
  id: text("id").primaryKey(),
  seasonId: text("season_id").notNull().references(() => seasons.id, { onDelete: "cascade" }),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration").notNull().default(0),
  videoAssetKey: text("video_asset_key"),
  hlsMasterKey: text("hls_master_key"),
  skipIntroStart: integer("skip_intro_start"),
  skipIntroEnd: integer("skip_intro_end"),
  moderationStatus: text("moderation_status").notNull().default("draft"),
  rejectionReason: text("rejection_reason"),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const subtitles = sqliteTable("subtitles", {
  id: text("id").primaryKey(),
  episodeId: text("episode_id").notNull().references(() => episodes.id, { onDelete: "cascade" }),
  language: text("language").notNull(),
  label: text("label").notNull(),
  fileKey: text("file_key").notNull(),
});

export const transcodeJobs = sqliteTable("transcode_jobs", {
  id: text("id").primaryKey(),
  episodeId: text("episode_id").notNull().references(() => episodes.id, { onDelete: "cascade" }),
  rawKey: text("raw_key").notNull(),
  status: text("status").notNull().default("queued"),
  error: text("error"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const plans = sqliteTable("plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  priceCents: integer("price_cents").notNull(),
  interval: text("interval").notNull().default("monthly"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: text("plan_id").notNull().references(() => plans.id),
  status: text("status").notNull().default("active"),
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
  provider: text("provider").notNull().default("stub"),
  providerRef: text("provider_ref"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const adSlots = sqliteTable("ad_slots", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  position: text("position").notNull().default("preroll"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const adCreatives = sqliteTable("ad_creatives", {
  id: text("id").primaryKey(),
  slotId: text("slot_id").notNull().references(() => adSlots.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  videoUrl: text("video_url"),
  vastTagUrl: text("vast_tag_url"),
  skipAfterSeconds: integer("skip_after_seconds").notNull().default(5),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const adImpressions = sqliteTable("ad_impressions", {
  id: text("id").primaryKey(),
  creativeId: text("creative_id").notNull().references(() => adCreatives.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id),
  episodeId: text("episode_id").references(() => episodes.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const watchlist = sqliteTable("watchlist", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  seriesId: text("series_id").notNull().references(() => series.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const watchProgress = sqliteTable("watch_progress", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  episodeId: text("episode_id").notNull().references(() => episodes.id, { onDelete: "cascade" }),
  positionSeconds: integer("position_seconds").notNull().default(0),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  episodeId: text("episode_id").notNull().references(() => episodes.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  status: text("status").notNull().default("visible"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const ratings = sqliteTable("ratings", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  seriesId: text("series_id").notNull().references(() => series.id, { onDelete: "cascade" }),
  value: integer("value").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  reporterId: text("reporter_id").notNull().references(() => users.id),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").references(() => users.id),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  metadata: text("metadata").notNull().default("{}"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
