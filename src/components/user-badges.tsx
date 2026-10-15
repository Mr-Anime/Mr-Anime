import Image from "next/image";
import {
  FlameIcon,
  HeartHandshakeIcon,
  ShieldCheckIcon,
  ShieldIcon,
  SparklesIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "cn";
import {
  DONOR_BADGE,
  MEMBER_NEBULA_BADGE,
  MEMBER_NITRO_BADGE,
  MEMBER_VERIFIED_BADGE,
  MEMBER_VERIFIED_IMAGE,
  MOD_VERIFIED_BADGE,
  MOD_VERIFIED_IMAGE,
  OWNER_VERIFIED_IMAGE,
} from "@/lib/badges";

const BADGE_LABELS: Record<string, string> = {
  supporter: "Supporter",
  early: "Early Member",
  beta: "Beta Tester",
  founder: "Founder",
  moderator: "Moderator",
};

type Props = {
  role?: string | null;
  isVerified?: boolean | null;
  badges?: string[] | null;
  /** Mr. Anime Nitro (badge or active paid period). */
  nitro?: boolean;
  className?: string;
};

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
      key !== DONOR_BADGE,
  );

  if (
    !isVerified &&
    role !== "admin" &&
    role !== "moderator" &&
    !hasMemberVerified &&
    !hasModVerified &&
    !hasNitro &&
    !hasNebula &&
    !hasDonor &&
    custom.length === 0
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
