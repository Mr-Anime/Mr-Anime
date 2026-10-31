import { defineMiddleware } from "astro:middleware";
import { getSessionUser } from "./lib/session";

export const onRequest = defineMiddleware(async (context, next) => {
  const env = (context.locals as any).runtime?.env;
  const token = context.cookies.get("mr_session")?.value;
  let user = null;
  if (env && token) {
    try { user = await getSessionUser(env, token); } catch {}
  }
  (context.locals as any).user = user;
  const url = new URL(context.request.url);
  if (url.pathname.startsWith("/admin") && (!user || user.role !== "admin")) {
    return context.redirect("/login?next=" + encodeURIComponent(url.pathname));
  }
  if (url.pathname.startsWith("/account") && !user) {
    return context.redirect("/login?next=" + encodeURIComponent(url.pathname));
  }
  if (url.pathname.startsWith("/developers") && !user) {
    return context.redirect("/login?next=" + encodeURIComponent(url.pathname));
  }
  if (url.pathname === "/suspended" && user && !user.isBanned) {
    return context.redirect("/");
  }
  if (user && user.isBanned && url.pathname !== "/suspended") {
    return context.redirect("/suspended");
  }
  return next();
});