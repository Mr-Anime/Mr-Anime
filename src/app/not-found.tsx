import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 px-4 py-28 text-center">
      <p className="text-6xl font-bold tracking-tight text-muted-foreground/40">404</p>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The page you are looking for doesn&apos;t exist or the anime was removed.
        </p>
      </div>
      <div className="flex gap-3">
        <Button render={<Link href="/" />}>Go home</Button>
        <Button render={<Link href="/search" />} variant="outline">
          Browse anime
        </Button>
      </div>
    </div>
  );
}
