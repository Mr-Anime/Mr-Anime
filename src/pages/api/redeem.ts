import type { APIRoute } from "astro";
import { currentUser, json } from "../../lib/auth";

export const POST: APIRoute = async (context) => {
  const user = await currentUser(context);
  if (!user) return json({ error: "Sign in to redeem a code." }, 401);
  let input: Record<string, unknown>;
  try {
    input = await context.request.json() as Record<string, unknown>;
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) return json({ error: "A JSON object is required." }, 400);
  const code = typeof input.code === "string" ? input.code.trim() : "";
  if (!/^[A-Za-z0-9_-]{3,64}$/.test(code)) return json({ error: "Enter a valid promo code." }, 400);
  const db = context.locals.runtime.env.DB;
  const promo = await db.prepare("SELECT id, item_type, item_id FROM promo_codes WHERE code = ? COLLATE NOCASE AND active = 1")
    .bind(code).first<{ id: number; item_type: string; item_id: number }>();
  if (!promo) return json({ error: "This code is invalid or inactive." }, 404);
  const alreadyUsed = await db.prepare("SELECT id FROM redemptions WHERE user_id = ? AND promo_code_id = ?")
    .bind(user.id, promo.id).first();
  if (alreadyUsed) return json({ error: "You have already redeemed this code." }, 409);

  const redemptionResults = await db.batch([
    db.prepare(`
      INSERT INTO redemptions (user_id, promo_code_id)
      SELECT ?, p.id FROM promo_codes p
      WHERE p.id = ? AND p.active = 1
        AND (p.expires_at IS NULL OR p.expires_at > ?)
        AND (p.max_redemptions IS NULL OR
          (SELECT COUNT(*) FROM redemptions r WHERE r.promo_code_id = p.id) < p.max_redemptions)
      ON CONFLICT (user_id, promo_code_id) DO NOTHING
    `).bind(user.id, promo.id, new Date().toISOString()),
    db.prepare(`
      INSERT OR IGNORE INTO user_inventory (user_id, item_type, item_id)
      SELECT ?, item_type, item_id FROM promo_codes p
      WHERE p.id = ? AND EXISTS (
        SELECT 1 FROM redemptions r WHERE r.user_id = ? AND r.promo_code_id = p.id
      )
    `).bind(user.id, promo.id, user.id),
  ]);
  if (redemptionResults[0].meta.changes === 0) return json({ error: "This code has expired, reached its redemption limit, or was just redeemed." }, 409);
  await db.prepare(`
    INSERT INTO notifications (user_id, title, body, kind)
    VALUES (?, 'Reward unlocked', 'A promo code reward was added to your collection.', 'reward')
  `).bind(user.id).run();
  return json({ ok: true, item: { type: promo.item_type, id: promo.item_id } });
};
