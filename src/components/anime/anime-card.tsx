"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Clock, Calendar, Volume2, VolumeX } from "lucide-react";

interface AnimeCardProps {
  title: string;
  image: string;
  type: "ONA" | "TV" | "MOVIE";
  duration: string;
  year: number;
  rating: string;
  audio?: "Dub" | "Sub";
}

export function AnimeCard({ title, image, type, duration, year, rating, audio }: AnimeCardProps) {
  return (
    <Link href={`/anime/${title.toLowerCase().replace(/\s+/g, "-")}`} className="group block">
      <div className="relative overflow-hidden rounded-lg bg-[#35334D] transition-all duration-300 hover:scale-105">
        <div className="relative aspect-[2/3]">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#1F1E32] to-transparent opacity-80" />

          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-sm font-semibold text-white line-clamp-2">
              {title}
            </h3>
          </div>

          <div className="absolute top-2 right-2 flex flex-col gap-1">
            <div className="bg-[#7CE5D0] text-[#1F1E32] px-2 py-0.5 rounded text-xs font-semibold">
              {type}
            </div>
            {audio && (
              <div className="bg-[#55C7F0] text-[#1F1E32] px-2 py-0.5 rounded text-xs font-semibold">
                {audio}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
