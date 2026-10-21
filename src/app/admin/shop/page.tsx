import type { Metadata } from "next";
import { ShopSettingsForm } from "@/components/admin/shop-settings-form";
import { getShopEnabled } from "@/lib/settings";

export const metadata: Metadata = { title: "Shop" };

export default async function AdminShopPage() {
  const enabled = await getShopEnabled();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Shop</h2>
        <p className="text-sm text-muted-foreground">
          Master switch for the Mr.Coin shop. Grant frames and cosmetics from the
          Users page with the “Frames” action.
        </p>
      </div>
      <ShopSettingsForm initial={enabled} />
    </div>
  );
}
