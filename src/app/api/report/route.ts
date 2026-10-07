import { NextResponse, type NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { jsonError } from "@/lib/api";
import { reportSchema } from "@/lib/validation";

/**
 * Report broken video — intentionally NO database.
 * Payloads are logged and optionally forwarded to REPORT_WEBHOOK_URL.
 */
export async function POST(request: NextRequest) {
  const ip = await clientIp();
  const limit = rateLimit(`report:${ip}`, { limit: 5, windowMs: 10 * 60_000 });
  if (!limit.ok) {
    return new Response(
      JSON.stringify({ error: "Too many reports — try again later." }),
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)),
          "Content-Type": "application/json",
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid report payload.", 400);
  }

  const payload = {
    ...parsed.data,
    userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    at: new Date().toISOString(),
  };

  const webhook = process.env.REPORT_WEBHOOK_URL;
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) console.error("[report] webhook responded", res.status);
    } catch (error) {
      console.error("[report] webhook failed", error);
      // Still accept the report — the webhook is optional plumbing.
    }
  } else {
    console.info("[report]", JSON.stringify(payload));
  }

  return NextResponse.json({ ok: true }, { status: 202 });
}
