"use client";

import { useMemo, useState } from "react";
import { CheckIcon, ImageIcon, SearchIcon, SparklesIcon, XIcon } from "lucide-react";
import {
  AVATAR_GROUPS,
  AVATAR_TOTAL,
  getAvatarIdFromSrc,
  type CatalogAvatar,
} from "@/lib/avatar-catalog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "cn";

type Props = {
  currentAvatarUrl?: string | null;
  onSelect: (avatarSrc: string, avatarId: string) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function AvatarPickerDialog({
  currentAvatarUrl,
  onSelect,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = (next: boolean) => {
    if (isControlled) {
      setControlledOpen?.(next);
    } else {
      setInternalOpen(next);
    }
  };

  // Find initial group from current avatar if possible
  const currentId = useMemo(() => getAvatarIdFromSrc(currentAvatarUrl), [currentAvatarUrl]);
  const initialGroupKey = useMemo(() => {
    if (currentId) {
      const g = AVATAR_GROUPS.find((group) => group.avatars.some((a) => a.id === currentId));
      if (g) return g.key;
    }
    return AVATAR_GROUPS[0]?.key ?? "one_piece";
  }, [currentId]);

  const [selectedSrc, setSelectedSrc] = useState<string>(currentAvatarUrl ?? "");
  const [activeGroupKey, setActiveGroupKey] = useState<string>(initialGroupKey);
  const [query, setQuery] = useState("");

  const activeGroup = useMemo(
    () => AVATAR_GROUPS.find((g) => g.key === activeGroupKey) ?? AVATAR_GROUPS[0],
    [activeGroupKey]
  );

  // Search filter across all avatars
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const results: Array<CatalogAvatar & { animeLabel: string }> = [];
    for (const group of AVATAR_GROUPS) {
      for (const av of group.avatars) {
        if (
          group.label.toLowerCase().includes(q) ||
          av.label.toLowerCase().includes(q) ||
          av.id.toLowerCase().includes(q)
        ) {
          results.push({ ...av, animeLabel: group.label });
        }
      }
    }
    return results;
  }, [query]);

  function handleChoose(avatar: CatalogAvatar) {
    setSelectedSrc(avatar.src);
  }

  function handleConfirm() {
    if (selectedSrc) {
      const id = getAvatarIdFromSrc(selectedSrc) ?? "";
      onSelect(selectedSrc, id);
    }
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : (
        <DialogTrigger
          render={
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <SparklesIcon className="size-4 text-sky-400" />
              Choose Avatar
            </Button>
          }
        />
      )}

      <DialogContent className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-0 p-0 sm:max-w-3xl overflow-hidden">
        <DialogHeader className="border-b border-border/60 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20">
              <ImageIcon className="size-4" />
            </span>
            <div>
              <DialogTitle className="text-base font-semibold">Choose Avatar</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Select from {AVATAR_TOTAL} official anime avatars. Custom avatars & external links are not allowed.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Search bar */}
        <div className="border-b border-border/60 bg-muted/20 px-6 py-2.5">
          <div className="relative">
            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by anime name (e.g. One Piece, Naruto, Demon Slayer)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 pl-9 pr-8 text-xs"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <XIcon className="size-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Anime categories horizontal pill tabs */}
        {!searchResults ? (
          <div className="border-b border-border/60 bg-muted/10 px-6 py-2">
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              {AVATAR_GROUPS.map((group) => {
                const isActive = group.key === activeGroupKey;
                return (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => setActiveGroupKey(group.key)}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1 font-medium transition-all",
                      isActive
                        ? "bg-sky-500 text-white shadow-xs"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    #{group.label.replace(/\s+/g, "")}{" "}
                    <span className={cn("ml-1 text-[10px]", isActive ? "text-white/80" : "text-muted-foreground/70")}>
                      ({group.avatars.length})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Avatars Grid */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[260px] max-h-[50vh]">
          {searchResults ? (
            <div>
              <p className="mb-3 text-xs text-muted-foreground">
                Found {searchResults.length} {searchResults.length === 1 ? "avatar" : "avatars"} matching &quot;{query}&quot;:
              </p>
              {searchResults.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No anime avatars found matching &quot;{query}&quot;.
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
                  {searchResults.map((av) => {
                    const isSelected = selectedSrc === av.src;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => handleChoose(av)}
                        className={cn(
                          "group relative flex flex-col items-center overflow-hidden rounded-xl border-2 p-1 transition-all",
                          isSelected
                            ? "border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/30"
                            : "border-border/60 bg-card hover:border-sky-400/50 hover:bg-muted/40"
                        )}
                        title={`${av.animeLabel} - ${av.label}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={av.src}
                          alt={av.label}
                          className="aspect-square w-full rounded-lg object-cover"
                          loading="lazy"
                        />
                        <span className="mt-1 w-full truncate text-center text-[10px] text-muted-foreground group-hover:text-foreground">
                          {av.animeLabel}
                        </span>

                        {/* Checked overlay badge */}
                        {isSelected ? (
                          <span className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-sky-500 text-white shadow-xs">
                            <CheckIcon className="size-3 stroke-[3]" />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  {activeGroup?.label}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {activeGroup?.avatars.length} avatars available
                </span>
              </div>

              <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
                {activeGroup?.avatars.map((av) => {
                  const isSelected = selectedSrc === av.src;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => handleChoose(av)}
                      className={cn(
                        "group relative flex flex-col items-center overflow-hidden rounded-xl border-2 p-1 transition-all",
                        isSelected
                          ? "border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/30"
                          : "border-border/60 bg-card hover:border-sky-400/50 hover:bg-muted/40"
                      )}
                      title={`${activeGroup.label} - ${av.label}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={av.src}
                        alt={av.label}
                        className="aspect-square w-full rounded-lg object-cover"
                        loading="lazy"
                      />
                      <span className="mt-1 w-full truncate text-center text-[10px] text-muted-foreground group-hover:text-foreground">
                        {av.label}
                      </span>

                      {/* Checked overlay badge */}
                      {isSelected ? (
                        <span className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-sky-500 text-white shadow-xs">
                          <CheckIcon className="size-3 stroke-[3]" />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-6 py-3">
          <div className="flex items-center gap-3">
            {selectedSrc ? (
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedSrc}
                  alt="Selected preview"
                  className="size-8 rounded-full border border-sky-400 object-cover ring-2 ring-sky-400/20"
                />
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Avatar selected
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">No avatar selected</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={!selectedSrc}
              className="bg-sky-500 text-white hover:bg-sky-600"
            >
              Confirm Selection
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
