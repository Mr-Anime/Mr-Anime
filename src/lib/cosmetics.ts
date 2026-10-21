/** Shared cosmetics helpers (safe for client + server imports). */

export type ShopKind = "frame" | "name_style" | "name_animation";

export type Cosmetics = {
  frame: string | null;
  nameStyle: string | null;
  nameAnimation: string | null;
};

export const EMPTY_COSMETICS: Cosmetics = {
  frame: null,
  nameStyle: null,
  nameAnimation: null,
};

export const SLOT_KINDS = ["frame", "name_style", "name_animation"] as const;

export type ShopSlot = (typeof SLOT_KINDS)[number];

/** Custom / exclusive avatar frames assigned directly to usernames. */
export const SPECIAL_USER_FRAMES: Record<string, string> = {
  mostofa: "frame-mostofa",
};

export type ExclusiveFrame = {
  id: string;
  label: string;
  description: string;
  src: string;
};

/**
 * Admin-grantable exclusive frames. They are seeded into shop_items as
 * inactive (never purchasable) and assigned from the admin users table.
 * Add the matching CSS class in globals.css when adding a frame here.
 */
export const EXCLUSIVE_FRAMES: ExclusiveFrame[] = [
  {
    id: "frame-exclusive-crimson",
    label: "Crimson Ring",
    description: "Dark crimson blades circling your avatar.",
    src: "/frames/a_fbefe2b8f016d8dffa230e01f89aa8f2.webp",
  },
];

export const EXCLUSIVE_FRAME_IDS = EXCLUSIVE_FRAMES.map((frame) => frame.id);

/**
 * Resolves avatar frame with fallback to special user assigned frames (e.g. mostofa).
 */
export function resolveUserFrame(
  username: string | null | undefined,
  equippedFrame?: string | null,
): string | null {
  if (!username) return equippedFrame ?? null;
  const lower = username.trim().toLowerCase();
  if (lower in SPECIAL_USER_FRAMES) {
    return SPECIAL_USER_FRAMES[lower];
  }
  return equippedFrame ?? null;
}

/** Item ids double as class suffixes: frame "frame-frost" -> "shop-frame-frost". */
export function cosmeticClass(itemId: string | null | undefined): string {
  if (!itemId) return "";
  if (itemId === "a_ec414bdc7349060e321e6c652698c7d8" || itemId === "frame-mostofa") {
    return "shop-frame-mostofa";
  }
  return `shop-${itemId}`;
}

/** Convenience helper: get avatar frame class directly for a user. */
export function userFrameClass(
  username: string | null | undefined,
  cosmetics?: Cosmetics | null | undefined,
): string {
  const frame = resolveUserFrame(username, cosmetics?.frame);
  return cosmeticClass(frame);
}

/** Name classes: equipped style + animation. */
export function nameClasses(cosmetics: Cosmetics | null | undefined): string {
  if (!cosmetics) return "";
  return [cosmeticClass(cosmetics.nameStyle), cosmeticClass(cosmetics.nameAnimation)]
    .filter(Boolean)
    .join(" ");
}

/** Avatar frame class. */
export function frameClasses(cosmetics: Cosmetics | null | undefined): string {
  if (!cosmetics) return "";
  return cosmeticClass(cosmetics.frame);
}
