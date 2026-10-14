import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ForumThreadForm } from "@/components/forum/forum-thread-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tryCreateClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "New thread · Forum" };
export const dynamic = "force-dynamic";

export default async function NewThreadPage() {
  const supabase = await tryCreateClient();
  const authData = supabase ? (await supabase.auth.getClaims()).data : null;
  if (!authData?.claims?.sub) {
    redirect("/login?next=%2Fforum%2Fnew");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>New thread</CardTitle>
        </CardHeader>
        <CardContent>
          <ForumThreadForm />
        </CardContent>
      </Card>
    </div>
  );
}
