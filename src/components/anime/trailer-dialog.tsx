"use client";

import { PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function TrailerDialog({
  youtubeId,
  title,
}: {
  youtubeId: string;
  title: string;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" aria-label={`Play trailer for ${title}`} />
        }
      >
        <PlayIcon />
        Trailer
      </DialogTrigger>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0 sm:p-0">
        <DialogTitle className="sr-only">{title} — trailer</DialogTitle>
        <DialogDescription className="sr-only">
          Embedded YouTube trailer.
        </DialogDescription>
        <div className="aspect-video w-full">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
            title={`${title} trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full border-0"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
