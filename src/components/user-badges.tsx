import Image from "next/image";
import {
  ClockIcon,
  CrownIcon,
  FlaskConicalIcon,
  FlameIcon,
  HeartHandshakeIcon,
  PopcornIcon,
  ShieldCheckIcon,
  ShieldIcon,
  SparklesIcon,
  TrophyIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "cn";
import {
  BADGE_LABELS,
  BETA_TESTER_BADGE,
  BINGE_BADGE,
  DEDICATED_BADGE,
  DONOR_BADGE,
  EARLY_MEMBER_BADGE,
  FOUNDER_BADGE,
  MEMBER_NEBULA_BADGE,
  MEMBER_NITRO_BADGE,
  MEMBER_VERIFIED_BADGE,
  MEMBER_VERIFIED_IMAGE,
  MOD_VERIFIED_BADGE,
  MOD_VERIFIED_IMAGE,
  OWNER_VERIFIED_IMAGE,
  TOP_FAN_BADGE,
} from "@/lib/badges";

type Props = {
  role?: string | null;
  isVerified?: boolean | null;
  badges?: string[] | null;
  /** Mr. Anime Nitro (badge or active paid period). */
  nitro?: boolean;
  className?: string;
};

/** Special pill styling for milestone/staff badges (key, text, icon, classes). */
const SPECIAL_PILLS: {
  key: string;
  text: string;
  icon: React.ReactNode;
  cls: string;
}[] = [
  {
    key: FOUNDER_BADGE,
    text: "FOUNDER",
    icon: <CrownIcon className="size-2.5" />,
    cls: "bg-amber-400/15 text-amber-400 ring-1 ring-amber-400/50 ring-inset",
  },
  {
    key: EARLY_MEMBER_BADGE,
    text: "EARLY",
    icon: <ClockIcon className="size-2.5" />,
    cls: "bg-zinc-300/15 text-zinc-200 ring-1 ring-zinc-400/50 ring-inset",
  },
  {
    key: BETA_TESTER_BADGE,
    text: "BETA",
    icon: <FlaskConicalIcon className="size-2.5" />,
    cls: "bg-cyan-400/15 text-cyan-400 ring-1 ring-cyan-400/50 ring-inset",
  },
  {
    key: TOP_FAN_BADGE,
    text: "TOP FAN",
    icon: <TrophyIcon className="size-2.5" />,
    cls: "bg-yellow-400/15 text-yellow-400 ring-1 ring-yellow-400/50 ring-inset",
  },
  {
    key: BINGE_BADGE,
    text: "BINGE",
    icon: <PopcornIcon className="size-2.5" />,
    cls: "bg-orange-400/15 text-orange-400 ring-1 ring-orange-400/50 ring-inset",
  },
  {
    key: DEDICATED_BADGE,
    text: "DEDICATED",
    icon: <FlameIcon className="size-2.5" />,
    cls: "bg-red-400/15 text-red-400 ring-1 ring-red-400/50 ring-inset",
  },
];

const SPECIAL_KEYS = new Set(SPECIAL_PILLS.map((p) => p.key));

function customLabel(key: string) {
  return BADGE_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

export function UserBadges({ role, isVerified, badges, nitro, className }: Props) {
  const all = (badges ?? []).filter(Boolean);
  const hasMemberVerified = all.includes(MEMBER_VERIFIED_BADGE);
  const hasModVerified = all.includes(MOD_VERIFIED_BADGE);
  const hasNitro = nitro === true || all.includes(MEMBER_NITRO_BADGE);
  const hasNebula = all.includes(MEMBER_NEBULA_BADGE);
  const hasDonor = all.includes(DONOR_BADGE);
  const custom = all.filter(
    (key) =>
      key !== MEMBER_VERIFIED_BADGE &&
      key !== MOD_VERIFIED_BADGE &&
      key !== MEMBER_NITRO_BADGE &&
      key !== MEMBER_NEBULA_BADGE &&
      key !== DONOR_BADGE &&
      !SPECIAL_KEYS.has(key),
  );
  const specials = SPECIAL_PILLS.filter((p) => all.includes(p.key));

  if (
    !isVerified &&
    role !== "admin" &&
    role !== "moderator" &&
    !hasMemberVerified &&
    !hasModVerified &&
    !hasNitro &&
    !hasNebula &&
    !hasDonor &&
    custom.length === 0 &&
    specials.length === 0
  ) {
    return null;
  }

  return (
    <span
      className={cn("inline-flex items-center gap-1 align-middle", className)}
      aria-label="Account badges"
    >
      {isVerified ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Image
                src={OWNER_VERIFIED_IMAGE}
                alt="Owner verified"
                width={16}
                height={16}
                className="size-4 shrink-0"
              />
            }
          />
          <TooltipContent>Owner verified</TooltipContent>
        </Tooltip>
      ) : null}

      {hasMemberVerified ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Image
                src={MEMBER_VERIFIED_IMAGE}
                alt="Verified"
                width={16}
                height={16}
                className="size-4 shrink-0"
              />
            }
          />
          <TooltipContent>Verified</TooltipContent>
        </Tooltip>
      ) : null}

      {hasModVerified ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Image
                src={MOD_VERIFIED_IMAGE}
                alt="Moderator verified"
                width={16}
                height={16}
                className="size-4 shrink-0"
              />
            }
          />
          <TooltipContent>Moderator verified</TooltipContent>
        </Tooltip>
      ) : null}

      {hasNitro ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Badge
                className="nitro-pill h-4 gap-0.5 rounded-sm px-1 text-[10px] font-bold tracking-wide border-0"
              />
            }
          >
            <FlameIcon className="size-2.5" />
            NITRO
          </TooltipTrigger>
          <TooltipContent>Mr. Anime Nitro</TooltipContent>
        </Tooltip>
      ) : null}

      {hasNebula ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Badge
                className="nebula-pill h-4 gap-0.5 rounded-sm px-1 text-[10px] font-bold tracking-wide border-0"
              />
            }
          >
            <SparklesIcon className="size-2.5" />
            NEBULA
          </TooltipTrigger>
          <TooltipContent>Nebula Core avatar</TooltipContent>
        </Tooltip>
      ) : null}

      {hasDonor ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Badge className="donor-pill h-4 gap-0.5 rounded-sm border-0 px-1 text-[10px] font-bold tracking-wide" />
            }
          >
            <HeartHandshakeIcon className="size-2.5" />
            SUPPORTER
          </TooltipTrigger>
          <TooltipContent>Donation supporter</TooltipContent>
        </Tooltip>
      ) : null}

      {role === "moderator" ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Badge className="h-4 gap-1 rounded-sm border-0 bg-sky-500/15 px-1.5 text-[10px] font-bold tracking-wide text-sky-400 ring-1 ring-sky-500/40 ring-inset" />
            }
          >
            <ShieldCheckIcon className="size-2.5" />
            MODERATOR
          </TooltipTrigger>
          <TooltipContent>Moderator</TooltipContent>
        </Tooltip>
      ) : null}

      {role === "admin" ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Badge
                className="admin-pill h-4 gap-1 rounded-sm border-0 px-1.5 text-[10px] font-bold tracking-wide"
              />
            }
          >
            <ShieldIcon className="size-2.5" />
            ADMIN
          </TooltipTrigger>
          <TooltipContent>Site administrator</TooltipContent>
        </Tooltip>
      ) : null}

      {specials.map((p) => (
        <Tooltip key={p.key}>
          <TooltipTrigger
            render={
              <Badge
                className={cn(
                  "h-4 gap-0.5 rounded-sm border-0 px-1 text-[10px] font-bold tracking-wide",
                  p.cls,
                )}
              />
            }
          >
            {p.icon}
            {p.text}
          </TooltipTrigger>
          <TooltipContent>{BADGE_LABELS[p.key] ?? p.text}</TooltipContent>
        </Tooltip>
      ))}

      {custom.map((key) => (
        <Tooltip key={key}>
          <TooltipTrigger
            render={
              <Badge
                variant="outline"
                className="h-4 rounded-sm px-1 text-[10px] font-medium"
              />
            }
          >
            {customLabel(key)}
          </TooltipTrigger>
          <TooltipContent>{customLabel(key)}</TooltipContent>
        </Tooltip>
      ))}
    </span>
  );
}
