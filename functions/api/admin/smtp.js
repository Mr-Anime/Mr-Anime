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
      'SUPABASE_ACCESS_TOKEN is not configured, so SMTP settings cannot be managed from the admin panel. ' +
        'Set the SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_SENDER_EMAIL / SMTP_SENDER_NAME ' +
        'environment variables to configure email instead.',
      { status: 503, code: 'INTERNAL' },
    );
  }
  return env.SUPABASE_ACCESS_TOKEN;
}

/**
 * SMTP settings supplied through the Pages environment (vars/secrets).
 * These let a deployment configure Supabase Auth email without a personal
 * access token; when a token is present they are applied to the project.
 */
function envConfig(env) {
  const host = String(env.SMTP_HOST || '').trim();
  if (!host) return null;
  const user = String(env.SMTP_USER || '').trim();
  const senderEmail = String(env.SMTP_SENDER_EMAIL || '').trim();
  if (!user || !EMAIL_RE.test(senderEmail)) return null;
  return {
    host,
    port: Number(env.SMTP_PORT) || 587,
    user,
    pass: String(env.SMTP_PASS || ''),
    senderEmail,
    senderName: String(env.SMTP_SENDER_NAME || '').trim() || 'Mr.Anime',
  };
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

function toApi(config, { source = 'supabase', editable = true } = {}) {
  return {
    host: config?.smtp_host || '',
    port: Number(config?.smtp_port) || 587,
    user: config?.smtp_user || '',
    senderEmail: config?.smtp_admin_email || '',
    senderName: config?.smtp_sender_name || '',
    configured: Boolean(config?.smtp_host),
    source,
    editable,
  };
}

function envToApi(settings) {
  return {
    host: settings.host,
    port: settings.port,
    user: settings.user,
    senderEmail: settings.senderEmail,
    senderName: settings.senderName,
    configured: true,
    source: 'environment',
    editable: false,
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

function envToPayload(settings) {
  return {
    smtp_host: settings.host,
    smtp_port: String(settings.port),
    smtp_user: settings.user,
    smtp_admin_email: settings.senderEmail,
    smtp_sender_name: settings.senderName,
    ...(settings.pass ? { smtp_pass: settings.pass } : {}),
  };
}

/**
 * GET /api/admin/smtp        current SMTP settings (password never returned)
 * PUT /api/admin/smtp        save settings through the Supabase Management API
 *
 * This changes Supabase Auth's SMTP config, which is what the built-in
 * resetPasswordForEmail flow uses. Admin only.
 *
 * Configuration sources, in order: the Supabase project's Auth config, then
 * SMTP_* environment variables. When only env vars are present and a
 * SUPABASE_ACCESS_TOKEN is available, they are applied to the project
 * automatically so the panel never reports "unconfigured" for a deployment
 * that already supplies mail credentials through its environment.
 */
export const onRequest = handle(async ({ request, env }) => {
  await requireAdmin(request, env);
  const path = `/projects/${projectRef(env)}/config/auth`;
  const fromEnv = envConfig(env);
  const hasToken = Boolean(env.SUPABASE_ACCESS_TOKEN);

  if (request.method === 'GET') {
    if (!hasToken) {
      if (fromEnv) return { data: envToApi(fromEnv) };
      accessToken(env);
    }

    let config = await management(env, path);
    let source = 'supabase';
    if (!config?.smtp_host && fromEnv) {
      await management(env, path, { method: 'PATCH', body: JSON.stringify(envToPayload(fromEnv)) });
      config = await management(env, path);
      source = 'environment';
    }
    if (!config?.smtp_host) {
      return { data: { ...toApi(config), source: 'none', editable: hasToken } };
    }
    return { data: toApi(config, { source, editable: true }) };
  }

  if (request.method === 'PUT' || request.method === 'POST') {
    accessToken(env);
    const body = await request.json().catch(() => null);
    if (!body) throw badRequest('Expected a JSON body.');
    await management(env, path, { method: 'PATCH', body: JSON.stringify(normalize(body)) });
    const config = await management(env, path);
    return { data: toApi(config) };
  }

  throw badRequest('Unsupported method.');
}, { methods: ['GET', 'PUT', 'POST'] });
