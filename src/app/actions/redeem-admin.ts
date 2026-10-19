"use server";

import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminGate } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type RedeemAdminResult =
  | { ok: true; message: string; code?: string }
  | { ok: false; error: string };

const createSchema = z.object({
  coins: z.number().int().min(0).max(100000),
  badge: z.string().trim().max(40).nullable(),
  maxUses: z.number().int().min(1).max(10000),
  days: z.number().int().min(0).max(365), // 0 = never expires
});

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous chars

function generateCode(): string {
  const out: string[] = [];
  for (let g = 0; g < 3; g++) {
    let block = "";
    for (let i = 0; i < 4; i++) block += ALPHABET[randomInt(ALPHABET.length)];
    out.push(block);
  }
  return out.join("-");
}

async function requireAdmin(): Promise<
  { adminId: string } | { error: RedeemAdminResult }
> {
  const gate = await adminGate();
  if (gate.status !== "ok") return { error: { ok: false, error: "Not authorized." } };
  return { adminId: gate.adminId };
}

async function audit(adminId: string, action: string, details: Record<string, unknown>) {
  try {
    const admin = createAdminClient();
    await admin.from("admin_actions").insert({
      admin_id: adminId,
      target_user_id: null,
      action,
      details,
    });
  } catch (error) {
    console.error("[redeem-admin] audit write failed", error);
  }
}

/** Generate a new redeem code. */
export async function createRedeemCode(input: {
  coins: number;
  badge: string | null;
  maxUses: number;
  days: number;
}): Promise<RedeemAdminResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid code settings." };
  if (parsed.data.coins === 0 && !parsed.data.badge) {
    return { ok: false, error: "Give the code coins or a badge." };
  }

  try {
    const admin = createAdminClient();
    // Retry on the (rare) unique collision.
    let code = generateCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await admin
        .from("redeem_codes")
        .insert({
          code,
          coins: parsed.data.coins,
          badge: parsed.data.badge || null,
          max_uses: parsed.data.maxUses,
          expires_at:
            parsed.data.days > 0
              ? new Date(Date.now() + parsed.data.days * 24 * 60 * 60 * 1000).toISOString()
              : null,
          created_by: auth.adminId,
        })
        .select("code")
        .single();
      if (!error && data) {
        await audit(auth.adminId, "redeem_code_create", {
          code: data.code,
          coins: parsed.data.coins,
          badge: parsed.data.badge || null,
          max_uses: parsed.data.maxUses,
        });
        revalidatePath("/admin/redeem");
        return { ok: true, message: `Code ${data.code} created.`, code: data.code };
      }
      if (!error?.message?.includes("duplicate")) {
        console.error("[redeem-admin] create failed", error?.message);
        return { ok: false, error: "Could not create the code. Try again." };
      }
      code = generateCode();
    }
    return { ok: false, error: "Could not create a unique code. Try again." };
  } catch (error) {
    console.error("[redeem-admin] create failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}

/** Activate or deactivate an existing code. */
export async function toggleRedeemCode(
  id: string,
  active: boolean,
): Promise<RedeemAdminResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("redeem_codes")
      .update({ active })
      .eq("id", id)
      .select("code")
      .single();
    if (error || !data) {
      console.error("[redeem-admin] toggle failed", error?.message);
      return { ok: false, error: "Could not update that code." };
    }
    await audit(auth.adminId, "redeem_code_toggle", { code: data.code, active });
    revalidatePath("/admin/redeem");
    return { ok: true, message: active ? `Code ${data.code} activated.` : `Code ${data.code} deactivated.` };
  } catch (error) {
    console.error("[redeem-admin] toggle failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}

/** Delete a code and its claim history (cascade). */
export async function deleteRedeemCode(id: string): Promise<RedeemAdminResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("redeem_codes")
      .delete()
      .eq("id", id)
      .select("code")
      .single();
    if (error || !data) {
      console.error("[redeem-admin] delete failed", error?.message);
      return { ok: false, error: "Could not delete that code." };
    }
    await audit(auth.adminId, "redeem_code_delete", { code: data.code });
    revalidatePath("/admin/redeem");
    return { ok: true, message: `Code ${data.code} deleted.` };
  } catch (error) {
    console.error("[redeem-admin] delete failed", error);
    return { ok: false, error: "Supabase is not configured." };
  }
}
