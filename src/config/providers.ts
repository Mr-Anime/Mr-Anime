export interface ProviderBuildParams {
  anilistId: number;
  episode: number;
  season?: number;
  type?: "sub" | "dub";
}

export interface Provider {
  id: string;
  name: string;
  enabled: boolean;
  buildUrl: (params: ProviderBuildParams) => string;
}

export const providers: Provider[] = [
  {
    id: "megaplay",
    name: "MegaPlay",
    enabled: true,
    buildUrl: ({ anilistId, episode, type = "sub" }: ProviderBuildParams) => {
      const base =
        (typeof import.meta !== "undefined" && (import.meta as any).env?.PROVIDER_MEGAPLAY_BASE) ||
        (typeof process !== "undefined" && process.env?.PROVIDER_MEGAPLAY_BASE) ||
        "https://megaplay.buzz";
      return `${base.replace(/\/+$/, "")}/stream/ani/${anilistId}/${episode}/${type}`;
    }
  },
  {
    id: "anixo",
    name: "Anixo",
    enabled: true,
    buildUrl: ({ anilistId, episode, type = "sub" }: ProviderBuildParams) => {
      const base =
        (typeof import.meta !== "undefined" && (import.meta as any).env?.PROVIDER_ANIXO_BASE) ||
        (typeof process !== "undefined" && process.env?.PROVIDER_ANIXO_BASE) ||
        "https://anixo.buzz";
      return `${base.replace(/\/+$/, "")}/embed/ani/${anilistId}/${episode}?track=${type}`;
    }
  },
  {
    id: "tryembed",
    name: "TryEmbed",
    enabled: true,
    buildUrl: ({ anilistId, episode, type = "sub" }: ProviderBuildParams) => {
      const base =
        (typeof import.meta !== "undefined" && (import.meta as any).env?.PROVIDER_TRYEMBED_BASE) ||
        (typeof process !== "undefined" && process.env?.PROVIDER_TRYEMBED_BASE) ||
        "https://tryembed.us.cc";
      return `${base.replace(/\/+$/, "")}/embed/anime/${anilistId}/${episode}/${type}`;
    }
  },
  {
    id: "vidnest",
    name: "VidNest",
    enabled: true,
    buildUrl: ({ anilistId, episode, type = "sub" }: ProviderBuildParams) => {
      const base =
        (typeof import.meta !== "undefined" && (import.meta as any).env?.PROVIDER_VIDNEST_BASE) ||
        (typeof process !== "undefined" && process.env?.PROVIDER_VIDNEST_BASE) ||
        "https://vidnest.fun";
      return `${base.replace(/\/+$/, "")}/anime/${anilistId}/${episode}/${type}`;
    }
  }
];
