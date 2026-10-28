"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Clock, Calendar } from "lucide-react";
import type { Media } from "@/lib/anilist/types";
import { mediaTitle, mediaYear } from "@/lib/anime-format";
import { stripHtml } from "@/lib/sanitize";

export function HeroBanner({ media }: { media?: Media }) {
  const title = media ? mediaTitle(media) : "Cyberpunk: Edgerunners 2";
  const bgImage =
    media?.bannerImage ||
    media?.coverImage?.extraLarge ||
    media?.coverImage?.large ||
    "https://picsum.photos/seed/hero-cyberpunk/1200/460";
  const format = media?.format || "ONA";
  const duration = media?.duration ? `${media.duration}m` : "28m";
  const year = media ? mediaYear(media) || 2026 : 2026;
  const description = media?.description
    ? stripHtml(media.description)
    : "Cyberpunk: Edgerunners 2 pulls you back into Night City...";
  const watchHref = media?.id ? `/watch/${media.id}/1` : "/watch/cyberpunk-edgerunners-2-episode-1";
  const detailHref = media?.id ? `/anime/${media.id}` : "/anime/cyberpunk-edgerunners-2";

  return (
    <section className="relative h-[460px] w-full overflow-hidden rounded-xl">
      <div className="absolute inset-0">
        <Image
          src={bgImage}
          alt={title}
          fill
          priority
          className="object-cover object-right"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-[#1F1E32] via-[#1F1E32]/80 to-transparent" />

      <div className="relative z-10 flex h-full items-center px-8">
        <div className="max-w-2xl">
          <div className="mb-4 flex items-center gap-2">
            <span className="bg-[#7CE5D0] text-[#1F1E32] px-3 py-1 rounded-full text-xs font-semibold">
              #1 Spotlight
            </span>
          </div>

          <h1 className="mb-4 text-4xl font-bold text-white md:text-6xl line-clamp-1">
            {title}
          </h1>

          <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-[#B8B7C9]">
            <div className="flex items-center gap-1">
              <Play className="h-4 w-4 text-[#7CE5D0]" />
              <span>{format}</span>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-[#7CE5D0]" />
              <span>{duration}</span>
            </div>

            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-[#7CE5D0]" />
              <span>{year}</span>
            </div>

            <div className="bg-[#7CE5D0]/20 text-[#7CE5D0] px-2 py-1 rounded text-xs font-semibold">
              HD
            </div>

            <div className="bg-[#35334D] text-white px-2 py-1 rounded text-xs font-semibold">
              DUB / SUB
            </div>
          </div>

          <p className="mb-8 line-clamp-2 text-base text-[#B8B7C9] md:line-clamp-3">
            {description}
          </p>

          <div className="flex gap-4">
            <Link
              href={watchHref}
              className="group flex items-center gap-2 rounded-full bg-[#7CE5D0] px-6 py-3 font-semibold text-[#1F1E32] transition-all duration-300 hover:bg-[#7CE5D0]/90"
            >
              <Play className="h-4 w-4 fill-[#1F1E32]" />
              <span>Watch Now</span>
            </Link>

            <Link
              href={detailHref}
              className="flex items-center gap-2 rounded-full border border-[#7CE5D0]/30 bg-transparent px-6 py-3 font-semibold text-white transition-all duration-300 hover:bg-[#7CE5D0]/10"
            >
              <span>Detail</span>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
