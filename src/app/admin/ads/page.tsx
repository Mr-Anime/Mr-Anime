import type { Metadata } from "next";
import { AdSettingsForm } from "@/components/admin/ad-settings-form";
import { getAdSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Ads" };

export default async function AdminAdsPage() {
  const settings = await getAdSettings();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Ads</h2>
        <p className="text-sm text-muted-foreground">
          Banner and social bar monetization — disabled by default until you turn
          them on here.
        </p>
      </div>
      <AdSettingsForm initial={settings} />
    </div>
  );
}
