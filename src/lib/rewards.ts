/** Mr.Coin reward catalog (coins → permanent perks) — shared by /redeem. */

export type Reward = {
  key: string;
  label: string;
  description: string;
  price: number;
  badgeKey: string;
};

export const REWARD_CATALOG: Reward[] = [
  {
    key: "supporter",
    label: "Supporter badge",
    description: "Permanent gold heart pill next to your name everywhere.",
    price: 250,
    badgeKey: "supporter",
  },
  {
    key: "nebula",
    label: "Nebula Core avatar",
    description: "Exclusive animated energy ring, shards and particles on your profile.",
    price: 1200,
    badgeKey: "nebula",
  },
];

/** Existing /shop Nitro product (30 days) — shown on the Redeem page too. */
export const NITRO_REWARD = {
  key: "nitro-30d",
  label: "Mr. Anime Nitro — 30 days",
  description: "Blue flame profile border, hover card aura and the NITRO badge.",
  price: 1500,
} as const;
