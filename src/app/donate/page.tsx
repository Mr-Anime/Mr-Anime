import type { Metadata } from "next";
import { HeartHandshakeIcon } from "lucide-react";
import { DonateForm } from "@/components/donations/donate-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Donate" };
export const dynamic = "force-dynamic";

export default function DonatePage() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-6 px-4 py-10">
      <div className="space-y-2 text-center">
        <h1 className="flex items-center justify-center gap-2 text-3xl font-bold">
          <HeartHandshakeIcon className="size-7 text-sky-500" />
          Support Mr.Anime
        </h1>
        <p className="text-sm text-muted-foreground">
          Donations keep the site fast and ad-light. Pay securely with crypto
          via OxaPay.
        </p>
        <p className="text-sm font-medium text-amber-400">
          Sign in before donating — every $1 earns 200 Mr.Coins + a permanent
          Supporter badge!
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Make a donation</CardTitle>
          <CardDescription>
            You will be redirected to OxaPay&apos;s secure checkout.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DonateForm />
        </CardContent>
      </Card>
    </div>
  );
}
