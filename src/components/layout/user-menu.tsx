"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ListTodoIcon,
  LogOutIcon,
  SettingsIcon,
  ShieldIcon,
  UserRoundIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/actions/auth";
import { UserBadges } from "@/components/user-badges";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

type Profile = {
  username: string;
  avatar_url: string | null;
  role: string;
  is_verified: boolean;
  badges: string[];
};

export function UserMenu() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "anon" | "auth">("loading");
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let supabase;
      try {
        supabase = createClient();
      } catch {
        // Supabase env not configured locally — render signed-out state.
        if (!cancelled) setStatus("anon");
        return;
      }
      const { data, error } = await supabase.auth.getClaims();
      if (error || !data?.claims) {
        if (!cancelled) setStatus("anon");
        return;
      }
      const { data: row } = await supabase
        .from("profiles")
        .select("username,avatar_url,role,is_verified,badges")
        .eq("id", data.claims.sub)
        .single();
      if (cancelled) return;
      if (row) {
        setProfile(row as unknown as Profile);
        setStatus("auth");
      } else {
        setStatus("anon");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return <Skeleton className="size-8 rounded-full" aria-label="Loading account" />;
  }

  if (status === "anon") {
    return (
      <div className="flex items-center gap-2">
        <Button
          render={<Link href="/login" />}
          size="sm"
          variant="ghost"
          className="hidden sm:inline-flex"
        >
          Sign in
        </Button>
        <Button render={<Link href="/register" />} size="sm">
          Get started
        </Button>
      </div>
    );
  }

  if (!profile) return null;

  const isAdmin = profile.role === "admin";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 rounded-full pr-2"
            aria-label="Open account menu"
          />
        }
      >
        <Avatar className="size-7">
          {profile.avatar_url ? (
            <AvatarImage src={profile.avatar_url} alt="" />
          ) : null}
          <AvatarFallback className="text-xs">
            {profile.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-28 truncate text-sm font-medium sm:inline">
          {profile.username}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2 font-normal">
          <span className="truncate font-medium text-foreground">
            {profile.username}
          </span>
          <UserBadges
            role={profile.role}
            isVerified={profile.is_verified}
            badges={profile.badges}
          />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/account")}>
          <UserRoundIcon />
          Account
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/list")}>
          <ListTodoIcon />
          My List
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/account")}>
          <SettingsIcon />
          Settings
        </DropdownMenuItem>
        {isAdmin ? (
          <DropdownMenuItem onClick={() => router.push("/admin")}>
            <ShieldIcon />
            Admin panel
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            void logout();
          }}
        >
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
