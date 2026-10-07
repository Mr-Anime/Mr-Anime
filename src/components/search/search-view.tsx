"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { SearchIcon } from "lucide-react";
import { AnimeCard } from "@/components/anime/anime-card";
import { GridSkeleton } from "@/components/anime/media-skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ANIME_GENRES } from "@/lib/anime-format";
import type { Media, PageInfo } from "@/lib/anilist/types";

type SearchResponse = { items: Media[]; pageInfo: PageInfo };

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1969 }, (_, i) => CURRENT_YEAR - i);

const ALL = "all";

export function SearchView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const query = searchParams.get("q") ?? "";
  const [input, setInput] = useState(query);

  // Debounced search box → URL (keeps results shareable/bookmarkable)
  useEffect(() => {
    const next = input.trim();
    const current = searchParams.get("q") ?? "";
    if (next === current) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set("q", next);
      else params.delete("q");
      params.delete("page");
      startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
    }, 350);
    return () => clearTimeout(timer);
  }, [input, searchParams, pathname, router, startTransition]);

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === ALL) params.delete(key);
    else params.set(key, value);
    params.delete("page");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  function setPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  const queryString = searchParams.toString();
  const page = Number(searchParams.get("page") ?? "1") || 1;

  const { data, isPending: loading, isError, refetch } = useQuery({
    queryKey: ["anime-search", queryString],
    queryFn: async (): Promise<SearchResponse> => {
      const res = await fetch(`/api/anime/search?${queryString}`);
      if (!res.ok) throw new Error("Search request failed");
      return res.json();
    },
    placeholderData: keepPreviousData,
  });

  const filterSelect = (
    key: string,
    placeholder: string,
    value: string,
    options: { value: string; label: string }[],
  ) => (
    <Select
      value={value || ALL}
      onValueChange={(v) => setFilter(key, String(v))}
    >
      <SelectTrigger className="min-w-36" aria-label={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const pageInfo = data?.pageInfo;
  const total = pageInfo?.total ?? null;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Browse anime</h1>
          <p className="text-sm text-muted-foreground">
            Search the AniList catalogue with genre, year, season and format filters.
          </p>
        </div>

        <div className="relative">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search anime…"
            className="pl-9"
            aria-label="Search anime"
            type="search"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filterSelect("genre", "Genre", searchParams.get("genre") ?? "", [
            { value: ALL, label: "All genres" },
            ...ANIME_GENRES.map((g) => ({ value: g, label: g })),
          ])}
          {filterSelect("year", "Year", searchParams.get("year") ?? "", [
            { value: ALL, label: "Any year" },
            ...YEARS.map((y) => ({ value: String(y), label: String(y) })),
          ])}
          {filterSelect("season", "Season", searchParams.get("season") ?? "", [
            { value: ALL, label: "Any season" },
            { value: "WINTER", label: "Winter" },
            { value: "SPRING", label: "Spring" },
            { value: "SUMMER", label: "Summer" },
            { value: "FALL", label: "Fall" },
          ])}
          {filterSelect("format", "Format", searchParams.get("format") ?? "", [
            { value: ALL, label: "Any format" },
            { value: "TV", label: "TV" },
            { value: "MOVIE", label: "Movie" },
            { value: "OVA", label: "OVA" },
            { value: "ONA", label: "ONA" },
            { value: "SPECIAL", label: "Special" },
            { value: "TV_SHORT", label: "TV short" },
          ])}
          {filterSelect("status", "Status", searchParams.get("status") ?? "", [
            { value: ALL, label: "Any status" },
            { value: "RELEASING", label: "Airing" },
            { value: "FINISHED", label: "Finished" },
            { value: "NOT_YET_RELEASED", label: "Upcoming" },
          ])}
          {filterSelect("sort", "Sort", searchParams.get("sort") ?? "", [
            { value: ALL, label: "Relevance" },
            { value: "TRENDING_DESC", label: "Trending" },
            { value: "POPULARITY_DESC", label: "Most popular" },
            { value: "SCORE_DESC", label: "Highest rated" },
            { value: "START_DATE_DESC", label: "Newest" },
          ])}
        </div>
      </div>

      {isError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive">
            Something went wrong while searching.
          </p>
          <Button className="mt-3" variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : loading || !data ? (
        <GridSkeleton />
      ) : data.items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 p-10 text-center">
          <p className="font-medium">No results found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {query ? <>Nothing matched “{query}”.</> : "Try different filters or search terms."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {total !== null ? `${total.toLocaleString()} results` : `${data.items.length} results`}
            {query ? <> for “{query}”</> : null}
          </p>

          <div
            className={`grid grid-cols-2 gap-4 transition-opacity sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 ${isPending ? "opacity-60" : ""}`}
          >
            {data.items.map((media) => (
              <AnimeCard key={media.id} media={media} />
            ))}
          </div>

          {pageInfo?.hasNextPage || page > 1 ? (
            <nav
              className="flex items-center justify-center gap-3 pt-4"
              aria-label="Pagination"
            >
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <Button
                variant="outline"
                disabled={!pageInfo?.hasNextPage}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
