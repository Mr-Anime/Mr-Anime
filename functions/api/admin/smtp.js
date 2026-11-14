import { ApiError, badRequest, handle } from '../../lib/http.js';
import { requireAdmin } from '../../lib/supabase.js';

const MANAGEMENT_API = 'https://api.supabase.com/v1';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HOST_RE = /^[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?$/i;

function projectRef(env) {
  if (env.SUPABASE_PROJECT_ID) return env.SUPABASE_PROJECT_ID;
  try {
    return new URL(env.SUPABASE_URL).hostname.split('.')[0];
  } catch {
    throw new ApiError('Supabase project is not configured on the server.', { status: 503, code: 'INTERNAL' });
  }
}

function accessToken(env) {
  if (!env.SUPABASE_ACCESS_TOKEN) {
    throw new ApiError(
      'SUPABASE_ACCESS_TOKEN is not configured, so SMTP settings cannot be managed from the admin panel.',
      { status: 503, code: 'INTERNAL' },
    );
  }
  return env.SUPABASE_ACCESS_TOKEN;
}

async function management(env, path, init = {}) {
  const res = await fetch(`${MANAGEMENT_API}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${accessToken(env)}`,
      accept: 'application/json',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
    },
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const message = payload?.message || payload?.error || `Supabase Management API returned ${res.status}.`;
    throw new ApiError(message, { status: 502, code: 'UPSTREAM_ERROR' });
  }
  return payload;
}

function toApi(config) {
  return {
    host: config?.smtp_host || '',
    port: Number(config?.smtp_port) || 587,
    user: config?.smtp_user || '',
    senderEmail: config?.smtp_admin_email || '',
    senderName: config?.smtp_sender_name || '',
    configured: Boolean(config?.smtp_host),
  };
}

function requiredString(value, name, max = 255) {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!s) throw badRequest(`${name} is required.`);
  if (s.length > max) throw badRequest(`${name} must be at most ${max} characters.`);
  return s;
}

function normalize(body) {
  const host = requiredString(body?.host, 'host', 253);
  if (!HOST_RE.test(host)) throw badRequest('host must be a hostname such as smtp.example.com.');

  const port = Number(body?.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw badRequest('port must be an integer between 1 and 65535.');
  }

  const user = requiredString(body?.user, 'user', 320);
  const senderEmail = requiredString(body?.senderEmail, 'senderEmail', 320);
  if (!EMAIL_RE.test(senderEmail)) throw badRequest('senderEmail must be a valid email address.');
  const senderName = requiredString(body?.senderName, 'senderName', 100);

  const pass = typeof body?.pass === 'string' ? body.pass : '';
  if (pass.length > 500) throw badRequest('pass must be at most 500 characters.');

  return {
    smtp_host: host,
    smtp_port: String(port),
    smtp_user: user,
    smtp_admin_email: senderEmail,
    smtp_sender_name: senderName,
    ...(pass ? { smtp_pass: pass } : {}),
  };
}

/**
 * GET /api/admin/smtp        current SMTP settings (password never returned)
 * PUT /api/admin/smtp        save settings through the Supabase Management API
 *
 * This changes Supabase Auth's SMTP config, which is what the built-in
 * resetPasswordForEmail flow uses. Admin only.
 */
export const onRequest = handle(async ({ request, env }) => {
  await requireAdmin(request, env);
  const path = `/projects/${projectRef(env)}/config/auth`;

  if (request.method === 'GET') {
    const config = await management(env, path);
    return { data: toApi(config) };
  }

  if (request.method === 'PUT' || request.method === 'POST') {
    const body = await request.json().catch(() => null);
    if (!body) throw badRequest('Expected a JSON body.');
    await management(env, path, { method: 'PATCH', body: JSON.stringify(normalize(body)) });
    const config = await management(env, path);
    return { data: toApi(config) };
  }

  throw badRequest('Unsupported method.');
}, { methods: ['GET', 'PUT', 'POST'] });
