"use client";

import Image from "next/image";
import Link from "next/link";
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
  audio?: "Dub" | "Sub";
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
  audio: propAudio,
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
  const href = id ? `/anime/${id}` : `/anime/${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <Link href={href} className={`group block ${className}`}>
      <div className="relative overflow-hidden rounded-lg bg-[#35334D] transition-all duration-300 hover:scale-105">
        <div className="relative aspect-[2/3]">
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              priority={priority}
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
              No Image
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#1F1E32] to-transparent opacity-80" />

          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-sm font-semibold text-white line-clamp-2">
              {title}
            </h3>
          </div>

          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {type && (
              <div className="bg-[#7CE5D0] text-[#1F1E32] px-2 py-0.5 rounded text-xs font-semibold">
                {type}
              </div>
            )}
            {propAudio && (
              <div className="bg-[#55C7F0] text-[#1F1E32] px-2 py-0.5 rounded text-xs font-semibold">
                {propAudio}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
