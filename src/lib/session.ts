import type { APIRoute } from "astro";
import { getDb } from "./db";
import { sessions, users } from "./schema";
import { eq } from "drizzle-orm";
import { sha256Hex, randomBytesHex } from "./crypto";

export const SESSION_COOKIE = "mr_session";

export async function createSession(env: any, userId: string, ip?: string, ua?: string) {
  const token = randomBytesHex(32);
  const idHash = await sha256Hex(token);
  const db = getDb(env);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 60 * 60 * 24 * 30;
  await db.insert(sessions).values({ idHash, userId, expiresAt, ip: ip || null, userAgent: ua || null, createdAt: now });
  return { token, expiresAt };
}

export async function getSessionUser(env: any, token: string | undefined | null) {
  if (!token) return null;
  const idHash = await sha256Hex(token);
  const db = getDb(env);
  const now = Math.floor(Date.now() / 1000);
  const sess = await db.select().from(sessions).where(eq(sessions.idHash, idHash)).get();
  if (!sess || sess.expiresAt < now) return null;
  const user = await db.select().from(users).where(eq(users.id, sess.userId)).get();
  if (!user || user.isBanned) return null;
  return user;
}