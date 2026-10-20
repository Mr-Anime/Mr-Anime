/* Generate src/lib/avatar-catalog.ts from public/avatars — run once after copying assets. */
const fs = require("fs");
const path = require("path");

const ROOT = path.join("C:", "Users", "User", "Pictures", "Mr.Anime", "public", "avatars");
const OUT = path.join("C:", "Users", "User", "Pictures", "Mr.Anime", "src", "lib", "avatar-catalog.ts");

const ANIME = {
  attack_on_titan: "Attack on Titan",
  berserk: "Berserk",
  bleach: "Bleach",
  chainsaw: "Chainsaw Man",
  conan: "Detective Conan",
  deadnote: "Death Note",
  demon_splayer: "Demon Slayer",
  dragon_ball: "Dragon Ball",
  dragon_ball_chibi: "Dragon Ball Chibi",
  haikyu: "Haikyu!!",
  jujutsu_kaisen: "Jujutsu Kaisen",
  mha: "My Hero Academia",
  naruto: "Naruto",
  one_piece: "One Piece",
  one_punch_man: "One Punch Man",
  sakura: "Sakura",
  spy_family: "Spy x Family",
  tha: "THA",
  zoro_chibi: "Zoro Chibi",
  zoro_normal: "Zoro",
};

const ORDER = [
  "one_piece", "zoro", "zoro_chibi", "naruto", "dragon_ball", "dragon_ball_chibi",
  "jujutsu_kaisen", "demon_splayer", "bleach", "attack_on_titan", "chainsaw",
  "deadnote", "spy_family", "mha", "one_punch_man", "haikyu", "berserk",
  "conan", "sakura", "tha",
];

function labelFromFilename(file) {
  const base = file.replace(/\.[a-z0-9]+$/i, "");
  return base
    .replace(/^(File|avatar-?|avatar2-?|av-?|av-db-?|av-zz-?|user-?|naruto_|dead_note_|bleanch_|opm_|haikyu_|aot_|berserk_)/i, "")
    .replace(/^(\d+)$/, "#$1")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || file;
}

const groups = [];
const byId = {};
for (const folder of ORDER) {
  const dir = path.join(ROOT, folder === "zoro" ? "zoro_normal" : folder);
  if (!fs.existsSync(dir)) continue;
  const key = folder === "zoro" ? "zoro_normal" : folder;
  const label = ANIME[key] ?? key;
  const files = fs.readdirSync(dir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
  const avatars = files.map((file) => ({
    id: `${key}/${file}`,
    src: `/avatars/${key}/${file}`,
    label: labelFromFilename(file),
  }));
  for (const a of avatars) byId[a.id] = a.src;
  groups.push({ key, label, avatars });
}

const total = groups.reduce((n, g) => n + g.avatars.length, 0);
const out = `/* AUTO-GENERATED from public/avatars — do not edit by hand.
 * Run: node scripts/gen-avatars.js (after adding assets to public/avatars).
 * Only these avatars are allowed site-wide (validation in actions/profile-prefs.ts).
 */

export type CatalogAvatar = { id: string; src: string; label: string };
export type AvatarGroup = { key: string; label: string; avatars: CatalogAvatar[] };

export const AVATAR_GROUPS: AvatarGroup[] = ${JSON.stringify(groups, null, 2)};

/** Flat lookup: avatar id → public src path. */
export const AVATAR_SRC: Record<string, string> = ${JSON.stringify(byId, null, 2)};

export const AVATAR_IDS = Object.keys(AVATAR_SRC);

export const AVATAR_TOTAL = ${total};

const SRC_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(AVATAR_SRC).map(([id, src]) => [src, id]),
);

export function getAvatarIdFromSrc(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  return SRC_TO_ID[src];
}

export function isValidCatalogSrc(src: string | null | undefined): boolean {
  if (!src) return false;
  return src in SRC_TO_ID;
}
`;
fs.writeFileSync(OUT, out);
console.log(`Wrote ${OUT} — ${groups.length} groups, ${total} avatars`);
