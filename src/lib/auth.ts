import type { APIContext } from "astro";
import { env } from "cloudflare:workers";

const SESSION_COOKIE = "mr_anime_session";
const SESSION_DAYS = 30;

export interface User {
  id: number;
  username: string;
  role: "user" | "moderator" | "admin";
  badge: string | null;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 210_000, hash: "SHA-256" }, key, 256);
  return `${toHex(salt)}:${toHex(new Uint8Array(derived))}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, expectedHex] = stored.split(":");
  if (!saltHex || !expectedHex) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: toArrayBuffer(fromHex(saltHex)), iterations: 210_000, hash: "SHA-256" },
    key,
    256,
  );
  const actual = new Uint8Array(derived);
  const expected = fromHex(expectedHex);
  return actual.length === expected.length && actual.every((byte, index) => byte === expected[index]);
}

export async function issueSession(context: APIContext, userId: number): Promise<void> {
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare(
    "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
  ).bind(userId, tokenHash, expiresAt).run();
  context.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: new URL(context.request.url).protocol === "https:",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return toHex(new Uint8Array(digest));
}

export async function currentUser(context: APIContext): Promise<User | null> {
  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = await hashToken(token);
  const row = await env.DB.prepare(`
    SELECT u.id, u.username, u.role, u.badge, u.status, u.blocked_until
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?
  `).bind(tokenHash, new Date().toISOString()).first<User & { status: string; blocked_until: string | null }>();

  if (!row || row.status === "banned" || (row.status === "blocked" && (!row.blocked_until || row.blocked_until > new Date().toISOString()))) {
    return null;
  }
  if (row.status === "blocked") {
    await env.DB.prepare("UPDATE users SET status = 'active', blocked_until = NULL WHERE id = ?").bind(row.id).run();
  }
  const { status: _status, blocked_until: _blockedUntil, ...user } = row;
  return user;
}

export function clearSession(context: APIContext): void {
  context.cookies.delete(SESSION_COOKIE, { path: "/" });
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "cache-control": "no-store" } });
}
