export const providers = [
  {
    id: 'provider1',
    name: 'Provider 1',
    enabled: true,
    buildUrl: ({ anilistId, episode }: { anilistId: number; episode: number }) => {
      const base = import.meta.env.PROVIDER_1_BASE || process.env.PROVIDER_1_BASE || '';
      return base ? \\?id=\&ep=\\ : '#';
    }
  }
];
