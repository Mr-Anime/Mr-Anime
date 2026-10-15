"use server";

import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const HANDLED_TYPES = new Set(["invoice", "donation", "payment"]);

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** OxaPay payment IPN — validates HMAC-SHA512(rawBody, merchant key), then upserts. */
export async function POST(request: Request): Promise<Response> {
  const raw = await request.text();
  const hmacHeader = request.headers.get("hmac") ?? "";
  const key = process.env.OXAPAY_MERCHANT_KEY;

  if (!key) {
    console.error("[oxapay:callback] OXAPAY_MERCHANT_KEY missing");
    return new Response("ok", { status: 200 });
  }

  const expected = createHmac("sha512", key).update(raw).digest("hex");
  if (!hmacHeader || !safeEqual(expected, hmacHeader)) {
    console.warn("[oxapay:callback] invalid HMAC signature");
    return new Response("Invalid HMAC signature", { status: 400 });
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const type = String(data.type ?? "");
  if (!HANDLED_TYPES.has(type)) {
    return new Response("ok", { status: 200 });
  }

  const trackId = data.track_id ? String(data.track_id) : "";
  const status = data.status ? String(data.status) : "";
  if (!trackId) return new Response("ok", { status: 200 });

  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc("apply_donation_ipn", {
      p_track_id: trackId,
      p_status: status || "Unknown",
      p_raw: data,
    });
    if (error) {
      console.error("[oxapay:callback] apply_donation_ipn failed", error.message);
    }
  } catch (error) {
    console.error("[oxapay:callback] failed", error);
  }

  return new Response("ok", { status: 200 });
}
