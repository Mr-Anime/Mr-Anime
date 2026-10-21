import type { Metadata } from "next";
import { MaintenanceSettingsForm } from "@/components/admin/maintenance-settings-form";
import { getMaintenanceBannerEnabled } from "@/lib/settings";

export const metadata: Metadata = { title: "Site" };

export default async function AdminSitePage() {
  const bannerEnabled = await getMaintenanceBannerEnabled();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Site</h2>
        <p className="text-sm text-muted-foreground">
          Sitewide notices. Changes are recorded in the audit log.
        </p>
      </div>
      <MaintenanceSettingsForm initial={bannerEnabled} />
    </div>
  );
}
