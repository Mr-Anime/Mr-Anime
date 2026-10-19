/** Badge keys shared by the profile UI and admin actions. */

/** Admin-granted badge for normal users — renders as an image check icon. */
export const MEMBER_VERIFIED_BADGE = "verified";

/** Mr. Anime Nitro — premium badge (blue flame effects). */
export const MEMBER_NITRO_BADGE = "nitro";

/** Exclusive animated Nebula Core avatar effect. */
export const MEMBER_NEBULA_BADGE = "nebula";

/** Moderator-granted verification — renders as an image check icon. */
export const MOD_VERIFIED_BADGE = "mod-verified";

/** Auto-granted on the first paid donation — permanent gold heart pill. */
export const DONOR_BADGE = "supporter";

/** Manual staff badges — admin-grantable from /admin/users. */
export const FOUNDER_BADGE = "founder";
export const EARLY_MEMBER_BADGE = "early";
export const BETA_TESTER_BADGE = "beta";

/** Auto-granted milestone badges. */
export const TOP_FAN_BADGE = "top-fan";
export const BINGE_BADGE = "binge";
export const DEDICATED_BADGE = "dedicated";

/** Badges admins may grant/revoke from /admin/users. */
export const ADMIN_GRANTABLE_BADGES = [
  MEMBER_VERIFIED_BADGE,
  MEMBER_NITRO_BADGE,
  MEMBER_NEBULA_BADGE,
  MOD_VERIFIED_BADGE,
  DONOR_BADGE,
  FOUNDER_BADGE,
  EARLY_MEMBER_BADGE,
  BETA_TESTER_BADGE,
  TOP_FAN_BADGE,
  BINGE_BADGE,
  DEDICATED_BADGE,
] as const;

/** Human labels for pill rendering + the admin badge manager. */
export const BADGE_LABELS: Record<string, string> = {
  supporter: "Supporter",
  early: "Early Member",
  beta: "Beta Tester",
  founder: "Founder",
  moderator: "Moderator",
  "top-fan": "Top Fan",
  binge: "Binge Watcher",
  dedicated: "Dedicated",
  verified: "Verified",
  "mod-verified": "Mod Verified",
  nitro: "Mr. Anime Nitro",
  nebula: "Nebula Core",
};

/** Site-owner verification icon (profiles.is_verified). */
export const OWNER_VERIFIED_IMAGE =
  "https://cdn-icons-png.flaticon.com/512/18295/18295118.png";

/** Admin-granted member verification icon. */
export const MEMBER_VERIFIED_IMAGE =
  "https://cdn-icons-png.flaticon.com/512/9195/9195920.png";

/** Moderator verification icon (local asset). */
export const MOD_VERIFIED_IMAGE = "/icons/moderator-verified.png";
