import Image from "next/image";
import { FlameIcon, ShieldIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "cn";
import {
  MEMBER_NITRO_BADGE,
  MEMBER_VERIFIED_BADGE,
  MEMBER_VERIFIED_IMAGE,
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
  const hasNitro = nitro === true || all.includes(MEMBER_NITRO_BADGE);
  const custom = all.filter(
    (key) => key !== MEMBER_VERIFIED_BADGE && key !== MEMBER_NITRO_BADGE,
  );

  if (!isVerified && role !== "admin" && !hasMemberVerified && !hasNitro && custom.length === 0) {
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

      {role === "admin" ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Badge
                variant="secondary"
                className="h-4 gap-0.5 rounded-sm px-1 text-[10px] font-semibold tracking-wide"
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
