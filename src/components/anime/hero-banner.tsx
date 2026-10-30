"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Clock, Calendar, Info, Star } from "lucide-react";
import type { Media } from "@/lib/anilist/types";
import { mediaTitle, mediaYear } from "@/lib/anime-format";
import { stripHtml } from "@/lib/sanitize";

export function HeroBanner({ media }: { media?: Media }) {
  const title = media ? mediaTitle(media) : "Cyberpunk: Edgerunners 2";
  const bgImage =
    media?.bannerImage ||
    media?.coverImage?.extraLarge ||
    media?.coverImage?.large ||
    "https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-831dC48S8lqN.jpg";
  const format = media?.format || "TV";
  const duration = media?.duration ? `${media.duration}m` : "24m";
  const year = media ? mediaYear(media) || 2026 : 2026;
  const rating = media?.averageScore ? (media.averageScore / 10).toFixed(1) : "8.8";
  const description = media?.description
    ? stripHtml(media.description)
    : "A washed-up street kid trying to survive in a technology and body modification-obsessed city of the future. Having everything to lose, he chooses to stay alive by becoming an edgerunner.";
  const watchHref = media?.id ? `/watch/${media.id}/1` : "/search?sort=POPULARITY_DESC";
  const detailHref = media?.id ? `/anime/${media.id}` : "/search?sort=POPULARITY_DESC";

  return (
    <section className="relative h-[480px] w-full overflow-hidden rounded-2xl bg-[#1a192b] shadow-2xl ring-1 ring-white/10">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={bgImage}
          alt={title}
          fill
          priority
          className="object-cover object-center opacity-40 blur-[1px] transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#161527] via-[#161527]/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#161527] via-transparent to-transparent opacity-80" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex h-full items-center px-6 sm:px-12">
        <div className="max-w-2xl space-y-4">
          {/* Spotlight Pill */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#7CE5D0] to-[#55C7F0] px-3 py-1 text-xs font-black uppercase text-[#161527] shadow-lg shadow-[#7CE5D0]/30">
              ⚡ SPOTLIGHT
            </span>
            <span className="flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-400/30">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {rating}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-black text-white sm:text-5xl lg:text-6xl line-clamp-2 tracking-tight drop-shadow-md">
            {title}
          </h1>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-1 rounded-md bg-white/10 backdrop-blur-md px-2.5 py-1">
              <Play className="h-3.5 w-3.5 text-[#7CE5D0]" />
              <span>{format}</span>
            </div>

            <div className="flex items-center gap-1 rounded-md bg-white/10 backdrop-blur-md px-2.5 py-1">
              <Clock className="h-3.5 w-3.5 text-[#7CE5D0]" />
              <span>{duration}</span>
            </div>

            <div className="flex items-center gap-1 rounded-md bg-white/10 backdrop-blur-md px-2.5 py-1">
              <Calendar className="h-3.5 w-3.5 text-[#7CE5D0]" />
              <span>{year}</span>
            </div>

            <span className="rounded-md bg-[#7CE5D0]/20 text-[#7CE5D0] border border-[#7CE5D0]/40 px-2 py-1 font-bold">
              HD
            </span>

            <span className="rounded-md bg-[#55C7F0]/20 text-[#55C7F0] border border-[#55C7F0]/40 px-2 py-1 font-bold">
              SUB / DUB
            </span>
          </div>

          {/* Synopsis */}
          <p className="line-clamp-3 text-sm text-slate-300 sm:text-base leading-relaxed max-w-xl">
            {description}
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              href={watchHref}
              className="group flex items-center gap-2.5 rounded-full bg-[#7CE5D0] px-7 py-3.5 font-extrabold text-[#161527] shadow-lg shadow-[#7CE5D0]/40 transition-all duration-300 hover:scale-105 hover:bg-[#7CE5D0]/90"
            >
              <Play className="h-5 w-5 fill-[#161527]" />
              <span>Watch Now</span>
            </Link>

            <Link
              href={detailHref}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-black/30 backdrop-blur-md px-6 py-3.5 font-bold text-white transition-all duration-300 hover:bg-white/10 hover:border-white/40"
            >
              <Info className="h-5 w-5 text-[#7CE5D0]" />
              <span>Details</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
