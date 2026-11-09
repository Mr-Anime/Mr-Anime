export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-surface-3 ${className}`} aria-hidden="true" />;
}

export function CardSkeleton() {
  return (
    <div className="w-full">
      <Skeleton className="aspect-[2/3] w-full rounded-xl" />
      <Skeleton className="mt-2 h-4 w-4/5" />
      <Skeleton className="mt-1.5 h-3 w-2/5" />
    </div>
  );
}

export function CardGridSkeleton({ count = 18 }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 md:gap-4 lg:grid-cols-6 xl:grid-cols-7">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RowSkeleton({ count = 7 }) {
  return (
    <div className="flex gap-3 overflow-hidden md:gap-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="w-[130px] shrink-0 sm:w-[150px] md:w-[170px]">
          <CardSkeleton />
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[58vh] min-h-[420px] w-full overflow-hidden bg-surface-2 md:h-[70vh]">
      <Skeleton className="absolute inset-0 rounded-none" />
    </div>
  );
}
