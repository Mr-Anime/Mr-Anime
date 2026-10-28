"use client";

import { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimeCard } from "./anime-card";

interface Anime {
  id: string;
  title: string;
  image: string;
  type: "ONA" | "TV" | "MOVIE";
  duration: string;
  year: number;
  rating: string;
  audio?: "Dub" | "Sub";
}

const animeList: Anime[] = [
  {
    id: "lord-of-the-rings-war-of-the-rohirrim",
    title: "The Lord of the Rings: The War of the Rohirrim",
    image: "https://picsum.photos/seed/lotr-rohirrim/200/300",
    type: "MOVIE",
    duration: "2h 24m",
    year: 2024,
    rating: "9.2",
    audio: "Sub",
  },
  {
    id: "cyberpunk-edgerunners",
    title: "Cyberpunk: Edgerunners",
    image: "https://picsum.photos/seed/cyberpunk/200/300",
    type: "ONA",
    duration: "24m",
    year: 2022,
    rating: "8.8",
    audio: "Dub",
  },
  {
    id: "bleach-thousand-year-blood-war",
    title: "BLEACH: Thousand-Year Blood War",
    image: "https://picsum.photos/seed/bleach/200/300",
    type: "ONA",
    duration: "24m",
    year: 2022,
    rating: "9.0",
  },
  {
    id: "my-list-moon",
    title: "My List on The Moon",
    image: "https://picsum.photos/seed/moon/200/300",
    type: "TV",
    duration: "24m",
    year: 2023,
    rating: "8.5",
  },
];

export function AnimeCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    const scrollAmount = 300;
    if (direction === "left") {
      scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    } else {
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="relative group">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {animeList.map((anime) => (
          <div key={anime.id} className="min-w-[140px] sm:min-w-[160px] md:min-w-[180px] lg:min-w-[200px]">
            <AnimeCard {...anime} />
          </div>
        ))}
      </div>

      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[#7CE5D0]/90 hover:bg-[#7CE5D0] text-[#1F1E32] p-2 rounded-r-lg transition-all duration-300 opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[#7CE5D0]/90 hover:bg-[#7CE5D0] text-[#1F1E32] p-2 rounded-l-lg transition-all duration-300 opacity-0 group-hover:opacity-100"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
}
