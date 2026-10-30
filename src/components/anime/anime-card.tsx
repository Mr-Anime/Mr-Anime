"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Star } from "lucide-react";
import { mediaTitle } from "@/lib/anime-format";
import type { Media, MediaRelationNode } from "@/lib/anilist/types";

export interface AnimeCardProps {
  media?: Media | MediaRelationNode;
  title?: string;
  image?: string;
  type?: string;
  duration?: string;
  year?: number;
  rating?: string | number;
  audio?: "Dub" | "Sub" | "Sub / Dub";
  episodes?: number;
  priority?: boolean;
  className?: string;
}

export function AnimeCard({
  media,
  title: propTitle,
  image: propImage,
  type: propType,
  duration: propDuration,
  year: propYear,
  rating: propRating,
  audio: propAudio = "Sub / Dub",
  episodes: propEpisodes,
  priority = false,
  className = "",
}: AnimeCardProps) {
  const id = media?.id;
  const title = propTitle || (media ? mediaTitle(media) : "Untitled");
  const image =
    propImage ||
    media?.coverImage?.extraLarge ||
    media?.coverImage?.large ||
    "";
  const type = propType || media?.format || "TV";
  const score =
    propRating ||
    (media && "averageScore" in media && media.averageScore
      ? (media.averageScore / 10).toFixed(1)
      : null);
  const eps = propEpisodes || (media && "episodes" in media ? media.episodes : null);

  const href = id ? `/anime/${id}` : `/anime/${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <Link href={href} className={`group relative block transition-all duration-300 ${className}`}>
      <div className="relative overflow-hidden rounded-xl bg-[#2D2B45] shadow-lg ring-1 ring-white/10 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-[#7CE5D0]/20 group-hover:ring-[#7CE5D0]/50">
        <div className="relative aspect-[2/3] w-full">
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              priority={priority}
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#25233B] text-xs text-slate-400">
              No Poster
            </div>
          )}

          {/* Dark Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#161527] via-[#161527]/20 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-95" />

          {/* Play Button Overlay on Hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#7CE5D0] text-[#161527] shadow-lg shadow-[#7CE5D0]/50 transition-transform duration-300 group-hover:scale-110">
              <Play className="h-6 w-6 fill-current ml-0.5" />
            </div>
          </div>

          {/* Top Badges */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
            {score ? (
              <div className="flex items-center gap-1 rounded-md bg-[#161527]/80 backdrop-blur-md px-2 py-0.5 text-[11px] font-bold text-amber-300 ring-1 ring-amber-400/30">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>{score}</span>
              </div>
            ) : <div />}

            <div className="flex items-center gap-1">
              <span className="rounded-md bg-[#7CE5D0] px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-[#161527] shadow">
                {type}
              </span>
              {propAudio && (
                <span className="hidden sm:inline-block rounded-md bg-[#55C7F0]/90 px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-[#161527] shadow">
                  {propAudio}
                </span>
              )}
            </div>
          </div>

          {/* Bottom Info inside Card */}
          <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col justify-end">
            <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 transition-colors group-hover:text-[#7CE5D0]">
              {title}
            </h3>

            {eps ? (
              <div className="mt-1.5 flex items-center gap-2 text-[11px] font-medium text-slate-300">
                <span className="rounded bg-white/10 px-1.5 py-0.5 backdrop-blur-sm">
                  EP {eps}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
