/** Mr. Anime Nitro — premium perk (admin-granted badge and/or timed coin purchase). */

import { MEMBER_NITRO_BADGE } from "@/lib/badges";

export const NITRO_PRICE = 1500;
export const NITRO_DAYS = 30;

type NitroSource = {
  badges?: string[] | null;
  nitro_until?: string | null;
} | null | undefined;

/** True when the user has the Nitro badge or an unexpired paid Nitro period. */
export function isNitroActive(source: NitroSource): boolean {
  if (!source) return false;
  if (source.badges?.includes(MEMBER_NITRO_BADGE)) return true;
  const until = source.nitro_until;
  if (!until) return false;
  const ts = Date.parse(until);
  return Number.isFinite(ts) && ts > Date.now();
}
