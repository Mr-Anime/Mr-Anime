"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AwardIcon,
  BookmarkIcon,
  CheckIcon,
  ImageIcon,
  LockIcon,
  PaletteIcon,
  SaveIcon,
  CrownIcon,
  SparklesIcon,
  TypeIcon,
} from "lucide-react";
import { toast } from "sonner";
import { saveProfilePrefs } from "@/app/actions/profile-prefs";
import { AVATAR_GROUPS, AVATAR_SRC } from "@/lib/avatar-catalog";
import { BADGE_LABELS } from "@/lib/badges";
import {
  BANNERS,
  FLAIR,
  PROFILE_THEMES,
  TITLES,
  THEME_KEYS,
  bannerCss,
  type UserProfile,
} from "@/lib/profile-prefs";
import { UserBadges } from "@/components/user-badges";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

type Props = {
  username: string;
  avatarUrl: string | null;
  frameClass?: string;
  role: string;
  isVerified: boolean;
  badges: string[];
  nitro: boolean;
  initial: UserProfile;
  unlocked: string[];
  points: number;
};

/** Sentinel: user unchecked every badge (empty array means "show all"). */
const NONE = "__none__";

function Section({
  title,
  hint,
  icon,
  children,
}: {
  title: string;
  hint?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-sky-400">{icon}</span>
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      </div>
      {hint ? <p className="mb-3 text-xs text-muted-foreground">{hint}</p> : <div className="mb-3" />}
      {children}
    </section>
  );
}

export function CustomizeClient({
  username,
  avatarUrl,
  frameClass,
  role,
  isVerified,
  badges,
  nitro,
  initial,
  unlocked,
  points,
}: Props) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<UserProfile>(initial);
  const [saving, setSaving] = useState(false);
  const [activeGroup, setActiveGroup] = useState(AVATAR_GROUPS[0]?.key ?? "");
  const [titlePointsOpen, setTitlePointsOpen] = useState(false);

  const theme = PROFILE_THEMES[prefs.theme];
  const group = AVATAR_GROUPS.find((g) => g.key === activeGroup) ?? AVATAR_GROUPS[0];
  const unlockedSet = useMemo(() => new Set(unlocked), [unlocked]);
  const dirty = useMemo(() => JSON.stringify(prefs) !== JSON.stringify(initial), [prefs, initial]);

  const previewAvatar = prefs.avatarId ? AVATAR_SRC[prefs.avatarId] : avatarUrl;
  const visibleBadges =
    prefs.displayBadges.length === 0 || prefs.displayBadges.includes(NONE)
      ? prefs.displayBadges.includes(NONE)
        ? []
        : badges
      : badges.filter((b) => prefs.displayBadges.includes(b));
  const title = prefs.title ? TITLES.find((t) => t.key === prefs.title) : null;

  function toggleFlair(key: string) {
    setPrefs((p) => ({
      ...p,
      flair: p.flair.includes(key) ? p.flair.filter((f) => f !== key) : [...p.flair, key].slice(0, 6),
    }));
  }

  function toggleBadge(key: string) {
    setPrefs((p) => {
      const current = p.displayBadges.length === 0 || p.displayBadges.includes(NONE)
        ? [...badges]
        : p.displayBadges;
      const next = current.includes(key)
        ? current.filter((b) => b !== key)
        : [...current, key];
      if (next.length === badges.length) return { ...p, displayBadges: [...badges] };
      if (next.length === 0) return { ...p, displayBadges: [NONE] };
      return { ...p, displayBadges: next };
    });
  }

  function setFavorite(slot: number, id: string) {
    setPrefs((p) => {
      const next = [...p.characters];
      while (next.length < 3) next.push("");
      next[slot] = id;
      // No duplicate characters across slots.
      for (let i = 0; i < 3; i++) {
        if (i !== slot && next[i] === id) next[i] = "";
      }
      return { ...p, characters: next.filter((c) => c !== "").slice(0, 3) };
    });
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const payload: UserProfile = {
        ...prefs,
        characters: prefs.characters.filter((c) => c in AVATAR_SRC),
      };
      const res = await saveProfilePrefs(payload);
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ——— LIVE PREVIEW ——— */}
      <section aria-label="Live preview" className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <SparklesIcon className="size-3.5" /> Live preview — as others see you
          </span>
          {dirty ? <span className="text-amber-400">● unsaved changes</span> : null}
        </div>
        <div className="h-20" style={{ background: bannerCss(prefs.bannerId) }} />
        <div
          className="border-t border-border/60 p-5"
          style={{ boxShadow: theme.glow }}
        >
          <div className="flex flex-wrap items-center gap-4">
            <span className={cn("inline-flex rounded-full", frameClass)}>
              <span
                className={cn(
                  "inline-flex size-14 items-center justify-center overflow-hidden rounded-full ring-2",
                  theme.ring,
                )}
              >
                {previewAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element -- catalog avatar preview
                  <img src={previewAvatar} alt="" className="size-14 object-cover" />
                ) : (
                  <span className="flex size-14 items-center justify-center bg-muted text-xl font-bold">
                    {username.charAt(0).toUpperCase()}
                  </span>
                )}
              </span>
            </span>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-xl font-bold tracking-tight">{username}</span>
                <UserBadges
                  role={role}
                  isVerified={isVerified}
                  badges={visibleBadges}
                  nitro={nitro}
                />
              </div>
              {title ? (
                <p className={cn("text-sm font-medium", theme.text)}>「{title.label}」</p>
              ) : null}
              {prefs.flair.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {prefs.flair.map((key) => {
                    const f = FLAIR.find((x) => x.key === key);
                    if (!f) return null;
                    return (
                      <span
                        key={key}
                        className={cn(
                          "rounded-sm px-1.5 py-0.5 text-[10px] font-bold ring-1 ring-inset",
                          f.cls,
                        )}
                      >
                        {f.label.toUpperCase()}
                      </span>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
          {prefs.characters.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {prefs.characters.filter(Boolean).map((id) => (
                <span
                  key={id}
                  className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 py-0.5 pr-2.5 pl-0.5 text-xs"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={AVATAR_SRC[id]} alt="" className="size-6 rounded-full object-cover" />
                  {id.split("/")[0].replace(/_/g, " ")}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ——— AVATAR ——— */}
      <Section
        title="Avatar"
        hint="Only the site's anime character catalog is allowed — pick your favorite."
        icon={<ImageIcon className="size-4" />}
      >
        <div className="mb-3 flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setPrefs((p) => ({ ...p, avatarId: "" }))}
            className={cn(
              "rounded-full px-3 py-1 text-xs transition-colors",
              prefs.avatarId === ""
                ? "bg-sky-500/15 text-sky-400"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Keep current
          </button>
          {AVATAR_GROUPS.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setActiveGroup(g.key)}
              className={cn(
                "rounded-full px-3 py-1 text-xs transition-colors",
                activeGroup === g.key
                  ? "bg-sky-500/15 text-sky-400"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {g.label} ({g.avatars.length})
            </button>
          ))}
        </div>
        <div className="grid max-h-72 grid-cols-6 gap-2 overflow-y-auto pr-1 sm:grid-cols-10">
          {group?.avatars.map((a) => {
            const isSelected = prefs.avatarId === a.id;
            return (
              <button
                key={a.id}
                type="button"
                title={`${group.label} — ${a.label}`}
                onClick={() => setPrefs((p) => ({ ...p, avatarId: a.id }))}
                className={cn(
                  "group relative overflow-hidden rounded-lg border-2 transition-all",
                  isSelected
                    ? "border-sky-400 ring-2 ring-sky-400/40"
                    : "border-transparent hover:border-border",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.src} alt={a.label} className="aspect-square w-full object-cover" />
                {isSelected ? (
                  <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-sky-500 text-white shadow-xs">
                    <CheckIcon className="size-2.5 stroke-[3]" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </Section>

      {/* ——— BANNER ——— */}
      <Section
        title="Banner"
        hint="The gradient strip at the top of your profile header."
        icon={<PaletteIcon className="size-4" />}
      >
        <div className="flex flex-wrap gap-2">
          {BANNERS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setPrefs((p) => ({ ...p, bannerId: b.id }))}
              className={cn(
                "w-28 overflow-hidden rounded-lg border-2 text-left transition-all",
                prefs.bannerId === b.id ? "border-sky-400" : "border-transparent hover:border-border",
              )}
            >
              <span className="block h-10" style={{ background: b.css }} />
              <span className="block px-1.5 py-1 text-[10px] text-muted-foreground">{b.label}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* ——— TITLES ——— */}
      <Section
        title="Title / tagline"
        hint={`Unlocked by watch points (${points} pts now) or status — shows under your name.`}
        icon={<TypeIcon className="size-4" />}
      >
        <div className="grid gap-2 sm:grid-cols-3">
          {TITLES.map((t) => {
            const has = unlockedSet.has(t.key) || t.rule.kind === "free";
            const selected = prefs.title === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  if (!has) {
                    setTitlePointsOpen(true);
                    return;
                  }
                  setPrefs((p) => ({ ...p, title: selected ? null : t.key }));
                }}
                className={cn(
                  "flex flex-col gap-0.5 rounded-lg border p-2.5 text-left transition-all",
                  selected
                    ? "border-sky-400 bg-sky-500/10"
                    : has
                      ? "border-border/60 hover:border-border"
                      : "border-border/40 opacity-60",
                )}
              >
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  {has ? null : <LockIcon className="size-3 text-muted-foreground" />}
                  {selected ? <CheckIcon className="size-3.5 text-sky-400" /> : null}
                  {t.label}
                </span>
                <span className="text-[11px] leading-tight text-muted-foreground">{t.hint}</span>
              </button>
            );
          })}
        </div>
        {titlePointsOpen ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Watch points = shows watched ×2 + comments. Keep watching &amp; commenting to
            level up titles.
          </p>
        ) : null}
      </Section>

      {/* ——— FLAIR ——— */}
      <Section
        title="Flair badges"
        hint="Decorative badges shown next to your name — toggle any you like."
        icon={<AwardIcon className="size-4" />}
      >
        <div className="flex flex-wrap gap-2">
          {FLAIR.map((f) => {
            const on = prefs.flair.includes(f.key);
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => toggleFlair(f.key)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
                  on
                    ? "border-sky-400/60 bg-sky-500/10 text-sky-400"
                    : "border-border/60 text-muted-foreground hover:text-foreground",
                )}
              >
                {on ? "✓ " : ""}
                {f.label}
              </button>
            );
          })}
        </div>
      </Section>

      {/* ——— BADGE DISPLAY ——— */}
      <Section
        title="Profile badges"
        hint="Choose which of your earned badges show on the profile card (all on by default)."
        icon={<CrownIcon className="size-4" />}
      >
        {badges.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No badges yet — donate, hit milestones or ask an admin.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => {
              const current =
                prefs.displayBadges.length === 0 || prefs.displayBadges.includes(NONE)
                  ? [...badges]
                  : prefs.displayBadges;
              const on = current.includes(b);
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleBadge(b)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                    on
                      ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-400"
                      : "border-border/60 text-muted-foreground line-through hover:text-foreground",
                  )}
                >
                  {BADGE_LABELS[b] ?? b}
                </button>
              );
            })}
          </div>
        )}
      </Section>

      {/* ——— FAVORITE CHARACTERS ——— */}
      <Section
        title="Favorite characters"
        hint="Top 3 — pick from the same avatar catalog (no duplicates)."
        icon={<BookmarkIcon className="size-4" />}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((slot) => {
            const value = prefs.characters[slot] ?? "";
            return (
              <div key={slot} className="flex items-center gap-2 rounded-lg border border-border/60 p-2">
                <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                  {value && AVATAR_SRC[value] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={AVATAR_SRC[value]} alt="" className="size-11 object-cover" />
                  ) : (
                    <span className="text-xs text-muted-foreground">#{slot + 1}</span>
                  )}
                </span>
                <select
                  value={value}
                  onChange={(e) => setFavorite(slot, e.target.value)}
                  className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2 text-sm"
                  aria-label={`Favorite character ${slot + 1}`}
                >
                  <option value="">Empty slot</option>
                  {AVATAR_GROUPS.map((g) => (
                    <optgroup key={g.key} label={g.label}>
                      {g.avatars.map((a) => (
                        <option key={a.id} value={a.id} disabled={prefs.characters.includes(a.id) && prefs.characters[slot] !== a.id}>
                          {g.label} — {a.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ——— THEME ——— */}
      <Section
        title="Profile color theme"
        hint="Accent color for your profile card border, glow and title."
        icon={<PaletteIcon className="size-4" />}
      >
        <div className="flex flex-wrap gap-2">
          {THEME_KEYS.map((key) => {
            const t = PROFILE_THEMES[key];
            const on = prefs.theme === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, theme: key }))}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  on ? "border-sky-400 bg-sky-500/10" : "border-border/60 hover:border-border",
                )}
              >
                <span
                  className="size-3 rounded-full"
                  style={{ background: t.accent, boxShadow: t.glow }}
                />
                {t.label}
                {on ? <CheckIcon className="size-3 text-sky-400" /> : null}
              </button>
            );
          })}
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving || !dirty} className="h-10 px-6">
          {saving ? "Saving…" : <><SaveIcon className="size-4" /> Save customization</>}
        </Button>
        {!dirty ? (
          <span className="text-xs text-muted-foreground">All changes saved.</span>
        ) : null}
      </div>
    </div>
  );
}
