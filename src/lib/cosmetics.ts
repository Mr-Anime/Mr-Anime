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

/** Item ids double as class suffixes: frame "frame-frost" -> "shop-frame-frost". */
export function cosmeticClass(itemId: string | null | undefined): string {
  return itemId ? `shop-${itemId}` : "";
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
