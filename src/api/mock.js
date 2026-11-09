/**
 * TEMPORARY mock backend used only when VITE_USE_MOCK_API=true.
 * Mirrors the response shapes of the Pages Functions so the UI can be
 * developed and previewed before the Workers exist.
 * @TODO delete this file together with the USE_MOCK_API branch once Workers ship.
 */

const TITLES = [
  ['Frieren: Beyond Journey\u2019s End', 'Sōsō no Frieren', '葬送のフリーレン', 154587, 9.1],
  ['Solo Leveling', 'Ore dake Level Up na Ken', '俺だけレベルアップな件', 151807, 8.2],
  ['Jujutsu Kaisen 2nd Season', 'Jujutsu Kaisen 2nd Season', '呪術廻戦 第2期', 145064, 8.6],
  ['One Piece', 'One Piece', 'ワンピース', 21, 8.7],
  ['Demon Slayer: Hashira Training', 'Kimetsu no Yaiba: Hashira Geiko-hen', '鬼滅の刃 柱稽古編', 166240, 7.9],
  ['Blue Box', 'Ao no Hako', 'アオのハコ', 170942, 8.0],
  ['Dan Da Dan', 'Dandadan', 'ダンダダン', 171018, 8.4],
  ['Chainsaw Man', 'Chainsaw Man', 'チェンソーマン', 127230, 8.5],
  ['My Hero Academia: 7th Season', 'Boku no Hero Academia 7', '僕のヒーローアカデミア 7', 163134, 8.1],
  ['Spy x Family Season 2', 'Spy x Family Season 2', 'スパイファミリー 2', 158927, 8.0],
  ['Oshi no Ko', 'Oshi no Ko', '【推しの子】', 150672, 8.6],
  ['Haikyuu!! Movie: Battle at the Garbage Dump', 'Haikyuu!! Movie: Gomisuteba no Kessen', 'ハイキュー!!', 158075, 8.9],
  ['Mushoku Tensei II', 'Mushoku Tensei II: Isekai Ittara Honki Dasu', '無職転生II', 146065, 8.4],
  ['Ao Ashi', 'Ao Ashi', 'アオアシ', 139650, 8.1],
  ['Vinland Saga Season 2', 'Vinland Saga Season 2', 'ヴィンランド・サガ', 136430, 8.8],
  ['Bocchi the Rock!', 'Bocchi the Rock!', 'ぼっち・ざ・ろっく！', 130003, 8.8],
  ['Cyberpunk: Edgerunners', 'Cyberpunk: Edgerunners', 'サイバーパンク', 120377, 8.6],
  ['Attack on Titan Final Season', 'Shingeki no Kyojin: The Final Season', '進撃の巨人', 110277, 8.7],
  ['Kaguya-sama: Love is War Ultra Romantic', 'Kaguya-sama wa Kokurasetai', 'かぐや様は告らせたい', 125367, 8.7],
  ['Made in Abyss: The Golden City', 'Made in Abyss: Retsujitsu no Ougonkyou', 'メイドインアビス', 124194, 8.6],
  ['Your Lie in April', 'Shigatsu wa Kimi no Uso', '四月は君の嘘', 20665, 8.6],
  ['Violet Evergarden', 'Violet Evergarden', 'ヴァイオレット・エヴァーガーデン', 21827, 8.7],
  ['Fullmetal Alchemist: Brotherhood', 'Hagane no Renkinjutsushi: Fullmetal Alchemist', '鋼の錬金術師', 5114, 9.1],
  ['Steins;Gate', 'Steins;Gate', 'シュタインズ・ゲート', 9253, 9.0],
];

const GENRES = [['Action', 'Shounen'], ['Adventure', 'Drama'], ['Comedy', 'Slice of Life'], ['Drama', 'Romance'], ['Fantasy', 'Supernatural'], ['Sports', 'Comedy'], ['Sci-Fi', 'Mystery'], ['Horror', 'Thriller']];
const FORMATS = ['TV', 'TV', 'TV', 'TV', 'MOVIE', 'TV'];
const STATUSES = ['RELEASING', 'FINISHED', 'RELEASING', 'NOT_YET_RELEASED'];
const DESCRIPTIONS = [
  'An immersive journey through a vivid world where every choice matters. Follow a cast of unforgettable characters as they grow, fight, and discover what truly drives them.',
  'After a life-changing encounter, a curious hero sets out to understand the people and places they left behind. Warm, thoughtful, and beautifully animated.',
  'High-stakes battles, razor-sharp strategy and a story that never stops escalating. One of the most talked-about series of its season.',
  'A gentle slice-of-life with surprising emotional depth and gorgeous direction.',
];
const ROMAJI_SLUG = (t) => t.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();

function iso(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function makeMedia(i, { banner = false } = {}) {
  const [en, romaji, native, id, score] = TITLES[i % TITLES.length];
  const [g1, g2] = GENRES[i % GENRES.length];
  const status = STATUSES[i % STATUSES.length];
  const episodes = [12, 24, 13, 0, 1, 25][i % 6] || 12;
  const nextInHours = 4 + ((i * 7) % 120);
  return {
    id,
    title: { english: en, romaji, native, userPreferred: en },
    coverImage: {
      extraLarge: `https://picsum.photos/seed/mranime-cover-${id}/460/640`,
      large: `https://picsum.photos/seed/mranime-cover-${id}/460/640`,
      color: '#1d1d28',
    },
    bannerImage: banner ? `https://picsum.photos/seed/mranime-banner-${id}/1600/900` : `https://picsum.photos/seed/mranime-banner-${id}/1600/900`,
    description: DESCRIPTIONS[i % DESCRIPTIONS.length].repeat(2).slice(0, 420) + '...',
    genres: [g1, g2],
    tags: [
      { name: 'Female Protagonist', rank: 87 },
      { name: 'Primarily Adult Cast', rank: 76 },
      { name: 'Magic', rank: 71 },
    ],
    averageScore: Math.round(score * 10),
    meanScore: Math.round(score * 10) - 15,
    popularity: 100000 + id * 37,
    favourites: 5000 + id,
    status,
    season: ['WINTER', 'SPRING', 'SUMMER', 'FALL'][i % 4],
    seasonYear: 2024 - (i % 3),
    format: FORMATS[i % FORMATS.length],
    duration: FORMATS[i % FORMATS.length] === 'MOVIE' ? 120 : 24,
    episodes: episodes || null,
    nextAiringEpisode:
      status === 'RELEASING' ? { episode: (episodes || 12) > 0 ? Math.ceil((episodes || 12) / 2) : 4, airingAt: Math.floor(Date.now() / 1000) + nextInHours * 3600, timeUntilAiring: nextInHours * 3600 } : null,
    startDate: { year: 2024 - (i % 3), month: 4, day: 1 },
    endDate: status === 'FINISHED' ? { year: 2024 - (i % 3), month: 9, day: 24 } : { year: null, month: null, day: null },
    source: ['MANGA', 'LIGHT_NOVEL', 'ORIGINAL', 'VIDEO_GAME'][i % 4],
    studios: { nodes: i % 3 === 0 ? [{ name: 'Studio Trigger' }, { name: 'CloverWorks' }] : [{ name: 'Madhouse' }] },
    trailer: i % 2 === 0 ? { id: '60oc24ZUsOU', site: 'youtube', thumbnail: null } : null,
    characters: {
      edges: Array.from({ length: 8 }, (_, k) => ({
        role: k < 3 ? 'MAIN' : 'SUPPORTING',
        node: {
          id: id * 100 + k,
          name: { full: ['Frieren', 'Fern', 'Stark', 'Himmel', 'Heiter', 'Eisen', 'Aura', 'Serie'][k] },
          image: { medium: `https://picsum.photos/seed/char-${id}-${k}/160/220` },
        },
        voiceActors: [{ id: k, name: { full: ['Atsumi Tanezaki', 'Kana Ichinose', 'Chiaki Kobayashi', 'Nobuhiko Okamoto'][k % 4] }, language: 'Japanese' }],
      })),
    },
    relations: {
      edges: [
        { relationType: 'PREQUEL', node: { id: id - 1, type: 'ANIME', title: { romaji: `${romaji} (Prequel)` }, coverImage: { large: `https://picsum.photos/seed/rel-${id}-a/230/320` }, format: 'TV', episodes: 12, status: 'FINISHED' } },
        { relationType: 'SEQUEL', node: { id: id + 1, type: 'ANIME', title: { romaji: `${romaji} Season 2` }, coverImage: { large: `https://picsum.photos/seed/rel-${id}-b/230/320` }, format: 'TV', episodes: 12, status: 'RELEASING' } },
        { relationType: 'SIDE_STORY', node: { id: id + 2, type: 'ANIME', title: { romaji: `${romaji} OVA` }, coverImage: { large: `https://picsum.photos/seed/rel-${id}-c/230/320` }, format: 'OVA', episodes: 2, status: 'FINISHED' } },
      ],
    },
    recommendations: {
      nodes: Array.from({ length: 10 }, (_, k) => {
        const j = (i + k + 1) % TITLES.length;
        return { mediaRecommendation: makeCard(j) };
      }),
    },
    externalLinks: [{ id: 1, site: 'Official Site', url: 'https://example.com', type: 'INFO' }],
  };
}

function makeCard(i) {
  const m = makeCardFields(i);
  return {
    id: m.id,
    title: m.title,
    coverImage: m.coverImage,
    bannerImage: m.bannerImage,
    format: m.format,
    seasonYear: m.seasonYear,
    status: m.status,
    episodes: m.episodes,
    nextAiringEpisode: m.nextAiringEpisode,
    averageScore: m.averageScore,
    genres: m.genres,
    description: m.description,
  };
}

function makeCardFields(i) {
  const [en, , , id, score] = TITLES[i % TITLES.length];
  const [g1, g2] = GENRES[i % GENRES.length];
  const FORMAT_CYCLE = ['TV', 'TV', 'TV', 'TV', 'MOVIE', 'TV'];
  return {
    id,
    title: { english: en, romaji: TITLES[i % TITLES.length][1], native: TITLES[i % TITLES.length][2], userPreferred: en },
    coverImage: { large: `https://picsum.photos/seed/mranime-cover-${id}/460/640`, extraLarge: `https://picsum.photos/seed/mranime-cover-${id}/460/640` },
    format: FORMAT_CYCLE[i % FORMAT_CYCLE.length],
    seasonYear: 2024 - (i % 3),
    status: STATUSES[i % STATUSES.length],
    episodes: [12, 24, 13, 0, 1, 25][i % 6] || 12,
    averageScore: Math.round(score * 10),
    genres: [g1, g2],
    description: DESCRIPTIONS[i % DESCRIPTIONS.length],
  };
}

const ALL = Array.from({ length: 24 }, (_, i) => makeMedia(i, { banner: true }));

function availabilityFor(id) {
  const n = Number(id);
  const hasDub = n % 3 !== 0;
  return { anilistId: n, hasSub: true, hasDub, subEpisodes: n % 5 === 0 ? 6 : null, dubEpisodes: hasDub && n % 4 === 0 ? 4 : null, override: false };
}

function delay(ms = 350) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function mockResponse(path) {
  await delay();
  const url = new URL(path, 'http://mock.local');
  const p = url.pathname;
  const params = url.searchParams;

  if (p === '/api/trending') {
    if (params.get('rows')) {
      return {
        rows: {
          trending: { data: ALL.slice(0, 14) },
          popularSeason: { data: ALL.slice(4, 18) },
          topRated: { data: [...ALL].sort((a, b) => b.averageScore - a.averageScore).slice(0, 14) },
          recentlyUpdated: { data: ALL.slice(2, 16) },
          upcoming: { data: ALL.filter((m) => m.status === 'NOT_YET_RELEASED').concat(ALL.slice(0, 8)).slice(0, 14) },
        },
      };
    }
    return { data: ALL.slice(0, 10) };
  }

  const animeMatch = p.match(/^\/api\/anime\/(\d+)$/);
  if (animeMatch) {
    const found = ALL.find((m) => m.id === Number(animeMatch[1]));
    if (!found) throw Object.assign(new Error('Not found'), { status: 404 });
    return { data: found };
  }

  if (p === '/api/search') {
    const q = (params.get('q') || '').toLowerCase();
    let list = ALL;
    if (q) list = list.filter((m) => JSON.stringify(m.title).toLowerCase().includes(q));
    const genre = params.get('genre')?.split(',');
    if (genre?.length) list = list.filter((m) => genre.some((g) => m.genres.includes(g)));
    const page = Number(params.get('page') || 1);
    const perPage = Number(params.get('perPage') || 24);
    const slice = list.slice((page - 1) * perPage, page * perPage);
    if (params.get('suggestions')) return { data: list.slice(0, perPage).map((m) => ({ id: m.id, title: m.title, coverImage: m.coverImage, format: m.format, seasonYear: m.seasonYear, averageScore: m.averageScore })) };
    return { pageInfo: { total: list.length, currentPage: page, lastPage: Math.ceil(list.length / perPage), hasNextPage: page * perPage < list.length, perPage }, media: slice };
  }

  if (p === '/api/schedule') {
    const list = ALL.slice(0, 18).map((m) => ({
      id: m.id,
      title: m.title,
      coverImage: m.coverImage,
      format: m.format,
      episodes: m.episodes,
      nextAiringEpisode: m.nextAiringEpisode || { episode: (m.episodes || 12) + 1, airingAt: Math.floor(Date.now() / 1000) + ((m.id % 7) + 1) * 86400, timeUntilAiring: 86400 },
    }));
    return { airingSchedules: list.map((m) => ({ id: m.id, airingAt: m.nextAiringEpisode.airingAt, episode: m.nextAiringEpisode.episode, media: m })) };
  }

  const availMatch = p.match(/^\/api\/availability\/(\d+)$/);
  if (availMatch) return { data: availabilityFor(availMatch[1]) };

  if (p.startsWith('/api/admin/')) {
    return { users: 128, watchlistEntries: 942, historyEntries: 3110, cachedShows: ALL.length, cacheOverrides: 3 };
  }

  throw Object.assign(new Error('Mock: unknown path ' + p), { status: 404 });
}

export { iso, ROMAJI_SLUG };
