import { BadgeCheckIcon, ShieldIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "cn";

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
  className?: string;
};

function customLabel(key: string) {
  return BADGE_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

export function UserBadges({ role, isVerified, badges, className }: Props) {
  const custom = (badges ?? []).filter(Boolean);

  if (!isVerified && role !== "admin" && custom.length === 0) return null;

  return (
    <span
      className={cn("inline-flex items-center gap-1 align-middle", className)}
      aria-label="Account badges"
    >
      {isVerified ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <BadgeCheckIcon
                className="size-4 shrink-0 text-sky-400"
                aria-label="Verified account"
              />
            }
          />
          <TooltipContent>Verified</TooltipContent>
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
