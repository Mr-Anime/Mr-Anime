"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollTextIcon, LayoutDashboardIcon, UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon, exact: true },
  { href: "/admin/users", label: "Users", icon: UsersIcon, exact: false },
  { href: "/admin/audit", label: "Audit log", icon: ScrollTextIcon, exact: false },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border/60" aria-label="Admin navigation">
      {LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "border-sky-500 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
