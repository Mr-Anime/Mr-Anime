/** Badge keys shared by the profile UI and admin actions. */

/** Admin-granted badge for normal users — renders as an image check icon. */
export const MEMBER_VERIFIED_BADGE = "verified";

/** Mr. Anime Nitro — premium badge (blue flame effects). */
export const MEMBER_NITRO_BADGE = "nitro";

/** Exclusive animated Nebula Core avatar effect. */
export const MEMBER_NEBULA_BADGE = "nebula";

/** Moderator-granted verification — renders as an image check icon. */
export const MOD_VERIFIED_BADGE = "mod-verified";

/** Badges admins may grant/revoke from /admin/users. */
export const ADMIN_GRANTABLE_BADGES = [
  MEMBER_VERIFIED_BADGE,
  MEMBER_NITRO_BADGE,
  MEMBER_NEBULA_BADGE,
  MOD_VERIFIED_BADGE,
] as const;

/** Site-owner verification icon (profiles.is_verified). */
export const OWNER_VERIFIED_IMAGE =
  "https://cdn-icons-png.flaticon.com/512/18295/18295118.png";

/** Admin-granted member verification icon. */
export const MEMBER_VERIFIED_IMAGE =
  "https://cdn-icons-png.flaticon.com/512/9195/9195920.png";

/** Moderator verification icon (local asset). */
export const MOD_VERIFIED_IMAGE = "/icons/moderator-verified.png";
