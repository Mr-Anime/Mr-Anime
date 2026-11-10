const BASE_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'x-content-type-options': 'nosniff',
};

export class ApiError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL', headers } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.headers = headers;
  }
}

export function json(data, { status = 200, headers = {}, cacheControl } = {}) {
  const h = { ...BASE_HEADERS, ...headers };
  if (cacheControl) h['cache-control'] = cacheControl;
  return new Response(JSON.stringify(data), { status, headers: h });
}

/** Wrap a route handler: method check, JSON error envelope, logging. */
export function handle(handler, { methods = ['GET'] } = {}) {
  return async function wrapped(context) {
    const { request } = context;
    const started = Date.now();
    try {
      if (!methods.includes(request.method)) {
        throw new ApiError(`Method ${request.method} not allowed`, {
          status: 405,
          code: 'BAD_REQUEST',
          headers: { allow: methods.join(', ') },
        });
      }
      const result = await handler(context);
      return result instanceof Response ? result : json(result);
    } catch (err) {
      if (err instanceof ApiError) {
        return json({ error: err.message, code: err.code }, { status: err.status, headers: err.headers });
      }
      console.error(`[api] ${request.method} ${request.url} failed after ${Date.now() - started}ms:`, err);
      return json({ error: 'Unexpected server error.', code: 'INTERNAL' }, { status: 500 });
    }
  };
}

export function badRequest(message) {
  return new ApiError(message, { status: 400, code: 'BAD_REQUEST' });
}

export function notFound(message = 'Not found') {
  return new ApiError(message, { status: 404, code: 'NOT_FOUND' });
}

export function positiveInt(value, fallback, { max = 50 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.floor(n), max);
}
