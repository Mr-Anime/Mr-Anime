"use server";

import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { siteConfig } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOxapayInvoice } from "@/lib/oxapay";

export type DonationActionResult =
  | { ok: true; message: string; url: string }
  | { ok: false; error: string };

const donationSchema = z.object({
  amount: z
    .number()
    .min(1, "Minimum donation is $1.")
    .max(10000, "Maximum donation is $10,000."),
  email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address.")
    .optional(),
  message: z
    .string()
    .trim()
    .max(300, "Message must be 300 characters or fewer.")
    .optional(),
});

async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : siteConfig.url;
}

export async function createDonation(input: {
  amount: number;
  email?: string;
  message?: string;
}): Promise<DonationActionResult> {
  const ip = await clientIp();
  const ipLimit = rateLimit(`donate:${ip}`, { limit: 5, windowMs: 10 * 60_000 });
  if (!ipLimit.ok) {
    return { ok: false, error: "Too many attempts — try again in a few minutes." };
  }

  const parsed = donationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid donation." };
  }

  try {
    // Optional: attach the donation to the signed-in profile (never required).
    let userId: string | null = null;
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getClaims();
    if (authData?.claims?.sub) userId = authData.claims.sub;

    const orderId = `DON-${randomUUID()}`;
    const origin = await requestOrigin();
    const { amount, email, message } = parsed.data;

    const result = await createOxapayInvoice({
      amount,
      orderId,
      description: message
        ? `Mr.Anime donation — ${message.slice(0, 120)}`
        : "Mr.Anime donation",
      callbackUrl: `${origin}/api/oxapay/callback`,
      returnUrl: `${origin}/donate/success?order_id=${orderId}`,
      ...(email ? { email } : {}),
    });
    if (!result.ok) return { ok: false, error: result.error };

    const admin = createAdminClient();
    const { error: insertError } = await admin.from("donations").insert({
      order_id: orderId,
      track_id: result.invoice.trackId,
      user_id: userId,
      amount,
      email: email || null,
      message: message || null,
      status: "Pending",
    });
    if (insertError) {
      console.error("[donations] insert failed", insertError.message);
    }

    revalidatePath("/donate");
    return { ok: true, message: "Redirecting to payment…", url: result.invoice.paymentUrl };
  } catch (error) {
    console.error("[donations] create failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}
