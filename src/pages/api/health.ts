import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const config = {
  runtime: 'edge',
};
