export const providers = [
  {
    id: "provider1",
    name: "Provider 1",
    enabled: true,
    buildUrl: ({ anilistId, episode }: { anilistId: number; episode: number }) => {
      const base = (typeof import.meta !== "undefined" && (import.meta as any).env?.PROVIDER_1_BASE) || process.env.PROVIDER_1_BASE || "";
      return base ? base + "?id=" + anilistId + "&ep=" + episode : "#";
    }
  }
];