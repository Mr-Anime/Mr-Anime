import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const issuer = url.origin;
  const meta = {
    issuer,
    authorization_endpoint: issuer + "/oauth/authorize",
    token_endpoint: issuer + "/oauth/token",
    revocation_endpoint: issuer + "/oauth/revoke",
    introspection_endpoint: issuer + "/oauth/introspect",
    userinfo_endpoint: issuer + "/oauth/userinfo",
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post", "none"],
    scopes_supported: ["profile", "email"],
    subject_types_supported: ["public"],
  };
  return new Response(JSON.stringify(meta), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
};

export const config = { runtime: "edge" };