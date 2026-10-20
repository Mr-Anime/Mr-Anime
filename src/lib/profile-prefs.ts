/**
 * Profile customization — shared catalogs, theme/banner maps and the
 * `userProfileSchema` (mock JSON shape for saving prefs to Postgres).
 * Client-safe: no server-only imports.
 */
import { z } from "zod";

/* ————————————————————————————————————————————————————————————————
 * userProfileSchema — what the /customize page saves per user.
 */
export const userProfileSchema = z.object({
  /** Catalog avatar id ("one_piece/File1.png") — "" keeps current avatar. */
  avatarId: z.string().max(120),
  /** Banner preset key. */
  bannerId: z.string().max(40),
  /** Title key from TITLES (must be unlocked server-side) or null. */
  title: z.string().max(30).nullable(),
  /** Displayed flair badge keys (max 6). */
  flair: z.array(z.string().max(30)).max(6),
  /** Owned badges to show on the profile card (empty = show all). */
  displayBadges: z.array(z.string().max(40)).max(30),
  /** Top-3 favourite character avatar ids. */
  characters: z.array(z.string().max(120)).max(3),
  theme: z.enum([
    "classic",
    "neon-cyberpunk",
    "dark-sakura",
    "crimson-flame",
    "toxic-rush",
    "royal-violet",
  ]),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

/** Sentinel in displayBadges: user hid every badge (empty array = show all). */
export const BADGE_HIDE_ALL = "__none__";

/** Mock payload example — POST /api/profile-prefs body. */
export const SAMPLE_USER_PROFILE: UserProfile = {
  avatarId: "one_piece/File1.png",
  bannerId: "sakura-dusk",
  title: "otaku-leader",
  flair: ["s-rank", "manga-reader"],
  displayBadges: ["supporter", "founder"],
  characters: ["jujutsu_kaisen/File1.png", "naruto/naruto_01.png", "one_piece/File3.png"],
  theme: "dark-sakura",
};

export const DEFAULT_PREFS: UserProfile = {
  avatarId: "",
  bannerId: "classic",
  title: null,
  flair: [],
  displayBadges: [],
  characters: [],
  theme: "classic",
};

/* ————————————————————————————————————————————————————————————————
 * Titles / taglines — unlocked by watch points or status.
 */
export type TitleRule =
  | { kind: "free" }
  | { kind: "list"; min: number }
  | { kind: "watched"; min: number }
  | { kind: "points"; min: number }
  | { kind: "ratings"; min: number }
  | { kind: "forum"; min: number }
  | { kind: "badge"; badge: string }
  | { kind: "nitro" }
  | { kind: "staff" };

export type TitleDef = {
  key: string;
  label: string;
  hint: string;
  rule: TitleRule;
};

export const TITLES: TitleDef[] = [
  { key: "night-owl", label: "Night Owl", hint: "Everyone starts here.", rule: { kind: "free" } },
  { key: "shonen-fanatic", label: "Shonen Fanatic", hint: "10+ anime in your My List.", rule: { kind: "list", min: 10 } },
  { key: "otaku-leader", label: "Otaku Leader", hint: "50+ watch points (shows ×2 + comments).", rule: { kind: "points", min: 50 } },
  { key: "binge-king", label: "Binge King", hint: "Watch 10+ shows on the site.", rule: { kind: "watched", min: 10 } },
  { key: "critic", label: "Critic", hint: "Rate 5+ anime with stars.", rule: { kind: "ratings", min: 5 } },
  { key: "forum-regular", label: "Forum Regular", hint: "Post 10+ times in the forum.", rule: { kind: "forum", min: 10 } },
  { key: "benefactor", label: "Benefactor", hint: "Own the Supporter badge.", rule: { kind: "badge", badge: "supporter" } },
  { key: "nitro-soul", label: "Nitro Soul", hint: "Active Mr. Anime Nitro.", rule: { kind: "nitro" } },
  { key: "inner-circle", label: "Inner Circle", hint: "Moderator or admin.", rule: { kind: "staff" } },
];

/* ————————————————————————————————————————————————————————————————
 * Flair — decorative badges toggled onto the profile card (free).
 */
export const FLAIR = [
  { key: "s-rank", label: "S-Rank", cls: "text-amber-400 ring-amber-400/50 bg-amber-400/10" },
  { key: "movie-buff", label: "Movie Buff", cls: "text-rose-400 ring-rose-400/50 bg-rose-400/10" },
  { key: "manga-reader", label: "Manga Reader", cls: "text-emerald-400 ring-emerald-400/50 bg-emerald-400/10" },
  { key: "speed-runner", label: "Speed Runner", cls: "text-cyan-400 ring-cyan-400/50 bg-cyan-400/10" },
  { key: "lore-master", label: "Lore Master", cls: "text-purple-400 ring-purple-400/50 bg-purple-400/10" },
  { key: "otaku-prime", label: "Otaku Prime", cls: "text-sky-400 ring-sky-400/50 bg-sky-400/10" },
] as const;

export const FLAIR_KEYS = FLAIR.map((f) => f.key);

/* ————————————————————————————————————————————————————————————————
 * Banner presets (CSS-only, no assets).
 */
export const BANNERS = [
  { id: "classic", label: "Classic", css: "linear-gradient(180deg, #18181b, #09090b)" },
  { id: "sakura-dusk", label: "Sakura Dusk", css: "linear-gradient(135deg, #f9a8d4 0%, #7c3aed 55%, #1e1b4b 100%)" },
  { id: "cyber-grid", label: "Cyber Grid", css: "linear-gradient(120deg, #06b6d4 0%, #0f172a 50%, #d946ef 100%)" },
  { id: "ocean-deep", label: "Ocean Deep", css: "linear-gradient(160deg, #0ea5e9 0%, #0f172a 70%)" },
  { id: "ember-night", label: "Ember Night", css: "linear-gradient(135deg, #f97316 0%, #7f1d1d 55%, #09090b 100%)" },
  { id: "void-purple", label: "Void Purple", css: "linear-gradient(140deg, #4c1d95 0%, #09090b 75%)" },
  { id: "forest-mist", label: "Forest Mist", css: "linear-gradient(150deg, #10b981 0%, #064e3b 60%, #09090b 100%)" },
] as const;

export const BANNER_IDS = BANNERS.map((b) => b.id);

/* ————————————————————————————————————————————————————————————————
 * Color themes — accent drives the profile card border/glow/title.
 */
export type ProfileTheme = {
  label: string;
  accent: string; // hex for inline styles
  text: string; // tailwind class for accent-colored text
  ring: string; // tailwind class for accent rings
  glow: string; // box-shadow css
};

export const PROFILE_THEMES: Record<UserProfile["theme"], ProfileTheme> = {
  classic: {
    label: "Classic Dark",
    accent: "#38bdf8",
    text: "text-sky-400",
    ring: "ring-sky-500/40",
    glow: "0 0 0 rgba(0,0,0,0)",
  },
  "neon-cyberpunk": {
    label: "Neon Cyberpunk",
    accent: "#f0f",
    text: "text-fuchsia-400",
    ring: "ring-fuchsia-500/50",
    glow: "0 0 24px rgba(240,25,240,.35)",
  },
  "dark-sakura": {
    label: "Dark Sakura",
    accent: "#f9a8d4",
    text: "text-pink-300",
    ring: "ring-pink-400/50",
    glow: "0 0 24px rgba(249,168,212,.30)",
  },
  "crimson-flame": {
    label: "Crimson Flame",
    accent: "#f87171",
    text: "text-red-400",
    ring: "ring-red-500/50",
    glow: "0 0 24px rgba(248,113,113,.30)",
  },
  "toxic-rush": {
    label: "Toxic Rush",
    accent: "#a3e635",
    text: "text-lime-400",
    ring: "ring-lime-500/50",
    glow: "0 0 24px rgba(163,230,53,.30)",
  },
  "royal-violet": {
    label: "Royal Violet",
    accent: "#c084fc",
    text: "text-purple-400",
    ring: "ring-purple-500/50",
    glow: "0 0 24px rgba(192,132,252,.30)",
  },
};

export const THEME_KEYS = Object.keys(PROFILE_THEMES) as UserProfile["theme"][];

export function bannerCss(id: string): string {
  return (BANNERS.find((b) => b.id === id) ?? BANNERS[0]).css;
}
