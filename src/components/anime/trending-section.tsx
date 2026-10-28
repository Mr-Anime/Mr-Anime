"use client";

import { AnimeCarousel } from "./anime-carousel";

export function TrendingSection() {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-white md:text-3xl">
        <span className="text-[#7CE5D0]">Trending</span> Now
      </h2>

      <AnimeCarousel />
    </section>
  );
}
