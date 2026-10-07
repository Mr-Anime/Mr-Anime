import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "@/components/search/search-view";
import { GridSkeleton } from "@/components/anime/media-skeletons";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search anime by name with filters for genre, year, season, format and status.",
};

export default function SearchPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <Suspense fallback={<GridSkeleton count={18} />}>
        <SearchView />
      </Suspense>
    </div>
  );
}
