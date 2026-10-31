import type { APIRoute } from "astro";
import { SESSION_COOKIE } from "../../../lib/session";

export const POST: APIRoute = async ({ cookies, request }) => {
  cookies.set(SESSION_COOKIE, "", { path: "/", httpOnly: true, secure: true, sameSite: "lax", expires: new Date(0) });
  return Response.redirect(new URL("/", request.url), 302);
};

export const GET: APIRoute = async ({ cookies, request }) => {
  cookies.set(SESSION_COOKIE, "", { path: "/", httpOnly: true, secure: true, sameSite: "lax", expires: new Date(0) });
  return Response.redirect(new URL("/", request.url), 302);
};

export const config = { runtime: "edge" };