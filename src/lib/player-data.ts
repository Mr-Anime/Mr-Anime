import "server-only";
import { buildUrl, getProviders, type AudioLang } from "@/config/providers";
import { isEmbedUrlAvailable } from "@/lib/embed-availability";
import { mediaTitle } from "@/lib/anime-format";
import type { Media } from "@/lib/anilist/types";
import {
  getTmdbSeason,
  isTmdbConfigured,
  matchTmdbForTitle,
  type TmdbEpisode,
} from "@/lib/tmdb/client";

/**
 * Shared player data for the watch page and the public /api/v1 player
 * endpoints — one source of truth so the API mirrors the site exactly:
 * episode metadata (TMDB → AniList fallbacks), provider embed URLs and
 * per-provider dub availability probes (6h cached).
 */

export type EpisodeInfo = {
  number: number;
  title: string | null;
  thumbnail: string | null;
};

/** Structurally compatible with PlayerHost's `providers` prop. */
export type PlayerProvider = {
  id: string;
  name: string;
  url: string;
  dubOk: boolean;
};

export type PlayerData = {
  episode: EpisodeInfo;
  providers: PlayerProvider[];
  dubAvailable: boolean;
  requestedLang: AudioLang;
  effectiveLang: AudioLang;
  dubMissing: boolean;
};

async function getTmdbEpisodeMap(
  title: string,
  year: number | null | undefined,
  season: number,
): Promise<{ tmdbId: number | null; episodes: Map<number, TmdbEpisode> }> {
  const episodes = new Map<number, TmdbEpisode>();
  if (!isTmdbConfigured()) return { tmdbId: null, episodes };
  try {
    const match = await matchTmdbForTitle(title, year);
    if (!match) return { tmdbId: null, episodes };
    const seasonData = await getTmdbSeason(match.id, season);
    for (const episode of seasonData.episodes) {
      episodes.set(episode.episode_number, episode);
    }
    return { tmdbId: match.id, episodes };
  } catch (error) {
    console.warn("player-data: TMDB enrichment skipped", error);
    return { tmdbId: null, episodes };
  }
}

function resolveEpisodeInfo(
  media: Media,
  tmdbEpisodes: Map<number, TmdbEpisode>,
  episode: number,
): EpisodeInfo {
  const streamingList = media.streamingEpisodes ?? [];
  const completeStreamingList =
    media.episodes !== null &&
    media.episodes !== undefined &&
    streamingList.length >= media.episodes;
  const tmdbEp = tmdbEpisodes.get(episode) ?? null;
  const fallback = completeStreamingList ? streamingList[episode - 1] : undefined;
  return {
    number: episode,
    title: tmdbEp?.name ?? fallback?.title ?? null,
    thumbnail:
      (tmdbEp?.still_path
        ? `https://image.tmdb.org/t/p/w780${tmdbEp.still_path}`
        : null) ??
      fallback?.thumbnail ??
      null,
  };
}

/** Episode list with titles/thumbnails (TMDB first, then AniList streaming list). */
export async function getEpisodeList(
  media: Media,
  season: number,
): Promise<{ episodes: EpisodeInfo[]; count: number }> {
  const title = mediaTitle(media);
  const { episodes: tmdbEpisodes } = await getTmdbEpisodeMap(
    title,
    media.seasonYear,
    season,
  );
  const streamingList = media.streamingEpisodes ?? [];
  const count =
    media.episodes ??
    (tmdbEpisodes.size || streamingList.length || 0);
  const bounded = Math.min(count, 10000);

  const episodes: EpisodeInfo[] = [];
  for (let number = 1; number <= bounded; number++) {
    episodes.push(resolveEpisodeInfo(media, tmdbEpisodes, number));
  }
  return { episodes, count: bounded };
}

/**
 * Everything the player needs for one episode: resolved episode metadata,
 * provider embed URLs (lang applied + dub probed) and dub flags.
 * Returns null when the episode number is out of range for the title.
 */
export async function getPlayerData(
  media: Media,
  episode: number,
  season: number,
  lang: AudioLang,
): Promise<PlayerData | null> {
  if (episode < 1 || episode > 10000) return null;
  if (media.episodes && episode > media.episodes) return null;

  const title = mediaTitle(media);
  const { tmdbId, episodes: tmdbEpisodes } = await getTmdbEpisodeMap(
    title,
    media.seasonYear,
    season,
  );
  const episodeInfo = resolveEpisodeInfo(media, tmdbEpisodes, episode);

  // Providers may only carry dub for certain titles (megaplay's /dub 404s
  // per episode) — probe every provider's dub URL once (6h cache) so the
  // response reflects reality instead of the provider's own error screen.
  // Templates anchored on {tmdb} (e.g. VidRift's /embed/tv/{tmdb}/…) are
  // unusable without a TMDB id, and sub-only providers never have dub.
  const allProviders = getProviders().filter(
    (p) => !(p.base.includes("{tmdb}") && !tmdbId),
  );
  const dubFlags = await Promise.all(
    allProviders.map((p) =>
      p.subOnly
        ? Promise.resolve(false)
        : isEmbedUrlAvailable(
            buildUrl(p, {
              mediaId: media.id,
              episode,
              title,
              tmdbId,
              season,
              lang: "dub",
            }),
          ),
    ),
  );
  const dubAvailable = dubFlags.some(Boolean);
  const effectiveLang: AudioLang =
    lang === "dub" && dubAvailable ? "dub" : "sub";
  const dubMissing = lang === "dub" && !dubAvailable;

  const providers = allProviders.map((p, i) => ({
    id: p.id,
    name: p.name,
    dubOk: dubFlags[i],
    url: buildUrl(p, {
      mediaId: media.id,
      episode,
      title,
      tmdbId,
      season,
      lang: lang === "dub" && dubFlags[i] ? "dub" : "sub",
    }),
  }));

  return {
    episode: episodeInfo,
    providers,
    dubAvailable,
    requestedLang: lang,
    effectiveLang,
    dubMissing,
  };
}
