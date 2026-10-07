import { Skeleton } from "@/components/ui/skeleton";

export function RowSkeleton({ count = 7 }: { count?: number }) {
  return (
    <section className="space-y-3" aria-hidden>
      <Skeleton className="h-6 w-48" />
      <div className="-mx-4 flex gap-3 overflow-hidden px-4 sm:mx-0 sm:px-0">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="w-36 shrink-0 space-y-2 sm:w-40">
            <Skeleton className="aspect-[2/3] w-full rounded-lg" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function GridSkeleton({ count = 24 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[2/3] w-full rounded-lg" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[55vh] min-h-[380px] w-full overflow-hidden" aria-hidden>
      <Skeleton className="absolute inset-0 rounded-none" />
      <div className="absolute bottom-0 left-0 space-y-3 p-6 sm:p-10">
        <Skeleton className="h-8 w-64 sm:h-10 sm:w-96" />
        <Skeleton className="h-4 w-80 max-w-full" />
        <Skeleton className="h-10 w-48" />
      </div>
    </div>
  );
}
