"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, CoinsIcon } from "lucide-react";
import { toast } from "sonner";
import { equipShopItem, purchaseShopItem } from "@/app/actions/shop";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cosmeticClass, type Cosmetics, type ShopKind } from "@/lib/cosmetics";
import { cn } from "cn";

export type ShopItemView = {
  id: string;
  name: string;
  description: string;
  kind: ShopKind;
  price: number;
};

const KIND_LABELS: Record<ShopKind, string> = {
  frame: "Avatar frames",
  name_style: "Name styles",
  name_animation: "Name animations",
};

function equippedFor(loadout: Cosmetics, kind: ShopKind): string | null {
  if (kind === "frame") return loadout.frame;
  if (kind === "name_style") return loadout.nameStyle;
  return loadout.nameAnimation;
}

type Props = {
  items: ShopItemView[];
  owned: string[];
  loadout: Cosmetics;
  coins: number;
  kinds: Set<string>;
};

export function ShopClient({ items, owned, loadout, coins, kinds }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [defaultTab] = useState<string>(() => {
    if (kinds.has("frame")) return "frame";
    if (kinds.has("name_style")) return "name_style";
    return "name_animation";
  });

  function buy(item: ShopItemView) {
    startTransition(async () => {
      const res = await purchaseShopItem(item.id);
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function equip(item: ShopItemView) {
    const equipped = equippedFor(loadout, item.kind) === item.id;
    startTransition(async () => {
      const res = await equipShopItem(item.kind, equipped ? null : item.id);
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList>
        {(["frame", "name_style", "name_animation"] as ShopKind[])
          .filter((kind) => kinds.has(kind))
          .map((kind) => (
            <TabsTrigger key={kind} value={kind}>
              {KIND_LABELS[kind]}
            </TabsTrigger>
          ))}
      </TabsList>

      {(["frame", "name_style", "name_animation"] as ShopKind[])
        .filter((kind) => kinds.has(kind))
        .map((kind) => (
          <TabsContent key={kind} value={kind}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items
                .filter((item) => item.kind === kind)
                .map((item) => {
                  const isOwned = owned.includes(item.id);
                  const isEquipped = equippedFor(loadout, kind) === item.id;
                  const affordable = coins >= item.price;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors",
                        isEquipped
                          ? "border-emerald-500/50"
                          : "border-border/60 hover:border-border",
                      )}
                    >
                      <div className="flex h-24 items-center justify-center">
                        {kind === "frame" ? (
                          <span
                            className={cn("inline-flex rounded-full", cosmeticClass(item.id))}
                          >
                            <Avatar size="lg">
                              <AvatarFallback className="bg-sky-500/20 font-semibold text-sky-300">
                                M
                              </AvatarFallback>
                            </Avatar>
                          </span>
                        ) : (
                          <span
                            className={cn(
                              "text-lg font-semibold",
                              cosmeticClass(item.id),
                            )}
                          >
                            {kind === "name_style" ? "Your name" : "Shining name"}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold">{item.name}</h3>
                          {isEquipped ? (
                            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                              <CheckIcon className="size-3" />
                              Equipped
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-2">
                        {isOwned ? (
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CheckIcon className="size-3.5 text-emerald-400" />
                            In your collection
                          </span>
                        ) : (
                          <span
                            className={cn(
                              "flex items-center gap-1 text-sm font-semibold",
                              affordable ? "text-amber-400" : "text-muted-foreground",
                            )}
                          >
                            <CoinsIcon className="size-4" />
                            {item.price}
                          </span>
                        )}
                        {isOwned ? (
                          <Button
                            size="sm"
                            variant={isEquipped ? "secondary" : "default"}
                            disabled={isPending}
                            onClick={() => equip(item)}
                          >
                            {isEquipped ? "Unequip" : "Equip"}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={isPending || !affordable}
                            onClick={() => buy(item)}
                          >
                            {!affordable ? "Not enough" : "Buy"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </TabsContent>
        ))}

      <p className="mt-6 rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground">
        Coins drop randomly while you watch — one per 10 minutes, with a chance at a ×3
        jackpot. Equipped cosmetics show on your comments, hover cards and profile.
      </p>
    </Tabs>
  );
}
