import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const icons: Record<string, (size: number) => JSX.Element> = {
  creator: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z" />
    </svg>
  ),
  moderator: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  admin: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l9 4-1 10-8 6-8-6-1-10 9-4z" />
      <path d="M8 12h8M12 8v8" />
    </svg>
  ),
};

const colors: Record<string, string> = {
  creator: "text-purple-400",
  moderator: "text-emerald-400",
  admin: "text-yellow-400",
};

export function RoleBadge({ role, size = 16 }: { role: string; size?: number }) {
  if (role === "user" || !icons[role]) return null;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center ${colors[role]}`}>{icons[role](size)}</span>
        </TooltipTrigger>
        <TooltipContent>{role}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
